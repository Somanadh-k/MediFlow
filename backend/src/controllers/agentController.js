const supabase = require('../config/supabase');
const { successResponse, errorResponse } = require('../utils/response');
const { sendEmailNotification } = require('../services/notificationService');

const getDecisions = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('agent_decision_logs')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return successResponse(res, data || []);
  } catch (error) {
    return errorResponse(res, 'Failed to fetch agent decisions', error);
  }
};

const approveDecision = async (req, res) => {
  const { id } = req.params;
  try {
    // Fetch the decision first
    const { data: decision, error: fetchErr } = await supabase
      .from('agent_decision_logs')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchErr) return errorResponse(res, 'Decision not found', fetchErr, 404);
    if (decision.approval_status === 'APPROVED') {
      return errorResponse(res, 'Decision is already approved', null, 400);
    }

    // Update status
    const { data: updated, error: updateErr } = await supabase
      .from('agent_decision_logs')
      .update({ approval_status: 'APPROVED' })
      .eq('id', id)
      .select()
      .single();

    if (updateErr) throw updateErr;

    // Process the purchase order creation if recommendation is parsed
    try {
      const rec = JSON.parse(decision.recommendation);
      if (rec && rec.medicine_id) {
        // Create PO
        const { data: poData } = await supabase.from('purchase_orders').insert([{
          vendor_id: rec.vendor_id || 'UNKNOWN_VENDOR',
          medicine_id: rec.medicine_id,
          quantity: rec.quantity || 50,
          approval_status: 'APPROVED',
          order_status: 'PENDING'
        }]).select().single();

        // Email Automation Integration
        if (rec.vendor_id) {
          // Fetch Vendor details
          const { data: vendorData } = await supabase.from('vendors').select('*').eq('id', rec.vendor_id).single();
          // Fetch Medicine details
          const { data: medData } = await supabase.from('medicines').select('medicine_name').eq('id', rec.medicine_id).single();
          
          if (vendorData && vendorData.email && medData) {
            const timestamp = new Date().toLocaleString();
            const subject = `[MediFlow] Official Purchase Order - ${medData.medicine_name}`;
            const text = `Dear ${vendorData.vendor_name},\n\nPlease process the following Official Purchase Order:\n\nPO Reference ID: ${poData ? poData.id : 'DRAFT'}\nTimestamp: ${timestamp}\n\nItem Description: ${medData.medicine_name}\nQuantity Requested: ${rec.quantity || 50}\n\nPlease confirm receipt of this order and provide an estimated delivery timeline.\n\nThank you,\nMediFlow Pharmacy Management System`;
            
            // Dispatch Email using native service
            await sendEmailNotification({
              to: vendorData.email,
              subject: subject,
              text: text,
              event_type: 'PROCUREMENT_ORDER'
            });
            console.log(`[Email Automation] Dispatched PO email to ${vendorData.email} for ${medData.medicine_name}`);
          }
        }
      }
    } catch (parseError) {
      console.warn('Could not parse recommendation JSON or missing medicine_id, skipping purchase_order creation and email.', parseError.message);
    }

    return successResponse(res, updated);
  } catch (error) {
    return errorResponse(res, 'Failed to approve decision', error);
  }
};

const getDemandForecasts = async (req, res) => {
  try {
    const { getLatestDemandForecasts } = require('../services/demandForecastService');
    const data = await getLatestDemandForecasts();
    return successResponse(res, data);
  } catch (error) {
    return errorResponse(res, error.message, null, 500);
  }
};

const getDemandForecastAnalytics = async (req, res) => {
  try {
    // Fetch all active medicines
    const { data: medicines, error: medError } = await supabase
      .from('medicines')
      .select('id, medicine_name')
      .neq('status', 'DELETED');
    if (medError) throw medError;

    // Fetch stock out transactions over last 6 months to compute historical demand
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    const { data: transactions, error: txError } = await supabase
      .from('inventory_transactions')
      .select('medicine_id, quantity, created_at')
      .eq('transaction_type', 'STOCK_OUT')
      .gte('created_at', sixMonthsAgo.toISOString());
    if (txError) throw txError;

    // Fetch future demand forecasts
    const { data: forecasts, error: fcError } = await supabase
      .from('demand_forecasts')
      .select('*')
      .order('created_at', { ascending: false });
    if (fcError) throw fcError;

    // Format Data
    const analyticsMap = {};
    medicines.forEach(m => {
      analyticsMap[m.id] = {
        medicine_id: m.id,
        medicine_name: m.medicine_name,
        historical: [],
        predicted: null,
        confidence_score: null
      };
    });

    // Group historical transactions by Month (Jan, Feb, etc.)
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    
    // Initialize exactly 6 trailing months dynamically
    const currentMonthIndex = new Date().getMonth();
    const timeline = [];
    for (let i = 5; i >= 0; i--) {
      let mIdx = currentMonthIndex - i;
      if (mIdx < 0) mIdx += 12;
      timeline.push(monthNames[mIdx]);
    }

    // Populate historical zeroes
    Object.keys(analyticsMap).forEach(id => {
      analyticsMap[id].historical = timeline.map(month => ({ month, demand: 0 }));
    });

    // Aggregate transactions
    if (transactions) {
      transactions.forEach(tx => {
        const txMonth = monthNames[new Date(tx.created_at).getMonth()];
        const med = analyticsMap[tx.medicine_id];
        if (med) {
          const monthNode = med.historical.find(h => h.month === txMonth);
          if (monthNode) monthNode.demand += tx.quantity;
        }
      });
    }

    // Attach latest forecast
    if (forecasts) {
      // Sort to get latest per medicine
      forecasts.forEach(fc => {
        const med = analyticsMap[fc.medicine_id];
        if (med && med.predicted === null) {
          med.predicted = fc.predicted_demand;
          med.confidence_score = fc.confidence_score;
        }
      });
    }

    const payload = Object.values(analyticsMap);
    return successResponse(res, payload);
  } catch (error) {
    return errorResponse(res, 'Failed to fetch demand forecast analytics', error);
  }
};

module.exports = {
  getDecisions,
  approveDecision,
  getDemandForecasts,
  getDemandForecastAnalytics,
};
