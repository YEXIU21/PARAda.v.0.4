/**
 * MongoDB Routes
 * Direct MongoDB operations for the frontend
 */
const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const mongodbController = require('../controllers/mongodb.controller');
const authMiddleware = require('../middleware/auth.middleware');

/**
 * @route POST /api/mongodb/query
 * @desc Execute a MongoDB query
 * @access Private
 */
router.post(
  '/query',
  [
    authMiddleware.verifyToken,
    body('collection')
      .isString()
      .notEmpty()
      .withMessage('Collection name is required'),
    body('query')
      .isObject()
      .withMessage('Query must be an object')
  ],
  mongodbController.query
);

/**
 * @route POST /api/mongodb/insert
 * @desc Insert a document into MongoDB
 * @access Private
 */
router.post(
  '/insert',
  [
    authMiddleware.verifyToken,
    body('collection')
      .isString()
      .notEmpty()
      .withMessage('Collection name is required'),
    body('document')
      .isObject()
      .withMessage('Document must be an object')
  ],
  mongodbController.insert
);

/**
 * @route POST /api/mongodb/update
 * @desc Update a document in MongoDB
 * @access Private
 */
router.post(
  '/update',
  [
    authMiddleware.verifyToken,
    body('collection')
      .isString()
      .notEmpty()
      .withMessage('Collection name is required'),
    body('query')
      .isObject()
      .withMessage('Query must be an object'),
    body('update')
      .isObject()
      .withMessage('Update must be an object')
  ],
  mongodbController.update
);

/**
 * @route POST /api/mongodb/delete
 * @desc Delete a document from MongoDB
 * @access Private
 */
router.post(
  '/delete',
  [
    authMiddleware.verifyToken,
    body('collection')
      .isString()
      .notEmpty()
      .withMessage('Collection name is required'),
    body('query')
      .isObject()
      .withMessage('Query must be an object')
  ],
  mongodbController.delete
);

module.exports = router; 