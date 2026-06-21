const cron = require('node-cron');
const { checkExpiries } = require('../services/expiryService');

// Schedule job to run every day at midnight
const startExpiryMonitorJob = () => {
  cron.schedule('0 0 * * *', async () => {
    console.log(`[Job] Running expiryMonitorJob at ${new Date().toISOString()}`);
    await checkExpiries();
  });
  console.log('[Job] Expiry monitor job scheduled (runs daily at midnight).');
};

module.exports = { startExpiryMonitorJob };
