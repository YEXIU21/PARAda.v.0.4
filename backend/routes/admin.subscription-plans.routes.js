/**
 * Admin Subscription Plans Routes
 * Handles API endpoints for managing subscription plans
 */
const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const authMiddleware = require('../middleware/auth.middleware');
const adminMiddleware = require('../middleware/admin.middleware');
const subscriptionPlanController = require('../controllers/subscription-plan.controller');

/**
 * @route GET /api/admin/subscription-plans
 * @desc Get all subscription plans
 * @access Admin only
 */
router.get(
  '/',
  [authMiddleware, adminMiddleware],
  subscriptionPlanController.getAllPlans
);

/**
 * @route GET /api/admin/subscription-plans/:id
 * @desc Get subscription plan by ID
 * @access Admin only
 */
router.get(
  '/:id',
  [authMiddleware, adminMiddleware],
  subscriptionPlanController.getPlanById
);

/**
 * @route POST /api/admin/subscription-plans
 * @desc Create a new subscription plan
 * @access Admin only
 */
router.post(
  '/',
  [
    authMiddleware,
    adminMiddleware,
    body('id').notEmpty().withMessage('Plan ID is required'),
    body('name').notEmpty().withMessage('Plan name is required'),
    body('price').isNumeric().withMessage('Price must be a number'),
    body('duration').isNumeric().withMessage('Duration must be a number'),
    body('features').isArray().withMessage('Features must be an array')
  ],
  subscriptionPlanController.createPlan
);

/**
 * @route PUT /api/admin/subscription-plans/:id
 * @desc Update a subscription plan
 * @access Admin only
 */
router.put(
  '/:id',
  [
    authMiddleware,
    adminMiddleware,
    body('name').notEmpty().withMessage('Plan name is required'),
    body('price').isNumeric().withMessage('Price must be a number'),
    body('duration').isNumeric().withMessage('Duration must be a number'),
    body('features').isArray().withMessage('Features must be an array')
  ],
  subscriptionPlanController.updatePlan
);

/**
 * @route DELETE /api/admin/subscription-plans/:id
 * @desc Delete a subscription plan
 * @access Admin only
 */
router.delete(
  '/:id',
  [authMiddleware, adminMiddleware],
  subscriptionPlanController.deletePlan
);

module.exports = router; 