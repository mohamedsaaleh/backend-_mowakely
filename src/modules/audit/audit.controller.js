const { AuditLog } = require('./audit.model');
const { successResponse } = require('../../utils/apiResponse');

class AuditController {
  async getAuditLogs(req, res, next) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const skip = (page - 1) * limit;

      const query = {};

      if (req.query.action) {
        query.action = req.query.action;
      }
      if (req.query.targetResource) {
        query.targetResource = req.query.targetResource;
      }
      if (req.query.userId) {
        query.userId = req.query.userId;
      }

      const logs = await AuditLog.find(query)
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limit)
        .populate('userId', 'full_name email role isSuperAdmin');

      const total = await AuditLog.countDocuments(query);

      return successResponse(res, 'Audit logs retrieved', {
        logs,
        pagination: {
          total,
          page,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AuditController();
