const Joi = require('joi');
const { AppError } = require('../middlewares/error.middleware');
const { escapeRegex } = require('./escapeRegex');

const objectIdPattern = new RegExp('^[0-9a-fA-F]{24}$');

const objectId = Joi.string().pattern(objectIdPattern).messages({
  'string.pattern.base': 'Invalid ID format'
});

const pagination = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  sort: Joi.string().default('-createdAt'),
  order: Joi.string().valid('asc', 'desc').default('desc')
});

const objectIdValidation = (value, helpers) => {
  if (!objectIdPattern.test(value)) {
    return helpers.error('any.invalid');
  }
  return value;
};

const objectIdSchema = Joi.object({
  id: Joi.string().custom(objectIdValidation, 'Object ID validation').required()
});

const queryPagination = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  sort: Joi.string().default('-createdAt'),
  order: Joi.string().valid('asc', 'desc').default('desc'),
  search: Joi.string().allow(''),
  fields: Joi.string()
});

const idParam = (paramName = 'id') => {
  return Joi.object({
    [paramName]: Joi.string().custom(objectIdValidation, 'Object ID validation').required()
  });
};

const validateObjectId = (id) => {
  if (!objectIdPattern.test(id)) {
    throw new AppError('Invalid ID format', 400);
  }
};

const parseSort = (sortStr) => {
  if (!sortStr) return { createdAt: -1 };

  const sortObj = {};
  const fields = sortStr.split(',');

  fields.forEach(field => {
    const isDescending = field.startsWith('-');
    const key = isDescending ? field.slice(1) : field;
    sortObj[key] = isDescending ? -1 : 1;
  });

  return sortObj;
};

const getPagination = (page = 1, limit = 10) => {
  const pageNum = parseInt(page) || 1;
  const limitNum = parseInt(limit) || 10;

  return {
    skip: (pageNum - 1) * limitNum,
    limit: Math.min(limitNum, 100),
    page: pageNum,
    limitNum
  };
};

const buildFilter = (query, allowedFields = []) => {
  const filter = {};

  allowedFields.forEach(field => {
    if (query[field] !== undefined) {
      filter[field] = query[field];
    }
  });

  if (query.search) {
    const searchValue = escapeRegex(query.search);
    filter.$or = [
      { title: { $regex: searchValue, $options: 'i' } },
      { description: { $regex: searchValue, $options: 'i' } }
    ];
  }

  return filter;
};

module.exports = {
  objectId,
  pagination,
  objectIdSchema,
  queryPagination,
  idParam,
  validateObjectId,
  parseSort,
  getPagination,
  buildFilter
};
