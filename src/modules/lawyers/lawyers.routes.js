const express = require('express');
const router = express.Router();
const lawyerController = require('./lawyers.controller');
const { authenticate } = require('../../middlewares/auth.middleware');
const { authorize } = require('../../middlewares/role.middleware');

/**
 * @swagger
 * /lawyers:
 *   get:
 *     summary: Get all lawyers
 *     description: Retrieve all lawyers with filtering, pagination, and sorting
 *     tags: [Lawyers]
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
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: city
 *         schema:
 *           type: string
 *       - in: query
 *         name: specialization
 *         schema:
 *           type: string
 *       - in: query
 *         name: minRating
 *         schema:
 *           type: number
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           default: -rating
 *     responses:
 *       200:
 *         description: Lawyers retrieved successfully
 */
router.get('/', lawyerController.getAll);

/**
 * @swagger
 * /lawyers/me:
 *   get:
 *     summary: Get my profile
 *     description: Get authenticated lawyer's profile
 *     tags: [Lawyers]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile retrieved
 *       401:
 *         description: Unauthorized
 */
router.get('/me', authenticate, authorize('lawyer'), lawyerController.getMyProfile);

/**
 * @swagger
 * /lawyers/me:
 *   patch:
 *     summary: Update my profile
 *     description: Update authenticated lawyer's profile
 *     tags: [Lawyers]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               specializations:
 *                 type: array
 *                 items:
 *                   type: string
 *               city:
 *                 type: string
 *               bio:
 *                 type: string
 *               hourlyRate:
 *                 type: number
 *     responses:
 *       200:
 *         description: Profile updated
 *       401:
 *         description: Unauthorized
 */
router.patch('/me', authenticate, authorize('lawyer'), lawyerController.updateMyProfile);

/**
 * @swagger
 * /lawyers/{id}:
 *   get:
 *     summary: Get lawyer by ID
 *     description: Retrieve a specific lawyer's profile
 *     tags: [Lawyers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Lawyer retrieved
 *       404:
 *         description: Lawyer not found
 */
router.get('/:id', lawyerController.getById);

/**
 * @swagger
 * /lawyers:
 *   post:
 *     summary: Create a new lawyer
 *     description: Create a new lawyer profile (admin only)
 *     tags: [Lawyers]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               specializations:
 *                 type: array
 *                 items:
 *                   type: string
 *               city:
 *                 type: string
 *               bio:
 *                 type: string
 *               hourlyRate:
 *                 type: number
 *     responses:
 *       201:
 *         description: Lawyer created successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 */
router.post('/', authenticate, authorize('admin'), lawyerController.create);

/**
 * @swagger
 * /lawyers/{id}:
 *   put:
 *     summary: Update lawyer by ID
 *     description: Update a lawyer's profile by ID (admin or lawyer only)
 *     tags: [Lawyers]
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
 *               specializations:
 *                 type: array
 *                 items:
 *                   type: string
 *               city:
 *                 type: string
 *               bio:
 *                 type: string
 *               hourlyRate:
 *                 type: number
 *     responses:
 *       200:
 *         description: Lawyer updated successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Not authorized to update this lawyer
 *       404:
 *         description: Lawyer not found
 */
router.put('/:id', authenticate, authorize('admin', 'lawyer'), lawyerController.updateById);

/**
 * @swagger
 * /lawyers/{id}:
 *   delete:
 *     summary: Delete lawyer by ID
 *     description: Delete a lawyer's profile by ID (admin only)
 *     tags: [Lawyers]
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
 *         description: Lawyer deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       404:
 *         description: Lawyer not found
 */
router.delete('/:id', authenticate, authorize('admin'), lawyerController.deleteById);

module.exports = router;