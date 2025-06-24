/**
 * Driver Routes
 */
const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const authMiddleware = require('../middleware/auth.middleware');

// Import controller (will create later)
const driverController = require('../controllers/driver.controller');

/**
 * @route GET /api/drivers
 * @desc Get all drivers
 * @access Public
 */
router.get(
  '/',
  driverController.getDrivers
);

/**
 * @route GET /api/drivers/profile
 * @desc Get current driver profile (from auth token)
 * @access Private/Driver
 */
router.get(
  '/profile',
  authMiddleware.verifyToken,
  authMiddleware.isDriver,
  driverController.getDriverProfile
);

/**
 * @route GET /api/drivers/routes
 * @desc Get routes assigned to the current driver
 * @access Private/Driver
 */
router.get(
  '/routes',
  authMiddleware.verifyToken,
  authMiddleware.isDriver,
  driverController.getDriverRoutes
);

/**
 * @route PUT /api/drivers/status
 * @desc Update current driver's status
 * @access Private/Driver
 */
router.put(
  '/status',
  [
    authMiddleware.verifyToken,
    authMiddleware.isDriver,
    body('status')
      .isIn(['active', 'offline', 'inactive'])
      .withMessage('Invalid status')
  ],
  driverController.updateCurrentDriverStatus
);

/**
 * @route PUT /api/drivers/location
 * @desc Update current driver's location
 * @access Private/Driver
 */
router.put(
  '/location',
  [
    authMiddleware.verifyToken,
    authMiddleware.isDriver,
    body('latitude')
      .isNumeric()
      .withMessage('Latitude must be a number'),
    body('longitude')
      .isNumeric()
      .withMessage('Longitude must be a number')
  ],
  driverController.updateCurrentDriverLocation
);

/**
 * @route GET /api/drivers/:driverId
 * @desc Get driver by ID
 * @access Public
 */
router.get(
  '/:driverId',
  driverController.getDriverById
);

/**
 * @route GET /api/drivers/user/:userId
 * @desc Get driver by user ID
 * @access Private
 */
router.get(
  '/user/:userId',
  authMiddleware.verifyToken,
  driverController.getDriverByUserId
);

/**
 * @route POST /api/drivers
 * @desc Create a new driver profile
 * @access Private/Admin
 */
router.post(
  '/',
  [
    authMiddleware.verifyToken,
    authMiddleware.isAdmin,
    body('userId')
      .isMongoId()
      .withMessage('Valid user ID is required'),
    body('routeNumber')
      .isString()
      .withMessage('Route number is required'),
    body('vehicleType')
      .isIn(['bus', 'jeep'])
      .withMessage('Valid vehicle type is required'),
    body('licensePlate')
      .isString()
      .withMessage('License plate is required')
  ],
  driverController.createDriver
);

/**
 * @route PUT /api/drivers/:driverId
 * @desc Update driver profile
 * @access Private
 */
router.put(
  '/:driverId',
  [
    authMiddleware.verifyToken,
    body('status')
      .optional()
      .isIn(['active', 'offline', 'inactive'])
      .withMessage('Invalid status')
  ],
  driverController.updateDriver
);

/**
 * @route PUT /api/drivers/:driverId/location
 * @desc Update driver location
 * @access Private/Driver
 */
router.put(
  '/:driverId/location',
  [
    authMiddleware.verifyToken,
    authMiddleware.isDriver,
    body('latitude')
      .isNumeric()
      .withMessage('Latitude must be a number'),
    body('longitude')
      .isNumeric()
      .withMessage('Longitude must be a number')
  ],
  driverController.updateDriverLocation
);

/**
 * @route PUT /api/drivers/:driverId/status
 * @desc Update driver status
 * @access Private/Driver
 */
router.put(
  '/:driverId/status',
  [
    authMiddleware.verifyToken,
    authMiddleware.isDriver,
    body('status')
      .isIn(['active', 'offline', 'inactive'])
      .withMessage('Invalid status')
  ],
  driverController.updateDriverStatus
);

/**
 * @route PUT /api/drivers/:driverId/verify
 * @desc Verify a driver (admin only)
 * @access Private/Admin
 */
router.put(
  '/:driverId/verify',
  [
    authMiddleware.verifyToken,
    authMiddleware.isAdmin,
    body('verified')
      .isBoolean()
      .withMessage('Verification status must be a boolean')
  ],
  driverController.verifyDriver
);

/**
 * @route POST /api/drivers/location
 * @desc Update driver location via HTTP fallback
 * @access Private/Driver
 */
router.post(
  '/location',
  [
    authMiddleware.verifyToken,
    authMiddleware.isDriver,
    body('location.latitude')
      .isNumeric()
      .withMessage('Latitude must be a number'),
    body('location.longitude')
      .isNumeric()
      .withMessage('Longitude must be a number'),
    body('driverId')
      .optional()
      .isMongoId()
      .withMessage('Valid driver ID is required')
  ],
  driverController.updateLocationViaHttp
);

/**
 * @route POST /api/drivers/:driverId/trip
 * @desc Update trip status for a driver
 * @access Private/Driver
 */
router.post(
  '/:driverId/trip',
  [
    authMiddleware.verifyToken,
    authMiddleware.isDriver,
    body('routeId')
      .isString()
      .withMessage('Route ID is required'),
    body('status')
      .isIn(['waiting', 'in_progress', 'completed', 'cancelled'])
      .withMessage('Valid status is required'),
    body('location')
      .optional()
      .isObject()
      .withMessage('Location must be an object')
  ],
  driverController.updateTripStatus
);

module.exports = router; 