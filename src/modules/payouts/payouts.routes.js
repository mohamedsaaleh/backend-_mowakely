/**
 * @swagger
 * tags:
 *   name: Payouts
 *   description: Lawyer payout and withdrawal management
 */

/**
 * @swagger
 * /api/payouts:
 *   post:
 *     summary: Request a payout (Lawyer only)
 *     tags: [Payouts]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *             properties:
 *               amount:
 *                 type: number
 *               method:
 *                 type: string
 *                 enum: [bank_transfer, paypal, stripe]
 *     responses:
 *       201:
 *         description: Payout requested
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 * 
 *   get:
 *     summary: Get all payouts (Admin only)
 *     tags: [Payouts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/page'
 *       - $ref: '#/components/parameters/limit'
 *     responses:
 *       200:
 *         description: Payouts retrieved
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 * 
 * /api/payouts/my-payouts:
 *   get:
 *     summary: Get my payouts (Lawyer only)
 *     tags: [Payouts]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Payouts retrieved
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 * 
 * /api/payouts/{id}/status:
 *   patch:
 *     summary: Update payout status (Admin only)
 *     tags: [Payouts]
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
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [processing, completed, failed, cancelled]
 *     responses:
 *       200:
 *         description: Payout status updated
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */

const express = require('express');
const router = express.Router();
const payoutController = require('./payouts.controller');
const { authenticate } = require('../../middlewares/auth.middleware');
const { authorize } = require('../../middlewares/role.middleware');

router.post('/', authenticate, authorize('lawyer'), payoutController.request);
router.get('/my-payouts', authenticate, authorize('lawyer'), payoutController.getMyPayouts);
router.get('/', authenticate, authorize('admin'), payoutController.getAll);
router.patch('/:id/status', authenticate, authorize('admin'), payoutController.updateStatus);

module.exports = router;