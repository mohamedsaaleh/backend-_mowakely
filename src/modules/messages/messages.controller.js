const messageService = require('./messages.service');
const { uploadFiles } = require('../../middlewares/upload.middleware');
const config = require('../../config/env');

class MessageController {
  async getByCase(req, res, next) {
    try {
      const caseId = req.query.caseId || req.params.caseId;
      const result = await messageService.getByCase(caseId, req.user);
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
      const caseId = req.body.caseId || req.params.caseId;
      const message = await messageService.createMessage(
        caseId,
        { message: req.body.message, attachments: req.body.attachments || [] },
        req.user
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
      const caseId = req.query.caseId || req.params.caseId;
      const count = await messageService.getUnreadCount(caseId, req.user);
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