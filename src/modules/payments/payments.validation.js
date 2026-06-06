const Joi = require('joi');

const createPaymentSession = Joi.object({
  invoiceId: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      'string.pattern.base': 'invoiceId must be a valid MongoDB ObjectId',
      'any.required': 'invoiceId is required'
    })
});

module.exports = {
  createPaymentSession
};
