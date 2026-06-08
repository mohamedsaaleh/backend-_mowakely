/**
 * @swagger
 * tags:
 *   name: Superadmin
 *   description: Superadmin system-level operations
 */

/**
 * @swagger
 * /api/superadmin/admins:
 *   get:
 *     summary: List all admin users
 *     description: Retrieve all users with admin role (superadmin only)
 *     tags: [Superadmin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/page'
 *       - $ref: '#/components/parameters/limit'
 *       - $ref: '#/components/parameters/search'
 *     responses:
 *       200:
 *         description: Admins retrieved successfully
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */

/**
 * @swagger
 * /api/superadmin/create-admin:
 *   post:
 *     summary: Create a new admin user
 *     description: Create a new user with admin role (superadmin only)
 *     tags: [Superadmin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - full_name
 *               - email
 *               - password
 *               - phone
 *             properties:
 *               full_name:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               phone:
 *                 type: string
 *               city:
 *                 type: string
 *               address:
 *                 type: string
 *               bio:
 *                 type: string
 *               profile_photo:
 *                 type: string
 *     responses:
 *       201:
 *         description: Admin created successfully
 *       400:
 *         description: Validation error or email already exists
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */

/**
 * @swagger
 * /api/superadmin/admin/{id}:
 *   delete:
 *     summary: Delete an admin user
 *     description: Delete a user with admin role (superadmin only)
 *     tags: [Superadmin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Admin deleted successfully
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */

/**
 * @swagger
 * /api/superadmin/change-role/{id}:
 *   patch:
 *     summary: Change user role
 *     description: Change any user's role to client, lawyer, or admin (superadmin only)
 *     tags: [Superadmin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - newRole
 *             properties:
 *               newRole:
 *                 type: string
 *                 enum: [client, lawyer, admin]
 *     responses:
 *       200:
 *         description: Role changed successfully
 *       400:
 *         description: Invalid role or bad request
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */

const express = require('express');
const router = express.Router();
const superadminController = require('./superadmin.controller');
const { authenticate } = require('../../middlewares/auth.middleware');
const { authorize } = require('../../middlewares/role.middleware');
const { validate } = require('../../middlewares/validate.middleware');
const { createAdminSchema, changeRoleSchema } = require('./superadmin.validation');

router.use(authenticate, authorize('superadmin'));

router.get('/admins', superadminController.getAllAdmins);
router.post('/create-admin', validate(createAdminSchema), superadminController.createAdmin);
router.delete('/admin/:id', superadminController.deleteAdmin);
router.patch('/change-role/:id', validate(changeRoleSchema), superadminController.changeRole);

module.exports = router;
