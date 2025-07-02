/**
 * Authentication Routes
 */
const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const authMiddleware = require('../middleware/auth.middleware');

/**
 * @route POST /api/auth/register
 * @desc Register a new user
 * @access Public
 */
router.post(
  '/register',
  [
    body('username')
      .isLength({ min: 3, max: 50 })
      .withMessage('Username must be between 3 and 50 characters'),
    body('email')
      .isEmail()
      .withMessage('Please provide a valid email'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters'),
    body('role')
      .optional()
      .isIn(['admin', 'driver', 'passenger'])
      .withMessage('Invalid role'),
    body('accountType')
      .optional()
      .isIn(['regular', 'student'])
      .withMessage('Invalid account type')
  ],
  authController.register
);

/**
 * @route POST /api/auth/login
 * @desc Login user and return JWT token
 * @access Public
 */
router.post(
  '/login',
  [
    body('email')
      .isEmail()
      .withMessage('Please provide a valid email'),
    body('password')
      .exists()
      .withMessage('Password is required')
  ],
  authController.login
);

/**
 * @route GET /api/auth/me
 * @desc Get current user profile
 * @access Private
 */
router.get(
  '/me',
  authMiddleware.verifyToken,
  authController.getCurrentUser
);

/**
 * @route POST /api/auth/verify
 * @desc Verify JWT token
 * @access Public
 */
router.post(
  '/verify',
  authController.verifyToken
);

/**
 * @route POST /api/auth/reset-password-request
 * @desc Request password reset
 * @access Public
 */
router.post(
  '/reset-password-request',
  [
    body('email')
      .isEmail()
      .withMessage('Please provide a valid email')
  ],
  authController.requestPasswordReset
);

/**
 * @route POST /api/auth/reset-password
 * @desc Reset password with token
 * @access Public
 */
router.post(
  '/reset-password',
  [
    body('token')
      .exists()
      .withMessage('Token is required'),
    body('newPassword')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters')
  ],
  authController.resetPassword
);

/**
 * @route GET /api/auth/profile
 * @desc Get the current user's profile including subscription status
 * @access Private
 */
router.get(
  '/profile',
  [authMiddleware.verifyToken],
  authController.getUserProfile
);

/**
 * @route POST /api/auth/change-password
 * @desc Change user password
 * @access Private
 */
router.post(
  '/change-password',
  [
    authMiddleware.verifyToken,
    body('currentPassword')
      .exists()
      .withMessage('Current password is required'),
    body('newPassword')
      .isLength({ min: 6 })
      .withMessage('New password must be at least 6 characters')
  ],
  authController.changePassword
);

module.exports = router; 