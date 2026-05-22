const { Case } = require('./cases.model');
const { Client } = require('../clients/clients.model');
const { Lawyer } = require('../lawyers/lawyers.model');
const { Notification } = require('../notifications/notifications.model');
const { AppError } = require('../../middlewares/error.middleware');

class CaseService {
  async create(caseData, userId) {
    const client = await Client.findOne({ user: userId });
    if (!client) {
      throw new AppError('Client profile not found', 400);
    }

    const legalCase = await Case.create({
      ...caseData,
      client: client._id
    });

    return await Case.findById(legalCase._id)
      .populate('category', 'name')
      .populate('client', 'user')
      .populate('client.user', 'full_name email profile_photo');
  }

  async getAll(query = {}) {
    const {
      page = 1,
      limit = 20,
      status,
      category,
      city,
      minBudget,
      maxBudget,
      search
    } = query;

    const filter = {};

    if (status) filter.status = status;
    if (category) filter.category = category;
    if (city) filter.city = { $regex: city, $options: 'i' };
    if (minBudget) filter.budget = { $gte: parseInt(minBudget) };
    if (search) {
      filter.$text = { $search: search };
    }

    const cases = await Case.find(filter)
      .populate('category', 'name')
      .populate('client', 'user')
      .populate('client.user', 'full_name profile_photo')
      .populate('lawyer', 'rate')
      .populate('lawyer.user', 'full_name')
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .sort({ created_at: -1 });

    const total = await Case.countDocuments(filter);

    return {
      cases,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  async getById(id) {
    const legalCase = await Case.findById(id)
      .populate('category', 'name')
      .populate('client', 'user')
      .populate('client.user', 'full_name email profile_photo phone')
      .populate('lawyer', 'rate specialization years_of_experience office_address availability_status')
      .populate('lawyer.user', 'full_name email profile_photo')
      .populate('accepted_offer_id');

    if (!legalCase) {
      throw new AppError('Case not found', 404);
    }

    return legalCase;
  }

  async getByClient(clientId, query = {}) {
    const { page = 1, limit = 20, status } = query;
    const filter = { client: clientId };
    if (status) filter.status = status;

    const cases = await Case.find(filter)
      .populate('category', 'name')
      .populate('lawyer', 'rate')
      .populate('lawyer.user', 'full_name profile_photo')
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .sort({ created_at: -1 });

    const total = await Case.countDocuments(filter);

    return {
      cases,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  async getByLawyer(lawyerId, query = {}) {
    const { page = 1, limit = 20, status } = query;
    const filter = { lawyer: lawyerId };
    if (status) filter.status = status;

    const cases = await Case.find(filter)
      .populate('category', 'name')
      .populate('client', 'user')
      .populate('client.user', 'full_name profile_photo')
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .sort({ created_at: -1 });

    const total = await Case.countDocuments(filter);

    return {
      cases,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  async update(id, updateData, userId, role) {
    const legalCase = await Case.findById(id);
    if (!legalCase) {
      throw new AppError('Case not found', 404);
    }

    if (role === 'client') {
      const client = await Client.findOne({ user: userId });
      if (legalCase.client.toString() !== client._id.toString()) {
        throw new AppError('You can only update your own cases', 403);
      }
      if (legalCase.status !== 'open') {
        throw new AppError('Cannot update case after offers are accepted', 400);
      }
    }

    const allowedFields = ['title', 'description', 'city', 'budget'];
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

  async delete(id, userId, role) {
    const legalCase = await Case.findById(id);
    if (!legalCase) {
      throw new AppError('Case not found', 404);
    }

    if (role === 'client') {
      const client = await Client.findOne({ user: userId });
      if (legalCase.client.toString() !== client._id.toString()) {
        throw new AppError('You can only delete your own cases', 403);
      }
      if (legalCase.status !== 'open') {
        throw new AppError('Cannot delete case after offers are accepted', 400);
      }
    }

    await Case.findByIdAndDelete(id);
    return { message: 'Case deleted successfully' };
  }

  async acceptOffer(caseId, offerId, clientUserId) {
    const legalCase = await Case.findById(caseId);
    if (!legalCase) {
      throw new AppError('Case not found', 404);
    }

    if (legalCase.status !== 'open') {
      throw new AppError('Case is not open', 400);
    }

    const client = await Client.findOne({ user: clientUserId });
    if (!client || legalCase.client.toString() !== client._id.toString()) {
      throw new AppError('You can only accept offers for your own cases', 403);
    }

    legalCase.lawyer = offerId;
    legalCase.status = 'in_progress';
    await legalCase.save();

    return legalCase;
  }

  async updateStatus(caseId, status) {
    const legalCase = await Case.findById(caseId);
    if (!legalCase) {
      throw new AppError('Case not found', 404);
    }

    legalCase.status = status;
    await legalCase.save();
    return legalCase;
  }
}

module.exports = new CaseService();