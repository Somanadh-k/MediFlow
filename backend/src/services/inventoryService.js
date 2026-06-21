const supabase = require('../config/supabase');
const { logAudit } = require('./auditService');
const { sendEmailNotification } = require('./notificationService');
const procurementAgentService = require('./procurementAgentService');

/**
 * Checks inventory for low and out-of-stock items and generates alerts.
 */
const checkInventoryLevels = async () => {
  console.log('Running Inventory Monitor Agent...');

  try {
    // Fetch all active medicines
    const { data: allMedicines, error } = await supabase
      .from('medicines')
      .select('*')
      .neq('status', 'DELETED')
      .neq('status', 'QUARANTINED');

    if (error) throw error;
    
    // Filter medicines with stock <= reorder_level (REMOVED: The Inventory Agent now evaluates all active medicines)
    const medicines = allMedicines || [];

    if (!medicines || medicines.length === 0) {
      console.log('No active inventory items to process.');
      return;
    }

    const { triggerInventoryAgent } = require('./inventoryAgentService');

    for (const medicine of medicines) {
      // Trigger the n8n Intelligent Inventory Agent
      // We don't await this so it runs concurrently and doesn't block the job
      triggerInventoryAgent(medicine, 'MANUAL_RECONCILIATION');
    }

    console.log(`Processed ${medicines.length} inventory items.`);
  } catch (error) {
    console.error('Error in checkInventoryLevels:', error);
  }
};

module.exports = {
  checkInventoryLevels,
};
