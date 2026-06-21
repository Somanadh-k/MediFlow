const axios = require('axios');
const supabase = require('../config/supabase');

/**
 * Triggers the n8n Intelligent Inventory Agent webhook for inventory events.
 * @param {Object} medicine - The medicine object from Supabase.
 * @param {string} eventType - The trigger event (e.g., 'MEDICINE_CREATED', 'MEDICINE_UPDATED', 'MEDICINE_DELETED', 'MANUAL_RECONCILIATION').
 */
const triggerInventoryAgent = async (medicine, eventType) => {
  const webhookUrl = process.env.N8N_INVENTORY_AGENT_WEBHOOK;
  if (!webhookUrl) {
    console.warn('N8N_INVENTORY_AGENT_WEBHOOK is not defined. Skipping inventory agent trigger.');
    return;
  }

  try {
    console.log(`Triggering Inventory Agent for medicine ID: ${medicine.id} (Event: ${eventType})`);
    
    // Send full data payload to n8n Webhook
    const payload = {
      event_type: eventType,
      medicine: {
        id: medicine.id,
        medicine_name: medicine.medicine_name,
        barcode: medicine.barcode,
        batch_no: medicine.batch_no,
        stock_quantity: medicine.stock_quantity,
        reorder_level: medicine.reorder_level,
        expiry_date: medicine.expiry_date,
        status: medicine.status,
        vendor_id: medicine.vendor_id,
        purchase_price: medicine.purchase_price,
        selling_price: medicine.selling_price
      },
      timestamp: new Date().toISOString()
    };

    let responseData = null;

    if (process.env.MOCK_INVENTORY_AGENT === 'true' || !webhookUrl) {
      console.log(`[MOCK INVENTORY AGENT] Evaluating ${medicine.medicine_name} natively...`);
      const isOutOfStock = medicine.stock_quantity === 0;
      const isLowStock = medicine.stock_quantity > 0 && medicine.stock_quantity <= medicine.reorder_level;
      
      let stockStatus = 'OK';
      if (isOutOfStock) stockStatus = 'OUT_OF_STOCK';
      else if (isLowStock) stockStatus = 'LOW_STOCK';

      let expiryStatus = 'OK';
      if (medicine.expiry_date) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const expDate = new Date(medicine.expiry_date);
        expDate.setHours(0, 0, 0, 0);
        const diffTime = expDate - today;
        const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (daysRemaining < 0) expiryStatus = 'EXPIRED';
        else if (daysRemaining <= 90) expiryStatus = 'NEAR_EXPIRY';
      }

      responseData = {
        stock_status: stockStatus,
        expiry_status: expiryStatus,
        trigger_procurement: stockStatus !== 'OK',
        message: `[MOCK] Internal evaluation executed.`
      };
    } else {
      const response = await axios.post(webhookUrl, payload, { timeout: 10000 });
      console.log(`Successfully dispatched ${eventType} to Inventory Agent for ${medicine.medicine_name}. Status: ${response.status}`);
      responseData = response.data;
    }
    
    // Handle response: Create alerts if n8n evaluated a problem
    if (responseData) {
      const { stock_status, expiry_status, trigger_procurement, message } = responseData;
      
      // 1. Stock Alerts
      if (stock_status === 'LOW_STOCK' || stock_status === 'OUT_OF_STOCK') {
        const { data: existingStockAlerts } = await supabase
          .from('stock_alerts')
          .select('*')
          .eq('medicine_id', medicine.id)
          .eq('is_resolved', false)
          .eq('alert_type', stock_status);

        if (!existingStockAlerts || existingStockAlerts.length === 0) {
          const alertMessage = message || `Inventory Agent detected ${stock_status} for ${medicine.medicine_name}.`;
          
          await supabase.from('stock_alerts').insert([{
            medicine_id: medicine.id,
            alert_type: stock_status,
            message: alertMessage,
            status: 'ACTIVE'
          }]);
          
          // Trigger Notification Email
          const { sendEmailNotification } = require('./notificationService');
          const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
          await sendEmailNotification({
            to: adminEmail,
            subject: `[MediFlow] ${stock_status.replace('_', ' ')} Alert: ${medicine.medicine_name}`,
            text: alertMessage,
            event_type: stock_status,
          });
          
          // Trigger downstream Procurement Agent
          if (trigger_procurement !== false) {
             const procurementAgentService = require('./procurementAgentService');
             procurementAgentService.triggerProcurementAgent(medicine);
          }
        }
      }

      // 2. Expiry Alerts
      if (expiry_status === 'NEAR_EXPIRY' || expiry_status === 'EXPIRED') {
         const { data: existingExpiryAlerts } = await supabase
          .from('expiry_alerts')
          .select('*')
          .eq('medicine_id', medicine.id)
          .eq('alert_type', expiry_status);

         if (!existingExpiryAlerts || existingExpiryAlerts.length === 0) {
           await supabase.from('expiry_alerts').insert([{
             medicine_id: medicine.id,
             alert_type: expiry_status,
             message: message || `Inventory Agent detected ${expiry_status} for ${medicine.medicine_name}.`
           }]);
         }
      }
    }

  } catch (error) {
    console.error(`Failed to trigger Inventory Agent webhook for ${medicine.medicine_name}:`, error.message);
    // Non-blocking: We don't throw here to ensure application processes continue running.
  }
};

module.exports = {
  triggerInventoryAgent,
};
