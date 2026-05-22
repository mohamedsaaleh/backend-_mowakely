const Joi = require('joi');

const createCaseSchema = Joi.object({
  title: Joi.string().min(5).max(200).required(),
  description: Joi.string().min(20).max(5000).required(),
  category: Joi.string().required(),
  city: Joi.string().required(),
  budget: Joi.number().min(2000).optional()
});

const updateCaseSchema = Joi.object({
  title: Joi.string().min(5).max(200).optional(),
  description: Joi.string().min(20).max(5000).optional(),
  city: Joi.string().optional(),
  budget: Joi.number().min(2000).optional(),
  status: Joi.string().valid('open', 'in_progress', 'completed', 'cancelled').optional()
});

const caseQuerySchema = Joi.object({
  page: Joi.number().min(1).default(1),
  limit: Joi.number().min(1).max(100).default(20),
  status: Joi.string().valid('open', 'in_progress', 'completed', 'cancelled').optional(),
  category: Joi.string().optional(),
  city: Joi.string().optional(),
  minBudget: Joi.number().optional(),
  search: Joi.string().optional()
});

module.exports = { createCaseSchema, updateCaseSchema, caseQuerySchema };