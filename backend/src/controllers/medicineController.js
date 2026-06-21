const supabase = require('../config/supabase');
const { successResponse, errorResponse } = require('../utils/response');
const { logAudit } = require('../services/auditService');
const { triggerInventoryAgent } = require('../services/inventoryAgentService');

const getMedicines = async (req, res) => {
  const { data, error } = await supabase.from('medicines').select('*').neq('status', 'DELETED');
  if (error) throw error;
  
  // Calculate days remaining strictly on the backend
  const today = new Date().toISOString().split('T')[0];
  const todayDate = new Date(today);
  
  const mappedData = data.map(m => {
    let daysRemaining = null;
    if (m.expiry_date) {
      const expDate = new Date(m.expiry_date);
      const diffTime = expDate - todayDate;
      daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }
    return { ...m, days_remaining: daysRemaining };
  });

  return successResponse(res, mappedData);
};

const getMedicineById = async (req, res) => {
  const { id } = req.params;
  const { data, error } = await supabase.from('medicines').select('*').eq('id', id).single();
  
  if (error) return errorResponse(res, 'Medicine not found', {}, 404);
  return successResponse(res, data);
};

const createMedicine = async (req, res) => {
  const payload = req.body;
  
  // Calculate correct initial status based on expiry_date
  if (payload.expiry_date) {
    // The validator uses .toDate(), so payload.expiry_date is a Date object.
    const expDate = new Date(payload.expiry_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    expDate.setHours(0, 0, 0, 0);
    
    if (expDate < today) {
      return errorResponse(res, 'Cannot add an already expired medicine.', {}, 400);
    }
    
    const diffTime = expDate - today;
    const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (daysRemaining <= 90) {
      payload.status = 'NEAR_EXPIRY';
    } else {
      payload.status = 'ACTIVE';
    }
  } else {
    payload.status = 'ACTIVE';
  }

  const { data, error } = await supabase.from('medicines').insert([payload]).select().single();
  if (error) throw error;

  await logAudit({
    user_id: req.user.id,
    action: 'CREATE_MEDICINE',
    entity: 'medicines',
    entity_id: data.id,
    after_state: data,
  });

  // Log inventory transaction (Initial stock)
  if (data.stock_quantity > 0) {
    await supabase.from('inventory_transactions').insert([{
      medicine_id: data.id,
      transaction_type: 'STOCK_IN',
      quantity: data.stock_quantity,
      user_id: req.user.id,
      notes: 'Initial stock on creation',
    }]);
  }

  // INTEGRATION: Intelligent Inventory Agent
  triggerInventoryAgent(data, 'MEDICINE_CREATED');

  return successResponse(res, data, 201);
};

const updateMedicine = async (req, res) => {
  const { id } = req.params;
  const payload = req.body;

  // Get current state
  const { data: beforeData, error: fetchErr } = await supabase.from('medicines').select('*').eq('id', id).single();
  if (fetchErr) return errorResponse(res, 'Medicine not found', {}, 404);

  // Calculate correct status if expiry_date is being updated
  const targetExpiryDate = payload.expiry_date || beforeData.expiry_date;
  if (targetExpiryDate) {
    const expDate = new Date(targetExpiryDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    expDate.setHours(0, 0, 0, 0);
    
    // We do NOT block editing if already expired in case of admin overrides, 
    // but if the user specifically changes the expiry date to a past date we can either block it or mark as QUARANTINED.
    // The instructions say: "If user enters an already expired medicine: Either: Automatically mark as QUARANTINED or Reject creation according to existing business rules. Apply the same logic consistently."
    // Let's reject it to be consistent with creation.
    if (expDate < today && payload.expiry_date && new Date(payload.expiry_date).getTime() !== new Date(beforeData.expiry_date).getTime()) {
      return errorResponse(res, 'Cannot change expiry date to an already expired date.', {}, 400);
    }
    
    // Auto-calculate status (do not overwrite if it's already EXPIRED/QUARANTINED unless the date pushes it back to active)
    const diffTime = expDate - today;
    const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    // Determine the calculated status based on dates
    let calculatedStatus = 'ACTIVE';
    if (daysRemaining < 0) {
      calculatedStatus = beforeData.status === 'QUARANTINED' ? 'QUARANTINED' : 'EXPIRED';
    } else if (daysRemaining <= 90) {
      calculatedStatus = 'NEAR_EXPIRY';
    }
    
    // Only overwrite payload status if it wasn't manually set to QUARANTINED in this request
    if (payload.status !== 'QUARANTINED') {
      payload.status = calculatedStatus;
    }
  }

  // CASCADE: If the user manually overrides the status to QUARANTINED
  if (payload.status === 'QUARANTINED' && beforeData.status !== 'QUARANTINED') {
    payload.stock_quantity = 0; // Quarantine rules: stock is unusable
  }

  const { data, error } = await supabase.from('medicines').update(payload).eq('id', id).select().single();
  if (error) throw error;

  // CROSS-MODULE SYNCHRONIZATION ---------------------------

  // 1. Stock Alert Cascade
  if (data.stock_quantity > data.reorder_level && beforeData.stock_quantity <= beforeData.reorder_level) {
    // Stock was replenished manually above reorder level, resolve alerts
    await supabase.from('stock_alerts').update({ is_resolved: true }).eq('medicine_id', id);
  }

  // 2. Expiry Alert Cascade
  if (data.status === 'ACTIVE' && beforeData.status !== 'ACTIVE') {
    // Medicine is no longer near expiry or expired
    await supabase.from('expiry_alerts').delete().eq('medicine_id', id);
  }

  // 3. Quarantine Cascade
  if (data.status === 'QUARANTINED' && beforeData.status !== 'QUARANTINED') {
    // Insert into quarantine inventory
    await supabase.from('quarantine_inventory').insert([{
      medicine_id: id,
      reason: 'MANUAL_QUARANTINE',
      quarantine_date: new Date().toISOString(),
    }]);
  } else if (data.status !== 'QUARANTINED' && beforeData.status === 'QUARANTINED') {
    // Clean up quarantine inventory since it was restored
    await supabase.from('quarantine_inventory').delete().eq('medicine_id', id);
  }
  // ---------------------------------------------------------

  await logAudit({
    user_id: req.user.id,
    action: 'UPDATE_MEDICINE',
    entity: 'medicines',
    entity_id: id,
    before_state: beforeData,
    after_state: data,
  });

  // Check if stock changed to log transaction
  if (beforeData.stock_quantity !== data.stock_quantity) {
    const diff = data.stock_quantity - beforeData.stock_quantity;
    await supabase.from('inventory_transactions').insert([{
      medicine_id: id,
      transaction_type: diff > 0 ? 'STOCK_IN' : 'STOCK_OUT',
      quantity: Math.abs(diff),
      user_id: req.user.id,
      notes: 'Manual update',
    }]);
  }

  // INTEGRATION: Intelligent Inventory Agent
  triggerInventoryAgent(data, 'MEDICINE_UPDATED');

  return successResponse(res, data);
};

const deleteMedicine = async (req, res) => {
  const { id } = req.params;

  const { data: beforeData } = await supabase.from('medicines').select('*').eq('id', id).single();
  if (!beforeData) return errorResponse(res, 'Medicine not found', {}, 404);

  // CASCADE CLEANUP: Resolve active stock alerts before deletion to avoid orphans in the UI
  await supabase.from('stock_alerts').update({ is_resolved: true }).eq('medicine_id', id);
  
  // CASCADE CLEANUP: Delete ephemeral expiry alerts completely
  await supabase.from('expiry_alerts').delete().eq('medicine_id', id);
  
  // CASCADE CLEANUP: Explicitly delete quarantine metadata to completely prevent future orphans
  await supabase.from('quarantine_inventory').delete().eq('medicine_id', id);

  const { error } = await supabase.from('medicines').delete().eq('id', id);
  
  if (error) {
    if (error.code === '23503') {
      // Foreign Key Violation - fallback to Soft Delete
      const softDeletePayload = { 
        status: 'DELETED', 
        barcode: `${beforeData.barcode}-deleted-${Date.now()}` 
      };
      
      const { error: softErr } = await supabase.from('medicines').update(softDeletePayload).eq('id', id);
      if (softErr) throw softErr;
      
      await logAudit({
        user_id: req.user.id,
        action: 'SOFT_DELETE_MEDICINE',
        entity: 'medicines',
        entity_id: id,
        before_state: beforeData,
        after_state: { ...beforeData, ...softDeletePayload },
      });
      
      // INTEGRATION: Intelligent Inventory Agent
      triggerInventoryAgent({ ...beforeData, ...softDeletePayload }, 'MEDICINE_DELETED');

      return successResponse(res, { message: 'Medicine safely soft-deleted due to existing dependencies.' });
    }
    throw error;
  }

  await logAudit({
    user_id: req.user.id,
    action: 'DELETE_MEDICINE',
    entity: 'medicines',
    entity_id: id,
    before_state: beforeData,
  });

  // INTEGRATION: Intelligent Inventory Agent
  triggerInventoryAgent({ ...beforeData, status: 'DELETED' }, 'MEDICINE_DELETED');

  return successResponse(res, { message: 'Medicine permanently deleted.' });
};

module.exports = {
  getMedicines,
  getMedicineById,
  createMedicine,
  updateMedicine,
  deleteMedicine,
};
