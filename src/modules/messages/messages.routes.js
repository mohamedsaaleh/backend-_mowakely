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
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: caseId
 *         required: true
 *         schema:
 *           type: string
 *         description: Case ID
 *     responses:
 *       200:
 *         description: Messages retrieved successfully
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 * 
 *   post:
 *     summary: Send a message
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
 *               - message
 *             properties:
 *               message:
 *                 type: string
 *                 maxLength: 5000
 *     responses:
 *       201:
 *         description: Message sent successfully
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 * 
 * /api/messages/unread:
 *   get:
 *     summary: Get unread message count
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Unread count retrieved
 */

const express = require('express');
const router = express.Router({ mergeParams: true });
const messageController = require('./messages.controller');
const { authenticate } = require('../../middlewares/auth.middleware');
const Joi = require('joi');
const { validate } = require('../../middlewares/validate.middleware');

const createMessageSchema = Joi.object({
  message: Joi.string().max(5000).required()
});

router.use(authenticate);

router.get('/', messageController.getByCase);
router.post('/', validate(createMessageSchema), messageController.create);
router.get('/unread', messageController.getUnreadCount);

module.exports = router;