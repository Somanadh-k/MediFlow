const cron = require('node-cron');
// Notification processor job could be used to retry failed notifications
// or process a queue if we implement one. Currently notifications are sent inline.

const startNotificationProcessorJob = () => {
  // Runs every 15 minutes to potentially retry failed notifications
  cron.schedule('*/15 * * * *', async () => {
    // console.log(`[Job] Running notificationProcessorJob at ${new Date().toISOString()}`);
    // Future implementation: fetch FAILED notifications from notification_logs and retry
  });
  console.log('[Job] Notification processor job scheduled (runs every 15m).');
};

module.exports = { startNotificationProcessorJob };
