const offerService = require('./offers.service');
const { Lawyer } = require('../lawyers/lawyers.model');

class OfferController {
  async create(req, res, next) {
    try {
      req.body.case = req.params.caseId || req.body.case;
      const offer = await offerService.create(req.body, req.user._id);
      res.status(201).json({
        success: true,
        data: offer
      });
    } catch (error) {
      next(error);
    }
  }

  async getByCase(req, res, next) {
    try {
      const result = await offerService.getByCase(req.params.caseId, req.query);
      res.json({
        success: true,
        ...result
      });
    } catch (error) {
      next(error);
    }
  }

  async getMyOffers(req, res, next) {
    try {
      const result = await offerService.getMyOffers(req);
      res.json({
        success: true,
        ...result
      });
    } catch (error) {
      next(error);
    }
  }

  async acceptOffer(req, res, next) {
    try {
      const offer = await offerService.acceptOffer(req.params.id, req.user._id);
      res.json({
        success: true,
        data: offer
      });
    } catch (error) {
      next(error);
    }
  }

  async rejectOffer(req, res, next) {
    try {
      const offer = await offerService.rejectOffer(req.params.id, req.user._id);
      res.json({
        success: true,
        data: offer
      });
    } catch (error) {
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      const result = await offerService.delete(req.params.id, req.user._id);
      res.json({
        success: true,
        ...result
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new OfferController();