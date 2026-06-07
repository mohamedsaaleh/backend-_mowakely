const { Notification } = require('./notifications.model');
const { AppError } = require('../../middlewares/error.middleware');
const { User } = require('../users/users.model');

class NotificationService {
  async getAll(req) {
    const { page = 1, limit = 20, unreadOnly } = req.query;
    const filter = req.user.role === 'admin' ? {} : { user: req.user._id };

    if (unreadOnly === 'true') {
      filter.is_read = false;
    }

    const notifications = await Notification.find(filter)
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .sort({ created_at: -1 });

    const total = await Notification.countDocuments(filter);
    const unreadCount = req.user.role === 'admin'
      ? await Notification.countDocuments({ is_read: false })
      : await Notification.countDocuments({ user: req.user._id, is_read: false });

    return {
      notifications,
      unreadCount,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  async markAsRead(req, notificationId) {
    const actualUserId = req.user.role === 'admin' ? undefined : req.user._id;
    const filter = actualUserId ? { _id: notificationId, user: actualUserId } : { _id: notificationId };
    const notification = await Notification.findOneAndUpdate(
      filter,
      { is_read: true },
      { new: true }
    );
    if (!notification) {
      throw new AppError('Notification not found', 404);
    }
    return notification;
  }

  async markAllAsRead(req) {
    const userId = req.user.role === 'admin' ? undefined : req.user._id;
    const filter = userId ? { user: userId, is_read: false } : { is_read: false };
    await Notification.updateMany(filter, { is_read: true });
    return { message: 'All notifications marked as read' };
  }

  async createNotification(recipientId, title, message) {
    const recipient = await User.findById(recipientId);
    if (!recipient) {
      throw new AppError('Recipient not found', 404);
    }

    const notification = await Notification.create({
      user: recipientId,
      type: 'admin_message',
      content: message
    });

    return notification;
  }

  async deleteNotification(req, notificationId) {
    const actualUserId = req.user.role === 'admin' ? undefined : req.user._id;
    const filter = actualUserId ? { _id: notificationId, user: actualUserId } : { _id: notificationId };
    const notification = await Notification.findOneAndDelete(filter);
    if (!notification) {
      throw new AppError('Notification not found', 404);
    }
    return { message: 'Notification deleted' };
  }
}

module.exports = new NotificationService();