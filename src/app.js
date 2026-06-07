const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const mongoSanitize = require('express-mongo-sanitize');
const hpp = require('hpp');
const morgan = require('morgan');
const config = require('./config/env');
const { errorHandler, notFound } = require('./middlewares/error.middleware');
const connectDB = require('./config/db');
const { swaggerSpec, swaggerUi } = require('./config/swagger');
const logger = require('./utils/logger');
const mongoose = require('mongoose');
const os = require('os');

const app = express();
app.set('trust proxy', 1);

const allowedOrigins = (process.env.CORS_ORIGIN || '*').split(',');

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://cdn.jsdelivr.net'],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:']
    }
  },
  crossOriginEmbedderPolicy: false
}));

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(mongoSanitize());

const xssSanitize = (value) => {
  if (typeof value !== 'string') return value;
  return value
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
    .replace(/<[^>]*>/g, '');
};

const deepSanitize = (obj) => {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(deepSanitize);

  for (const key in obj) {
    obj[key] = deepSanitize(obj[key]);
  }

  return obj;
};

app.use((req, res, next) => {
  if (req.body) req.body = deepSanitize(req.body);
  if (req.query) req.query = deepSanitize(req.query);
  if (req.params) req.params = deepSanitize(req.params);
  next();
});

app.use(hpp());

if (config.nodeEnv !== 'test') {
  app.use(morgan('combined'));
}

const apiLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20
});

app.use('/api', apiLimiter);

let isDbConnected = false;

async function initializeDatabase() {
  if (config.nodeEnv === 'test') {
    isDbConnected = true;
    return;
  }

  try {
    await connectDB();
    isDbConnected = true;
    logger.info('Database connected');
  } catch (err) {
    logger.error('DB connection failed (retry recommended):', err);
    isDbConnected = false;
  }
}

const appReady = initializeDatabase();

// routes
app.use('/api/auth', authLimiter, require('./modules/auth/auth.routes'));
app.use('/api/categories', require('./modules/categories/categories.routes'));
app.use('/api/cases', require('./modules/cases/cases.routes'));
app.use('/api/offers', require('./modules/offers/offers.routes'));
app.use('/api/messages', require('./modules/messages/messages.routes'));
app.use('/api/reviews', require('./modules/reviews/reviews.routes'));
app.use('/api/notifications', require('./modules/notifications/notifications.routes'));
app.use('/api/invoices', require('./modules/invoices/invoices.routes'));
app.use('/api/lawyers', require('./modules/lawyers/lawyers.routes'));
app.use('/api/clients', require('./modules/clients/clients.routes'));
app.use('/api/admin', require('./modules/admin/admin.routes'));
app.use('/api/payouts', require('./modules/payouts/payouts.routes'));
app.use('/api/users', require('./modules/users/users.routes'));
app.use('/api/payments', require('./modules/payments/payments.routes'));

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    db: isDbConnected
  });
});

app.get('/', (req, res) => {
  res.json({
    message: 'API Running'
  });
});

app.use(notFound);
app.use(errorHandler);

module.exports = { app, appReady };