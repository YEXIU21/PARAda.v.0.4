/**
 * Ride Routes
 * Handles routes for ride requests, assignments, and status updates
 */
const express = require('express');
const router = express.Router();
const { body, param } = require('express-validator');
const rideController = require('../controllers/ride.controller');
const authMiddleware = require('../middleware/auth.middleware');

// Apply auth middleware to all routes
router.use(authMiddleware.verifyToken);

/**
 * @route POST /api/rides
 * @desc Request a new ride
 * @access Private
 */
router.post(
  '/',
  [
    body('pickupLocation').isObject().withMessage('Pickup location is required'),
    body('pickupLocation.latitude').isNumeric().withMessage('Valid latitude is required'),
    body('pickupLocation.longitude').isNumeric().withMessage('Valid longitude is required'),
    body('destination').isObject().withMessage('Destination is required'),
    body('destination.latitude').isNumeric().withMessage('Valid latitude is required'),
    body('destination.longitude').isNumeric().withMessage('Valid longitude is required'),
    body('vehicleType').isString().withMessage('Vehicle type is required'),
    body('routeId').optional().isMongoId().withMessage('Valid route ID is required')
  ],
  rideController.requestRide
);

/**
 * @route GET /api/rides/history
 * @desc Get user's ride history
 * @access Private
 */
router.get('/history', rideController.getUserRideHistory);

/**
 * @route GET /api/rides/driver/:driverId/active
 * @desc Get driver's active rides
 * @access Private
 */
router.get(
  '/driver/:driverId/active',
  [
    param('driverId').isMongoId().withMessage('Valid driver ID is required')
  ],
  rideController.getDriverActiveRides
);

/**
 * @route PUT /api/rides/:rideId/assign
 * @desc Assign a driver to a ride
 * @access Private (Admin or Driver)
 */
router.put(
  '/:rideId/assign',
  [
    param('rideId').isMongoId().withMessage('Valid ride ID is required'),
    body('driverId').isMongoId().withMessage('Valid driver ID is required'),
    authMiddleware.isAdminOrDriver
  ],
  rideController.assignDriver
);

/**
 * @route PUT /api/rides/:rideId/status
 * @desc Update ride status
 * @access Private
 */
router.put(
  '/:rideId/status',
  [
    param('rideId').isMongoId().withMessage('Valid ride ID is required'),
    body('status').isIn(['picked_up', 'completed', 'cancelled']).withMessage('Valid status is required'),
    body('reason').optional().isString().withMessage('Reason must be a string'),
    body('rating').optional().isFloat({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
    body('feedback').optional().isString().withMessage('Feedback must be a string')
  ],
  rideController.updateRideStatus
);

/**
 * @route PUT /api/rides/:rideId/rate
 * @desc Rate a completed ride
 * @access Private
 */
router.put(
  '/:rideId/rate',
  [
    param('rideId').isMongoId().withMessage('Valid ride ID is required'),
    body('rating').isFloat({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
    body('feedback').optional().isString().withMessage('Feedback must be a string')
  ],
  rideController.rateRide
);

/**
 * @route GET /api/rides/:rideId
 * @desc Get ride by ID
 * @access Private
 */
router.get(
  '/:rideId',
  [
    param('rideId').isMongoId().withMessage('Valid ride ID is required')
  ],
  rideController.getRideById
);

/**
 * @route POST /api/rides/nearby-drivers
 * @desc Get nearby available drivers
 * @access Private
 */
router.post(
  '/nearby-drivers',
  [
    body('location').isObject().withMessage('Location is required'),
    body('location.latitude').isNumeric().withMessage('Valid latitude is required'),
    body('location.longitude').isNumeric().withMessage('Valid longitude is required')
  ],
  rideController.getNearbyDrivers
);

/**
 * @route PUT /api/rides/driver/:driverId/location
 * @desc Update driver location
 * @access Private (Driver only)
 */
router.put(
  '/driver/:driverId/location',
  [
    param('driverId').isMongoId().withMessage('Valid driver ID is required'),
    body('latitude').isNumeric().withMessage('Valid latitude is required'),
    body('longitude').isNumeric().withMessage('Valid longitude is required'),
    body('rideId').optional().isMongoId().withMessage('Valid ride ID is required'),
    authMiddleware.isAdminOrDriver
  ],
  rideController.updateDriverLocation
);

module.exports = router; 