/**
 * Admin Routes
 * Main router for admin-related routes
 */
const express = require('express');
const router = express.Router();
const adminMiddleware = require('../middleware/admin.middleware');
const adminSubscriptionPlansRoutes = require('./admin.subscription-plans.routes');
const adminStudentDiscountRoutes = require('./admin.student-discount.routes');
const authMiddleware = require('../middleware/auth.middleware');

// Import controller (will create later)
const adminController = require('../controllers/admin.controller');

// Apply auth middleware to all routes
router.use(authMiddleware.verifyToken);

// Apply admin middleware to all routes
router.use(adminMiddleware);

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
  adminController.getDashboardData
);

/**
 * @route GET /api/admin/users
 * @desc Get all users with pagination
 * @access Private/Admin
 */
router.get(
  '/users',
  adminController.getUsers
);

/**
 * @route GET /api/admin/drivers
 * @desc Get all drivers with pagination
 * @access Private/Admin
 */
router.get(
  '/drivers',
  adminController.getDrivers
);

/**
 * @route GET /api/admin/rides
 * @desc Get all rides with pagination
 * @access Private/Admin
 */
router.get(
  '/rides',
  adminController.getRides
);

/**
 * @route GET /api/admin/subscriptions
 * @desc Get all subscriptions with pagination
 * @access Private/Admin
 */
router.get(
  '/subscriptions',
  adminController.getSubscriptions
);

/**
 * @route GET /api/admin/reports
 * @desc Get reports data
 * @access Private/Admin
 */
router.get(
  '/reports',
  adminController.getReports
);

/**
 * @route DELETE /api/admin/drivers/:driverId
 * @desc Remove a driver
 * @access Private/Admin
 */
router.delete(
  '/drivers/:driverId',
  adminController.removeDriver
);

/**
 * @route POST /api/admin/drivers/:driverId/verify
 * @desc Verify a driver
 * @access Private/Admin
 */
router.post(
  '/drivers/:driverId/verify',
  adminController.verifyDriver
);

module.exports = router; 