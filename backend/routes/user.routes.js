/**
 * User Routes
 */
const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const authMiddleware = require('../middleware/auth.middleware');

// Import controller (will create later)
const userController = require('../controllers/user.controller');

/**
 * @route GET /api/users
 * @desc Get all users (admin only)
 * @access Private/Admin
 */
router.get(
  '/',
  [
    authMiddleware.verifyToken,
    authMiddleware.isAdmin
  ],
  userController.getUsers
);

/**
 * @route GET /api/users/:userId
 * @desc Get user by ID
 * @access Private
 */
router.get(
  '/:userId',
  [
    authMiddleware.verifyToken
  ],
  userController.getUserById
);

/**
 * @route PUT /api/users/:userId
 * @desc Update user
 * @access Private
 */
router.put(
  '/:userId',
  [
    authMiddleware.verifyToken,
    body('username')
      .optional()
      .isLength({ min: 3, max: 50 })
      .withMessage('Username must be between 3 and 50 characters'),
    body('email')
      .optional()
      .isEmail()
      .withMessage('Please provide a valid email'),
    body('profilePicture')
      .optional()
      .isURL()
      .withMessage('Profile picture must be a valid URL')
  ],
  userController.updateUser
);

/**
 * @route DELETE /api/users/:userId
 * @desc Delete user (admin only)
 * @access Private/Admin
 */
router.delete(
  '/:userId',
  [
    authMiddleware.verifyToken,
    authMiddleware.isAdmin
  ],
  userController.deleteUser
);

/**
 * @route POST /api/users/push-token
 * @desc Register push notification token
 * @access Private
 */
router.post(
  '/push-token',
  [
    authMiddleware.verifyToken,
    body('token')
      .isString()
      .withMessage('Token is required')
  ],
  userController.registerPushToken
);

/**
 * @route PUT /api/users/:userId/password
 * @desc Change user password
 * @access Private
 */
router.put(
  '/:userId/password',
  [
    authMiddleware.verifyToken,
    body('currentPassword')
      .exists()
      .withMessage('Current password is required'),
    body('newPassword')
      .isLength({ min: 6 })
      .withMessage('New password must be at least 6 characters')
  ],
  userController.changePassword
);

/**
 * @route PUT /api/users/:userId/role
 * @desc Change user role (admin only)
 * @access Private/Admin
 */
router.put(
  '/:userId/role',
  [
    authMiddleware.verifyToken,
    authMiddleware.isAdmin,
    body('role')
      .isIn(['admin', 'driver', 'passenger'])
      .withMessage('Invalid role')
  ],
  userController.changeUserRole
);

module.exports = router; 