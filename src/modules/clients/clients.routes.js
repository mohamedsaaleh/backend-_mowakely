/**
 * @swagger
 * tags:
 *   name: Clients
 *   description: Client profiles and management
 */

/**
 * @swagger
 * /api/clients/me:
 *   get:
 *     summary: Get my client profile
 *     tags: [Clients]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Client profile retrieved
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 * 
 *   patch:
 *     summary: Update my client profile
 *     tags: [Clients]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fullName:
 *                 type: string
 *               phone:
 *                 type: string
 *               city:
 *                 type: string
 *     responses:
 *       200:
 *         description: Profile updated
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */

const express = require('express');
const router = express.Router();
const clientController = require('./clients.controller');
const { authenticate } = require('../../middlewares/auth.middleware');
const { authorize } = require('../../middlewares/role.middleware');

router.get('/me', authenticate, authorize('client'), clientController.getMyProfile);
router.patch('/me', authenticate, authorize('client'), clientController.updateMyProfile);

module.exports = router;