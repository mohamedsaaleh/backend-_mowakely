const { AppError } = require('./error.middleware');

const authorize = (...roles) => {
  return (req, res, next) => {
    if (req.user.role === 'superadmin') {
      return next();
    }
    if (!roles.includes(req.user.role)) {
      return next(new AppError(`Role '${req.user.role}' is not authorized to access this route`, 403));
    }
    next();
  };
};

module.exports = { authorize };