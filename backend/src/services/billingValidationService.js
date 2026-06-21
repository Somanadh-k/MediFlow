const supabase = require('../config/supabase');

/**
 * Validate a medicine for billing
 * @param {string} medicineId - ID of the medicine
 * @param {number} requestedQuantity - Quantity trying to be billed
 * @returns {Promise<{allowed: boolean, message?: string}>}
 */
const validateForBilling = async (medicineId, requestedQuantity = 1) => {
  try {
    const { data: medicine, error } = await supabase
      .from('medicines')
      .select('*')
      .eq('id', medicineId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') { // No rows found
        return { allowed: false, message: 'Medicine not found.' };
      }
      throw error;
    }

    if (medicine.status === 'EXPIRED') {
      return { allowed: false, message: 'Medicine Expired. Sale Not Allowed.' };
    }

    if (medicine.status === 'QUARANTINED') {
      return { allowed: false, message: 'Medicine Quarantined. Sale Not Allowed.' };
    }

    if (medicine.stock_quantity < requestedQuantity) {
      return { 
        allowed: false, 
        message: `Insufficient stock. Only ${medicine.stock_quantity} available.` 
      };
    }

    // Additional check just in case date passed but status wasn't updated yet
    const today = new Date().toISOString().split('T')[0];
    if (medicine.expiry_date && medicine.expiry_date < today) {
       return { allowed: false, message: 'Medicine Expired. Sale Not Allowed.' };
    }

    return { allowed: true };

  } catch (err) {
    console.error('Billing validation error:', err);
    throw new Error('Failed to validate billing item.');
  }
};

module.exports = {
  validateForBilling,
};
