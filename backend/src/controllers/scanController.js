const supabase = require('../config/supabase');
const { successResponse, errorResponse } = require('../utils/response');

const validateScan = async (req, res) => {
  const { barcode } = req.body;

  try {
    // 1. Barcode exists & Medicine exists
    const { data: medicine, error } = await supabase
      .from('medicines')
      .select('*')
      .eq('barcode', barcode)
      .single();

    if (error || !medicine) {
      await logScan(barcode, null, false, 'Medicine not found for barcode');
      return res.status(200).json({ allowed: false, message: 'Medicine not found.' });
    }

    // 2. Status not EXPIRED
    if (medicine.status === 'EXPIRED') {
      await logScan(barcode, medicine.id, false, 'Medicine Expired. Sale Not Allowed.');
      return res.status(200).json({ allowed: false, message: 'Medicine Expired. Sale Not Allowed.' });
    }

    // 3. Status not QUARANTINED
    if (medicine.status === 'QUARANTINED') {
      await logScan(barcode, medicine.id, false, 'Medicine Quarantined. Sale Not Allowed.');
      return res.status(200).json({ allowed: false, message: 'Medicine Quarantined. Sale Not Allowed.' });
    }

    // 4. Stock available (Quantity > 0)
    if (medicine.stock_quantity <= 0) {
      await logScan(barcode, medicine.id, false, 'Medicine Out of Stock.');
      return res.status(200).json({ allowed: false, message: 'Medicine Out of Stock.' });
    }

    // 5. Expiry date valid (Extra check just in case status wasn't updated)
    const today = new Date().toISOString().split('T')[0];
    if (medicine.expiry_date && medicine.expiry_date < today) {
      await logScan(barcode, medicine.id, false, 'Medicine Expired. Sale Not Allowed.');
      return res.status(200).json({ allowed: false, message: 'Medicine Expired. Sale Not Allowed.' });
    }

    // If valid
    await logScan(barcode, medicine.id, true, 'Validation successful');
    return res.status(200).json({ allowed: true });

  } catch (err) {
    console.error('Scan validation error:', err);
    return errorResponse(res, 'Internal Server Error during validation', {}, 500);
  }
};

const logScan = async (barcode, medicineId, allowed, message) => {
  try {
    await supabase.from('scan_logs').insert([{
      barcode,
      medicine_id: medicineId,
      is_valid: allowed,
      message,
      scanned_at: new Date().toISOString(),
    }]);
  } catch (err) {
    console.error('Failed to log scan:', err);
  }
};

module.exports = {
  validateScan,
};
