/**
 * Installation Routes
 */
const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const authMiddleware = require('../middleware/auth.middleware');
const installationController = require('../controllers/installation.controller');

/**
 * @route POST /api/installations
 * @desc Track a new installation
 * @access Public
 */
router.post(
  '/',
  [
    body('platform')
      .isIn(['ios', 'android', 'web', 'pwa'])
      .withMessage('Valid platform is required (ios, android, web, pwa)'),
    body('deviceId')
      .optional()
      .isString()
      .withMessage('Device ID must be a string'),
    body('deviceInfo')
      .optional()
      .isObject()
      .withMessage('Device info must be an object')
  ],
  installationController.trackInstallation
);

/**
 * @route GET /api/installations/stats
 * @desc Get installation statistics
 * @access Private/Admin
 */
router.get(
  '/stats',
  [
    authMiddleware.verifyToken,
    authMiddleware.isAdmin
  ],
  installationController.getInstallationStats
);

/**
 * @route GET /api/installations/count
 * @desc Get public installation count
 * @access Public
 */
router.get(
  '/count',
  installationController.getPublicInstallationCount
);

module.exports = router; 