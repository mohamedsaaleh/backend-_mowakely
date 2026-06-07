/**
 * @swagger
 * tags:
 *   name: Payments
 *   description: Paymob payment gateway integration
 *
 * /api/payments/create:
 *   post:
 *     summary: Create a Paymob payment session for an invoice (Client only)
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - invoiceId
 *             properties:
 *               invoiceId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Payment session created
 *       400:
 *         description: Invoice already paid
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       502:
 *         description: Paymob API error
 *
 * /api/payments/verify/{transactionId}:
 *   get:
 *     summary: Verify a Paymob transaction
 *     tags: [Payments]
 *     parameters:
 *       - in: path
 *         name: transactionId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Transaction verification result
 *
 * /api/payments/webhook:
 *   post:
 *     summary: Paymob webhook callback (no auth, HMAC validated)
 *     tags: [Payments]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Webhook processed
 *       401:
 *         description: Invalid HMAC signature
 *
 * /api/payments/invoice/{invoiceId}:
 *   get:
 *     summary: Get payment details for an invoice
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: invoiceId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Payment details retrieved
 */

const express = require('express');
const router = express.Router();
const paymentController = require('./payments.controller');
const { authenticate } = require('../../middlewares/auth.middleware');
const { authorize } = require('../../middlewares/role.middleware');

router.post('/create', authenticate, authorize('client'), paymentController.create);
router.get('/verify/:transactionId', paymentController.verify);
router.post('/webhook', paymentController.webhook);
router.get('/invoice/:invoiceId', authenticate, paymentController.getByInvoice);

module.exports = router;
