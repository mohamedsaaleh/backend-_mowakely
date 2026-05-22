const { Notification } = require('./notifications.model');
const { AppError } = require('../../middlewares/error.middleware');

class NotificationService {
  async getAll(userId, query = {}) {
    const { page = 1, limit = 20, unreadOnly } = query;
    const filter = { user: userId };
    if (unreadOnly === 'true') filter.is_read = false;

    const notifications = await Notification.find(filter)
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .sort({ created_at: -1 });

    const total = await Notification.countDocuments(filter);
    const unreadCount = await Notification.countDocuments({ user: userId, is_read: false });

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

  async markAsRead(notificationId, userId) {
    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, user: userId },
      { is_read: true },
      { new: true }
    );
    if (!notification) {
      throw new AppError('Notification not found', 404);
    }
    return notification;
  }

  async markAllAsRead(userId) {
    await Notification.updateMany(
      { user: userId, is_read: false },
      { is_read: true }
    );
    return { message: 'All notifications marked as read' };
  }

  async createNotification(data) {
    return await Notification.create(data);
  }

  async deleteNotification(notificationId, userId) {
    const notification = await Notification.findOneAndDelete({
      _id: notificationId,
      user: userId
    });
    if (!notification) {
      throw new AppError('Notification not found', 404);
    }
    return { message: 'Notification deleted' };
  }
}

module.exports = new NotificationService();