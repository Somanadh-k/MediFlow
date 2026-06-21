const express = require('express');
const router = express.Router();
const { getDecisions, approveDecision, getDemandForecasts, getDemandForecastAnalytics } = require('../controllers/agentController');
const { verifyToken } = require('../middleware/authMiddleware');

router.use(verifyToken);

router.get('/decisions', getDecisions);
router.put('/decisions/:id/approve', approveDecision);
router.get('/forecasts', getDemandForecasts);
router.get('/forecasts/analytics', getDemandForecastAnalytics);

module.exports = router;
