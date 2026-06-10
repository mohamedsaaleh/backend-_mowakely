const Joi = require('joi');

const registerSchema = Joi.object({
  full_name: Joi.string().min(2).max(100).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).max(100).required(),
  role: Joi.string().valid('client', 'lawyer', 'admin','superadmin').required(),
  phone: Joi.string().required(),
  city: Joi.string().allow('', null),
  address: Joi.string().allow('', null),
  bio: Joi.string().allow('', null),
  specialization: Joi.string().when('role', {
    is: 'lawyer',
    then: Joi.string().required(),
    otherwise: Joi.optional()
  }),
  years_of_experience: Joi.number().integer().min(0).when('role', {
    is: 'lawyer',
    then: Joi.number().integer().min(0),
    otherwise: Joi.optional()
  }),
  office_address: Joi.string().allow('', null)
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

const refreshTokenSchema = Joi.object({
  refreshToken: Joi.string().required()
});

const forgotPasswordSchema = Joi.object({
  email: Joi.string().email().required()
});

const resetPasswordSchema = Joi.object({
  password: Joi.string().min(6).max(100).required()
});

module.exports = {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  forgotPasswordSchema,
  resetPasswordSchema
};