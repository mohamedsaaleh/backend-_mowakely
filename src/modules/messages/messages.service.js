const { Message } = require('./messages.model');
const { Case } = require('../cases/cases.model');
const { Client } = require('../clients/clients.model');
const { Lawyer } = require('../lawyers/lawyers.model');
const { Notification } = require('../notifications/notifications.model');
const { AppError } = require('../../middlewares/error.middleware');

class MessageService {
  async getByCase(caseId, user, query = {}) {
    const { page = 1, limit = 50 } = query;

    const legalCase = await Case.findById(caseId);
    if (!legalCase) {
      throw new AppError('Case not found', 404);
    }

    const hasAccess = await this.checkCaseAccess(caseId, user);
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

    if (user.role !== 'admin') {
      await Message.updateMany(
        { case_id: caseId, sender_id: { $ne: user._id }, is_read: false },
        { is_read: true }
      );
    }

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

  async checkCaseAccess(caseId, user) {
    const legalCase = await Case.findById(caseId);
    if (!legalCase) return false;

    if (user.role === 'admin') return true;

    const client = await Client.findOne({ user: user._id });
    const lawyer = await Lawyer.findOne({ user: user._id });

    if (client && legalCase.client.toString() === client._id.toString()) {
      return true;
    }

    if (lawyer && legalCase.lawyer && legalCase.lawyer.toString() === lawyer._id.toString()) {
      return true;
    }

    return false;
  }

  async createMessage(caseId, messageData, user) {
    const legalCase = await Case.findById(caseId);
    if (!legalCase) {
      throw new AppError('Case not found', 404);
    }

    const hasAccess = await this.checkCaseAccess(caseId, user);
    if (!hasAccess) {
      throw new AppError('You do not have access to this case', 403);
    }

    const senderId = user._id;
    let receiverId = null;
    
    if (legalCase.lawyer) {
      const lawyerProfile = await Lawyer.findById(legalCase.lawyer);
      if (lawyerProfile && lawyerProfile.user.toString() !== user._id.toString()) {
        receiverId = lawyerProfile.user;
      }
    }

    if (!receiverId) {
      const clientProfile = await Client.findById(legalCase.client);
      if (clientProfile && clientProfile.user.toString() !== user._id.toString()) {
        receiverId = clientProfile.user;
      }
    }

    const message = await Message.create({
      case_id: caseId,
      sender_id: senderId,
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

  async getUnreadCount(caseId, user) {
    if (user.role === 'admin') {
      return await Message.countDocuments({
        case_id: caseId,
        is_read: false
      });
    }
    return await Message.countDocuments({
      case_id: caseId,
      receiver_id: user._id,
      is_read: false
    });
  }
}

module.exports = new MessageService();