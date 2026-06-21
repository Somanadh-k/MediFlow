const supabase = require('../config/supabase');
const { logAudit } = require('./auditService');
const { sendEmailNotification } = require('./notificationService');

/**
 * Helper to get date strictly offset by days
 */
const addDays = (date, days) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result.toISOString().split('T')[0]; // Return YYYY-MM-DD
};

/**
 * Main routine for Expiry Monitoring Agent
 */
const checkExpiries = async () => {
  console.log('Running Expiry Monitor Agent...');
  
  const today = new Date().toISOString().split('T')[0];
  const days90 = addDays(new Date(), 90);
  const days60 = addDays(new Date(), 60);
  const days30 = addDays(new Date(), 30);

  try {
    // Fetch all active or near_expiry medicines
    const { data: medicines, error } = await supabase
      .from('medicines')
      .select('*')
      .in('status', ['ACTIVE', 'NEAR_EXPIRY']);

    if (error) throw error;
    if (!medicines) return;

    for (const medicine of medicines) {
      const expiryDate = medicine.expiry_date;
      if (!expiryDate) continue;

      let newStatus = medicine.status;
      let alertType = null;
      let daysRemaining = null;

      // Determine condition
      if (expiryDate < today) {
        // EXPIRED
        newStatus = 'EXPIRED';
        alertType = 'EXPIRED';
        daysRemaining = 0;
      } else if (expiryDate <= days30) {
        newStatus = 'NEAR_EXPIRY';
        alertType = '30_DAYS_EXPIRY';
        daysRemaining = 30;
      } else if (expiryDate <= days60) {
        newStatus = 'NEAR_EXPIRY';
        alertType = '60_DAYS_EXPIRY';
        daysRemaining = 60;
      } else if (expiryDate <= days90) {
        newStatus = 'NEAR_EXPIRY';
        alertType = '90_DAYS_EXPIRY';
        daysRemaining = 90;
      }

      // If a condition is met
      if (alertType) {
        // We must check if an alert for this specific milestone has already been sent
        const { data: existingAlerts } = await supabase
          .from('expiry_alerts')
          .select('id')
          .eq('medicine_id', medicine.id)
          .eq('days_remaining', daysRemaining);

        const alertAlreadySent = existingAlerts && existingAlerts.length > 0;

        if (!alertAlreadySent) {
          await processStatusChange(medicine, newStatus, alertType, daysRemaining);
        } else if (newStatus !== medicine.status && newStatus === 'EXPIRED') {
          // If status somehow missed being updated to EXPIRED, still process it
          await processStatusChange(medicine, newStatus, alertType, daysRemaining);
        }
      }
    }
    
    console.log('Expiry check complete.');
  } catch (error) {
    console.error('Error in checkExpiries:', error);
  }
};

const processStatusChange = async (medicine, newStatus, alertType, daysRemaining) => {
  try {
    let finalStatus = newStatus;
    
    // If expired, move to quarantine
    if (newStatus === 'EXPIRED') {
      finalStatus = 'QUARANTINED';
      
      // 1. Add record to quarantine_inventory
      await supabase.from('quarantine_inventory').insert([{
        medicine_id: medicine.id,
        reason: 'EXPIRED',
        quarantine_date: new Date().toISOString(),
      }]);

      // Note: We skip quarantine_logs directly here since quarantine_inventory
      // effectively logs the quarantine event, and the audit logs handle history.
    }

    // 3. Update medicine status
    const updatePayload = { status: finalStatus };
    if (finalStatus === 'QUARANTINED') {
      // Typically, stock is zeroed out in main inventory when quarantined
      updatePayload.stock_quantity = 0; 
    }

    await supabase
      .from('medicines')
      .update(updatePayload)
      .eq('id', medicine.id);

    // Create expiry alert record
    await supabase.from('expiry_alerts').insert([{
      medicine_id: medicine.id,
      days_remaining: daysRemaining,
      alert_sent: false
    }]);

    // 4. Create audit logs
    await logAudit({
      user_id: 'system',
      action: finalStatus === 'QUARANTINED' ? 'QUARANTINE_MEDICINE' : 'UPDATE_MEDICINE_STATUS',
      entity: 'medicines',
      entity_id: medicine.id,
      before_state: { status: medicine.status },
      after_state: updatePayload,
    });

    // 5. Create notification log (via email)
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com'; 
    const alertMessage = finalStatus === 'QUARANTINED' 
      ? `${medicine.medicine_name} has expired and moved to quarantine.`
      : `${medicine.medicine_name} will expire in approximately ${daysRemaining} days.`;

    await sendEmailNotification({
      to: adminEmail,
      subject: `[MediFlow] Expiry Alert: ${medicine.medicine_name} - ${alertType}`,
      text: alertMessage,
      event_type: alertType,
    });

  } catch (error) {
    console.error(`Error processing status change for medicine ${medicine.id}:`, error);
  }
};

module.exports = {
  checkExpiries,
};
