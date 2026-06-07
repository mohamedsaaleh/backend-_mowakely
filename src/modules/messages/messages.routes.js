/**
 * @swagger
 * tags:
 *   name: Messages
 *   description: Real-time messaging between users
 */

/**
 * @swagger
 * /api/messages:
 *   get:
 *     summary: Get messages by case
 *     description: Retrieve messages for a specific case. Users can only access messages for their own cases; admins can access all messages.
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: caseId
 *         required: true
 *         schema:
 *           type: string
 *         description: Case ID
 *       - $ref: '#/components/parameters/page'
 *       - $ref: '#/components/parameters/limit'
 *     responses:
 *       200:
 *         description: Messages retrieved successfully
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 * 
 *   post:
 *     summary: Send a message
 *     description: Send a message to the other party in a case. Users can only send messages in their own cases; admins can send messages in any case.
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - caseId
 *               - message
 *             properties:
 *               caseId:
 *                 type: string
 *                 description: Case ID
 *               message:
 *                 type: string
 *                 maxLength: 5000
 *     responses:
 *       201:
 *         description: Message sent successfully
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 * 
 * /api/messages/unread:
 *   get:
 *     summary: Get unread message count
 *     description: Get unread message count for a specific case. Users see their own unread messages; admins see total unread count across all participants.
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: caseId
 *         required: true
 *         schema:
 *           type: string
 *         description: Case ID
 *     responses:
 *       200:
 *         description: Unread count retrieved
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */

const express = require('express');
const router = express.Router({ mergeParams: true });
const messageController = require('./messages.controller');
const { authenticate } = require('../../middlewares/auth.middleware');
const { authorize } = require('../../middlewares/role.middleware');
const Joi = require('joi');
const { validate } = require('../../middlewares/validate.middleware');

const createMessageSchema = Joi.object({
  caseId: Joi.string().required(),
  message: Joi.string().max(5000).required()
});

router.use(authenticate);

router.get('/', authorize('client', 'lawyer', 'admin'), messageController.getByCase);
router.post('/', authorize('client', 'lawyer', 'admin'), validate(createMessageSchema), messageController.create);
router.get('/unread', authorize('client', 'lawyer', 'admin'), messageController.getUnreadCount);

module.exports = router;