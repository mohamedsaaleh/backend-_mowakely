const { AppError } = require('./error.middleware');
const { Role } = require('../modules/roles/roles.model');

const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (req.user.isSuperAdmin) {
      return next();
    }
    if (!roles.includes(req.user.role)) {
      return next(new AppError(`Role '${req.user.role}' is not authorized to access this route`, 403));
    }
    next();
  };
};

const authorizePermissions = (...permissions) => {
  return async (req, res, next) => {
    try {
      if (req.user.isSuperAdmin) {
        return next();
      }

      // Check direct user permissions
      const userPermissions = req.user.permissions || [];
      let hasAllPermissions = permissions.every(p => userPermissions.includes(p));

      // If user doesn't have it directly, check their role permissions
      if (!hasAllPermissions) {
        // Fetch role if not already populated
        const role = await Role.findOne({ name: req.user.role });
        const rolePermissions = role ? role.permissions : [];
        
        // Combine them
        const combinedPermissions = new Set([...userPermissions, ...rolePermissions]);
        hasAllPermissions = permissions.every(p => combinedPermissions.has(p));
      }

      if (!hasAllPermissions) {
        return next(new AppError('You do not have the required permissions to perform this action', 403));
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

// Keeping the original name for backward compatibility during migration
const authorize = authorizeRoles;

module.exports = { authorize, authorizeRoles, authorizePermissions };