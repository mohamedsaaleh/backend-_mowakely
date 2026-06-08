const { User } = require('../users/users.model');
const { Client } = require('../clients/clients.model');
const { Lawyer } = require('../lawyers/lawyers.model');
const { Case } = require('../cases/cases.model');
const { Offer } = require('../offers/offers.model');
const { Category } = require('../categories/categories.model');
const { Review } = require('../reviews/reviews.model');
const { Invoice } = require('../invoices/invoices.model');
const { Payout } = require('../payouts/payouts.model');
const { AppError } = require('../../middlewares/error.middleware');
const bcrypt = require('bcryptjs');
const { escapeRegex } = require('../../utils/escapeRegex');
const QueryBuilder = require('../../utils/queryBuilder');

const usersService = require('../users/users.service');
const clientsService = require('../clients/clients.service');
const lawyersService = require('../lawyers/lawyers.service');
const casesService = require('../cases/cases.service');
const offersService = require('../offers/offers.service');
const categoriesService = require('../categories/categories.service');
const adminService = require('../admin/admin.service');

class SuperadminService {
  // ==================== DASHBOARD & STATISTICS ====================

  async getDashboard() {
    const stats = await adminService.getDashboardStats();
    return stats;
  }

  async getStatistics() {
    const totalUsers = await User.countDocuments();
    const totalClients = await User.countDocuments({ role: 'client' });
    const totalLawyers = await User.countDocuments({ role: 'lawyer' });
    const totalAdmins = await User.countDocuments({ role: 'admin' });
    const totalSuperadmins = await User.countDocuments({ role: 'superadmin' });
    const totalCases = await Case.countDocuments();
    const totalOffers = await Offer.countDocuments();
    const totalCategories = await Category.countDocuments();
    const totalReviews = await Review.countDocuments();
    const totalInvoices = await Invoice.countDocuments();
    const totalPayouts = await Payout.countDocuments();

    const openCases = await Case.countDocuments({ status: 'open' });
    const inProgressCases = await Case.countDocuments({ status: 'in_progress' });
    const completedCases = await Case.countDocuments({ status: 'completed' });
    const pendingOffers = await Offer.countDocuments({ status: 'pending' });
    const acceptedOffers = await Offer.countDocuments({ status: 'accepted' });

    return {
      users: { total: totalUsers, clients: totalClients, lawyers: totalLawyers, admins: totalAdmins, superadmins: totalSuperadmins },
      cases: { total: totalCases, open: openCases, inProgress: inProgressCases, completed: completedCases },
      offers: { total: totalOffers, pending: pendingOffers, accepted: acceptedOffers },
      categories: { total: totalCategories },
      reviews: { total: totalReviews },
      invoices: { total: totalInvoices },
      payouts: { total: totalPayouts }
    };
  }

  async getAnalytics() {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const newUsersLast30Days = await User.countDocuments({ created_at: { $gte: thirtyDaysAgo } });
    const newUsersLast7Days = await User.countDocuments({ created_at: { $gte: sevenDaysAgo } });
    const newCasesLast30Days = await Case.countDocuments({ created_at: { $gte: thirtyDaysAgo } });
    const newOffersLast30Days = await Offer.countDocuments({ applied_at: { $gte: thirtyDaysAgo } });

    const casesByStatus = await Case.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    const usersByRole = await User.aggregate([
      { $group: { _id: '$role', count: { $sum: 1 } } }
    ]);

    return {
      period: '30 days',
      users: {
        newLast30Days: newUsersLast30Days,
        newLast7Days: newUsersLast7Days,
        byRole: usersByRole
      },
      cases: {
        newLast30Days: newCasesLast30Days,
        byStatus: casesByStatus
      },
      offers: {
        newLast30Days: newOffersLast30Days
      }
    };
  }

  // ==================== USER MANAGEMENT ====================

  async getAllUsers(query = {}) {
    return await usersService.getAllUsers(query);
  }

  async getUserById(id) {
    return await usersService.getUserById(id);
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
      const allowedRoles = ['client', 'lawyer', 'admin', 'superadmin'];
      if (!allowedRoles.includes(updateData.role)) {
        throw new AppError('Invalid role specified', 400);
      }
    }

    const allowedFields = ['full_name', 'phone', 'city', 'address', 'bio', 'profile_photo', 'role', 'is_verified', 'is_banned'];
    const updateFields = {};
    allowedFields.forEach(field => {
      if (updateData[field] !== undefined) updateFields[field] = updateData[field];
    });

    const user = await User.findByIdAndUpdate(id, updateFields, { new: true })
      .select('-password -emailVerificationToken -passwordResetToken -passwordResetExpires');

    if (!user) {
      throw new AppError('User not found', 404);
    }

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

  async banUser(id) {
    const user = await User.findById(id);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    if (user.role === 'superadmin') {
      throw new AppError('Cannot ban superadmin user', 403);
    }

    user.is_banned = true;
    await user.save();

    return user.toJSON();
  }

  async unbanUser(id) {
    const user = await User.findById(id);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    user.is_banned = false;
    await user.save();

    return user.toJSON();
  }

  // ==================== CLIENT MANAGEMENT ====================

  async getAllClients(query = {}) {
    const result = await new QueryBuilder(Client)
      .filter({ ...query, role: 'client' })
      .sortBy(query.sort || '-created_at')
      .withPagination(query.page, query.limit)
      .populateFields('user:full_name email profile_photo city')
      .execute();
    return result;
  }

  async getClientById(id) {
    const client = await Client.findById(id)
      .populate('user', 'full_name email phone profile_photo city address bio');
    if (!client) {
      throw new AppError('Client not found', 404);
    }
    return client;
  }

  async createClient(clientData) {
    const existingUser = await User.findOne({ email: clientData.email.toLowerCase() });
    if (existingUser) {
      throw new AppError('Email already registered', 400);
    }

    const hashedPassword = await bcrypt.hash(clientData.password, 12);

    const user = await User.create({
      email: clientData.email.toLowerCase(),
      password: hashedPassword,
      role: 'client',
      full_name: clientData.full_name,
      phone: clientData.phone,
      city: clientData.city || '',
      address: clientData.address || '',
      bio: clientData.bio || '',
      profile_photo: clientData.profile_photo || null,
      is_verified: clientData.is_verified || false
    });

    const client = await Client.create({ user: user._id });
    return await Client.findById(client._id)
      .populate('user', 'full_name email phone profile_photo city address bio');
  }

  async updateClient(id, updateData) {
    const client = await Client.findById(id);
    if (!client) {
      throw new AppError('Client not found', 404);
    }

    const userUpdateFields = {};
    if (updateData.full_name) userUpdateFields.full_name = updateData.full_name;
    if (updateData.phone) userUpdateFields.phone = updateData.phone;
    if (updateData.city) userUpdateFields.city = updateData.city;
    if (updateData.address) userUpdateFields.address = updateData.address;
    if (updateData.bio) userUpdateFields.bio = updateData.bio;
    if (updateData.profile_photo) userUpdateFields.profile_photo = updateData.profile_photo;

    if (Object.keys(userUpdateFields).length > 0) {
      await User.findByIdAndUpdate(client.user, userUpdateFields);
    }

    return await Client.findById(id)
      .populate('user', 'full_name email phone profile_photo city address bio');
  }

  async deleteClient(id) {
    const client = await Client.findById(id);
    if (!client) {
      throw new AppError('Client not found', 404);
    }

    await Client.findByIdAndDelete(id);
    return { message: 'Client deleted successfully' };
  }

  // ==================== LAWYER MANAGEMENT ====================

  async getAllLawyers(query = {}) {
    const result = await lawyersService.getAll(query);
    return result;
  }

  async getLawyerById(id) {
    return await lawyersService.getById(id);
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

  async verifyLawyer(id, verified) {
    const lawyer = await Lawyer.findById(id);
    if (!lawyer) {
      throw new AppError('Lawyer not found', 404);
    }

    lawyer.verificationStatus = verified;
    await lawyer.save();

    return lawyer;
  }

  async unverifyLawyer(id) {
    const lawyer = await Lawyer.findById(id);
    if (!lawyer) {
      throw new AppError('Lawyer not found', 404);
    }

    lawyer.verificationStatus = false;
    await lawyer.save();

    return lawyer;
  }

  // ==================== CASE MANAGEMENT ====================

  async getAllCases(query = {}) {
    const result = await casesService.getAll(query, null);
    return result;
  }

  async getCaseById(id) {
    return await casesService.getById(id);
  }

  async createCase(caseData) {
    const userId = caseData.clientUserId || caseData.userId;
    if (!userId) {
      throw new AppError('clientUserId or userId is required in request body', 400);
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
    return await casesService.updateById(id, updateData);
  }

  async deleteCase(id) {
    return await casesService.deleteById(id);
  }

  async updateCaseStatus(id, status) {
    const legalCase = await Case.findById(id);
    if (!legalCase) {
      throw new AppError('Case not found', 404);
    }

    const validStatuses = ['open', 'in_progress', 'pending_payment', 'completed', 'cancelled', 'disputed'];
    if (!validStatuses.includes(status)) {
      throw new AppError('Invalid status', 400);
    }

    legalCase.status = status;
    await legalCase.save();

    return legalCase;
  }

  // ==================== OFFER MANAGEMENT ====================

  async getAllOffers(query = {}) {
    return await offersService.getAll(query);
  }

  async getOfferById(id) {
    const offer = await Offer.findById(id)
      .populate('lawyer', 'rate specialization years_of_experience')
      .populate('lawyer.user', 'full_name email profile_photo')
      .populate('case', 'title status budget')
      .populate('case.category', 'name');

    if (!offer) {
      throw new AppError('Offer not found', 404);
    }
    return offer;
  }

  async createOffer(offerData) {
    const lawyer = await Lawyer.findById(offerData.lawyer);
    if (!lawyer) {
      throw new AppError('Lawyer not found', 404);
    }

    const legalCase = await Case.findById(offerData.case);
    if (!legalCase) {
      throw new AppError('Case not found', 404);
    }

    if (legalCase.status !== 'open') {
      throw new AppError('Case is not open for offers', 400);
    }

    const existingOffer = await Offer.findOne({
      case: offerData.case,
      lawyer: lawyer._id
    });

    if (existingOffer) {
      throw new AppError('This lawyer has already submitted an offer for this case', 400);
    }

    const offer = await Offer.create({
      case: offerData.case,
      lawyer: lawyer._id,
      price: offerData.price,
      message: offerData.message || '',
      delivery_time: offerData.delivery_time || 30,
      status: offerData.status || 'pending',
      applied_at: new Date()
    });

    await Case.findByIdAndUpdate(legalCase._id, { $inc: { offers_count: 1 } });

    const client = await Client.findById(legalCase.client);
    await Notification.create({
      user: client.user,
      type: 'offer_received',
      content: `New offer received for case: ${legalCase.title}`
    });

    return await Offer.findById(offer._id)
      .populate('lawyer', 'rate specialization')
      .populate('lawyer.user', 'full_name profile_photo');
  }

  async updateOffer(id, updateData) {
    const offer = await Offer.findById(id);
    if (!offer) {
      throw new AppError('Offer not found', 404);
    }

    Object.assign(offer, updateData);
    await offer.save();

    return await Offer.findById(id)
      .populate('lawyer', 'rate specialization years_of_experience')
      .populate('lawyer.user', 'full_name email profile_photo')
      .populate('case', 'title status budget');
  }

  async deleteOffer(id) {
    return await offersService.delete(id, null, 'admin');
  }

  // ==================== CATEGORY MANAGEMENT ====================

  async getAllCategories(query = {}) {
    return await categoriesService.getAll(query);
  }

  async getCategoryById(id) {
    return await categoriesService.getById(id);
  }

  async createCategory(categoryData) {
    return await categoriesService.create(categoryData);
  }

  async updateCategory(id, updateData) {
    return await categoriesService.update(id, updateData);
  }

  async deleteCategory(id) {
    return await categoriesService.delete(id);
  }

  // ==================== REVIEW MANAGEMENT ====================

  async getAllReviews(query = {}) {
    const reviews = await Review.find(query)
      .populate('lawyer', 'specialization rate')
      .populate('lawyer.user', 'full_name profile_photo')
      .populate('client', 'user')
      .populate('client.user', 'full_name')
      .populate('case', 'title')
      .sort({ created_at: -1 });

    return { reviews };
  }

  async getReviewById(id) {
    const review = await Review.findById(id)
      .populate('lawyer', 'specialization rate')
      .populate('lawyer.user', 'full_name profile_photo')
      .populate('client', 'user')
      .populate('client.user', 'full_name')
      .populate('case', 'title');

    if (!review) {
      throw new AppError('Review not found', 404);
    }
    return review;
  }

  async hideReview(id) {
    const review = await Review.findById(id);
    if (!review) {
      throw new AppError('Review not found', 404);
    }

    review.status = 'hidden';
    await review.save();

    return review;
  }

  async publishReview(id) {
    const review = await Review.findById(id);
    if (!review) {
      throw new AppError('Review not found', 404);
    }

    review.status = 'published';
    await review.save();

    return review;
  }

  async deleteReview(id) {
    const review = await Review.findById(id);
    if (!review) {
      throw new AppError('Review not found', 404);
    }

    await Review.findByIdAndDelete(id);
    return { message: 'Review deleted successfully' };
  }

  // ==================== ADMIN MANAGEMENT ====================

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
      pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / limit) }
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

  async deleteAdmin(id) {
    const admin = await User.findById(id);
    if (!admin) {
      throw new AppError('Admin not found', 404);
    }

    if (admin.role !== 'admin') {
      throw new AppError('User is not an admin', 400);
    }

    await User.findByIdAndDelete(id);
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
