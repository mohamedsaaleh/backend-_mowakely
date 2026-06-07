const notificationService = require('./notifications.service');

class NotificationController {
  async getAll(req, res, next) {
    try {
      const result = await notificationService.getAll(req);
      res.json({
        success: true,
        ...result
      });
    } catch (error) {
      next(error);
    }
  }

  async create(req, res, next) {
    try {
      const notification = await notificationService.createNotification(
        req.body.recipientId,
        req.body.title,
        req.body.message
      );
      res.status(201).json({
        success: true,
        data: notification
      });
    } catch (error) {
      next(error);
    }
  }

  async markAsRead(req, res, next) {
    try {
      const notification = await notificationService.markAsRead(req, req.params.id);
      res.json({
        success: true,
        data: notification
      });
    } catch (error) {
      next(error);
    }
  }

  async markAllAsRead(req, res, next) {
    try {
      const result = await notificationService.markAllAsRead(req);
      res.json({
        success: true,
        ...result
      });
    } catch (error) {
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      const result = await notificationService.deleteNotification(req, req.params.id);
      res.json({
        success: true,
        ...result
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new NotificationController();