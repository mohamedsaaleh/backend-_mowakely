const { Message } = require('./messages.model');
const { Case } = require('../cases/cases.model');
const { Client } = require('../clients/clients.model');
const { Lawyer } = require('../lawyers/lawyers.model');
const { User } = require('../users/users.model');
const { Notification } = require('../notifications/notifications.model');
const { AppError } = require('../../middlewares/error.middleware');

class MessageService {
  async getByCase(caseId, userId, query = {}) {
    const { page = 1, limit = 50 } = query;

    const legalCase = await Case.findById(caseId);
    if (!legalCase) {
      throw new AppError('Case not found', 404);
    }

    const hasAccess = await this.checkCaseAccess(caseId, userId);
    if (!hasAccess) {
      throw new AppError('You do not have access to this case', 403);
    }

    const messages = await Message.find({ case_id: caseId })
      .populate('sender_id', 'full_name profile_photo role')
      .populate('receiver_id', 'full_name profile_photo role')
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .sort({ created_at: 1 });

    const total = await Message.countDocuments({ case_id: caseId });

    await Message.updateMany(
      { case_id: caseId, sender_id: { $ne: userId }, is_read: false },
      { is_read: true }
    );

    return {
      messages,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  async checkCaseAccess(caseId, userId) {
    const legalCase = await Case.findById(caseId);
    if (!legalCase) return false;

    const client = await Client.findOne({ user: userId });
    const lawyer = await Lawyer.findOne({ user: userId });

    if (client && legalCase.client.toString() === client._id.toString()) {
      return true;
    }

    if (lawyer && legalCase.lawyer && legalCase.lawyer.toString() === lawyer._id.toString()) {
      return true;
    }

    const userData = await User.findById(userId);
    if (userData && userData.role === 'admin') {
      return true;
    }

    return false;
  }

  async createMessage(caseId, messageData, userId) {
    const legalCase = await Case.findById(caseId);
    if (!legalCase) {
      throw new AppError('Case not found', 404);
    }

    const hasAccess = await this.checkCaseAccess(caseId, userId);
    if (!hasAccess) {
      throw new AppError('You do not have access to this case', 403);
    }

    let receiverId = null;
    if (legalCase.lawyer) {
      const lawyerProfile = await Lawyer.findById(legalCase.lawyer);
      if (lawyerProfile && lawyerProfile.user.toString() !== userId.toString()) {
        receiverId = lawyerProfile.user;
      }
    }

    if (!receiverId) {
      const clientProfile = await Client.findById(legalCase.client);
      if (clientProfile && clientProfile.user.toString() !== userId.toString()) {
        receiverId = clientProfile.user;
      }
    }

    const message = await Message.create({
      case_id: caseId,
      sender_id: userId,
      receiver_id: receiverId,
      message: messageData.message
    });

    if (receiverId) {
      await Notification.create({
        user: receiverId,
        type: 'new_message',
        content: `New message received in case: ${legalCase.title}`
      });
    }

    return await Message.findById(message._id)
      .populate('sender_id', 'full_name profile_photo role')
      .populate('receiver_id', 'full_name profile_photo role');
  }

  async getUnreadCount(caseId, userId) {
    return await Message.countDocuments({
      case_id: caseId,
      receiver_id: userId,
      is_read: false
    });
  }
}

module.exports = new MessageService();