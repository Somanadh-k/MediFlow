const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { errorHandler } = require('./middleware/errorMiddleware');

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Basic health check route
app.get('/health', (req, res) => {
  res.status(200).json({ success: true, data: { status: 'OK' } });
});

// Routes
const authRoutes = require('./routes/authRoutes');
const medicineRoutes = require('./routes/medicineRoutes');
const scanRoutes = require('./routes/scanRoutes');
const inventoryRoutes = require('./routes/inventoryRoutes');
const alertRoutes = require('./routes/alertRoutes');
const agentRoutes = require('./routes/agentRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/medicines', medicineRoutes);
app.use('/api/scan', scanRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/agents', agentRoutes);

// Background Jobs
const { startExpiryMonitorJob } = require('./jobs/expiryMonitorJob');
const { startInventoryMonitorJob } = require('./jobs/inventoryMonitorJob');
const { startNotificationProcessorJob } = require('./jobs/notificationProcessorJob');

startExpiryMonitorJob();
startInventoryMonitorJob();
startNotificationProcessorJob();

// Global Error Handler
app.use(errorHandler);

module.exports = app;
