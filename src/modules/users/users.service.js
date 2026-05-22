const { User } = require('./users.model');
const { escapeRegex } = require('../../utils/escapeRegex');

class UsersService {
  async getAllUsers(query) {
    const { page = 1, limit = 10, search, role } = query;
    const skip = (page - 1) * limit;

    const filter = {};
    if (role) filter.role = role;
    if (search) {
      const searchValue = escapeRegex(search);
      filter.$or = [
        { full_name: { $regex: searchValue, $options: 'i' } },
        { email: { $regex: searchValue, $options: 'i' } },
        { phone: { $regex: searchValue, $options: 'i' } }
      ];
    }

    const users = await User.find(filter)
      .select('-password -emailVerificationToken -passwordResetToken -passwordResetExpires')
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await User.countDocuments(filter);

    return {
      items: users,
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

  async getUserById(id) {
    return await User.findById(id).select('-password -emailVerificationToken -passwordResetToken -passwordResetExpires');
  }

  async updateUser(id, data) {
    const allowedFields = ['full_name', 'phone', 'city', 'address', 'bio', 'profile_photo'];
    const updateData = {};
    allowedFields.forEach(field => {
      if (data[field] !== undefined) updateData[field] = data[field];
    });

    return await User.findByIdAndUpdate(id, updateData, { new: true })
      .select('-password -emailVerificationToken -passwordResetToken -passwordResetExpires');
  }

  async deleteUser(id) {
    return await User.findByIdAndDelete(id);
  }

  async toggleBanUser(id, banned) {
    return await User.findByIdAndUpdate(id, { is_banned: banned }, { new: true })
      .select('-password -emailVerificationToken -passwordResetToken -passwordResetExpires');
  }
}

module.exports = new UsersService();
