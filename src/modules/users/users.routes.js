/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User profile management
 */

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Get all users
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/page'
 *       - $ref: '#/components/parameters/limit'
 *       - $ref: '#/components/parameters/search'
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [client, lawyer, admin]
 *     responses:
 *       200:
 *         description: Users retrieved successfully
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 * 
 * /api/users/{id}:
 *   get:
 *     summary: Get user by ID
 *     tags: [Users]
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
 *         description: User retrieved successfully
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 * 
 *   patch:
 *     summary: Update user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               full_name:
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
 *       200:
 *         description: User updated successfully
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 * 
 *   delete:
 *     summary: Delete user
 *     tags: [Users]
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
 *         description: User deleted successfully
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */

const express = require('express');
const router = express.Router();
const usersController = require('./users.controller');
const { authenticate } = require('../../middlewares/auth.middleware');
const { authorize } = require('../../middlewares/role.middleware');

router.get('/', authenticate, authorize('admin'), usersController.getAll);
router.get('/:id', authenticate, usersController.getById);
router.patch('/:id', authenticate, usersController.update);
router.delete('/:id', authenticate, authorize('admin'), usersController.delete);
router.patch('/:id/toggle-active', authenticate, authorize('admin', 'superadmin'), usersController.toggleActive);
router.patch('/:id/ban', authenticate, authorize('admin', 'superadmin'), usersController.banUser);
router.patch('/:id/unban', authenticate, authorize('admin', 'superadmin'), usersController.unbanUser);

module.exports = router;