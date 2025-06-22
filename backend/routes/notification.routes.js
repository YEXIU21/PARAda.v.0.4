/**
 * Notification Routes
 * Defines API endpoints for notification operations
 */
const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const notificationController = require('../controllers/notification.controller');
const authMiddleware = require('../middleware/auth.middleware');

/**
 * @route   GET /api/notifications
 * @desc    Get user notifications
 * @access  Private
 */
router.get(
  '/',
  authMiddleware.verifyToken,
  notificationController.getUserNotifications
);

/**
 * @route   GET /api/notifications/unread-count
 * @desc    Get unread notification count
 * @access  Private
 */
router.get(
  '/unread-count',
  authMiddleware.verifyToken,
  notificationController.getUnreadCount
);

/**
 * @route   PUT /api/notifications/:notificationId/read
 * @desc    Mark a notification as read
 * @access  Private
 */
router.put(
  '/:notificationId/read',
  authMiddleware.verifyToken,
  notificationController.markAsRead
);

/**
 * @route   PUT /api/notifications/read-all
 * @desc    Mark all notifications as read
 * @access  Private
 */
router.put(
  '/read-all',
  authMiddleware.verifyToken,
  notificationController.markAllAsRead
);

/**
 * @route   DELETE /api/notifications/:notificationId
 * @desc    Delete a notification
 * @access  Private
 */
router.delete(
  '/:notificationId',
  authMiddleware.verifyToken,
  notificationController.deleteNotification
);

/**
 * @route   DELETE /api/notifications
 * @desc    Delete all notifications
 * @access  Private
 */
router.delete(
  '/',
  authMiddleware.verifyToken,
  notificationController.deleteAllNotifications
);

/**
 * @route   POST /api/notifications
 * @desc    Create a notification (admin only)
 * @access  Private/Admin
 */
router.post(
  '/',
  [
    authMiddleware.verifyToken,
    authMiddleware.isAdmin,
    check('title', 'Title is required').not().isEmpty(),
    check('message', 'Message is required').not().isEmpty()
  ],
  notificationController.createNotification
);

/**
 * @route   POST /api/notifications/system
 * @desc    Send a system notification to all users or specific roles (admin only)
 * @access  Private/Admin
 */
router.post(
  '/system',
  [
    authMiddleware.verifyToken,
    authMiddleware.isAdmin,
    check('title', 'Title is required').not().isEmpty(),
    check('message', 'Message is required').not().isEmpty()
  ],
  notificationController.sendSystemNotification
);

/**
 * @route   POST /api/notifications/push
 * @desc    Send a push notification to all users (admin only)
 * @access  Private/Admin
 */
router.post(
  '/push',
  [
    authMiddleware.verifyToken,
    authMiddleware.isAdmin,
    check('title', 'Title is required').not().isEmpty(),
    check('message', 'Message is required').not().isEmpty()
  ],
  notificationController.sendPushNotificationToAll
);

/**
 * @route   POST /api/notifications/push/:userId
 * @desc    Send a push notification to a specific user (admin only)
 * @access  Private/Admin
 */
router.post(
  '/push/:userId',
  [
    authMiddleware.verifyToken,
    authMiddleware.isAdmin,
    check('title', 'Title is required').not().isEmpty(),
    check('message', 'Message is required').not().isEmpty()
  ],
  notificationController.sendPushNotificationToUser
);

module.exports = router; 