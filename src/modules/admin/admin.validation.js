const Joi = require('joi');

const createAdminSchema = Joi.object({
  full_name: Joi.string().min(2).max(100).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).max(100).required(),
  phone: Joi.string().required(),
  city: Joi.string().allow('', null),
  address: Joi.string().allow('', null),
  bio: Joi.string().allow('', null),
  profile_photo: Joi.string().allow('', null)
});

module.exports = {
  createAdminSchema
};
