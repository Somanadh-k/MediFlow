const express = require('express');
const router = express.Router();
const medicineController = require('../controllers/medicineController');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');
const asyncHandler = require('../utils/asyncHandler');
const { validateRequest, medicineValidator } = require('../validators');

// Apply authentication to all medicine routes
router.use(verifyToken);

// All authenticated users can view medicines
router.get('/', asyncHandler(medicineController.getMedicines));
router.get('/:id', asyncHandler(medicineController.getMedicineById));

// Only OWNER and PHARMACIST can modify medicines
router.use(requireRole('OWNER', 'PHARMACIST'));
router.post('/', medicineValidator, validateRequest, asyncHandler(medicineController.createMedicine));
router.put('/:id', medicineValidator, validateRequest, asyncHandler(medicineController.updateMedicine));
router.delete('/:id', asyncHandler(medicineController.deleteMedicine));

module.exports = router;
