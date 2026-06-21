const supabase = require('../config/supabase');

/**
 * Log an audit event
 * @param {Object} params
 * @param {string} params.user_id - ID of the user performing the action
 * @param {string} params.action - Action performed (e.g., 'LOGIN', 'CREATE_MEDICINE')
 * @param {string} params.entity - The entity affected (e.g., 'users', 'medicines')
 * @param {string} [params.entity_id] - ID of the specific entity
 * @param {Object} [params.before_state] - Previous state of the entity
 * @param {Object} [params.after_state] - New state of the entity
 * @param {string} [params.ip_address] - User's IP address
 */
const logAudit = async ({
  user_id,
  action,
  entity,
  entity_id = null,
  before_state = null,
  after_state = null,
  ip_address = null,
}) => {
  try {
    const { error } = await supabase
      .from('audit_logs')
      .insert([
        {
          user_id,
          action,
          entity,
          entity_id,
          before_state,
          after_state,
          ip_address,
          created_at: new Date().toISOString(),
        },
      ]);

    if (error) {
      console.error('Failed to write audit log:', error);
      // We don't usually throw here to prevent blocking main business logic,
      // but in a strict system we might.
    }
  } catch (err) {
    console.error('Audit logging error:', err);
  }
};

module.exports = { logAudit };
