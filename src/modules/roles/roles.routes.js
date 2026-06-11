const express = require('express');
const router = express.Router();
const rolesController = require('./roles.controller');
const { authenticate } = require('../../middlewares/auth.middleware');
const { authorizePermissions } = require('../../middlewares/role.middleware');

router.use(authenticate);

// List available permissions
router.get('/permissions', authorizePermissions('permissions.manage'), rolesController.getSystemPermissions);

// Role management routes
router.post('/', authorizePermissions('roles.manage'), rolesController.createRole);
router.get('/', authorizePermissions('roles.manage'), rolesController.getRoles);
router.patch('/:id', authorizePermissions('roles.manage'), rolesController.updateRole);
router.delete('/:id', authorizePermissions('roles.manage'), rolesController.deleteRole);

module.exports = router;
