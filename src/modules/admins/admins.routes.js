const express = require('express');
const router = express.Router();
const adminsController = require('./admins.controller');
const { authenticate } = require('../../middlewares/auth.middleware');
const { authorizePermissions } = require('../../middlewares/role.middleware');

router.use(authenticate);

// Admin management routes
router.post('/', authorizePermissions('admins.manage'), adminsController.createAdmin);
router.get('/', authorizePermissions('admins.manage'), adminsController.getAdmins);
router.patch('/:id', authorizePermissions('admins.manage'), adminsController.updateAdmin);
router.delete('/:id', authorizePermissions('admins.manage'), adminsController.deleteAdmin);
router.post('/:id/suspend', authorizePermissions('admins.manage'), adminsController.suspendAdmin);
router.post('/:id/restore', authorizePermissions('admins.manage'), adminsController.restoreAdmin);

module.exports = router;
