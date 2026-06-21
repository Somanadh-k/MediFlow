const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verifyToken } = require('../middleware/authMiddleware');
const asyncHandler = require('../utils/asyncHandler');
const { validateRequest, registerValidator, loginValidator } = require('../validators');

// Note: Registration might be protected in a real app (e.g., only OWNER can create accounts), 
// but we leave it open here or you can apply requireRole('OWNER').
router.post('/register', registerValidator, validateRequest, asyncHandler(authController.register));
router.post('/login', loginValidator, validateRequest, asyncHandler(authController.login));
router.get('/profile', verifyToken, asyncHandler(authController.getProfile));

module.exports = router;
