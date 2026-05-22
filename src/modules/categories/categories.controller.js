const categoryService = require('./categories.service');

class CategoryController {
  async create(req, res, next) {
    try {
      const category = await categoryService.create(req.body);
      res.status(201).json({
        success: true,
        data: category
      });
    } catch (error) {
      next(error);
    }
  }

  async getAll(req, res, next) {
    try {
      const result = await categoryService.getAll(req.query);
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const category = await categoryService.getById(req.params.id);
      res.json({
        success: true,
        data: category
      });
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const category = await categoryService.update(req.params.id, req.body);
      res.json({
        success: true,
        data: category
      });
    } catch (error) {
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      await categoryService.delete(req.params.id);
      res.json({
        success: true,
        message: 'Category deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  async seed(req, res, next) {
    try {
      const categories = await categoryService.seedCategories();
      res.json({
        success: true,
        message: 'Categories seeded successfully',
        data: categories
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new CategoryController();
