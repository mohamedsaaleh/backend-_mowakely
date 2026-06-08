const express = require('express');
const router = express.Router();
const superadminController = require('./superadmin.controller');
const { authenticate } = require('../../middlewares/auth.middleware');
const { authorize } = require('../../middlewares/role.middleware');
const { validate } = require('../../middlewares/validate.middleware');
const {
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
} = require('./superadmin.validation');

router.use(authenticate, authorize('superadmin'));

// ==================== DASHBOARD ====================
router.get('/dashboard', superadminController.getDashboard);
router.get('/statistics', superadminController.getStatistics);
router.get('/analytics', superadminController.getAnalytics);

// ==================== USERS ====================
router.get('/users', superadminController.getAllUsers);
router.get('/users/:id', superadminController.getUserById);
router.post('/users', validate(createUserSchema), superadminController.createUser);
router.put('/users/:id', validate(updateUserSchema), superadminController.updateUser);
router.delete('/users/:id', superadminController.deleteUser);
router.patch('/users/:id/ban', validate(banUserSchema), superadminController.banUser);
router.patch('/users/:id/unban', superadminController.unbanUser);

// ==================== CLIENTS ====================
router.get('/clients', superadminController.getAllClients);
router.get('/clients/:id', superadminController.getClientById);
router.post('/clients', validate(createClientSchema), superadminController.createClient);
router.put('/clients/:id', validate(updateClientSchema), superadminController.updateClient);
router.delete('/clients/:id', superadminController.deleteClient);

// ==================== LAWYERS ====================
router.get('/lawyers', superadminController.getAllLawyers);
router.get('/lawyers/:id', superadminController.getLawyerById);
router.post('/lawyers', validate(createLawyerSchema), superadminController.createLawyer);
router.put('/lawyers/:id', validate(updateLawyerSchema), superadminController.updateLawyer);
router.delete('/lawyers/:id', superadminController.deleteLawyer);
router.patch('/lawyers/:id/verify', validate(verifyLawyerSchema), superadminController.verifyLawyer);
router.patch('/lawyers/:id/unverify', superadminController.unverifyLawyer);

// ==================== CASES ====================
router.get('/cases', superadminController.getAllCases);
router.get('/cases/:id', superadminController.getCaseById);
router.post('/cases', validate(createCaseSchema), superadminController.createCase);
router.put('/cases/:id', validate(updateCaseSchema), superadminController.updateCase);
router.delete('/cases/:id', superadminController.deleteCase);
router.patch('/cases/:id/status', superadminController.updateCaseStatus);

// ==================== OFFERS ====================
router.get('/offers', superadminController.getAllOffers);
router.get('/offers/:id', superadminController.getOfferById);
router.post('/offers', validate(createOfferSchema), superadminController.createOffer);
router.put('/offers/:id', validate(updateOfferSchema), superadminController.updateOffer);
router.delete('/offers/:id', superadminController.deleteOffer);

// ==================== CATEGORIES ====================
router.get('/categories', superadminController.getAllCategories);
router.get('/categories/:id', superadminController.getCategoryById);
router.post('/categories', validate(createCategorySchema), superadminController.createCategory);
router.put('/categories/:id', validate(updateCategorySchema), superadminController.updateCategory);
router.delete('/categories/:id', superadminController.deleteCategory);

// ==================== REVIEWS ====================
router.get('/reviews', superadminController.getAllReviews);
router.get('/reviews/:id', superadminController.getReviewById);
router.patch('/reviews/:id/hide', superadminController.hideReview);
router.patch('/reviews/:id/publish', superadminController.publishReview);
router.delete('/reviews/:id', superadminController.deleteReview);

// ==================== ADMIN MANAGEMENT ====================
router.get('/admins', superadminController.getAllAdmins);
router.post('/create-admin', validate(createUserSchema), superadminController.createAdmin);
router.delete('/admin/:id', superadminController.deleteAdmin);
router.patch('/change-role/:id', validate(changeRoleSchema), superadminController.changeRole);

module.exports = router;
