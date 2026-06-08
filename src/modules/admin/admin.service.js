const { User } = require('../users/users.model');
const { Lawyer } = require('../lawyers/lawyers.model');
const { Client } = require('../clients/clients.model');
const { Case } = require('../cases/cases.model');
const { Category } = require('../categories/categories.model');
const { Invoice } = require('../invoices/invoices.model');
const { Payout } = require('../payouts/payouts.model');
const { Notification } = require('../notifications/notifications.model');
const { AppError } = require('../../middlewares/error.middleware');
const { escapeRegex } = require('../../utils/escapeRegex');
const bcrypt = require('bcryptjs');
const logger = require('../../utils/logger');

const lawyersService = require('../lawyers/lawyers.service');
const categoriesService = require('../categories/categories.service');

class AdminService {
  // ==================== DASHBOARD ====================

  async getDashboardStats() {
    const totalUsers = await User.countDocuments();
    const totalLawyers = await Lawyer.countDocuments();
    const totalClients = await User.countDocuments({ role: 'client' });
    const totalCases = await Case.countDocuments();
    const openCases = await Case.countDocuments({ status: 'open' });
    const completedCases = await Case.countDocuments({ status: 'completed' });

    const totalRevenue = await Invoice.aggregate([
      { $match: { paymentStatus: 'paid' } },
      { $group: { _id: null, total: { $sum: '$value' } } }
    ]);

    const pendingPayouts = await Payout.aggregate([
      { $match: { status: 'pending' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    return {
      users: { total: totalUsers, lawyers: totalLawyers, clients: totalClients },
      cases: { total: totalCases, open: openCases, completed: completedCases },
      revenue: { total: totalRevenue[0]?.total || 0 },
      payouts: { pending: pendingPayouts[0]?.total || 0 }
    };
  }

  // ==================== USER MANAGEMENT ====================

  async getAllUsers(query = {}) {
    const { page = 1, limit = 20, role, search, is_banned, is_verified } = query;
    const filter = {};
    if (role) filter.role = role;
    if (is_banned !== undefined) filter.is_banned = is_banned === 'true' || is_banned === true;
    if (is_verified !== undefined) filter.is_verified = is_verified === 'true' || is_verified === true;
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
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .sort({ created_at: -1 });

    const total = await User.countDocuments(filter);

    return {
      users,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) }
    };
  }

  async getUserById(id) {
    const user = await User.findById(id)
      .select('-password -emailVerificationToken -passwordResetToken -passwordResetExpires');
    if (!user) {
      throw new AppError('User not found', 404);
    }
    return user;
  }

  async createUser(userData) {
    const existingUser = await User.findOne({ email: userData.email.toLowerCase() });
    if (existingUser) {
      throw new AppError('Email already registered', 400);
    }

    const hashedPassword = await bcrypt.hash(userData.password, 12);

    const user = await User.create({
      email: userData.email.toLowerCase(),
      password: hashedPassword,
      role: userData.role || 'client',
      full_name: userData.full_name,
      phone: userData.phone,
      city: userData.city || '',
      address: userData.address || '',
      bio: userData.bio || '',
      profile_photo: userData.profile_photo || null,
      is_verified: userData.is_verified || false,
      is_banned: userData.is_banned || false
    });

    if (userData.role === 'lawyer') {
      await Lawyer.create({
        user: user._id,
        specialization: userData.specialization || '',
        years_of_experience: userData.years_of_experience || 0,
        office_address: userData.office_address || ''
      });
    } else if (userData.role === 'client') {
      await Client.create({ user: user._id });
    }

    return user.toJSON();
  }

  async updateUser(id, updateData) {
    if (updateData.password) {
      throw new AppError('Use password reset endpoint for password changes', 400);
    }

    if (updateData.role) {
      const allowedRoles = ['client', 'lawyer', 'admin'];
      if (!allowedRoles.includes(updateData.role)) {
        throw new AppError('You cannot assign superadmin role', 403);
      }
    }

    const user = await User.findById(id);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    if (user.role === 'superadmin') {
      throw new AppError('Cannot modify superadmin users', 403);
    }

    const allowedFields = ['full_name', 'phone', 'city', 'address', 'bio', 'profile_photo', 'role', 'is_verified', 'is_banned'];
    allowedFields.forEach(field => {
      if (updateData[field] !== undefined) {
        user[field] = updateData[field];
      }
    });

    await user.save();

    return user.toJSON();
  }

  async deleteUser(id) {
    const user = await User.findById(id);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    if (user.role === 'superadmin') {
      throw new AppError('Cannot delete superadmin user', 403);
    }

    await User.findByIdAndDelete(id);
    await Lawyer.deleteMany({ user: id });
    await Client.deleteMany({ user: id });

    return { message: 'User deleted successfully' };
  }

  async toggleUserActive(id, isActive) {
    const user = await User.findById(id);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    if (user.role === 'superadmin') {
      throw new AppError('Cannot modify superadmin user status', 403);
    }

    user.is_banned = !isActive;
    await user.save();

    return user.toJSON();
  }

  async banUser(userId, banned = true) {
    const user = await User.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    if (user.role === 'superadmin') {
      throw new AppError('Cannot ban superadmin user', 403);
    }

    user.is_banned = banned;
    await user.save();

    return user.toJSON();
  }

  // ==================== LAWYER MANAGEMENT ====================

  async getAllLawyers(query = {}) {
    const { page = 1, limit = 20, status, city, specialization, search, availability_status } = query;
    const filter = {};

    if (specialization) filter.specialization = { $regex: escapeRegex(specialization), $options: 'i' };
    if (availability_status !== undefined) filter.availability_status = availability_status === 'true' || availability_status === true;
    if (city) {
      const usersFilter = { city: { $regex: escapeRegex(city), $options: 'i' } };
      const userRecords = await User.find(usersFilter).select('_id');
      filter.user = { $in: userRecords.map(u => u._id) };
    }

    if (search) {
      const userRecords = await User.find({
        $or: [
          { full_name: { $regex: escapeRegex(search), $options: 'i' } },
          { email: { $regex: escapeRegex(search), $options: 'i' } }
        ]
      }).select('_id');
      filter.user = { $in: userRecords.map(u => u._id) };
    }

    const lawyers = await Lawyer.find(filter)
      .populate('user', 'full_name email profile_photo phone city is_banned is_verified')
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .sort({ created_at: -1 });

    const total = await Lawyer.countDocuments(filter);

    return {
      lawyers,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) }
    };
  }

  async getLawyerById(id) {
    const lawyer = await Lawyer.findById(id)
      .populate('user', 'full_name email profile_photo phone city bio address is_verified is_banned');
    if (!lawyer) {
      throw new AppError('Lawyer not found', 404);
    }
    return lawyer;
  }

  async createLawyer(lawyerData) {
    const existingUser = await User.findOne({ email: lawyerData.email.toLowerCase() });
    if (existingUser) {
      throw new AppError('Email already registered', 400);
    }

    const hashedPassword = await bcrypt.hash(lawyerData.password, 12);

    const user = await User.create({
      email: lawyerData.email.toLowerCase(),
      password: hashedPassword,
      role: 'lawyer',
      full_name: lawyerData.full_name,
      phone: lawyerData.phone,
      city: lawyerData.city || '',
      address: lawyerData.address || '',
      bio: lawyerData.bio || '',
      profile_photo: lawyerData.profile_photo || null,
      is_verified: lawyerData.is_verified || false
    });

    const lawyer = await Lawyer.create({
      user: user._id,
      specialization: lawyerData.specialization || '',
      years_of_experience: lawyerData.years_of_experience || 0,
      office_address: lawyerData.office_address || '',
      availability_status: lawyerData.availability_status !== undefined ? lawyerData.availability_status : true,
      rate: lawyerData.rate || 0
    });

    return await Lawyer.findById(lawyer._id)
      .populate('user', 'full_name email profile_photo phone city bio address');
  }

  async updateLawyer(id, updateData) {
    const lawyer = await Lawyer.findById(id);
    if (!lawyer) {
      throw new AppError('Lawyer not found', 404);
    }

    const { specialization, years_of_experience, office_address, availability_status, rate } = updateData;
    if (specialization !== undefined) lawyer.specialization = specialization;
    if (years_of_experience !== undefined) lawyer.years_of_experience = years_of_experience;
    if (office_address !== undefined) lawyer.office_address = office_address;
    if (availability_status !== undefined) lawyer.availability_status = availability_status;
    if (rate !== undefined) lawyer.rate = rate;

    await lawyer.save();

    const userUpdateFields = {};
    if (updateData.full_name) userUpdateFields.full_name = updateData.full_name;
    if (updateData.city) userUpdateFields.city = updateData.city;
    if (updateData.address) userUpdateFields.address = updateData.address;
    if (updateData.bio) userUpdateFields.bio = updateData.bio;
    if (updateData.profile_photo) userUpdateFields.profile_photo = updateData.profile_photo;

    if (Object.keys(userUpdateFields).length > 0) {
      await User.findByIdAndUpdate(lawyer.user, userUpdateFields);
    }

    const updated = await Lawyer.findById(id)
      .populate('user', 'full_name email profile_photo phone city bio address');

    await lawyersService.invalidateCache(id, lawyer.user);
    return updated;
  }

  async deleteLawyer(id) {
    return await lawyersService.deleteById(id);
  }

  async verifyLawyer(lawyerId, verified) {
    const lawyer = await Lawyer.findById(lawyerId);
    if (!lawyer) {
      throw new AppError('Lawyer not found', 404);
    }

    await User.findByIdAndUpdate(lawyer.user, { is_verified: verified });

    return await Lawyer.findById(lawyerId)
      .populate('user', 'full_name email profile_photo phone city bio address is_verified');
  }

  // ==================== CASE MANAGEMENT ====================

  async getAllCases(query = {}) {
    const { page = 1, limit = 20, status, category, city, search } = query;
    const filter = {};

    if (status) filter.status = status;
    if (category) filter.category = category;
    if (city) filter.city = { $regex: escapeRegex(city), $options: 'i' };
    if (search) {
      filter.$text = { $search: search };
    }

    const cases = await Case.find(filter)
      .populate('category', 'name')
      .populate('client', 'user')
      .populate('client.user', 'full_name email profile_photo phone')
      .populate('lawyer', 'rate specialization')
      .populate('lawyer.user', 'full_name email profile_photo')
      .populate('accepted_offer_id')
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .sort({ created_at: -1 });

    const total = await Case.countDocuments(filter);

    return {
      cases,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) }
    };
  }

  async getCaseById(id) {
    const legalCase = await Case.findById(id)
      .populate('category', 'name')
      .populate('client', 'user')
      .populate('client.user', 'full_name email profile_photo phone city bio address')
      .populate('lawyer', 'rate specialization years_of_experience office_address availability_status')
      .populate('lawyer.user', 'full_name email profile_photo')
      .populate('accepted_offer_id');

    if (!legalCase) {
      throw new AppError('Case not found', 404);
    }

    return legalCase;
  }

  async createCase(caseData) {
    const userId = caseData.clientUserId || caseData.userId;
    if (!userId) {
      throw new AppError('clientUserId is required in request body', 400);
    }

    const client = await Client.findOne({ user: userId });
    if (!client) {
      throw new AppError('Client not found for given user ID', 404);
    }

    const { clientUserId, userId: _, ...caseInput } = caseData;
    const legalCase = await Case.create({
      ...caseInput,
      client: client._id
    });

    return await Case.findById(legalCase._id)
      .populate('category', 'name')
      .populate('client', 'user')
      .populate('client.user', 'full_name email profile_photo');
  }

  async updateCase(id, updateData) {
    const legalCase = await Case.findById(id);
    if (!legalCase) {
      throw new AppError('Case not found', 404);
    }

    const allowedFields = ['title', 'description', 'city', 'budget', 'status', 'category'];
    allowedFields.forEach(field => {
      if (updateData[field] !== undefined) {
        legalCase[field] = updateData[field];
      }
    });

    await legalCase.save();

    return await Case.findById(id)
      .populate('category', 'name')
      .populate('client', 'user')
      .populate('client.user', 'full_name email')
      .populate('lawyer', 'rate')
      .populate('lawyer.user', 'full_name');
  }

  async deleteCase(id) {
    const legalCase = await Case.findById(id);
    if (!legalCase) {
      throw new AppError('Case not found', 404);
    }

    await Case.findByIdAndDelete(id);
    return { message: 'Case deleted successfully' };
  }

  // ==================== CATEGORY MANAGEMENT ====================

  async getAllCategories(query = {}) {
    return await categoriesService.getAll(query);
  }

  async getCategoryById(id) {
    return await categoriesService.getById(id);
  }

  async createCategory(categoryData) {
    const existing = await Category.findOne({ name: categoryData.name.toUpperCase() });
    if (existing) {
      throw new AppError('Category with this name already exists', 400);
    }
    return await categoriesService.create(categoryData);
  }

  async updateCategory(id, updateData) {
    if (updateData.name) {
      const existing = await Category.findOne({
        name: updateData.name.toUpperCase(),
        _id: { $ne: id }
      });
      if (existing) {
        throw new AppError('Category with this name already exists', 400);
      }
    }
    return await categoriesService.update(id, updateData);
  }

  async deleteCategory(id) {
    return await categoriesService.delete(id);
  }

  // ==================== ADMIN CREATION ====================

  async createAdminUser(adminData) {
    const existingUser = await User.findOne({ email: adminData.email.toLowerCase() });
    if (existingUser) {
      throw new AppError('Email already registered', 400);
    }

    const hashedPassword = await bcrypt.hash(adminData.password, 12);

    const user = await User.create({
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

    return user.toJSON();
  }

  async markAsPaidOnly(invoiceId, adminId, reason = 'Manual admin override') {
    logger.warn('DEPRECATED: manual payment override used via admin.markAsPaidOnly');

    const invoice = await Invoice.findById(invoiceId);
    if (!invoice) {
      throw new AppError('Invoice not found', 404);
    }
    if (invoice.paymentStatus === 'paid') {
      throw new AppError('Invoice already paid', 400);
    }

    const updatedInvoice = await Invoice.findOneAndUpdate(
      { _id: invoiceId, paymentStatus: { $ne: 'paid' } },
      {
        $set: {
          paymentStatus: 'paid',
          paymentMethod: 'manual',
          paymentTransactionId: null,
          paid_at: new Date()
        },
        $push: {
          paymentOverrides: {
            type: 'manual_admin_override',
            adminId,
            timestamp: new Date(),
            reason
          }
        }
      },
      { new: true, runValidators: true }
    );

    if (!updatedInvoice) {
      throw new AppError('Invoice already paid', 400);
    }

    return updatedInvoice;
  }
}

module.exports = new AdminService();
