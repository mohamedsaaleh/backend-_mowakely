/**
 * @swagger
 * tags:
 *   name: Offers
 *   description: Legal case offers - create, accept, reject, withdraw
 */

/**
 * @swagger
 * /api/offers:
 *   post:
 *     summary: Create an offer for a case
 *     tags: [Offers]
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
 *               - price
 *               - message
 *             properties:
 *               case:
 *                 type: string
 *               price:
 *                 type: number
 *               message:
 *                 type: string
 *                 maxLength: 1000
 *               estimatedDuration:
 *                 type: string
 *     responses:
 *       201:
 *         description: Offer created
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *
 * /api/offers/case/{caseId}:
 *   get:
 *     summary: Get offers for a case
 *     tags: [Offers]
 *     parameters:
 *       - in: path
 *         name: caseId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Offers retrieved
 *
 * /api/offers/my-offers:
 *   get:
 *     summary: Get my offers (Lawyer)
 *     tags: [Offers]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Offers retrieved
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *
 * /api/offers/{id}/accept:
 *   patch:
 *     summary: Accept an offer (Client)
 *     tags: [Offers]
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
 *         description: Offer accepted
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *
 * /api/offers/{id}/reject:
 *   patch:
 *     summary: Reject an offer (Client)
 *     tags: [Offers]
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
 *         description: Offer rejected
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *
 * /api/offers/{id}:
 *   delete:
 *     summary: Delete an offer (Lawyer or Admin)
 *     tags: [Offers]
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
 *         description: Offer deleted
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */

const express = require('express');
const router = express.Router();
const offerController = require('./offers.controller');
const { validate } = require('../../middlewares/validate.middleware');
const { createOfferSchema } = require('./offers.validation');
const { authenticate } = require('../../middlewares/auth.middleware');
const { authorize } = require('../../middlewares/role.middleware');

router.post('/', authenticate, authorize('lawyer'), validate(createOfferSchema), offerController.create);
router.get('/my-offers', authenticate, authorize('lawyer'), offerController.getMyOffers);
router.get('/case/:caseId', offerController.getByCase);
router.get('/', authenticate, authorize('admin'), offerController.getAll);
router.patch('/:id/accept', authenticate, authorize('client'), offerController.acceptOffer);
router.patch('/:id/reject', authenticate, authorize('client'), offerController.rejectOffer);
router.delete('/:id', authenticate, authorize('lawyer', 'admin'), offerController.delete);

module.exports = router;