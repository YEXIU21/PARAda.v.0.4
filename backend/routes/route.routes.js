/**
 * Route Routes
 */
const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const authMiddleware = require('../middleware/auth.middleware');

// Import controller (will create later)
const routeController = require('../controllers/route.controller');

/**
 * @route GET /api/routes
 * @desc Get all routes
 * @access Public
 */
router.get(
  '/',
  routeController.getRoutes
);

/**
 * @route GET /api/routes/:routeId
 * @desc Get route by ID
 * @access Public
 */
router.get(
  '/:routeId',
  routeController.getRouteById
);

/**
 * @route POST /api/routes
 * @desc Create a new route
 * @access Private/Admin
 */
router.post(
  '/',
  [
    authMiddleware.verifyToken,
    authMiddleware.isAdmin,
    body('name')
      .isString()
      .withMessage('Route name is required'),
    body('vehicleType')
      .isIn(['latransco', 'calvo', 'corominas', 'ceres', 'gabe', 'jeep'])
      .withMessage('Valid vehicle type is required'),
    body('stops')
      .isArray({ min: 2 })
      .withMessage('At least 2 stops are required'),
    body('fare')
      .optional()
      .isNumeric()
      .withMessage('Fare must be a number')
      .toFloat()
  ],
  routeController.createRoute
);

/**
 * @route PUT /api/routes/:routeId
 * @desc Update a route
 * @access Private/Admin
 */
router.put(
  '/:routeId',
  [
    authMiddleware.verifyToken,
    authMiddleware.isAdmin
  ],
  routeController.updateRoute
);

/**
 * @route DELETE /api/routes/:routeId
 * @desc Delete a route
 * @access Private/Admin
 */
router.delete(
  '/:routeId',
  [
    authMiddleware.verifyToken,
    authMiddleware.isAdmin
  ],
  routeController.deleteRoute
);

/**
 * @route PUT /api/routes/:routeId/drivers/:driverId
 * @desc Assign a driver to a route
 * @access Private/Admin
 */
router.put(
  '/:routeId/drivers/:driverId',
  [
    authMiddleware.verifyToken,
    authMiddleware.isAdmin
  ],
  routeController.assignDriverToRoute
);

/**
 * @route DELETE /api/routes/:routeId/drivers/:driverId
 * @desc Remove a driver from a route
 * @access Private/Admin
 */
router.delete(
  '/:routeId/drivers/:driverId',
  [
    authMiddleware.verifyToken,
    authMiddleware.isAdmin
  ],
  routeController.removeDriverFromRoute
);

module.exports = router; 