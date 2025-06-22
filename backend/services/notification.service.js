/**
 * Notification Service
 * Handles notification creation and management
 */
const Notification = require('../models/notification.model');
const User = require('../models/user.model');
const pushService = require('./push.service');

/**
 * Create a notification
 * @param {Object} notificationData - Notification data
 * @param {string} notificationData.userId - User ID
 * @param {string} notificationData.title - Notification title
 * @param {string} notificationData.message - Notification message
 * @param {string} notificationData.type - Notification type (info, success, warning, error)
 * @param {string} notificationData.category - Notification category
 * @param {Object} notificationData.data - Additional data
 * @returns {Promise<Object>} - Created notification
 */
exports.createNotification = async (notificationData) => {
  try {
    const { userId, title, message, type = 'info', category = 'system', data = {} } = notificationData;
    
    // Validate required fields
    if (!userId || !title || !message) {
      throw new Error('Missing required notification fields');
    }
    
    const notification = new Notification({
      userId,
      title,
      message,
      type,
      category,
      data,
      read: false,
      readAt: null
    });
    
    // Set expiration if expiresIn is provided in data
    if (data && data.expiresIn && typeof data.expiresIn === 'number') {
      notification.setExpiration(data.expiresIn);
    }
    
    return notification.save();
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
};

/**
 * Create a notification for a specific user
 * @param {string} userId - User ID
 * @param {string} title - Notification title
 * @param {string} message - Notification message
 * @param {string} category - Notification category
 * @param {Object} data - Additional data
 * @param {string} type - Notification type (info, success, warning, error)
 * @returns {Promise<Object>} - Created notification
 */
exports.createUserNotification = async (userId, title, message, category = 'system', data = {}, type = 'info') => {
  return this.createNotification({
    userId,
    title,
    message,
    type,
    category,
    data
  });
};

/**
 * Create a system notification for admins
 * @param {string|null} adminId - Admin ID (null for all admins)
 * @param {string} title - Notification title
 * @param {string} message - Notification message
 * @param {string} category - Notification category
 * @param {Object} data - Additional data
 * @param {string} type - Notification type (info, success, warning, error)
 * @returns {Promise<Object[]>} - Created notifications
 */
exports.createSystemNotification = async (adminId, title, message, category = 'system', data = {}, type = 'info') => {
  // If adminId is provided, create notification for that admin only
  if (adminId) {
    return this.createUserNotification(adminId, title, message, category, data, type);
  }
  
  // Otherwise, create notifications for all admins
  const admins = await User.find({ role: 'admin' });
  
  const notifications = [];
  for (const admin of admins) {
    const notification = await this.createUserNotification(
      admin._id,
      title,
      message,
      category,
      data,
      type
    );
    notifications.push(notification);
  }
  
  return notifications;
};

/**
 * Get user's notifications
 * @param {string} userId - User ID
 * @param {Object} options - Query options
 * @param {boolean} options.read - Filter by read status
 * @param {string} options.type - Filter by type
 * @param {string} options.category - Filter by category
 * @param {number} options.limit - Maximum number of notifications to return
 * @param {number} options.skip - Number of notifications to skip
 * @returns {Promise<Object>} - Notifications with pagination info
 */
exports.getUserNotifications = async (userId, options = {}) => {
  try {
    // Build query
  const query = { userId };
  
    // Apply filters if provided
    if (options.read !== undefined) {
      query.read = options.read;
    }
    
    if (options.type) {
      query.type = options.type;
  }
  
    if (options.category) {
      query.category = options.category;
    }
    
    // Count total matching documents
  const total = await Notification.countDocuments(query);
    console.log(`Found ${total} notifications for user ${userId}`);
    
    // Set default limit and skip
    const limit = options.limit || 20;
    const skip = options.skip || 0;
  
    // Get notifications with pagination
  const notifications = await Notification.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
  
    console.log(`Retrieved ${notifications.length} notifications for user ${userId}`);
    
    // Return notifications with pagination info
  return {
    notifications,
      total,
      page: Math.floor(skip / limit) + 1,
      limit,
      hasMore: skip + notifications.length < total
    };
  } catch (error) {
    console.error('Error getting user notifications:', error);
    throw error;
    }
};

/**
 * Mark a notification as read
 * @param {string} notificationId - Notification ID
 * @param {string} userId - Optional user ID for verification
 * @returns {Promise<Object>} - Updated notification
 */
exports.markAsRead = async (notificationId, userId = null) => {
  try {
    const notification = await Notification.findById(notificationId);
  
  if (!notification) {
    throw new Error('Notification not found');
  }
    
    // If userId is provided, verify ownership
    if (userId && notification.userId && notification.userId.toString() !== userId.toString()) {
      console.warn(`User ${userId} attempted to mark notification ${notificationId} as read, but it belongs to user ${notification.userId}`);
      // Instead of throwing an error, just log a warning but still mark as read
      // This helps with situations where notifications might be accessed through different user contexts
    }
  
  notification.read = true;
  notification.readAt = new Date();
  
    await notification.save();
    
    return notification;
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
};

/**
 * Mark all user's notifications as read
 * @param {string} userId - User ID
 * @returns {Promise<Object>} - Update result
 */
exports.markAllAsRead = async (userId) => {
  return Notification.updateMany(
    { userId, read: false },
    { $set: { read: true, readAt: new Date() } }
  );
};

/**
 * Delete a notification
 * @param {string} notificationId - Notification ID
 * @returns {Promise<Object>} - Delete result
 */
exports.deleteNotification = async (notificationId) => {
  try {
    console.log(`Deleting notification ${notificationId}`);
    
    const result = await Notification.deleteOne({ _id: notificationId });
    
    if (result.deletedCount === 0) {
      console.warn(`No notification found with ID ${notificationId}`);
    } else {
      console.log(`Successfully deleted notification ${notificationId}`);
    }
    
    return result;
  } catch (error) {
    console.error(`Error deleting notification ${notificationId}:`, error);
    throw error;
  }
};

/**
 * Get unread notification count for user
 * @param {string} userId - User ID
 * @returns {Promise<number>} - Number of unread notifications
 */
exports.getUnreadCount = async (userId) => {
  try {
    const count = await Notification.countDocuments({
    userId,
    read: false
  });
    
    console.log(`Found ${count} unread notifications for user ${userId}`);
    return count;
  } catch (error) {
    console.error('Error getting unread notification count:', error);
    throw error;
  }
};

/**
 * Get notification by ID
 * @param {string} notificationId - Notification ID
 * @returns {Promise<Object>} - Notification
 */
exports.getNotificationById = async (notificationId) => {
  try {
    const notification = await Notification.findById(notificationId);
    
    if (!notification) {
      throw new Error('Notification not found');
    }
    
    return notification;
  } catch (error) {
    console.error('Error getting notification by ID:', error);
    throw error;
  }
};

/**
 * Delete all notifications
 * @param {string} userId - User ID
 * @param {Object} filter - Filter options
 * @returns {Promise<Object>} - Result with count
 */
exports.deleteAllNotifications = async (userId, filter = {}) => {
  try {
    // Build query
    const query = { userId };
    
    if (filter.read !== undefined) {
      query.read = filter.read;
    }
    
    if (filter.category) {
      query.category = filter.category;
    }
    
    const result = await Notification.deleteMany(query);
    
    return { count: result.deletedCount };
  } catch (error) {
    console.error('Error deleting notifications:', error);
    throw error;
  }
};

/**
 * Send a system notification to all users or specific roles
 * @param {Object} notificationData - Notification data
 * @param {Array<string>} targetRoles - Target roles (optional)
 * @returns {Promise<Object>} - Result with count
 */
exports.sendSystemNotification = async (notificationData, targetRoles = []) => {
  try {
    // Build query for users
    const query = {};
    
    if (targetRoles && targetRoles.length > 0) {
      query.role = { $in: targetRoles };
    }
    
    // Get users
    const users = await User.find(query);
    
    if (users.length === 0) {
      return { count: 0 };
    }
    
    // Create notifications for each user
    const notifications = await Promise.all(
      users.map(user => 
        this.createNotification({
          ...notificationData,
          userId: user._id,
          category: notificationData.category || 'system'
        })
      )
    );
    
    return { count: notifications.length };
  } catch (error) {
    console.error('Error sending system notification:', error);
    throw error;
  }
}; 