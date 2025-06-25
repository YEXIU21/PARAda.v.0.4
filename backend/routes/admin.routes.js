/**
 * Admin Routes
 * Main router for admin-related routes
 */
const express = require('express');
const router = express.Router();
const { isAdmin } = require('../middleware/admin.middleware');
const adminSubscriptionPlansRoutes = require('./admin.subscription-plans.routes');
const adminStudentDiscountRoutes = require('./admin.student-discount.routes');
const authMiddleware = require('../middleware/auth.middleware');

// Import controller (will create later)
const adminController = require('../controllers/admin.controller');

// Apply admin middleware to all routes
router.use(isAdmin);

// Use specific route handlers
router.use('/subscription-plans', adminSubscriptionPlansRoutes);
router.use('/student-discount', adminStudentDiscountRoutes);

/**
 * @route GET /api/admin/dashboard
 * @desc Get admin dashboard data
 * @access Private/Admin
 */
router.get(
  '/dashboard',
  [
    authMiddleware.verifyToken,
    authMiddleware.isAdmin
  ],
  adminController.getDashboardData
);

/**
 * @route GET /api/admin/users
 * @desc Get all users with pagination
 * @access Private/Admin
 */
router.get(
  '/users',
  [
    authMiddleware.verifyToken,
    authMiddleware.isAdmin
  ],
  adminController.getUsers
);

/**
 * @route GET /api/admin/drivers
 * @desc Get all drivers with pagination
 * @access Private/Admin
 */
router.get(
  '/drivers',
  [
    authMiddleware.verifyToken,
    authMiddleware.isAdmin
  ],
  adminController.getDrivers
);

/**
 * @route GET /api/admin/rides
 * @desc Get all rides with pagination
 * @access Private/Admin
 */
router.get(
  '/rides',
  [
    authMiddleware.verifyToken,
    authMiddleware.isAdmin
  ],
  adminController.getRides
);

/**
 * @route GET /api/admin/subscriptions
 * @desc Get all subscriptions with pagination
 * @access Private/Admin
 */
router.get(
  '/subscriptions',
  [
    authMiddleware.verifyToken,
    authMiddleware.isAdmin
  ],
  adminController.getSubscriptions
);

/**
 * @route GET /api/admin/reports
 * @desc Get reports data
 * @access Private/Admin
 */
router.get(
  '/reports',
  [
    authMiddleware.verifyToken,
    authMiddleware.isAdmin
  ],
  adminController.getReports
);

/**
 * @route DELETE /api/admin/drivers/:driverId
 * @desc Remove a driver
 * @access Private/Admin
 */
router.delete(
  '/drivers/:driverId',
  [
    authMiddleware.verifyToken,
    authMiddleware.isAdmin
  ],
  adminController.removeDriver
);

/**
 * @route POST /api/admin/drivers/:driverId/verify
 * @desc Verify a driver
 * @access Private/Admin
 */
router.post(
  '/drivers/:driverId/verify',
  [
    authMiddleware.verifyToken,
    authMiddleware.isAdmin
  ],
  adminController.verifyDriver
);

module.exports = router; 