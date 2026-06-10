require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const logger = require('./utils/logger');
const { getModels } = require('./config/db');

// Import routes
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const supplierRoutes = require('./routes/supplierRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const auditRoutes = require('./routes/auditRoutes');

const app = express();

// Security Middlewares
app.use(helmet()); 

// CORS configuration
const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : '*',
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

app.use(express.json());

// Global Rate Limiting (Disabled in tests)
if (process.env.NODE_ENV !== 'test') {
    const globalLimiter = rateLimit({
        windowMs: 15 * 60 * 1000,
        max: 100,
        message: { message: 'Too many requests from this IP, please try again after 15 minutes' },
        standardHeaders: true,
        legacyHeaders: false,
    });
    app.use('/api', globalLimiter);

    const authLimiter = rateLimit({
        windowMs: 60 * 60 * 1000,
        max: 10,
        message: { message: 'Too many authentication attempts, please try again after an hour' },
        standardHeaders: true,
        legacyHeaders: false,
    });
    app.use('/api/auth/login', authLimiter);
    app.use('/api/auth/register', authLimiter);
}

// HTTP Request Logging
if (process.env.NODE_ENV !== 'test') {
    app.use(morgan('combined', { 
        stream: { write: (message) => logger.info(message.trim()) } 
    }));
}

// Mount API routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/audit', auditRoutes);

// Health check
app.get('/', (req, res) => {
  const models = getModels();
  res.json({
    status: 'Healthy',
    databaseMode: models.isFallback ? 'Local JSON' : 'MongoDB',
    environment: process.env.NODE_ENV || 'development'
  });
});

// Error handling
app.use((err, req, res, next) => {
  if (process.env.NODE_ENV !== 'test') {
    logger.error(`${err.status || 500} - ${err.message} - ${req.originalUrl} - ${req.method} - ${req.ip} - ${err.stack}`);
  }
  
  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error occurred',
    stack: process.env.NODE_ENV === 'production' ? null : err.stack
  });
});

module.exports = app;
