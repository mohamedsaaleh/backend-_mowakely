const { Role } = require('./roles.model');
const { AuditLog } = require('../audit/audit.model');
const { successResponse, errorResponse } = require('../../utils/apiResponse');

class RolesController {
  // Common permissions available in the system
  async getSystemPermissions(req, res, next) {
    try {
      const permissions = [
        'users.read', 'users.create', 'users.update', 'users.delete',
        'cases.read', 'cases.create', 'cases.update', 'cases.delete',
        'payments.read', 'payments.create', 'payments.update', 'payments.delete',
        'roles.manage', 'permissions.manage', 'admins.manage', 'notifications.manage'
      ];
      return successResponse(res, 'System permissions retrieved', permissions);
    } catch (error) {
      next(error);
    }
  }

  async createRole(req, res, next) {
    try {
      const { name, description, permissions } = req.body;

      const existingRole = await Role.findOne({ name: name.toUpperCase() });
      if (existingRole) {
        return errorResponse(res, 'Role with this name already exists', 400);
      }

      const role = await Role.create({
        name: name.toUpperCase(),
        description,
        permissions: permissions || [],
        isSystemRole: false
      });

      await AuditLog.create({
        userId: req.user._id,
        action: 'CREATE_ROLE',
        targetResource: 'Role',
        targetId: role._id,
        newData: role,
        ipAddress: req.ip
      });

      return successResponse(res, 'Role created successfully', role, 201);
    } catch (error) {
      next(error);
    }
  }

  async getRoles(req, res, next) {
    try {
      const roles = await Role.find().sort({ created_at: -1 });
      return successResponse(res, 'Roles retrieved', roles);
    } catch (error) {
      next(error);
    }
  }

  async updateRole(req, res, next) {
    try {
      const { id } = req.params;
      const { description, permissions } = req.body;

      const role = await Role.findById(id);
      if (!role) {
        return errorResponse(res, 'Role not found', 404);
      }

      if (role.isSystemRole && req.body.name) {
        return errorResponse(res, 'Cannot rename system roles', 400);
      }

      const oldData = { ...role.toObject() };

      if (req.body.name && !role.isSystemRole) {
        role.name = req.body.name.toUpperCase();
      }
      if (description !== undefined) role.description = description;
      if (permissions !== undefined) role.permissions = permissions;

      await role.save();

      await AuditLog.create({
        userId: req.user._id,
        action: 'UPDATE_ROLE',
        targetResource: 'Role',
        targetId: role._id,
        oldData,
        newData: role,
        ipAddress: req.ip
      });

      return successResponse(res, 'Role updated successfully', role);
    } catch (error) {
      next(error);
    }
  }

  async deleteRole(req, res, next) {
    try {
      const { id } = req.params;

      const role = await Role.findById(id);
      if (!role) {
        return errorResponse(res, 'Role not found', 404);
      }

      if (role.isSystemRole) {
        return errorResponse(res, 'System roles cannot be deleted', 400);
      }

      const oldData = { ...role.toObject() };
      await role.deleteOne();

      await AuditLog.create({
        userId: req.user._id,
        action: 'DELETE_ROLE',
        targetResource: 'Role',
        targetId: role._id,
        oldData,
        ipAddress: req.ip
      });

      return successResponse(res, 'Role deleted successfully');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new RolesController();
