/**
 * Message Controller
 * Handles direct messaging operations
 */
const { validationResult } = require('express-validator');
const messageService = require('../services/message.service');
const notificationService = require('../services/notification.service');
const socketService = require('../services/socket.service');

/**
 * Send a direct message to a user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} - Response with sent message or error
 */
exports.sendMessage = async (req, res) => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation error', 
        errors: errors.array() 
      });
    }
    
    const { recipientId, message, data = {} } = req.body;
    const senderId = req.user._id;
    
    // Don't allow sending messages to self
    if (senderId.toString() === recipientId.toString()) {
      return res.status(400).json({
        message: 'Cannot send messages to yourself'
      });
    }
    
    // Create message
    const createdMessage = await messageService.createMessage({
      senderId,
      recipientId,
      message,
      data
    });
    
    // Create notification for recipient
    try {
      await notificationService.createNotification({
        userId: recipientId,
        title: `New message from ${req.user.username || 'a user'}`,
        message: message.length > 50 ? `${message.substring(0, 50)}...` : message,
        type: 'info',
        category: 'message',
        data: {
          ...data,
          messageId: createdMessage._id,
          senderId
        }
      });
    } catch (notifError) {
      console.warn('Error creating notification for message:', notifError);
      // Continue even if notification creation fails
    }
    
    // Emit real-time message via socket
    try {
      socketService.emitToUser(recipientId, 'new_message', {
        message: {
          _id: createdMessage._id,
          senderId,
          senderName: req.user.username,
          message,
          createdAt: createdMessage.createdAt,
          data: createdMessage.data
        }
      });
    } catch (socketError) {
      console.warn('Could not emit socket message:', socketError);
      // Continue even if socket emission fails
    }
    
    return res.status(201).json({
      message: 'Message sent successfully',
      sentMessage: createdMessage
    });
  } catch (error) {
    console.error('Error sending message:', error);
    return res.status(500).json({
      message: 'Error sending message',
      error: error.message
    });
  }
};

/**
 * Get message history with a specific user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} - Response with messages or error
 */
exports.getMessageHistory = async (req, res) => {
  try {
    const userId = req.user._id;
    const otherUserId = req.params.userId;
    
    // Get query parameters
    const options = {
      limit: req.query.limit ? parseInt(req.query.limit) : 20,
      skip: req.query.skip ? parseInt(req.query.skip) : 0
    };
    
    // Get messages
    const messages = await messageService.getMessagesBetweenUsers(userId, otherUserId, options);
    
    return res.status(200).json({
      messages
    });
  } catch (error) {
    console.error('Error getting message history:', error);
    return res.status(500).json({
      message: 'Error retrieving messages',
      error: error.message
    });
  }
};

/**
 * Mark a message as read
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} - Response with updated message or error
 */
exports.markAsRead = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user._id;
    
    // Mark message as read
    const message = await messageService.markAsRead(messageId, userId);
    
    return res.status(200).json({
      message: 'Message marked as read',
      updatedMessage: message
    });
  } catch (error) {
    console.error('Error marking message as read:', error);
    return res.status(500).json({
      message: 'Error updating message',
      error: error.message
    });
  }
};

/**
 * Delete a message
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} - Response with result or error
 */
exports.deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user._id;
    
    // Delete message
    await messageService.deleteMessage(messageId, userId);
    
    return res.status(200).json({
      message: 'Message deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting message:', error);
    return res.status(500).json({
      message: 'Error deleting message',
      error: error.message
    });
  }
};

/**
 * Get unread message count
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} - Response with count or error
 */
exports.getUnreadCount = async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Get unread count
    const count = await messageService.getUnreadCount(userId);
    
    return res.status(200).json({
      count
    });
  } catch (error) {
    console.error('Error getting unread message count:', error);
    return res.status(500).json({
      message: 'Error retrieving unread count',
      error: error.message
    });
  }
}; 