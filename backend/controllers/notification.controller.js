/**
 * Notification Controller
 * Handles notification creation, retrieval, and management
 */
const { validationResult } = require('express-validator');
const notificationService = require('../services/notification.service');

/**
 * Get notifications for the authenticated user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} - Response with notifications or error
 */
exports.getUserNotifications = async (req, res) => {
  try {
    // Get user ID from request (attached by auth middleware)
    const userId = req.user._id;
    
    // Get query parameters
    const options = {
      read: req.query.read === 'true' ? true : (req.query.read === 'false' ? false : undefined),
      type: req.query.type,
      category: req.query.category,
      limit: req.query.limit ? parseInt(req.query.limit) : 20,
      skip: req.query.skip ? parseInt(req.query.skip) : 0
    };
    
    console.log(`Getting notifications for user ${userId} with options:`, options);
    
    // Get notifications
    const result = await notificationService.getUserNotifications(userId, options);
    
    // Get unread count
    const unreadCount = await notificationService.getUnreadCount(userId);
    
    return res.status(200).json({
      notifications: result.notifications,
      total: result.total,
      page: result.page,
      limit: result.limit,
      hasMore: result.hasMore,
      unreadCount
    });
  } catch (error) {
    console.error('Error getting user notifications:', error);
    return res.status(500).json({
      message: 'Error retrieving notifications',
      error: error.message
    });
  }
};

/**
 * Mark a notification as read
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} - Response with updated notification or error
 */
exports.markAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user._id;
    
    console.log(`Received request to mark notification ${notificationId} as read for user ${userId}`);
    
    // Mark notification as read
    const notification = await notificationService.markAsRead(notificationId, userId);
    
    return res.status(200).json({
      message: 'Notification marked as read',
      notification
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return res.status(500).json({
      message: 'Error updating notification',
      error: error.message
    });
  }
};

/**
 * Mark all notifications as read for the authenticated user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} - Response with result or error
 */
exports.markAllAsRead = async (req, res) => {
  try {
    // Get user ID from request (attached by auth middleware)
    const userId = req.user._id;
    
    // Mark all notifications as read
    const result = await notificationService.markAllAsRead(userId);
    
    return res.status(200).json({
      message: 'All notifications marked as read',
      count: result.count
    });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    return res.status(500).json({
      message: 'Error updating notifications',
      error: error.message
    });
  }
};

/**
 * Delete a notification
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} - Response with deleted notification or error
 */
exports.deleteNotification = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user._id;
    
    console.log(`Received request to delete notification ${notificationId} from user ${userId}`);
    
    // Try to get the notification first to check if it exists and belongs to the user
    let notification = null;
    try {
      notification = await notificationService.getNotificationById(notificationId);
      
      // Verify ownership (optional - we might want to allow admins to delete any notification)
      if (notification && notification.userId && notification.userId.toString() !== userId.toString()) {
        if (req.user.role !== 'admin') {
          console.warn(`User ${userId} attempted to delete notification ${notificationId} that belongs to user ${notification.userId}`);
          return res.status(403).json({
            message: 'You do not have permission to delete this notification',
            notificationId
          });
        }
      }
    } catch (notFoundError) {
      // If notification doesn't exist, still return success
      console.warn(`Notification ${notificationId} not found, but returning success: ${notFoundError.message}`);
      return res.status(200).json({
        success: true,
        message: 'Notification already deleted or not found',
        notificationId
      });
    }
    
    // Delete notification
    const result = await notificationService.deleteNotification(notificationId);
    console.log(`Delete result for notification ${notificationId}:`, result);
    
    return res.status(200).json({
      success: true,
      message: 'Notification deleted successfully',
      notificationId,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('Error deleting notification:', error);
    return res.status(500).json({
      success: false,
      message: 'Error deleting notification',
      error: error.message
    });
  }
};

/**
 * Delete all notifications for the authenticated user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} - Response with result or error
 */
exports.deleteAllNotifications = async (req, res) => {
  try {
    // Get user ID from request (attached by auth middleware)
    const userId = req.user._id;
    
    // Get query parameters
    const filter = {
      read: req.query.read === 'true' ? true : (req.query.read === 'false' ? false : undefined),
      category: req.query.category
    };
    
    // Delete notifications
    const result = await notificationService.deleteAllNotifications(userId, filter);
    
    return res.status(200).json({
      message: 'Notifications deleted successfully',
      count: result.count
    });
  } catch (error) {
    console.error('Error deleting notifications:', error);
    return res.status(500).json({
      message: 'Error deleting notifications',
      error: error.message
    });
  }
};

/**
 * Get unread notification count for the authenticated user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} - Response with count or error
 */
exports.getUnreadCount = async (req, res) => {
  try {
    // Get user ID from request (attached by auth middleware)
    const userId = req.user._id;
    
    // Get unread count
    const result = await notificationService.getUnreadCount(userId);
    
    return res.status(200).json({
      count: result.count
    });
  } catch (error) {
    console.error('Error getting unread notification count:', error);
    return res.status(500).json({
      message: 'Error retrieving notification count',
      error: error.message
    });
  }
};

/**
 * Create a new notification (admin only)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} - Response with created notification or error
 */
exports.createNotification = async (req, res) => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation error', 
        errors: errors.array() 
      });
    }
    
    // Create notification
    const notification = await notificationService.createNotification(req.body);
    
    // Emit real-time notification via socket if available
    try {
      const socketService = require('../services/socket.service');
      // Emit to the specific user
      socketService.emitToUser(req.body.userId, 'new_notification', {
        notification: {
          _id: notification._id,
          title: notification.title,
          message: notification.message,
          type: notification.type,
          category: notification.category,
          createdAt: notification.createdAt,
          data: notification.data
        }
      });
    } catch (socketError) {
      console.warn('Could not emit socket notification:', socketError);
      // Continue even if socket emission fails
    }
    
    return res.status(201).json({
      message: 'Notification created successfully',
      notification
    });
  } catch (error) {
    console.error('Error creating notification:', error);
    return res.status(500).json({
      message: 'Error creating notification',
      error: error.message
    });
  }
};

/**
 * Send a system notification to all users or specific roles (admin only)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} - Response with result or error
 */
exports.sendSystemNotification = async (req, res) => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation error', 
        errors: errors.array() 
      });
    }
    
    const { title, message, type, data, targetRoles } = req.body;
    
    // Send system notification
    const result = await notificationService.sendSystemNotification(
      { title, message, type, data },
      targetRoles
    );
    
    return res.status(200).json({
      message: 'System notification sent successfully',
      ...result
    });
  } catch (error) {
    console.error('Error sending system notification:', error);
    return res.status(500).json({
      message: 'Error sending system notification',
      error: error.message
    });
  }
};

/**
 * Send a push notification to all users (admin only)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} - Response with result or error
 */
exports.sendPushNotificationToAll = async (req, res) => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation error', 
        errors: errors.array() 
      });
    }
    
    const { title, message, data = {} } = req.body;
    
    // Use push service to send notification to all users
    const pushService = require('../services/push.service');
    
    // Get all users with push tokens
    const User = require('../models/user.model');
    const users = await User.find({ 
      pushTokens: { $exists: true, $not: { $size: 0 } } 
    });
    
    if (users.length === 0) {
      return res.status(404).json({
        message: 'No users with registered push tokens found'
      });
    }
    
    // Send push notifications
    const userIds = users.map(user => user._id);
    const result = await pushService.sendToUsers(userIds, {
      title,
      body: message,
      data
    });
    
    // Create in-app notifications for each user
    const notificationService = require('../services/notification.service');
    await Promise.all(users.map(user => 
      notificationService.createNotification({
        userId: user._id,
        title,
        message,
        type: data.type || 'info',
        category: data.category || 'system',
        data
      })
    ));
    
    return res.status(200).json({
      message: `Push notification sent to ${users.length} users`,
      success: result.success,
      results: result.results
    });
  } catch (error) {
    console.error('Error sending push notification to all users:', error);
    return res.status(500).json({
      message: 'Error sending push notifications',
      error: error.message
    });
  }
};

/**
 * Send a push notification to a specific user (admin only)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} - Response with result or error
 */
exports.sendPushNotificationToUser = async (req, res) => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation error', 
        errors: errors.array() 
      });
    }
    
    const { userId } = req.params;
    const { title, message, data = {} } = req.body;
    
    // Check if user exists and has push tokens
    const User = require('../models/user.model');
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        message: 'User not found'
      });
    }
    
    if (!user.pushTokens || user.pushTokens.length === 0) {
      return res.status(404).json({
        message: 'User has no registered push tokens'
      });
    }
    
    // Use push service to send notification to the user
    const pushService = require('../services/push.service');
    const result = await pushService.sendToUser(userId, {
      title,
      body: message,
      data
    });
    
    // Create an in-app notification for the user
    const notificationService = require('../services/notification.service');
    await notificationService.createNotification({
      userId,
      title,
      message,
      type: data.type || 'info',
      category: data.category || 'system',
      data
    });
    
    return res.status(200).json({
      message: 'Push notification sent successfully',
      success: result.success,
      results: result.results
    });
  } catch (error) {
    console.error('Error sending push notification to user:', error);
    return res.status(500).json({
      message: 'Error sending push notification',
      error: error.message
    });
  }
}; 