const crypto = require('crypto');

const generateToken = (length = 32) => {
  return crypto.randomBytes(length).toString('hex');
};

const generateEmailVerificationToken = () => {
  return generateToken(64);
};

const generatePasswordResetToken = () => {
  return generateToken(64);
};

const hashToken = (token) => {
  if (!token || typeof token !== 'string') {
    throw new Error('Token must be a non-empty string');
  }
  return crypto.createHash('sha256').update(token).digest('hex');
};

module.exports = {
  generateToken,
  generateEmailVerificationToken,
  generatePasswordResetToken,
  hashToken
};