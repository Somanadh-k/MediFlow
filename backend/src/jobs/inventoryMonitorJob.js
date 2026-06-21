const cron = require('node-cron');
const { checkInventoryLevels } = require('../services/inventoryService');

// Schedule job to run every hour
const startInventoryMonitorJob = () => {
  cron.schedule('0 * * * *', async () => {
    console.log(`[Job] Running inventoryMonitorJob at ${new Date().toISOString()}`);
    await checkInventoryLevels();
  });
  console.log('[Job] Inventory monitor job scheduled (runs hourly).');
};

module.exports = { startInventoryMonitorJob };
