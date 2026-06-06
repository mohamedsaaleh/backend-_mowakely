/**
 * @swagger
 * tags:
 *   name: Invoices
 *   description: Invoice generation and payment tracking
 */

/**
 * @swagger
 * /api/invoices:
 *   post:
 *     summary: Create an invoice (Admin only)
 *     tags: [Invoices]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - case
 *               - client
 *               - lawyer
 *               - amount
 *               - dueDate
 *             properties:
 *               case:
 *                 type: string
 *               client:
 *                 type: string
 *               lawyer:
 *                 type: string
 *               amount:
 *                 type: number
 *               dueDate:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: Invoice created
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 * 
 * /api/invoices/my-invoices:
 *   get:
 *     summary: Get my invoices (Client only)
 *     tags: [Invoices]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Invoices retrieved
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 * 
 * /api/invoices/lawyer-invoices:
 *   get:
 *     summary: Get invoices for lawyer (Lawyer only)
 *     tags: [Invoices]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Invoices retrieved
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 * 
 * /api/invoices/{id}:
 *   get:
 *     summary: Get invoice by ID
 *     tags: [Invoices]
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
 *         description: Invoice retrieved
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */

const express = require('express');
const router = express.Router();
const invoiceController = require('./invoices.controller');
const { authenticate } = require('../../middlewares/auth.middleware');
const { authorize } = require('../../middlewares/role.middleware');

router.post('/', authenticate, authorize('admin'), invoiceController.create);
router.get('/my-invoices', authenticate, authorize('client'), invoiceController.getMyInvoices);
router.get('/lawyer-invoices', authenticate, authorize('lawyer'), invoiceController.getLawyerInvoices);
router.get('/:id', authenticate, invoiceController.getById);
module.exports = router;