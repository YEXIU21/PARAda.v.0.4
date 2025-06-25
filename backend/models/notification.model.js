/**
 * Notification Model
 * Represents a notification in the system
 */
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * Notification schema
 */
const NotificationSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['info', 'success', 'warning', 'error'],
    default: 'info'
  },
  category: {
    type: String,
    enum: ['system', 'route', 'user', 'payment', 'promo', 'message'],
    default: 'system'
  },
  read: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date,
    default: null
  },
  relatedId: {
    type: Schema.Types.ObjectId,
    default: null
  },
  relatedModel: {
    type: String,
    default: null
  },
  data: {
    type: Object,
    default: {}
  },
  expiresAt: {
    type: Date,
    default: null,
    index: { expires: '0s' } // TTL index - delete document when current time > expiresAt
  }
}, {
  timestamps: true
});

/**
 * Set expiration date for the notification
 * @param {number} days - Number of days until expiration
 */
NotificationSchema.methods.setExpiration = function(days) {
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + days);
  this.expiresAt = expiryDate;
};

/**
 * Mark notification as read
 * @returns {Promise<Object>} - Updated notification
 */
NotificationSchema.methods.markAsRead = async function() {
  this.read = true;
  this.readAt = new Date();
  return await this.save();
};

// Create model from schema
const Notification = mongoose.model('Notification', NotificationSchema);

module.exports = Notification; 