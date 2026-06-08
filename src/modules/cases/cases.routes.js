const express = require('express');
const router = express.Router();
const caseController = require('./cases.controller');
const { validate } = require('../../middlewares/validate.middleware');
const { createCaseSchema, updateCaseSchema } = require('./cases.validation');
const { authenticate } = require('../../middlewares/auth.middleware');
const { authorize } = require('../../middlewares/role.middleware');
const { uploadFiles } = require('../../middlewares/upload.middleware');

/**
 * @swagger
 * /cases:
 *   post:
 *     summary: Create a new case
 *     description: Create a new legal case (client only)
 *     tags: [Cases]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *               - category
 *               - budget
 *             properties:
 *               title:
 *                 type: string
 *                 example: Divorce and Child Custody
 *               description:
 *                 type: string
 *                 example: Need legal representation for divorce...
 *               category:
 *                 type: string
 *                 example: Family Law
 *               budget:
 *                 type: number
 *                 example: 5000
 *               priority:
 *                 type: string
 *                 enum: [low, medium, high, urgent]
 *                 default: medium
 *               location:
 *                 type: string
 *                 example: New York, NY
 *     responses:
 *       201:
 *         description: Case created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.post('/', authenticate, authorize('client'), validate(createCaseSchema), caseController.create);

/**
 * @swagger
 * /cases:
 *   get:
 *     summary: Get all cases
 *     description: Retrieve all cases with optional filtering, pagination, and sorting. Admin can view all cases; lawyers can view open unassigned cases.
 *     tags: [Cases]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [open, in_progress, completed, cancelled]
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           default: -createdAt
 *     responses:
 *       200:
 *         description: Cases retrieved successfully
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 * 
 * /cases/my-cases:
 *   get:
 *     summary: Get my cases
 *     description: Get all cases for the authenticated client
 *     tags: [Cases]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cases retrieved
 *       401:
 *         description: Unauthorized
 */
router.get('/', caseController.getAll);
router.get('/my-cases', authenticate, authorize('client'), caseController.getMyCases);

/**
 * @swagger
 * /cases/lawyer-cases:
 *   get:
 *     summary: Get lawyer cases
 *     description: Get all cases for the authenticated lawyer
 *     tags: [Cases]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cases retrieved
 *       401:
 *         description: Unauthorized
 */
router.get('/lawyer-cases', authenticate, authorize('lawyer'), caseController.getLawyerCases);

/**
 * @swagger
 * /cases/{id}:
 *   get:
 *     summary: Get case by ID
 *     description: Retrieve a specific case by its ID. Admins can view any case; regular users can only view cases they are involved in.
 *     tags: [Cases]
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
 *         description: Case retrieved
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get('/:id', caseController.getById);

/**
 * @swagger
 * /cases/{id}:
 *   patch:
 *     summary: Update case
 *     description: Update case details
 *     tags: [Cases]
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
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               budget:
 *                 type: number
 *     responses:
 *       200:
 *         description: Case updated
 *       400:
 *         description: Validation error
 *       404:
 *         description: Case not found
 */
router.patch('/:id', authenticate, validate(updateCaseSchema), caseController.update);

/**
 * @swagger
 * /cases/{id}:
 *   delete:
 *     summary: Delete case
 *     description: Delete a case (client or admin). Admins can delete any case.
 *     tags: [Cases]
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
 *         description: Case deleted successfully
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.delete('/:id', authenticate, authorize('client', 'admin'), caseController.delete);

/**
 * @swagger
 * /cases/{id}/status:
 *   patch:
 *     summary: Update case status
 *     description: Update the status of a case
 *     tags: [Cases]
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
 *                 enum: [open, in_progress, pending_payment, completed, cancelled, disputed]
 *     responses:
 *       200:
 *         description: Status updated
 */
router.patch('/:id/status', authenticate, caseController.updateStatus);

module.exports = router;