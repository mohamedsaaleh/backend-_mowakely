const Joi = require('joi');
const constants = require('../constants');

const objectIdPattern = /^[0-9a-fA-F]{24}$/;

const validateObjectId = (value, helpers) => {
  if (!objectIdPattern.test(value)) {
    return helpers.error('any.invalid');
  }
  return value;
};

const passwordSchema = Joi.string()
  .min(constants.VALIDATION.PASSWORD_MIN_LENGTH)
  .max(constants.VALIDATION.PASSWORD_MAX_LENGTH)
  .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
  .messages({
    'string.min': 'Password must be at least 8 characters long',
    'string.max': 'Password must not exceed 100 characters',
    'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
  });

const emailSchema = Joi.string()
  .email()
  .lowercase()
  .pattern(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)
  .messages({
    'string.email': 'Please provide a valid email address',
    'string.pattern.base': 'Please provide a valid email format'
  });

const phoneSchema = Joi.string()
  .pattern(/^\+?[\d\s\-()]+$/)
  .min(10)
  .max(20)
  .messages({
    'string.pattern.base': 'Please provide a valid phone number',
    'string.min': 'Phone number must be at least 10 digits',
    'string.max': 'Phone number must not exceed 20 digits'
  });

const paginationSchema = Joi.object({
  page: Joi.number().integer().min(1).default(constants.PAGINATION.DEFAULT_PAGE),
  limit: Joi.number().integer().min(1).max(constants.PAGINATION.MAX_LIMIT).default(constants.PAGINATION.DEFAULT_LIMIT),
  sort: Joi.string().pattern(/^-?[a-zA-Z_]+$/),
  search: Joi.string().max(100).trim(),
  fields: Joi.string()
});

const idParamSchema = Joi.object({
  id: Joi.string().custom(validateObjectId).required()
});

const createPaginationSchema = (additionalFilters = {}) => {
  return paginationSchema.keys(additionalFilters);
};

const sanitizeString = (value) => {
  if (typeof value !== 'string') return value;

  return value
    .replace(/[<>]/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, '')
    .trim();
};

const validateEmail = (email) => {
  return emailSchema.validate(email);
};

const validatePassword = (password) => {
  return passwordSchema.validate(password);
};

const validatePhone = (phone) => {
  return phoneSchema.validate(phone);
};

const validateObjectIdString = (id) => {
  return objectIdPattern.test(id);
};

const createSchema = (fields) => {
  const schemaObj = {};

  Object.keys(fields).forEach(key => {
    const field = fields[key];
    let validator = Joi.string();

    if (field.required) validator = validator.required();
    if (field.email) validator = validator.concat(emailSchema);
    if (field.password) validator = validator.concat(passwordSchema);
    if (field.phone) validator = validator.concat(phoneSchema);
    if (field.min) validator = validator.min(field.min);
    if (field.max) validator = validator.max(field.max);
    if (field.pattern) validator = validator.pattern(field.pattern);
    if (field.allow) validator = validator.allow(field.allow);

    schemaObj[key] = validator;
  });

  return Joi.object(schemaObj);
};

module.exports = {
  validateObjectId,
  passwordSchema,
  emailSchema,
  phoneSchema,
  paginationSchema,
  idParamSchema,
  createPaginationSchema,
  sanitizeString,
  validateEmail,
  validatePassword,
  validatePhone,
  validateObjectIdString,
  createSchema,
  objectIdPattern
};