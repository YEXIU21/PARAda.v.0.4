/**
 * Destination Routes
 */
const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const destinationController = require('../controllers/destination.controller');
const authMiddleware = require('../middleware/auth.middleware');

/**
 * @route GET /api/destinations
 * @desc Get all destinations
 * @access Public
 */
router.get('/', destinationController.getAllDestinations);

/**
 * @route GET /api/destinations/popular
 * @desc Get popular destinations
 * @access Public
 */
router.get('/popular', destinationController.getPopularDestinations);

/**
 * @route POST /api/destinations/nearby
 * @desc Get nearby destinations
 * @access Public
 */
router.post(
  '/nearby',
  [
    body('latitude').isNumeric().withMessage('Valid latitude is required'),
    body('longitude').isNumeric().withMessage('Valid longitude is required'),
    body('radius').optional().isNumeric().withMessage('Radius must be a number')
  ],
  destinationController.getNearbyDestinations
);

/**
 * @route GET /api/destinations/search
 * @desc Search destinations
 * @access Public
 */
router.get('/search', destinationController.searchDestinations);

/**
 * @route GET /api/destinations/:id
 * @desc Get destination by ID
 * @access Public
 */
router.get('/:id', destinationController.getDestinationById);

/**
 * @route POST /api/destinations
 * @desc Create a new destination
 * @access Private/Admin
 */
router.post(
  '/',
  [
    authMiddleware.verifyToken,
    authMiddleware.isAdmin,
    body('name').isString().withMessage('Name is required'),
    body('latitude').isNumeric().withMessage('Valid latitude is required'),
    body('longitude').isNumeric().withMessage('Valid longitude is required'),
    body('address').optional().isString().withMessage('Address must be a string'),
    body('description').optional().isString().withMessage('Description must be a string'),
    body('type').optional().isString().withMessage('Type must be a string'),
    body('image').optional().isString().withMessage('Image URL must be a string')
  ],
  destinationController.createDestination
);

/**
 * @route PUT /api/destinations/:id
 * @desc Update a destination
 * @access Private/Admin
 */
router.put(
  '/:id',
  [
    authMiddleware.verifyToken,
    authMiddleware.isAdmin,
    body('name').optional().isString().withMessage('Name must be a string'),
    body('latitude').optional().isNumeric().withMessage('Valid latitude is required'),
    body('longitude').optional().isNumeric().withMessage('Valid longitude is required'),
    body('address').optional().isString().withMessage('Address must be a string'),
    body('description').optional().isString().withMessage('Description must be a string'),
    body('type').optional().isString().withMessage('Type must be a string'),
    body('image').optional().isString().withMessage('Image URL must be a string')
  ],
  destinationController.updateDestination
);

/**
 * @route DELETE /api/destinations/:id
 * @desc Delete a destination
 * @access Private/Admin
 */
router.delete(
  '/:id',
  [
    authMiddleware.verifyToken,
    authMiddleware.isAdmin
  ],
  destinationController.deleteDestination
);

/**
 * @route PUT /api/destinations/:id/visit
 * @desc Increment visit count for a destination
 * @access Private
 */
router.put(
  '/:id/visit',
  [
    authMiddleware.verifyToken
  ],
  destinationController.incrementVisitCount
);

module.exports = router; 