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

module.exports = router;