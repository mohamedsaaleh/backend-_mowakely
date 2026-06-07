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
const path = require('path');
const mongoose = require('mongoose');
const os = require('os');
const { sanitizeHtml } = require('./utils/securityHelper');

const app = express();
app.set('trust proxy', 1);

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
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(compression());

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use(mongoSanitize());

const xssSanitize = (value) => {
  if (typeof value === 'string') {
    return value.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
                .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
                .replace(/<[^>]*>/g, '');
  }
  return value;
};

const deepSanitize = (obj) => {
  if (!obj || typeof obj !== 'object') return xssSanitize(obj);
  if (Array.isArray(obj)) return obj.map(deepSanitize);
  Object.keys(obj).forEach(key => { obj[key] = deepSanitize(obj[key]); });
  return obj;
};

app.use((req, res, next) => {
  if (req.body) deepSanitize(req.body);
  if (req.query) deepSanitize(req.query);
  if (req.params) deepSanitize(req.params);
  next();
});

app.use(hpp({
  whitelist: ['page', 'limit', 'sort', 'status', 'category', 'city', 'search', 'role', 'minBudget', 'maxBudget', 'rating', 'specialization', 'minRating', 'fields', 'order', 'unreadOnly', 'availability_status']
}));

if (config.nodeEnv !== 'test') {
  const logStream = {
    write: (message) => {
      logger.info(message.trim());
    }
  };
  app.use(morgan('combined', { stream: logStream }));
}

const apiLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  message: { success: false, message: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, message: 'Too many login attempts, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false
});

app.use('/api', apiLimiter);

let isDbConnected = false;
let dbConnectionTime = null;

async function initializeDatabase() {
  if (config.nodeEnv === 'test') {
    isDbConnected = true;
    dbConnectionTime = new Date();
    return;
  }

  try {
    await connectDB();
    isDbConnected = true;
    dbConnectionTime = new Date();
    logger.info('✅ Database connected successfully');
  } catch (err) {
    logger.error('❌ Database connection failed:', err);
    process.exit(1);
  }
}

const appReady = initializeDatabase();

const authRoutes = require('./modules/auth/auth.routes');
const categoryRoutes = require('./modules/categories/categories.routes');
const caseRoutes = require('./modules/cases/cases.routes');
const offerRoutes = require('./modules/offers/offers.routes');
const messageRoutes = require('./modules/messages/messages.routes');
const reviewRoutes = require('./modules/reviews/reviews.routes');
const notificationRoutes = require('./modules/notifications/notifications.routes');
const invoiceRoutes = require('./modules/invoices/invoices.routes');
const lawyerRoutes = require('./modules/lawyers/lawyers.routes');
const clientRoutes = require('./modules/clients/clients.routes');
const adminRoutes = require('./modules/admin/admin.routes');
const payoutRoutes = require('./modules/payouts/payouts.routes');
const userRoutes = require('./modules/users/users.routes');
const paymentRoutes = require('./modules/payments/payments.routes');

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/cases', caseRoutes);
app.use('/api/offers', offerRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/lawyers', lawyerRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api//admin', adminRoutes);
app.use('/api/payouts', payoutRoutes);
app.use('/api/users', userRoutes);
app.use('/api/payments', paymentRoutes);

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Legal Services Marketplace API',
  customfavIcon: '/favicon.ico',
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
    docExpansion: 'list',
    filter: true,
    showExtensions: true,
    showCommonExtensions: true
  }
}));

app.get('/api-docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

app.get('/api/health', (req, res) => {
  const healthcheck = {
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv,
    version: process.env.npm_package_version || '1.0.0',
    uptime: process.uptime(),
    database: isDbConnected ? 'connected' : 'disconnected'
  };
  res.json(healthcheck);
});

app.get('/api/health/ready', async (req, res) => {
  const checks = {
    database: isDbConnected
  };

  const allReady = Object.values(checks).every(status => status === true);

  res.status(allReady ? 200 : 503).json({
    success: allReady,
    status: allReady ? 'ready' : 'not ready',
    checks,
    timestamp: new Date().toISOString()
  });
});

app.get('/api/health/live', (req, res) => {
  res.status(200).json({
    success: true,
    status: 'alive',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/health/detailed', async (req, res) => {
  const memUsage = process.memoryUsage();
  const cpuUsage = process.cpuUsage();

  let dbStatus = 'disconnected';
  let dbResponseTime = null;

  if (isDbConnected) {
    try {
      const start = Date.now();
      await mongoose.connection.db.admin().ping();
      dbResponseTime = Date.now() - start;
      dbStatus = 'connected';
    } catch (error) {
      dbStatus = 'error';
    }
  }

  const health = {
    success: true,
    status: dbStatus === 'connected' ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || '1.0.0',
    environment: config.nodeEnv,
    system: {
      platform: os.platform(),
      arch: os.arch(),
      nodeVersion: process.version,
      cpuCores: os.cpus().length,
      totalMemory: Math.round(os.totalmem() / 1024 / 1024) + ' MB',
      freeMemory: Math.round(os.freemem() / 1024 / 1024) + ' MB'
    },
    process: {
      pid: process.pid,
      memory: {
        rss: Math.round(memUsage.rss / 1024 / 1024) + ' MB',
        heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024) + ' MB',
        heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024) + ' MB',
        external: Math.round(memUsage.external / 1024 / 1024) + ' MB'
      },
      cpu: {
        user: cpuUsage.user,
        system: cpuUsage.system
      }
    },
    database: {
      status: dbStatus,
      responseTime: dbResponseTime ? dbResponseTime + 'ms' : null,
      connectionTime: dbConnectionTime ? dbConnectionTime.toISOString() : null,
      name: mongoose.connection.name,
      host: mongoose.connection.host
    }
  };

  res.json(health);
});

app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Legal Services Marketplace API',
    version: '1.0.0',
    documentation: '/api-docs',
    health: '/api/health'
  });
});

app.use(notFound);
app.use(errorHandler);

module.exports = app;
module.exports.app = app;
module.exports.appReady = appReady;
