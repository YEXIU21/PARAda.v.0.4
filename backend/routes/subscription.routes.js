/**
 * Subscription Routes
 * Handles subscription-related API endpoints
 */
const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const authMiddleware = require('../middleware/auth.middleware');
const subscriptionController = require('../controllers/subscription.controller');

/**
 * @route GET /api/subscriptions/plans
 * @desc Get all subscription plans
 * @access Public
 */
router.get(
  '/plans',
  subscriptionController.getPlans
);

/**
 * @route GET /api/subscriptions/public-plans
 * @desc Get all subscription plans directly from database without auth
 * @access Public
 */
router.get(
  '/public-plans',
  subscriptionController.getPublicPlans
);

/**
 * @route POST /api/subscriptions
 * @desc Create a new subscription
 * @access Private
 */
router.post(
  '/',
  [
    authMiddleware.verifyToken,
    body(['plan', 'planId'])
      .optional()
      .isString()
      .notEmpty()
      .withMessage('Plan is required')
      .custom((value, { req }) => {
        // Either plan or planId must be provided
        if (!req.body.plan && !req.body.planId) {
          throw new Error('Either plan or planId is required');
        }
        return true;
      }),
    body('paymentMethod')
      .isString()
      .notEmpty()
      .withMessage('Payment method is required'),
    body('referenceNumber')
      .isString()
      .notEmpty()
      .withMessage('Reference number is required')
  ],
  subscriptionController.createSubscription
);

/**
 * @route POST /api/subscriptions/public-create
 * @desc Create a new subscription without authentication (for users on web version)
 * @access Public
 */
router.post(
  '/public-create',
  [
    body(['plan', 'planId'])
      .optional()
      .isString()
      .notEmpty()
      .withMessage('Plan is required')
      .custom((value, { req }) => {
        // Either plan or planId must be provided
        if (!req.body.plan && !req.body.planId) {
          throw new Error('Either plan or planId is required');
        }
        return true;
      }),
    body('paymentMethod')
      .isString()
      .notEmpty()
      .withMessage('Payment method is required'),
    body('referenceNumber')
      .isString()
      .notEmpty()
      .withMessage('Reference number is required'),
    body('username')
      .isString()
      .notEmpty()
      .withMessage('Username is required'),
    body('email')
      .isEmail()
      .withMessage('Valid email is required'),
    body('userId')
      .optional()
      .isString()
  ],
  subscriptionController.createPublicSubscription
);

/**
 * @route GET /api/subscriptions/user
 * @desc Get user's active subscription
 * @access Private
 */
router.get(
  '/user',
  authMiddleware.verifyToken,
  subscriptionController.getUserSubscription
);

/**
 * @route GET /api/subscriptions/me
 * @desc Get user's active subscription (legacy endpoint)
 * @access Private
 */
router.get(
  '/me',
  authMiddleware.verifyToken,
  subscriptionController.getUserSubscription
);

/**
 * @route GET /api/subscriptions
 * @desc Get user's subscriptions or all subscriptions (if admin)
 * @access Private
 */
router.get(
  '/',
  authMiddleware.verifyToken,
  (req, res, next) => {
    if (req.user.role === 'admin') {
      // If admin, get all subscriptions
      return subscriptionController.getAllSubscriptions(req, res, next);
    } else {
      // If regular user, get only their subscriptions
      return subscriptionController.getUserSubscriptions(req, res, next);
    }
  }
);

/**
 * @route GET /api/subscriptions/pending
 * @desc Get all pending subscriptions (admin only)
 * @access Private/Admin
 */
router.get(
  '/pending',
  [
    authMiddleware.verifyToken,
    authMiddleware.isAdmin
  ],
  subscriptionController.getPendingSubscriptions
);

/**
 * @route GET /api/subscriptions/:id
 * @desc Get subscription by ID
 * @access Private
 */
router.get(
  '/:id',
  authMiddleware.verifyToken,
  subscriptionController.getSubscriptionById
);

/**
 * @route DELETE /api/subscriptions/:id
 * @desc Cancel a subscription
 * @access Private
 */
router.delete(
  '/:id',
  authMiddleware.verifyToken,
  subscriptionController.cancelSubscription
);

/**
 * @route POST /api/subscriptions/verify
 * @desc Verify a subscription (admin only)
 * @access Private/Admin
 */
router.post(
  '/verify',
  [
    authMiddleware.verifyToken,
    authMiddleware.isAdmin,
    body('subscriptionId')
      .isString()
      .notEmpty()
      .withMessage('Subscription ID is required'),
    body('approved')
      .isBoolean()
      .withMessage('Approval status must be a boolean')
  ],
  subscriptionController.verifySubscription
);

/**
 * @route PUT /api/subscriptions/approve
 * @desc Approve subscription by user ID and reference number (admin only)
 * @access Private/Admin
 */
router.put(
  '/approve',
  [
    authMiddleware.verifyToken,
    authMiddleware.isAdmin,
    body('userId')
      .isString()
      .notEmpty()
      .withMessage('User ID is required'),
    body('referenceNumber')
      .isString()
      .notEmpty()
      .withMessage('Reference number is required')
  ],
  subscriptionController.approveSubscriptionByReference
);

/**
 * @route GET /api/subscriptions/admin/pending
 * @desc Get all pending subscriptions (admin only) - alternative route for debugging
 * @access Private/Admin
 */
router.get(
  '/admin/pending',
  [
    authMiddleware.verifyToken,
    authMiddleware.isAdmin
  ],
  async (req, res) => {
    try {
      console.log('Admin pending subscriptions debug route accessed');
      
      // Get the Subscription model
      const Subscription = require('../models/subscription.model');
      
      // Find all subscriptions with pending status
      const pendingSubscriptions = await Subscription.find({
        'verification.status': 'pending',
        'verification.verified': false,
        isActive: false
      }).populate('userId', 'username email accountType');
      
      console.log(`Found ${pendingSubscriptions.length} pending subscriptions directly`);
      
      // Log the first subscription if available
      if (pendingSubscriptions.length > 0) {
        console.log('First pending subscription:', {
          id: pendingSubscriptions[0]._id,
          userId: pendingSubscriptions[0].userId,
          status: pendingSubscriptions[0].verification?.status,
          verified: pendingSubscriptions[0].verification?.verified,
          isActive: pendingSubscriptions[0].isActive
        });
      }
      
      return res.status(200).json({
        subscriptions: pendingSubscriptions,
        count: pendingSubscriptions.length
      });
    } catch (error) {
      console.error('Error in admin/pending route:', error);
      return res.status(500).json({
        message: 'Error getting pending subscriptions',
        error: error.message
      });
    }
  }
);

module.exports = router;
