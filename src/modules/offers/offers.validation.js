const Joi = require('joi');

const createOfferSchema = Joi.object({
  case: Joi.string().required(),
  price: Joi.number().min(0).required(),
  delivery_time: Joi.number().min(1).optional(),
  message: Joi.string().trim().max(1000).required()
});

const updateOfferSchema = Joi.object({
  price: Joi.number().min(0).optional(),
  delivery_time: Joi.number().min(1).optional(),
  message: Joi.string().trim().max(1000).optional()
});

module.exports = { createOfferSchema, updateOfferSchema };