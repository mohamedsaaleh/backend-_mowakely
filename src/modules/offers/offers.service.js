const { Offer } = require('./offers.model');
const { Case } = require('../cases/cases.model');
const { Lawyer } = require('../lawyers/lawyers.model');
const { Client } = require('../clients/clients.model');
const { Notification } = require('../notifications/notifications.model');
const { AppError } = require('../../middlewares/error.middleware');

class OfferService {
  async create(offerData, userId) {
    const lawyer = await Lawyer.findOne({ user: userId });
    if (!lawyer) {
      throw new AppError('Lawyer profile not found', 400);
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
      throw new AppError('You have already submitted an offer for this case', 400);
    }

    const offer = await Offer.create({
      ...offerData,
      lawyer: lawyer._id,
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

  async getByCase(caseId, query = {}) {
    const { page = 1, limit = 20 } = query;

    const offers = await Offer.find({ case: caseId })
      .populate('lawyer', 'rate specialization years_of_experience office_address availability_status')
      .populate('lawyer.user', 'full_name email profile_photo')
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .sort({ applied_at: -1 });

    const total = await Offer.countDocuments({ case: caseId });

    return {
      offers,
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

    const offers = await Offer.find(filter)
      .populate('case', 'title status budget')
      .populate('case.category', 'name')
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .sort({ applied_at: -1 });

    const total = await Offer.countDocuments(filter);

    return {
      offers,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  async getAll(query = {}) {
    const { page = 1, limit = 20, status } = query;

    const filter = {};
    if (status) filter.status = status;

    const offers = await Offer.find(filter)
      .populate('lawyer', 'rate specialization years_of_experience office_address availability_status')
      .populate('lawyer.user', 'full_name email profile_photo')
      .populate('case', 'title status budget')
      .populate('case.category', 'name')
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .sort({ applied_at: -1 });

    const total = await Offer.countDocuments(filter);

    return {
      offers,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  async getMyOffers(req) {
    const lawyer = await Lawyer.findOne({ user: req.user._id });
    if (!lawyer) {
      throw new AppError('Lawyer profile not found', 404);
    }
    return await this.getByLawyer(lawyer._id, req.query);
  }

  async acceptOffer(offerId, userId) {
    const offer = await Offer.findById(offerId);
    if (!offer) {
      throw new AppError('Offer not found', 404);
    }

    if (offer.status !== 'pending') {
      throw new AppError('This offer is no longer available', 400);
    }

    const legalCase = await Case.findById(offer.case);
    const client = await Client.findOne({ user: userId });

    if (!client || legalCase.client.toString() !== client._id.toString()) {
      throw new AppError('You can only accept offers for your own cases', 403);
    }

    await Offer.updateMany(
      { case: offer.case, status: 'pending' },
      { $set: { status: 'rejected' } }
    );

    offer.status = 'accepted';
    await offer.save();

    legalCase.lawyer = offer.lawyer;
    legalCase.accepted_offer_id = offer._id;
    legalCase.status = 'in_progress';
    await legalCase.save();

    await Lawyer.findByIdAndUpdate(offer.lawyer, { $inc: { offers_count: 1 } });

    const lawyerProfile = await Lawyer.findById(offer.lawyer);
    await Notification.create({
      user: lawyerProfile.user,
      type: 'offer_accepted',
      content: `Your offer for case "${legalCase.title}" has been accepted`
    });

    return offer;
  }

  async rejectOffer(offerId, userId) {
    const offer = await Offer.findById(offerId);
    if (!offer) {
      throw new AppError('Offer not found', 404);
    }

    const legalCase = await Case.findById(offer.case);
    const client = await Client.findOne({ user: userId });

    if (!client || legalCase.client.toString() !== client._id.toString()) {
      throw new AppError('You can only reject offers for your own cases', 403);
    }

    if (offer.status !== 'pending') {
      throw new AppError('This offer cannot be rejected', 400);
    }

    offer.status = 'rejected';
    await offer.save();

    const lawyerProfile = await Lawyer.findById(offer.lawyer);
    await Notification.create({
      user: lawyerProfile.user,
      type: 'offer_received',
      content: `Your offer for case "${legalCase.title}" has been rejected`
    });

    return offer;
  }

  async delete(offerId, userId, role) {
    const offer = await Offer.findById(offerId);

    if (!offer) {
      throw new AppError('Offer not found', 404);
    }

    if (role !== 'admin') {
      const lawyer = await Lawyer.findOne({ user: userId });
      if (!lawyer || offer.lawyer.toString() !== lawyer._id.toString()) {
        throw new AppError('You can only delete your own offers', 403);
      }

      if (offer.status !== 'pending') {
        throw new AppError('Cannot delete this offer', 400);
      }
    }

    await Offer.findByIdAndDelete(offerId);
    return { message: 'Offer deleted successfully' };
  }
}

module.exports = new OfferService();