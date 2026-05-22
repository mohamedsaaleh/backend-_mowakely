const Joi = require('joi');

const createCategorySchema = Joi.object({
  name: Joi.string().uppercase().required(),
  parentCategory: Joi.string().optional(),
  description: Joi.string().optional(),
  icon: Joi.string().optional()
});

const updateCategorySchema = Joi.object({
  name: Joi.string().uppercase().optional(),
  description: Joi.string().optional(),
  icon: Joi.string().optional()
});

module.exports = { createCategorySchema, updateCategorySchema };