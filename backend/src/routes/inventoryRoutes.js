const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventoryController');
const { verifyToken } = require('../middleware/authMiddleware');
const asyncHandler = require('../utils/asyncHandler');

router.use(verifyToken);

router.get('/low-stock', asyncHandler(inventoryController.getLowStock));
router.get('/out-of-stock', asyncHandler(inventoryController.getOutOfStock));
router.get('/quarantine', asyncHandler(inventoryController.getQuarantineRecords));

module.exports = router;
