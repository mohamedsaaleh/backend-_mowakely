const { Category } = require('./categories.model');
const { AppError } = require('../../middlewares/error.middleware');
const { cache } = require('../../utils/cache');
const QueryBuilder = require('../../utils/queryBuilder');
const constants = require('../../constants');

class CategoryService {
  async create(categoryData) {
    const category = await Category.create(categoryData);
    await cache.invalidatePrefix('categories');
    return category;
  }

  async getAll(query = {}) {
    const cacheKey = `categories:list:${JSON.stringify(query)}`;
    
    const cached = await cache.get(cacheKey);
    if (cached) return cached;

    const result = await new QueryBuilder(Category)
      .filter(query)
      .sortBy(query.sort || 'name')
      .withPagination(query.page, query.limit)
      .execute();

    await cache.set(cacheKey, result, constants.CACHE.TTL.LONG);
    return result;
  }

  async getById(id) {
    const cacheKey = `category:${id}`;
    
    const cached = await cache.get(cacheKey);
    if (cached) return cached;

    const category = await Category.findById(id);
    if (!category) {
      throw new AppError('Category not found', 404);
    }

    await cache.set(cacheKey, category, constants.CACHE.TTL.MEDIUM);
    return category;
  }

  async getByName(name) {
    const cacheKey = `category:name:${name.toUpperCase()}`;
    
    const cached = await cache.get(cacheKey);
    if (cached) return cached;

    const category = await Category.findOne({ name: name.toUpperCase() });
    if (!category) {
      throw new AppError('Category not found', 404);
    }

    await cache.set(cacheKey, category, constants.CACHE.TTL.LONG);
    return category;
  }

  async update(id, updateData) {
    const category = await Category.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );
    if (!category) {
      throw new AppError('Category not found', 404);
    }

    await cache.invalidatePrefix('categories');
    await cache.del(`category:${id}`);
    return category;
  }

  async delete(id) {
    const category = await Category.findByIdAndDelete(id);
    if (!category) {
      throw new AppError('Category not found', 404);
    }

    await cache.invalidatePrefix('categories');
    await cache.del(`category:${id}`);
    return category;
  }

  async getSubCategories(parentId) {
    const cacheKey = `categories:sub:${parentId}`;
    
    const cached = await cache.get(cacheKey);
    if (cached) return cached;

    const categories = await Category.find({});
    await cache.set(cacheKey, categories, constants.CACHE.TTL.SHORT);
    return categories;
  }

  async seedCategories() {
    const categories = [
      { name: 'FAMILY_LAW', description: 'Divorce, custody, adoption matters', icon: 'family' },
      { name: 'CRIMINAL_LAW', description: 'Criminal defense and prosecution', icon: 'criminal' },
      { name: 'CORPORATE_LAW', description: 'Business formation and contracts', icon: 'corporate' },
      { name: 'REAL_ESTATE', description: 'Property disputes and transactions', icon: 'real-estate' },
      { name: 'INTELLECTUAL_PROPERTY', description: 'Patents, trademarks, copyrights', icon: 'ip' },
      { name: 'IMMIGRATION', description: 'Visa, citizenship, deportation', icon: 'immigration' },
      { name: 'EMPLOYMENT_LAW', description: 'Workplace disputes and rights', icon: 'employment' },
      { name: 'PERSONAL_INJURY', description: 'Accidents and compensation', icon: 'injury' },
      { name: 'TAX_LAW', description: 'Tax disputes and planning', icon: 'tax' },
      { name: 'ESTATE_PLANNING', description: 'Wills, trusts, probate', icon: 'estate' }
    ];

    for (const cat of categories) {
      await Category.findOneAndUpdate(
        { name: cat.name },
        cat,
        { upsert: true, new: true }
      );
    }

    await cache.invalidatePrefix('categories');
    return categories;
  }
}

module.exports = new CategoryService();