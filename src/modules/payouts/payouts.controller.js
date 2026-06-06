const payoutService = require('./payouts.service');
const { Lawyer } = require('../lawyers/lawyers.model');

class PayoutController {
  async request(req, res, next) {
    try {
      const payout = await payoutService.requestPayout(req.body, req.user._id);
      res.status(201).json({
        success: true,
        data: payout
      });
    } catch (error) {
      next(error);
    }
  }
// getMyPayouts
  async getMyPayouts(req, res, next) {
    try {
      const lawyer = await Lawyer.findOne({ user: req.user._id });
      if (!lawyer) {
        return res.status(404).json({ success: false, message: 'Lawyer profile not found' });
      }
      const result = await payoutService.getByLawyer(lawyer._id, req.query);
      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }

  async getAll(req, res, next) {
    try {
      const result = await payoutService.getAll(req.query);
      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }

  async updateStatus(req, res, next) {
    try {
      const { status, providerRef } = req.body;
      const payout = await payoutService.updateStatus(req.params.id, status, providerRef);
      res.json({ success: true, data: payout });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new PayoutController();