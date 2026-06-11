const Joi = require('joi');

const createUserSchema = Joi.object({
  full_name: Joi.string().min(2).max(100).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).max(100).required(),
  phone: Joi.string().required(),
  role: Joi.string().valid('client', 'lawyer', 'admin', 'superadmin').optional(),
  city: Joi.string().allow('', null),
  address: Joi.string().allow('', null),
  bio: Joi.string().allow('', null),
  profile_photo: Joi.string().allow('', null),
  is_verified: Joi.boolean().empty('').optional(),
  is_banned: Joi.boolean().empty('').optional(),
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
  role: Joi.string().valid('client', 'lawyer', 'admin', 'superadmin').optional(),
  is_verified: Joi.boolean().empty('').optional(),
  is_banned: Joi.boolean().empty('').optional()
});

const createClientSchema = Joi.object({
  full_name: Joi.string().min(2).max(100).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).max(100).required(),
  phone: Joi.string().required(),
  city: Joi.string().allow('', null),
  address: Joi.string().allow('', null),
  bio: Joi.string().allow('', null),
  profile_photo: Joi.string().allow('', null),
  is_verified: Joi.boolean().empty('').optional()
});

const updateClientSchema = Joi.object({
  full_name: Joi.string().min(2).max(100).optional(),
  phone: Joi.string().optional(),
  city: Joi.string().allow('', null).optional(),
  address: Joi.string().allow('', null).optional(),
  bio: Joi.string().allow('', null).optional(),
  profile_photo: Joi.string().allow('', null).optional()
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
  availability_status: Joi.boolean().empty('').optional(),
  rate: Joi.number().min(0).optional(),
  is_verified: Joi.boolean().empty('').optional()
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
  availability_status: Joi.boolean().empty('').optional(),
  rate: Joi.number().min(0).optional()
});

const createCaseSchema = Joi.object({
  title: Joi.string().min(3).max(200).required(),
  description: Joi.string().min(10).max(5000).required(),
  category: Joi.string().required(),
  budget: Joi.number().min(0).required(),
  city: Joi.string().allow('', null).optional(),
  priority: Joi.string().valid('low', 'medium', 'high', 'urgent').optional(),
  status: Joi.string().valid('open', 'in_progress', 'pending_payment', 'completed', 'cancelled', 'disputed').optional()
});

const updateCaseSchema = Joi.object({
  title: Joi.string().min(3).max(200).optional(),
  description: Joi.string().min(10).max(5000).optional(),
  category: Joi.string().optional(),
  budget: Joi.number().min(0).optional(),
  city: Joi.string().allow('', null).optional(),
  priority: Joi.string().valid('low', 'medium', 'high', 'urgent').optional(),
  status: Joi.string().valid('open', 'in_progress', 'pending_payment', 'completed', 'cancelled', 'disputed').optional()
});

const createOfferSchema = Joi.object({
  case: Joi.string().required(),
  price: Joi.number().min(0).required(),
  message: Joi.string().max(2000).optional(),
  delivery_time: Joi.number().integer().min(1).optional()
});

const updateOfferSchema = Joi.object({
  price: Joi.number().min(0).optional(),
  message: Joi.string().max(2000).optional(),
  delivery_time: Joi.number().integer().min(1).optional(),
  status: Joi.string().valid('pending', 'accepted', 'rejected', 'expired', 'withdrawn').optional()
});

const createCategorySchema = Joi.object({
  name: Joi.string().required(),
  description: Joi.string().allow('', null).optional(),
  icon: Joi.string().allow('', null).optional(),
  isActive: Joi.boolean().empty('').optional()
});

const updateCategorySchema = Joi.object({
  name: Joi.string().optional(),
  description: Joi.string().allow('', null).optional(),
  icon: Joi.string().allow('', null).optional(),
  isActive: Joi.boolean().empty('').optional()
});

const verifyLawyerSchema = Joi.object({
  verified: Joi.boolean().required()
});

const changeRoleSchema = Joi.object({
  newRole: Joi.string().valid('client', 'lawyer', 'admin').required()
});

const banUserSchema = Joi.object({
  banned: Joi.boolean().required()
});

module.exports = {
  createUserSchema,
  updateUserSchema,
  createClientSchema,
  updateClientSchema,
  createLawyerSchema,
  updateLawyerSchema,
  createCaseSchema,
  updateCaseSchema,
  createOfferSchema,
  updateOfferSchema,
  createCategorySchema,
  updateCategorySchema,
  verifyLawyerSchema,
  changeRoleSchema,
  banUserSchema
};
