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
 *     summary: Create an invoice from a case (Admin only)
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
 *               - caseId
 *             properties:
 *               caseId:
 *                 type: string
 *                 description: Case ID to generate invoice for
 *     responses:
 *       201:
 *         description: Invoice created
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */

/**
 * @swagger
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
 */

/**
 * @swagger
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
 */

/**
 * @swagger
 * /api/invoices:
 *   get:
 *     summary: Get all invoices (Admin only)
 *     description: Retrieve all invoices with optional filtering.
 *     tags: [Invoices]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/page'
 *       - $ref: '#/components/parameters/limit'
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, paid, overdue, cancelled, refunded]
 *     responses:
 *       200:
 *         description: Invoices retrieved
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */

/**
 * @swagger
 * /api/invoices/{id}:
 *   get:
 *     summary: Get invoice by ID
 *     description: Retrieve a specific invoice. Admins can view any invoice; clients and lawyers can only view their own invoices.
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
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */

const express = require('express');
const router = express.Router();
const invoiceController = require('./invoices.controller');
const { authenticate } = require('../../middlewares/auth.middleware');
const { authorize } = require('../../middlewares/role.middleware');

router.post('/', authenticate, authorize('admin'), invoiceController.create);
router.get('/', authenticate, authorize('admin'), invoiceController.getAll);
router.get('/my-invoices', authenticate, authorize('client'), invoiceController.getMyInvoices);
router.get('/lawyer-invoices', authenticate, authorize('lawyer'), invoiceController.getLawyerInvoices);
router.get('/:id', authenticate, invoiceController.getById);

module.exports = router;