const express = require('express');
const router = express.Router();
const alertController = require('../controllers/alertController');
const { verifyToken } = require('../middleware/authMiddleware');
const asyncHandler = require('../utils/asyncHandler');

router.use(verifyToken);
router.get('/', asyncHandler(alertController.getAlerts));

module.exports = router;
