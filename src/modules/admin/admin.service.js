const { User } = require('../users/users.model');
const { Lawyer } = require('../lawyers/lawyers.model');
const { Case } = require('../cases/cases.model');
const { Invoice } = require('../invoices/invoices.model');
const { Payout } = require('../payouts/payouts.model');
const { AppError } = require('../../middlewares/error.middleware');
const { escapeRegex } = require('../../utils/escapeRegex');
const logger = require('../../utils/logger');

class AdminService {
  async verifyLawyer(lawyerId, status) {
    const lawyer = await Lawyer.findById(lawyerId);
    if (!lawyer) {
      throw new AppError('Lawyer not found', 404);
    }

    lawyer.verificationStatus = status;
    await lawyer.save();

    return lawyer;
  }

  async banUser(userId, isBanned = true) {
    const user = await User.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    user.isBanned = isBanned;
    await user.save();

    return user;
  }

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

  async getAllUsers(query = {}) {
    const { page = 1, limit = 20, role, search } = query;
    const filter = {};
    if (role) filter.role = role;
    if (search) {
      const searchValue = escapeRegex(search);
      filter.$or = [
        { fullName: { $regex: searchValue, $options: 'i' } },
        { email: { $regex: searchValue, $options: 'i' } }
      ];
    }

    const users = await User.find(filter)
      .select('-password')
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await User.countDocuments(filter);

    return {
      users,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) }
    };
  }

  async getAllLawyers(query = {}) {
    const { page = 1, limit = 20, status, city } = query;
    const filter = {};
    if (status) filter.verificationStatus = status;
    if (city) filter.city = { $regex: escapeRegex(city), $options: 'i' };

    const lawyers = await Lawyer.find(filter)
      .populate('user', 'fullName email profileImage isBanned')
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await Lawyer.countDocuments(filter);

    return {
      lawyers,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) }
    };
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
