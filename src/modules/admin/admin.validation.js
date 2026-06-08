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

const createUserSchema = Joi.object({
  full_name: Joi.string().min(2).max(100).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).max(100).required(),
  phone: Joi.string().required(),
  role: Joi.string().valid('client', 'lawyer', 'admin').optional(),
  city: Joi.string().allow('', null),
  address: Joi.string().allow('', null),
  bio: Joi.string().allow('', null),
  profile_photo: Joi.string().allow('', null),
  is_verified: Joi.boolean().optional(),
  is_banned: Joi.boolean().optional(),
  specialization: Joi.string().optional(),
  years_of_experience: Joi.number().integer().min(0).optional(),
  office_address: Joi.string().allow('', null).optional()
});

const updateUserSchema = Joi.object({
  full_name: Joi.string().min(2).max(100).optional(),
  phone: Joi.string().optional(),
  city: Joi.string().allow('', null).optional(),
  address: Joi.string().allow('', null).optional(),
  bio: Joi.string().allow('', null).optional(),
  profile_photo: Joi.string().allow('', null).optional(),
  role: Joi.string().valid('client', 'lawyer', 'admin').optional(),
  is_verified: Joi.boolean().optional(),
  is_banned: Joi.boolean().optional()
});

const createLawyerSchema = Joi.object({
  full_name: Joi.string().min(2).max(100).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).max(100).required(),
  phone: Joi.string().required(),
  specialization: Joi.string().required(),
  years_of_experience: Joi.number().integer().min(0).optional(),
  office_address: Joi.string().allow('', null).optional(),
  city: Joi.string().allow('', null).optional(),
  address: Joi.string().allow('', null).optional(),
  bio: Joi.string().allow('', null).optional(),
  profile_photo: Joi.string().allow('', null).optional(),
  availability_status: Joi.boolean().optional(),
  rate: Joi.number().min(0).optional(),
  is_verified: Joi.boolean().optional()
});

const updateLawyerSchema = Joi.object({
  full_name: Joi.string().min(2).max(100).optional(),
  phone: Joi.string().optional(),
  city: Joi.string().allow('', null).optional(),
  address: Joi.string().allow('', null).optional(),
  bio: Joi.string().allow('', null).optional(),
  profile_photo: Joi.string().allow('', null).optional(),
  specialization: Joi.string().optional(),
  years_of_experience: Joi.number().integer().min(0).optional(),
  office_address: Joi.string().allow('', null).optional(),
  availability_status: Joi.boolean().optional(),
  rate: Joi.number().min(0).optional()
});

const createCaseSchema = Joi.object({
  clientUserId: Joi.string().required(),
  title: Joi.string().min(3).max(200).required(),
  description: Joi.string().min(10).max(5000).required(),
  category: Joi.string().required(),
  budget: Joi.number().min(0).required(),
  city: Joi.string().allow('', null).optional(),
  status: Joi.string().valid('open', 'in_progress', 'completed', 'cancelled').optional()
});

const updateCaseSchema = Joi.object({
  title: Joi.string().min(3).max(200).optional(),
  description: Joi.string().min(10).max(5000).optional(),
  category: Joi.string().optional(),
  budget: Joi.number().min(0).optional(),
  city: Joi.string().allow('', null).optional(),
  status: Joi.string().valid('open', 'in_progress', 'completed', 'cancelled').optional()
});

const createCategorySchema = Joi.object({
  name: Joi.string().required(),
  description: Joi.string().allow('', null).optional(),
  icon: Joi.string().allow('', null).optional(),
  is_active: Joi.boolean().optional()
});

const updateCategorySchema = Joi.object({
  name: Joi.string().optional(),
  description: Joi.string().allow('', null).optional(),
  icon: Joi.string().allow('', null).optional(),
  is_active: Joi.boolean().optional()
});

const verifyLawyerSchema = Joi.object({
  verified: Joi.boolean().required()
});

const toggleUserActiveSchema = Joi.object({
  isActive: Joi.boolean().required()
});

module.exports = {
  createAdminSchema,
  createUserSchema,
  updateUserSchema,
  createLawyerSchema,
  updateLawyerSchema,
  createCaseSchema,
  updateCaseSchema,
  createCategorySchema,
  updateCategorySchema,
  verifyLawyerSchema,
  toggleUserActiveSchema
};
