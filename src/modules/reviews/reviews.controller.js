const reviewService = require('./reviews.service');

class ReviewController {
  async create(req, res, next) {
    try {
      const review = await reviewService.create(req.body, req.user._id);
      res.status(201).json({
        success: true,
        data: review
      });
    } catch (error) {
      next(error);
    }
  }

  async getAll(req, res, next) {
    try {
      const result = await reviewService.getAll(req.query);
      res.json({
        success: true,
        ...result
      });
    } catch (error) {
      next(error);
    }
  }

  async getByLawyer(req, res, next) {
    try {
      const result = await reviewService.getByLawyer(req.params.lawyerId, req.query);
      res.json({
        success: true,
        ...result
      });
    } catch (error) {
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      const result = await reviewService.delete(req.params.id);
      res.json({
        success: true,
        ...result
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ReviewController();