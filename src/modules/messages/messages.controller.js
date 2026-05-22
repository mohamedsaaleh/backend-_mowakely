const messageService = require('./messages.service');
const { uploadFiles } = require('../../middlewares/upload.middleware');
const config = require('../../config/env');

class MessageController {
  async getByCase(req, res, next) {
    try {
      const result = await messageService.getByCase(req.params.caseId, req.user._id, req.query);
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
      const message = await messageService.createMessage(
        req.params.caseId,
        { message: req.body.message, attachments: req.body.attachments || [] },
        req.user._id
      );
      res.status(201).json({
        success: true,
        data: message
      });
    } catch (error) {
      next(error);
    }
  }

  async getUnreadCount(req, res, next) {
    try {
      const count = await messageService.getUnreadCount(req.params.caseId, req.user._id);
      res.json({
        success: true,
        data: { unreadCount: count }
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new MessageController();