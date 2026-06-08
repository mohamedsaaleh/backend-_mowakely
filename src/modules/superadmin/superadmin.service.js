const { User } = require('../users/users.model');
const { AppError } = require('../../middlewares/error.middleware');
const bcrypt = require('bcryptjs');
const { escapeRegex } = require('../../utils/escapeRegex');

class SuperadminService {
  async getAllAdmins(query = {}) {
    const { page = 1, limit = 20, search } = query;
    const skip = (page - 1) * limit;

    const filter = { role: 'admin' };
    if (search) {
      const searchValue = escapeRegex(search);
      filter.$or = [
        { full_name: { $regex: searchValue, $options: 'i' } },
        { email: { $regex: searchValue, $options: 'i' } },
        { phone: { $regex: searchValue, $options: 'i' } }
      ];
    }

    const admins = await User.find(filter)
      .select('-password -emailVerificationToken -passwordResetToken -passwordResetExpires')
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await User.countDocuments(filter);

    return {
      admins,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    };
  }

  async createAdmin(adminData) {
    const existingUser = await User.findOne({ email: adminData.email.toLowerCase() });
    if (existingUser) {
      throw new AppError('Email already registered', 400);
    }

    const hashedPassword = await bcrypt.hash(adminData.password, 12);

    const admin = await User.create({
      email: adminData.email.toLowerCase(),
      password: hashedPassword,
      role: 'admin',
      full_name: adminData.full_name,
      phone: adminData.phone,
      city: adminData.city || '',
      address: adminData.address || '',
      bio: adminData.bio || '',
      profile_photo: adminData.profile_photo || null,
      is_verified: true
    });

    return admin.toJSON();
  }

  async deleteAdmin(adminId) {
    const admin = await User.findById(adminId);
    if (!admin) {
      throw new AppError('Admin not found', 404);
    }

    if (admin.role !== 'admin') {
      throw new AppError('User is not an admin', 400);
    }

    await User.findByIdAndDelete(adminId);

    return { message: 'Admin deleted successfully' };
  }

  async changeRole(targetUserId, newRole, requesterId) {
    if (targetUserId.toString() === requesterId.toString()) {
      throw new AppError('Cannot change your own role', 400);
    }

    const allowedRoles = ['client', 'lawyer', 'admin'];
    if (!allowedRoles.includes(newRole)) {
      throw new AppError('Invalid role specified', 400);
    }

    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      throw new AppError('User not found', 404);
    }

    if (targetUser.role === 'superadmin') {
      throw new AppError('Cannot modify superadmin role', 403);
    }

    const updatedUser = await User.findByIdAndUpdate(
      targetUserId,
      { role: newRole },
      { new: true }
    ).select('-password -emailVerificationToken -passwordResetToken -passwordResetExpires');

    return updatedUser.toJSON();
  }
}

module.exports = new SuperadminService();
