/**
 * @swagger
 * tags:
 *   name: Notifications
 *   description: User notifications and alerts
 */

/**
 * @swagger
 * /api/notifications:
 *   get:
 *     summary: Get all notifications for current user
 *     description: Returns notifications for the authenticated user. Admins can access all notifications.
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/page'
 *       - $ref: '#/components/parameters/limit'
 *     responses:
 *       200:
 *         description: Notifications retrieved successfully
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 * 
 *   post:
 *     summary: Create a notification (Admin only)
 *     description: Create and send a notification to a specific user. Only admins can create notifications.
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - recipientId
 *               - title
 *               - message
 *             properties:
 *               recipientId:
 *                 type: string
 *                 description: User ID of the recipient
 *               title:
 *                 type: string
 *                 description: Notification title
 *               message:
 *                 type: string
 *                 description: Notification message content
 *     responses:
 *       201:
 *         description: Notification created successfully
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 * 
 * /api/notifications/read-all:
 *   patch:
 *     summary: Mark all notifications as read
 *     description: Marks all notifications as read for the authenticated user. Admins can mark all notifications system-wide.
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All notifications marked as read
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 * 
 * /api/notifications/{id}:
 *   patch:
 *     summary: Mark notification as read
 *     description: Marks a specific notification as read. Users can only modify their own notifications; admins can modify any notification.
 *     tags: [Notifications]
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
 *         description: Notification marked as read
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 * 
 *   delete:
 *     summary: Delete a notification
 *     description: Deletes a notification. Users can only delete their own notifications; admins can delete any notification.
 *     tags: [Notifications]
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
 *         description: Notification deleted
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */

const express = require('express');
const router = express.Router();
const notificationController = require('./notifications.controller');
const { authenticate } = require('../../middlewares/auth.middleware');
const { authorize } = require('../../middlewares/role.middleware');
const { validate } = require('../../middlewares/validate.middleware');
const Joi = require('joi');

const createNotificationSchema = Joi.object({
  recipientId: Joi.string().required(),
  title: Joi.string().required(),
  message: Joi.string().required()
});

router.use(authenticate);

router.get('/', authorize('client', 'lawyer', 'admin'), notificationController.getAll);
router.post('/', authorize('admin'), validate(createNotificationSchema), notificationController.create);
router.patch('/:id/read', authorize('client', 'lawyer', 'admin'), notificationController.markAsRead);
router.patch('/read-all', authorize('client', 'lawyer', 'admin'), notificationController.markAllAsRead);
router.delete('/:id', authorize('client', 'lawyer', 'admin'), notificationController.delete);

module.exports = router;