const express = require('express');
const router = express.Router();
const scanController = require('../controllers/scanController');
const { verifyToken } = require('../middleware/authMiddleware');
const asyncHandler = require('../utils/asyncHandler');
const { validateRequest, scanValidator } = require('../validators');

router.use(verifyToken);
router.post('/validate', scanValidator, validateRequest, asyncHandler(scanController.validateScan));

module.exports = router;
