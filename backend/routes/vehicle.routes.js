/**
 * Vehicle Routes
 */
const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const vehicleController = require('../controllers/vehicle.controller');
const authMiddleware = require('../middleware/auth.middleware');

/**
 * @route GET /api/vehicles
 * @desc Get all vehicles
 * @access Private/Admin
 */
router.get(
  '/',
  [
    authMiddleware.verifyToken,
    authMiddleware.isAdmin
  ],
  vehicleController.getAllVehicles
);

/**
 * @route POST /api/vehicles/nearby
 * @desc Get nearby vehicles
 * @access Public
 */
router.post(
  '/nearby',
  [
    body('latitude').isNumeric().withMessage('Valid latitude is required'),
    body('longitude').isNumeric().withMessage('Valid longitude is required'),
    body('radius').optional().isNumeric().withMessage('Radius must be a number'),
    body('type').optional().isString().withMessage('Type must be a string')
  ],
  vehicleController.getNearbyVehicles
);

/**
 * @route GET /api/vehicles/:id
 * @desc Get vehicle by ID
 * @access Private/Admin
 */
router.get(
  '/:id',
  [
    authMiddleware.verifyToken,
    authMiddleware.isAdmin
  ],
  vehicleController.getVehicleById
);

/**
 * @route POST /api/vehicles
 * @desc Create a new vehicle
 * @access Private/Admin
 */
router.post(
  '/',
  [
    authMiddleware.verifyToken,
    authMiddleware.isAdmin,
    body('type')
      .isIn(['latransco', 'calvo', 'corominas', 'ceres', 'gabe', 'jeep'])
      .withMessage('Valid vehicle type is required'),
    body('plateNumber').isString().withMessage('Plate number is required'),
    body('capacity').optional().isNumeric().withMessage('Capacity must be a number'),
    body('driverId').optional().isMongoId().withMessage('Valid driver ID is required'),
    body('routeId').optional().isMongoId().withMessage('Valid route ID is required'),
    body('features').optional().isObject().withMessage('Features must be an object')
  ],
  vehicleController.createVehicle
);

/**
 * @route PUT /api/vehicles/:id
 * @desc Update a vehicle
 * @access Private/Admin
 */
router.put(
  '/:id',
  [
    authMiddleware.verifyToken,
    authMiddleware.isAdmin,
    body('type')
      .optional()
      .isIn(['latransco', 'calvo', 'corominas', 'ceres', 'gabe', 'jeep'])
      .withMessage('Valid vehicle type is required'),
    body('plateNumber').optional().isString().withMessage('Plate number must be a string'),
    body('capacity').optional().isNumeric().withMessage('Capacity must be a number'),
    body('driverId').optional().custom(value => {
      if (value === null) return true;
      return typeof value === 'string' && /^[0-9a-fA-F]{24}$/.test(value);
    }).withMessage('Driver ID must be a valid MongoDB ID or null'),
    body('routeId').optional().isMongoId().withMessage('Valid route ID is required'),
    body('features').optional().isObject().withMessage('Features must be an object'),
    body('status')
      .optional()
      .isIn(['available', 'busy', 'offline', 'maintenance'])
      .withMessage('Valid status is required')
  ],
  vehicleController.updateVehicle
);

/**
 * @route PUT /api/vehicles/:id/location
 * @desc Update vehicle location
 * @access Private
 */
router.put(
  '/:id/location',
  [
    authMiddleware.verifyToken,
    body('latitude').isNumeric().withMessage('Valid latitude is required'),
    body('longitude').isNumeric().withMessage('Valid longitude is required')
  ],
  vehicleController.updateVehicleLocation
);

/**
 * @route PUT /api/vehicles/:id/status
 * @desc Update vehicle status
 * @access Private
 */
router.put(
  '/:id/status',
  [
    authMiddleware.verifyToken,
    body('status')
      .isIn(['available', 'busy', 'offline', 'maintenance'])
      .withMessage('Valid status is required')
  ],
  vehicleController.updateVehicleStatus
);

/**
 * @route DELETE /api/vehicles/:id
 * @desc Delete a vehicle
 * @access Private/Admin
 */
router.delete(
  '/:id',
  [
    authMiddleware.verifyToken,
    authMiddleware.isAdmin
  ],
  vehicleController.deleteVehicle
);

module.exports = router; 