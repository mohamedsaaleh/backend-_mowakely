const { Review } = require('./reviews.model');
const { Case } = require('../cases/cases.model');
const { Client } = require('../clients/clients.model');
const { Lawyer } = require('../lawyers/lawyers.model');
const { Notification } = require('../notifications/notifications.model');
const { AppError } = require('../../middlewares/error.middleware');

class ReviewService {
  async create(reviewData, userId) {
    const client = await Client.findOne({ user: userId });
    if (!client) {
      throw new AppError('Client profile not found', 400);
    }

    const legalCase = await Case.findById(reviewData.case);
    if (!legalCase) {
      throw new AppError('Case not found', 404);
    }

    if (legalCase.client.toString() !== client._id.toString()) {
      throw new AppError('You can only review lawyers on your own cases', 403);
    }

    if (legalCase.status !== 'completed') {
      throw new AppError('You can only review after the case is completed', 400);
    }

    const existingReview = await Review.findOne({
      reviewer: client._id,
      case: reviewData.case
    });

    if (existingReview) {
      throw new AppError('You have already reviewed this case', 400);
    }

    const review = await Review.create({
      ...reviewData,
      reviewer: client._id
    });

    const lawyer = await Lawyer.findById(reviewData.lawyer_reviewed);
    if (!lawyer) {
      throw new AppError('Lawyer not found', 404);
    }

    await Lawyer.findByIdAndUpdate(lawyer._id, { $inc: { total_reviews: 1 } });

    await Notification.create({
      user: lawyer.user,
      type: 'review_added',
      content: `You received a ${reviewData.rating}-star review`
    });

    return await Review.findById(review._id)
      .populate('reviewer', 'user')
      .populate('reviewer.user', 'full_name')
      .populate('lawyer_reviewed', 'rate')
      .populate('lawyer_reviewed.user', 'full_name')
      .populate('case', 'title');
  }

  async getByLawyer(lawyerId, query = {}) {
    const { page = 1, limit = 20 } = query;

    const reviews = await Review.find({ lawyer_reviewed: lawyerId })
      .populate('reviewer', 'user')
      .populate('reviewer.user', 'full_name profile_photo')
      .populate('case', 'title')
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .sort({ created_at: -1 });

    const total = await Review.countDocuments({ lawyer_reviewed: lawyerId });

    const stats = await Review.aggregate([
      { $match: { lawyer_reviewed: lawyerId } },
      {
        $group: {
          _id: null,
          avgRating: { $avg: '$rating' },
          totalReviews: { $sum: 1 },
          fiveStar: { $sum: { $cond: [{ $eq: ['$rating', 5] }, 1, 0] } },
          fourStar: { $sum: { $cond: [{ $eq: ['$rating', 4] }, 1, 0] } },
          threeStar: { $sum: { $cond: [{ $eq: ['$rating', 3] }, 1, 0] } },
          twoStar: { $sum: { $cond: [{ $eq: ['$rating', 2] }, 1, 0] } },
          oneStar: { $sum: { $cond: [{ $eq: ['$rating', 1] }, 1, 0] } }
        }
      }
    ]);

    return {
      reviews,
      stats: stats[0] || { avgRating: 0, totalReviews: 0 },
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }
}

module.exports = new ReviewService();