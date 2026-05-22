const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../config/env');
const logger = require('./logger');

const generateToken = (payload, options = {}) => {
  const defaultOptions = {
    expiresIn: config.jwt.expiresIn || '15m'
  };

  return jwt.sign(payload, config.jwt.secret, { ...defaultOptions, ...options });
};

const verifyToken = (token) => {
  try {
    return jwt.verify(token, config.jwt.secret);
  } catch (error) {
    return null;
  }
};

const hashPassword = async (password, saltRounds = 12) => {
  return bcrypt.hash(password, saltRounds);
};

const comparePassword = async (password, hashedPassword) => {
  return bcrypt.compare(password, hashedPassword);
};

const generateRandomToken = (length = 32) => {
  return crypto.randomBytes(length).toString('hex');
};

const generateVerificationCode = (length = 6) => {
  return crypto.randomInt(0, Math.pow(10, length)).toString().padStart(length, '0');
};

const generateApiKey = () => {
  const timestamp = Date.now().toString(36);
  const randomPart = crypto.randomBytes(16).toString('hex');
  return `lsk_${timestamp}_${randomPart}`;
};

const hashApiKey = (apiKey) => {
  return crypto.createHash('sha256').update(apiKey).digest('hex');
};

const encryptData = (data, key = null) => {
  const encryptionKey = key || config.jwt.secret;
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(encryptionKey.slice(0, 32)), iv);

  let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
  encrypted += cipher.final('hex');

  return iv.toString('hex') + ':' + encrypted;
};

const decryptData = (encryptedData, key = null) => {
  const decryptionKey = key || config.jwt.secret;
  const [ivHex, encrypted] = encryptedData.split(':');

  const iv = Buffer.from(ivHex, 'hex');
  const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(decryptionKey.slice(0, 32)), iv);

  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return JSON.parse(decrypted);
};

const sanitizeHtml = (input) => {
  if (typeof input !== 'string') return input;

return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

const rateLimitKey = (req) => {
  return req.ip || req.connection.remoteAddress || 'unknown';
};

const generateCsrfToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

const validateCsrfToken = (token, storedToken) => {
  if (!token || !storedToken) return false;
  return crypto.timingSafeEqual(Buffer.from(token), Buffer.from(storedToken));
};

const rotateRefreshToken = async (oldToken) => {
  try {
    const decoded = verifyToken(oldToken);
    if (!decoded) return null;

    const newAccessToken = generateToken(
      { userId: decoded.userId, role: decoded.role },
      { expiresIn: config.jwt.expiresIn }
    );

    const newRefreshToken = generateToken(
      { userId: decoded.userId, role: decoded.role, type: 'refresh' },
      { expiresIn: config.jwt.refreshExpiresIn }
    );

    return { accessToken: newAccessToken, refreshToken: newRefreshToken };
  } catch (error) {
    logger.error('Token rotation error:', error);
    return null;
  }
};

const detectSuspiciousLogin = (req, lastLogin) => {
  const currentIp = req.ip || req.connection.remoteAddress;
  const userAgent = req.get('user-agent') || '';

  if (!lastLogin) return false;

  const lastLoginIp = lastLogin.ip;
  const lastLoginTime = new Date(lastLogin.lastLoginAt);
  const timeDiff = Date.now() - lastLoginTime.getTime();

  const suspicious = lastLoginIp !== currentIp && timeDiff < 300000;

  return suspicious;
};

const accountLockKey = (email) => {
  return `lock:${email}`;
};

const failedLoginKey = (email) => {
  return `failed:${email}`;
};

module.exports = {
  generateToken,
  verifyToken,
  hashPassword,
  comparePassword,
  generateRandomToken,
  generateVerificationCode,
  generateApiKey,
  hashApiKey,
  encryptData,
  decryptData,
  sanitizeHtml,
  rateLimitKey,
  generateCsrfToken,
  validateCsrfToken,
  rotateRefreshToken,
  detectSuspiciousLogin,
  accountLockKey,
  failedLoginKey
};