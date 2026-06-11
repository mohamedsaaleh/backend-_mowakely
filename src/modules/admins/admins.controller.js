const { User } = require('../users/users.model');
const { AuditLog } = require('../audit/audit.model');
const { successResponse, errorResponse } = require('../../utils/apiResponse');
const bcrypt = require('bcryptjs');

class AdminsController {
  async createAdmin(req, res, next) {
    try {
      const { email, password, full_name, phone, role, permissions } = req.body;

      const existingUser = await User.findOne({ email: email.toLowerCase() });
      if (existingUser) {
        return errorResponse(res, 'Email already in use', 400);
      }

      const admin = await User.create({
        email,
        password,
        full_name,
        phone,
        role: role || 'admin',
        permissions: permissions || [],
        is_verified: true,
        isSuperAdmin: false
      });

      const safeAdmin = admin.toJSON();

      await AuditLog.create({
        userId: req.user._id,
        action: 'CREATE_ADMIN',
        targetResource: 'User',
        targetId: admin._id,
        newData: safeAdmin,
        ipAddress: req.ip
      });

      return successResponse(res, 'Admin created successfully', safeAdmin, 201);
    } catch (error) {
      next(error);
    }
  }

  async getAdmins(req, res, next) {
    try {
      // Find all users who are either super admins or have an admin-like role
      const admins = await User.find({
        $or: [
          { isSuperAdmin: true },
          { role: { $nin: ['client', 'lawyer'] } }
        ]
      }).select('-password').sort({ created_at: -1 });

      return successResponse(res, 'Admins retrieved successfully', admins);
    } catch (error) {
      next(error);
    }
  }

  async updateAdmin(req, res, next) {
    try {
      const { id } = req.params;
      const { full_name, phone, role, permissions } = req.body;

      const admin = await User.findById(id);
      if (!admin) {
        return errorResponse(res, 'Admin not found', 404);
      }

      // Prevent non-superadmins from modifying a superadmin
      if (admin.isSuperAdmin && !req.user.isSuperAdmin) {
        return errorResponse(res, 'You are not authorized to modify a super admin', 403);
      }

      const oldData = { ...admin.toJSON() };

      if (full_name) admin.full_name = full_name;
      if (phone) admin.phone = phone;
      if (role && !admin.isSuperAdmin) admin.role = role;
      if (permissions && !admin.isSuperAdmin) admin.permissions = permissions;

      await admin.save();

      await AuditLog.create({
        userId: req.user._id,
        action: 'UPDATE_ADMIN',
        targetResource: 'User',
        targetId: admin._id,
        oldData,
        newData: admin.toJSON(),
        ipAddress: req.ip
      });

      return successResponse(res, 'Admin updated successfully', admin.toJSON());
    } catch (error) {
      next(error);
    }
  }

  async suspendAdmin(req, res, next) {
    try {
      const { id } = req.params;

      const admin = await User.findById(id);
      if (!admin) return errorResponse(res, 'Admin not found', 404);

      if (admin.isSuperAdmin) {
        return errorResponse(res, 'Cannot suspend a super admin', 400);
      }

      const oldData = { ...admin.toJSON() };
      admin.status = 'suspended';
      await admin.save();

      await AuditLog.create({
        userId: req.user._id,
        action: 'SUSPEND_ADMIN',
        targetResource: 'User',
        targetId: admin._id,
        oldData,
        newData: admin.toJSON(),
        ipAddress: req.ip
      });

      return successResponse(res, 'Admin suspended successfully', admin.toJSON());
    } catch (error) {
      next(error);
    }
  }

  async restoreAdmin(req, res, next) {
    try {
      const { id } = req.params;

      const admin = await User.findById(id);
      if (!admin) return errorResponse(res, 'Admin not found', 404);

      const oldData = { ...admin.toJSON() };
      admin.status = 'active';
      await admin.save();

      await AuditLog.create({
        userId: req.user._id,
        action: 'RESTORE_ADMIN',
        targetResource: 'User',
        targetId: admin._id,
        oldData,
        newData: admin.toJSON(),
        ipAddress: req.ip
      });

      return successResponse(res, 'Admin restored successfully', admin.toJSON());
    } catch (error) {
      next(error);
    }
  }

  async deleteAdmin(req, res, next) {
    try {
      const { id } = req.params;

      const admin = await User.findById(id);
      if (!admin) return errorResponse(res, 'Admin not found', 404);

      if (admin.isSuperAdmin) {
        // Prevent deletion if it's the last super admin
        const superAdminsCount = await User.countDocuments({ isSuperAdmin: true, deletedAt: null });
        if (superAdminsCount <= 1) {
          return errorResponse(res, 'Cannot delete the last super admin', 400);
        }
      }

      const oldData = { ...admin.toJSON() };
      admin.deletedAt = new Date();
      await admin.save();

      await AuditLog.create({
        userId: req.user._id,
        action: 'DELETE_ADMIN',
        targetResource: 'User',
        targetId: admin._id,
        oldData,
        ipAddress: req.ip
      });

      return successResponse(res, 'Admin deleted successfully');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AdminsController();
