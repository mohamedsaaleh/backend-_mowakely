const jwt = require('jsonwebtoken');
const config = require('../config/env');
const { User } = require('../modules/users/users.model');
const { AppError } = require('./error.middleware');

const authenticate = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return next(new AppError('You are not logged in. Please log in to get access.', 401));
    }

    const decoded = jwt.verify(token, config.jwt.secret);

    if (decoded.type !== 'access') {
      return next(new AppError('Invalid token type', 401));
    }

    const user = await User.findById(decoded.id);
    if (!user) {
      return next(new AppError('User no longer exists.', 401));
    }

    if (user.is_banned) {
      return next(new AppError('Your account has been banned. Contact support.', 403));
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return next(new AppError('Token expired. Please log in again.', 401));
    }
    next(new AppError('Authentication failed. Please log in again.', 401));
  }
};

const optionalAuth = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (token) {
      const decoded = jwt.verify(token, config.jwt.secret);
      if (decoded.type === 'access') {
        const user = await User.findById(decoded.id);
        if (user && !user.is_banned) {
          req.user = user;
        }
      }
    }

    next();
  } catch (error) {
    next();
  }
};

module.exports = { authenticate, optionalAuth };