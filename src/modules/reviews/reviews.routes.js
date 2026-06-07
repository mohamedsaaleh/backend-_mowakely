/**
 * @swagger
 * tags:
 *   name: Reviews
 *   description: Reviews and ratings for lawyers
 */

/**
 * @swagger
 * /api/reviews:
 *   post:
 *     summary: Create a review for a lawyer
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - reviewedLawyer
 *               - case
 *               - rating
 *             properties:
 *               reviewedLawyer:
 *                 type: string
 *               case:
 *                 type: string
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *               comment:
 *                 type: string
 *                 maxLength: 1000
 *     responses:
 *       201:
 *         description: Review created successfully
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 */

/**
 * @swagger
 * /api/reviews:
 *   get:
 *     summary: Get all reviews (Admin only)
 *     description: Retrieve all reviews in the system. Admin only access for moderation.
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/page'
 *       - $ref: '#/components/parameters/limit'
 *     responses:
 *       200:
 *         description: Reviews retrieved successfully
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */

/**
 * @swagger
 * /api/reviews/{id}:
 *   delete:
 *     summary: Delete a review (Admin only)
 *     description: Delete a review by ID. Admin only for moderation.
 *     tags: [Reviews]
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
 *         description: Review deleted successfully
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */

/**
 * @swagger
 * /api/reviews/lawyer/{lawyerId}:
 *   get:
 *     summary: Get reviews for a specific lawyer
 *     tags: [Reviews]
 *     parameters:
 *       - in: path
 *         name: lawyerId
 *         required: true
 *         schema:
 *           type: string
 *       - $ref: '#/components/parameters/page'
 *       - $ref: '#/components/parameters/limit'
 *     responses:
 *       200:
 *         description: Reviews retrieved successfully
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */

const express = require('express');
const router = express.Router();
const reviewController = require('./reviews.controller');
const Joi = require('joi');
const { validate } = require('../../middlewares/validate.middleware');
const { authenticate } = require('../../middlewares/auth.middleware');
const { authorize } = require('../../middlewares/role.middleware');

const createReviewSchema = Joi.object({
  reviewedLawyer: Joi.string().required(),
  case: Joi.string().required(),
  rating: Joi.number().min(1).max(5).required(),
  comment: Joi.string().max(1000).optional()
});

router.post('/', authenticate, authorize('client'), validate(createReviewSchema), reviewController.create);
router.get('/', authenticate, authorize('admin'), reviewController.getAll);
router.get('/lawyer/:lawyerId', reviewController.getByLawyer);
router.delete('/:id', authenticate, authorize('admin'), reviewController.delete);

module.exports = router;