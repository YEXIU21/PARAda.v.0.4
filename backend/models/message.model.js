/**
 * Message Model
 * Represents a direct message between users
 */
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * Message schema
 */
const MessageSchema = new Schema({
  senderId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  recipientId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  message: {
    type: String,
    required: true
  },
  read: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date,
    default: null
  },
  deletedBySender: {
    type: Boolean,
    default: false
  },
  deletedByRecipient: {
    type: Boolean,
    default: false
  },
  data: {
    type: Object,
    default: {}
  }
}, {
  timestamps: true
});

// Create indexes for faster queries
MessageSchema.index({ senderId: 1, recipientId: 1, createdAt: -1 });
MessageSchema.index({ recipientId: 1, read: 1 });

/**
 * Mark message as read
 * @returns {Promise<Object>} - Updated message
 */
MessageSchema.methods.markAsRead = async function() {
  this.read = true;
  this.readAt = new Date();
  return await this.save();
};

// Create model from schema
const Message = mongoose.model('Message', MessageSchema);

module.exports = Message; 