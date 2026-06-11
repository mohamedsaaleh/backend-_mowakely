const express = require('express');
const router = express.Router();
const auditController = require('./audit.controller');
const { authenticate } = require('../../middlewares/auth.middleware');
const { authorizePermissions } = require('../../middlewares/role.middleware');

router.use(authenticate);

// Audit log routes
router.get('/', authorizePermissions('audit.read', 'admins.manage'), auditController.getAuditLogs);

module.exports = router;
