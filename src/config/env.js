require('dotenv').config();

module.exports = {
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/legal_marketplace',

  jwt: {
    secret: process.env.JWT_SECRET || 'fallback-secret-key-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d'
  },

  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100
  },

  upload: {
    path: process.env.UPLOAD_PATH || './uploads',
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024
  },

  platformFee: parseInt(process.env.PLATFORM_FEE_PERCENTAGE) || 10,

  email: {
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: process.env.EMAIL_SECURE === 'true',
    user: process.env.EMAIL_USER || '',
    password: process.env.EMAIL_PASSWORD || '',
    from: process.env.EMAIL_FROM || 'noreply@legalservices.com'
  },

  paymob: {
    apiKey: process.env.PAYMOB_API_KEY || '',
    integrationId: process.env.PAYMOB_INTEGRATION_ID || '',
    iframeId: process.env.PAYMOB_IFRAME_ID || '',
    hmacSecret: process.env.PAYMOB_HMAC_SECRET || ''
  },

  logging: {
    level: process.env.LOG_LEVEL || 'info',
    dir: process.env.LOG_DIR || 'logs'
  }
};