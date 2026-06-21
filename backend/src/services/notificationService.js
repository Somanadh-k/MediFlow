const nodemailer = require('nodemailer');
const supabase = require('../config/supabase');

// Configure Nodemailer transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: process.env.EMAIL_PORT == 465, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/**
 * Send an email notification and log it
 * @param {Object} params
 * @param {string} params.to - Recipient email address
 * @param {string} params.subject - Email subject
 * @param {string} params.text - Email body content
 * @param {string} params.event_type - Type of event (e.g., 'LOW_STOCK', 'EXPIRY_ALERT')
 */
const sendEmailNotification = async ({ to, subject, text, event_type }) => {
  try {
    // 1. Send the email
    const info = await transporter.sendMail({
      from: `"MediFlow AI" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
    });

    console.log('Message sent: %s', info.messageId);

    // 2. Log the notification
    await logNotification({
      type: 'EMAIL',
      recipient: to,
      event_type,
      message: text,
      status: 'SENT',
    });

    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    
    // Log failure
    await logNotification({
      type: 'EMAIL',
      recipient: to,
      event_type,
      message: text,
      status: 'FAILED',
      error_details: error.message,
    });

    return false;
  }
};

/**
 * Internal function to log notifications to Supabase
 */
const logNotification = async ({ type, recipient, event_type, message, status, error_details = null }) => {
  try {
    await supabase.from('notification_logs').insert([
      {
        notification_type: type, // e.g., 'EMAIL'
        recipient,
        event_type,
        message,
        status,
        error_details,
        sent_at: status === 'SENT' ? new Date().toISOString() : null,
      },
    ]);
  } catch (err) {
    console.error('Failed to write notification log:', err);
  }
};

module.exports = {
  sendEmailNotification,
};
