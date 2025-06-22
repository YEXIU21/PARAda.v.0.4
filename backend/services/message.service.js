/**
 * Message Service
 * Handles direct messaging operations
 */
const mongoose = require('mongoose');
const Message = require('../models/message.model');
const User = require('../models/user.model');

/**
 * Create a new message
 * @param {Object} messageData - Message data
 * @param {string} messageData.senderId - Sender user ID
 * @param {string} messageData.recipientId - Recipient user ID
 * @param {string} messageData.message - Message content
 * @param {Object} messageData.data - Additional data
 * @returns {Promise<Object>} - Created message
 */
exports.createMessage = async (messageData) => {
  try {
    const { senderId, recipientId, message, data = {} } = messageData;
    
    // Validate required fields
    if (!senderId || !recipientId || !message) {
      throw new Error('Missing required message fields');
    }
    
    // Check if recipient exists
    const recipient = await User.findById(recipientId);
    if (!recipient) {
      throw new Error('Recipient user not found');
    }
    
    // Create message
    const newMessage = new Message({
      senderId,
      recipientId,
      message,
      data,
      read: false,
      readAt: null
    });
    
    return await newMessage.save();
  } catch (error) {
    console.error('Error creating message:', error);
    throw error;
  }
};

/**
 * Get messages between two users
 * @param {string} userId1 - First user ID
 * @param {string} userId2 - Second user ID
 * @param {Object} options - Query options
 * @param {number} options.limit - Maximum number of messages to return
 * @param {number} options.skip - Number of messages to skip
 * @returns {Promise<Array>} - List of messages
 */
exports.getMessagesBetweenUsers = async (userId1, userId2, options = {}) => {
  try {
    // Convert string IDs to ObjectIds if needed
    const user1 = typeof userId1 === 'string' ? mongoose.Types.ObjectId(userId1) : userId1;
    const user2 = typeof userId2 === 'string' ? mongoose.Types.ObjectId(userId2) : userId2;
    
    // Build query to find messages between the two users (in either direction)
    const query = {
      $or: [
        { senderId: user1, recipientId: user2 },
        { senderId: user2, recipientId: user1 }
      ]
    };
    
    // Set default limit and skip
    const limit = options.limit || 20;
    const skip = options.skip || 0;
    
    // Get messages
    const messages = await Message.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    // Mark messages as read if recipient is current user
    const messagesToMark = messages.filter(
      msg => !msg.read && msg.recipientId.toString() === userId1.toString()
    );
    
    if (messagesToMark.length > 0) {
      await Message.updateMany(
        { 
          _id: { $in: messagesToMark.map(msg => msg._id) },
          recipientId: userId1
        },
        { 
          $set: { 
            read: true,
            readAt: new Date()
          } 
        }
      );
    }
    
    return messages;
  } catch (error) {
    console.error('Error getting messages between users:', error);
    throw error;
  }
};

/**
 * Mark a message as read
 * @param {string} messageId - Message ID
 * @param {string} userId - User ID (must be recipient)
 * @returns {Promise<Object>} - Updated message
 */
exports.markAsRead = async (messageId, userId) => {
  try {
    const message = await Message.findById(messageId);
    
    if (!message) {
      throw new Error('Message not found');
    }
    
    // Verify that the user is the recipient
    if (message.recipientId.toString() !== userId.toString()) {
      throw new Error('Only the recipient can mark a message as read');
    }
    
    // Mark as read
    message.read = true;
    message.readAt = new Date();
    
    await message.save();
    
    return message;
  } catch (error) {
    console.error('Error marking message as read:', error);
    throw error;
  }
};

/**
 * Delete a message
 * @param {string} messageId - Message ID
 * @param {string} userId - User ID (must be sender or recipient)
 * @returns {Promise<boolean>} - Success indicator
 */
exports.deleteMessage = async (messageId, userId) => {
  try {
    const message = await Message.findById(messageId);
    
    if (!message) {
      throw new Error('Message not found');
    }
    
    // Verify that the user is either the sender or recipient
    const isSender = message.senderId.toString() === userId.toString();
    const isRecipient = message.recipientId.toString() === userId.toString();
    
    if (!isSender && !isRecipient) {
      throw new Error('Only the sender or recipient can delete a message');
    }
    
    // If both users have deleted, or if it's a one-sided delete
    if (
      (isSender && message.deletedBySender && isRecipient && message.deletedByRecipient) ||
      (isSender && !isRecipient && message.deletedByRecipient) ||
      (!isSender && isRecipient && message.deletedBySender)
    ) {
      // Permanently delete the message
      await Message.deleteOne({ _id: messageId });
    } else {
      // Mark as deleted by the appropriate user
      if (isSender) {
        message.deletedBySender = true;
      }
      
      if (isRecipient) {
        message.deletedByRecipient = true;
      }
      
      await message.save();
    }
    
    return true;
  } catch (error) {
    console.error('Error deleting message:', error);
    throw error;
  }
};

/**
 * Get unread message count for a user
 * @param {string} userId - User ID
 * @returns {Promise<number>} - Number of unread messages
 */
exports.getUnreadCount = async (userId) => {
  try {
    const count = await Message.countDocuments({
      recipientId: userId,
      read: false,
      deletedByRecipient: { $ne: true }
    });
    
    return count;
  } catch (error) {
    console.error('Error getting unread message count:', error);
    throw error;
  }
}; 