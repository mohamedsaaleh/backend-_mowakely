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
      .populate({ path: 'client', select: 'user', populate: { path: 'user', select: 'full_name email profile_photo' } });
  }

  async getAll(query = {}, user = null) {
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

    if (user) {
      if (user.role === 'admin' || user.role === 'superadmin' || user.isSuperAdmin) {
        // Admin can see all cases - no additional filter
      } else if (user.role === 'lawyer') {
        // Lawyer can only see open cases without a lawyer assigned
        filter.status = 'open';
        filter.lawyer = null;
      } else {
        // Other roles cannot access this endpoint - return empty
        return {
          cases: [],
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: 0,
            pages: 0
          }
        };
      }
    }

    if (status) filter.status = status;
    if (category) filter.category = category;
    if (city) filter.city = { $regex: city, $options: 'i' };
    if (minBudget) filter.budget = { $gte: parseInt(minBudget) };
    if (search) {
      filter.$text = { $search: search };
    }

    const cases = await Case.find(filter)
      .populate('category', 'name')
      .populate({ path: 'client', populate: { path: 'user', select: 'full_name profile_photo' } })
      .populate({ path: 'lawyer', populate: { path: 'user', select: 'full_name' } })
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

async getById(id, user = null) {
    const legalCase = await Case.findById(id)
      .populate('category', 'name')
      .populate({ path: 'client', populate: { path: 'user', select: 'full_name email profile_photo phone city bio address' } })
      .populate({ path: 'lawyer', populate: { path: 'user', select: 'full_name email profile_photo' } })
      .populate('accepted_offer_id');

    if (!legalCase) {
      throw new AppError('Case not found', 404);
    }

    if (user && user.role !== 'admin' && user.role !== 'superadmin' && !user.isSuperAdmin) {
      const client = await Client.findOne({ user: user._id });
      const lawyer = await Lawyer.findOne({ user: user._id });

      const hasAccess = (client && legalCase.client.toString() === client._id.toString()) ||
        (lawyer && legalCase.lawyer && legalCase.lawyer.toString() === lawyer._id.toString());

      if (!hasAccess) {
        throw new AppError('You do not have access to this case', 403);
      }
    }

    return legalCase;
  }

  async getByClient(clientId, query = {}) {
    const { page = 1, limit = 20, status } = query;
    const filter = { client: clientId };
    if (status) filter.status = status;

    const cases = await Case.find(filter)
      .populate('category', 'name')
      .populate({ path: 'lawyer', populate: { path: 'user', select: 'full_name profile_photo' } })
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
      .populate({ path: 'client', populate: { path: 'user', select: 'full_name profile_photo' } })
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

  async update(id, updateData, user) {
    const legalCase = await Case.findById(id);
    if (!legalCase) {
      throw new AppError('Case not found', 404);
    }

    if (user.role !== 'admin' && user.role !== 'superadmin' && !user.isSuperAdmin) {
      const client = await Client.findOne({ user: user._id });
      if (!client || legalCase.client.toString() !== client._id.toString()) {
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
      .populate({ path: 'client', populate: { path: 'user', select: 'full_name email' } })
      .populate({ path: 'lawyer', populate: { path: 'user', select: 'full_name' } });
  }

  async delete(id, user) {
    const legalCase = await Case.findById(id);
    if (!legalCase) {
      throw new AppError('Case not found', 404);
    }

    if (user.role !== 'admin' && user.role !== 'superadmin' && !user.isSuperAdmin) {
      const client = await Client.findOne({ user: user._id });
      if (!client || legalCase.client.toString() !== client._id.toString()) {
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