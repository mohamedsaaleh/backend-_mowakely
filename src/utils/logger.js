const winston = require('winston');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

let logDir = 'logs';
try {
  const config = require('../config/env');
  logDir = config.logging?.dir || 'logs';
} catch (e) {}

if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

const getLevel = () => {
  try {
    const config = require('../config/env');
    return config.logging?.level || 'info';
  } catch (e) {
    return 'info';
  }
};

const requestIdFormatter = winston.format((info) => {
  info.requestId = info.requestId || uuidv4();
  return info;
});

const prodFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
  winston.format.errors({ stack: true }),
  requestIdFormatter(),
  winston.format.json()
);

const devFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.colorize(),
  requestIdFormatter(),
  winston.format.printf(({ timestamp, level, message, requestId, ...meta }) => {
    let metaStr = '';
    if (Object.keys(meta).length > 0 && meta.stack) {
      metaStr = `\n${meta.stack}`;
    } else if (Object.keys(meta).length > 0) {
      metaStr = `\n${JSON.stringify(meta, null, 2)}`;
    }
    return `${timestamp} [${requestId?.substring(0, 8)}] ${level}: ${message}${metaStr}`;
  })
);

const transports = [
  new winston.transports.File({
    filename: path.join(logDir, 'error.log'),
    level: 'error',
    maxsize: 10 * 1024 * 1024,
    maxFiles: 10
  }),
  new winston.transports.File({
    filename: path.join(logDir, 'combined.log'),
    maxsize: 10 * 1024 * 1024,
    maxFiles: 10
  }),
  new winston.transports.File({
    filename: path.join(logDir, 'audit.log'),
    level: 'info',
    maxsize: 10 * 1024 * 1024,
    maxFiles: 10
  })
];

const logger = winston.createLogger({
  level: getLevel(),
  format: process.env.NODE_ENV === 'production' ? prodFormat : devFormat,
  transports,
  exceptionHandlers: [
    new winston.transports.File({
      filename: path.join(logDir, 'exceptions.log'),
      maxsize: 10 * 1024 * 1024,
      maxFiles: 5
    })
  ],
  rejectionHandlers: [
    new winston.transports.File({
      filename: path.join(logDir, 'rejections.log'),
      maxsize: 10 * 1024 * 1024,
      maxFiles: 5
    })
  ]
});

if (process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'test') {
  logger.add(new winston.transports.Console({
    format: devFormat
  }));
}

const auditLogger = (action) => {
  return (userId, details = {}) => {
    logger.info('AUDIT', {
      action,
      userId,
      ...details,
      timestamp: new Date().toISOString()
    });
  };
};

const createChildLogger = (requestId) => {
  return logger.child({ requestId });
};

const logRequest = (req, res, next) => {
  req.requestId = uuidv4();
  req.logger = createChildLogger(req.requestId);

  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info(`${req.method} ${req.originalUrl}`, {
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('user-agent')
    });
  });

  next();
};

logger.audit = auditLogger;
logger.child = createChildLogger;
logger.logRequest = logRequest;

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection:', { reason: String(reason), promise });
});

module.exports = logger;
