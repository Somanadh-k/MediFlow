const { body, validationResult } = require('express-validator');
const { errorResponse } = require('../utils/response');

const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return errorResponse(res, 'Validation Error', errors.array(), 400);
  }
  next();
};

const registerValidator = [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('full_name').notEmpty().withMessage('Full name is required'),
  body('role').isIn(['OWNER', 'PHARMACIST', 'STAFF']).withMessage('Invalid role'),
];

const loginValidator = [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
];

const medicineValidator = [
  body('medicine_name').notEmpty().withMessage('Medicine name is required'),
  body('barcode').notEmpty().withMessage('Barcode is required'),
  body('batch_no').notEmpty().withMessage('Batch number is required'),
  body('expiry_date').isISO8601().toDate().withMessage('Valid expiry date is required'),
  body('stock_quantity').isInt({ min: 0 }).withMessage('Stock quantity must be non-negative'),
  body('reorder_level').isInt({ min: 0 }).withMessage('Reorder level must be non-negative'),
  body('purchase_price').isFloat({ min: 0 }).withMessage('Purchase price must be non-negative'),
  body('selling_price').isFloat({ min: 0 }).withMessage('Selling price must be non-negative'),
];

const scanValidator = [
  body('barcode').notEmpty().withMessage('Barcode is required'),
];

module.exports = {
  validateRequest,
  registerValidator,
  loginValidator,
  medicineValidator,
  scanValidator,
};
