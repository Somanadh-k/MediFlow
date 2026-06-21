const supabase = require('../config/supabase');
const { successResponse, errorResponse } = require('../utils/response');

const getLowStock = async (req, res) => {
  const { data, error } = await supabase
    .from('medicines')
    .select('*')
    .gt('stock_quantity', 0)
    .neq('status', 'DELETED');
    
  if (error) return errorResponse(res, 'Failed to fetch low stock medicines', error);
  
  // Filter in JS since Supabase JS client lte() expects a value, not another column name
  const lowStock = data.filter(m => m.stock_quantity <= m.reorder_level);
  
  return successResponse(res, lowStock);
};

const getOutOfStock = async (req, res) => {
  const { data, error } = await supabase
    .from('medicines')
    .select('*')
    .eq('stock_quantity', 0)
    .neq('status', 'DELETED');
    
  if (error) return errorResponse(res, 'Failed to fetch out of stock medicines', error);
  return successResponse(res, data);
};

const getQuarantineRecords = async (req, res) => {
  // Inventory is the source of truth! Fetch medicines that are currently QUARANTINED
  const { data: mData, error: mError } = await supabase
    .from('medicines')
    .select('id, medicine_name, batch_no, stock_quantity, status')
    .eq('status', 'QUARANTINED');
    
  if (mError) return errorResponse(res, 'Failed to fetch quarantined medicines', mError);

  const medicines = mData || [];
  const medicineIds = medicines.map(m => m.id);

  // Fetch metadata from quarantine_inventory for these medicines
  let qData = [];
  if (medicineIds.length > 0) {
    const { data: qResult, error: qError } = await supabase
      .from('quarantine_inventory')
      .select('*')
      .in('medicine_id', medicineIds)
      .is('disposed_date', null); // Only active quarantine records
      
    if (!qError) qData = qResult || [];
  }

  const qMap = {};
  qData.forEach(q => qMap[q.medicine_id] = q);

  // Build response based strictly on Inventory (medicines)
  const formattedData = medicines.map(m => {
    const qRecord = qMap[m.id];
    return {
      id: qRecord ? qRecord.id : `virtual-${m.id}`, // fallback if metadata is missing
      medicine_id: m.id,
      medicine_name: m.medicine_name,
      batch_no: m.batch_no,
      stock_quantity: m.stock_quantity,
      reason: qRecord ? qRecord.reason : 'MANUAL_QUARANTINE',
      date: qRecord ? qRecord.quarantine_date : new Date().toISOString(),
    };
  });

  // Sort by date descending
  formattedData.sort((a, b) => new Date(b.date) - new Date(a.date));

  return successResponse(res, formattedData);
};

module.exports = {
  getLowStock,
  getOutOfStock,
  getQuarantineRecords,
};
