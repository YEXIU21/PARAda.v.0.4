/**
 * Message Routes
 * Defines API endpoints for direct messaging operations
 */
const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const messageController = require('../controllers/message.controller');
const authMiddleware = require('../middleware/auth.middleware');

/**
 * @route   POST /api/messages
 * @desc    Send a direct message to a user
 * @access  Private
 */
router.post(
  '/',
  [
    authMiddleware.verifyToken,
    check('recipientId', 'Recipient ID is required').not().isEmpty(),
    check('message', 'Message content is required').not().isEmpty()
  ],
  messageController.sendMessage
);

/**
 * @route   GET /api/messages/:userId
 * @desc    Get message history with a specific user
 * @access  Private
 */
router.get(
  '/:userId',
  authMiddleware.verifyToken,
  messageController.getMessageHistory
);

/**
 * @route   PUT /api/messages/:messageId/read
 * @desc    Mark a message as read
 * @access  Private
 */
router.put(
  '/:messageId/read',
  authMiddleware.verifyToken,
  messageController.markAsRead
);

/**
 * @route   DELETE /api/messages/:messageId
 * @desc    Delete a message
 * @access  Private
 */
router.delete(
  '/:messageId',
  authMiddleware.verifyToken,
  messageController.deleteMessage
);

/**
 * @route   GET /api/messages/unread
 * @desc    Get unread message count
 * @access  Private
 */
router.get(
  '/unread',
  authMiddleware.verifyToken,
  messageController.getUnreadCount
);

module.exports = router; 