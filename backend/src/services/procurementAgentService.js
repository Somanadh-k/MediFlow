const axios = require('axios');
const supabase = require('../config/supabase');

/**
 * Triggers the n8n Procurement Agent webhook for low/out of stock items.
 * Handles the communication and logs the result into agent_decision_logs.
 */
const triggerProcurementAgent = async (medicine) => {
  const webhookUrl = process.env.N8N_PROCUREMENT_WEBHOOK;
  if (!webhookUrl) {
    console.warn('N8N_PROCUREMENT_WEBHOOK is not defined. Skipping agent trigger.');
    return;
  }

  try {
    console.log(`Triggering Procurement Agent for medicine ID: ${medicine.id}`);
    
    // Fetch latest demand forecast from dedicated service
    const { getForecastForMedicine } = require('./demandForecastService');
    const forecastData = await getForecastForMedicine(medicine.id);

    // Send data to n8n Webhook
    const payload = {
      medicine_id: medicine.id,
      medicine_name: medicine.medicine_name,
      stock_quantity: medicine.stock_quantity,
      reorder_level: medicine.reorder_level,
      vendor_id: medicine.vendor_id,
      purchase_price: medicine.purchase_price,
      selling_price: medicine.selling_price,
      predicted_demand: forecastData ? forecastData.predicted_demand : null,
      demand_confidence: forecastData ? forecastData.confidence_score : null
    };

    const response = await axios.post(webhookUrl, payload, { timeout: 10000 });
    
    // Expecting response from n8n. If standard HTTP 200, we log it.
    // The n8n agent might return structured data, or we just formulate a standard message.
    let message = 'Agent processed procurement evaluation successfully.';
    let confidence = 0.95; // Default or extract from response if provided

    if (response.data && response.data.recommendation) {
      message = response.data.recommendation;
    } else if (response.data && response.data.message) {
      message = response.data.message;
    } else {
      // Fallback recommendation text
      const orderAmount = medicine.reorder_level > 0 ? medicine.reorder_level * 2 : 50;
      message = `Recommend ordering ${orderAmount} units of ${medicine.medicine_name}.`;
    }

    if (response.data && response.data.confidence_score) {
      confidence = response.data.confidence_score;
    }

    // We stringify the structured data into the recommendation field 
    // so we can extract medicine_id and vendor_id upon approval.
    const recommendationPayload = {
      message: message,
      medicine_id: medicine.id,
      vendor_id: medicine.vendor_id,
      quantity: medicine.reorder_level > 0 ? medicine.reorder_level * 2 : 50
    };

    await supabase.from('agent_decision_logs').insert([{
      agent_name: 'Procurement & Communication Agent',
      trigger_event: medicine.stock_quantity === 0 ? 'OUT_OF_STOCK' : 'LOW_STOCK',
      recommendation: JSON.stringify(recommendationPayload),
      confidence_score: confidence,
      approval_required: true,
      approval_status: 'PENDING'
    }]);

    console.log(`Successfully logged procurement agent decision for ${medicine.medicine_name}.`);
  } catch (error) {
    console.error('Failed to trigger or process Procurement Agent webhook:', error.message);
    // Non-blocking: We don't throw here to ensure inventoryMonitorJob continues running.
  }
};

module.exports = {
  triggerProcurementAgent,
};
