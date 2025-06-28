/**
 * Audit Log Model
 * 
 * This model stores audit logs for security monitoring and compliance purposes.
 * It tracks user activities across the system, especially for sensitive operations.
 */

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * Audit Log Schema
 */
const AuditLogSchema = new Schema({
  // User who performed the action
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  // Username for quick reference without joins
  username: {
    type: String,
    required: true,
    index: true
  },
  
  // User role at the time of the action
  userRole: {
    type: String,
    enum: ['admin', 'support', 'driver', 'passenger'],
    required: true,
    index: true
  },
  
  // Type of action performed
  action: {
    type: String,
    required: true,
    index: true
  },
  
  // Category of the action for filtering
  category: {
    type: String,
    enum: [
      'authentication', // Login, logout, password changes
      'user_management', // User creation, updates, deletion
      'message', // Message sending, reading, deletion
      'payment', // Payment processing, refunds
      'subscription', // Subscription changes
      'system', // System settings changes
      'data_access' // Accessing sensitive data
    ],
    required: true,
    index: true
  },
  
  // Description of the action
  description: {
    type: String,
    required: true
  },
  
  // IP address of the user
  ipAddress: {
    type: String,
    required: true
  },
  
  // User agent (browser/app info)
  userAgent: {
    type: String
  },
  
  // Related entity ID (e.g., message ID, user ID)
  entityId: {
    type: Schema.Types.ObjectId,
    index: true
  },
  
  // Related entity type (e.g., 'message', 'user')
  entityType: {
    type: String,
    index: true
  },
  
  // Additional data as JSON
  metadata: {
    type: Object,
    default: {}
  },
  
  // Status of the action (success, failure, etc.)
  status: {
    type: String,
    enum: ['success', 'failure', 'warning', 'info'],
    default: 'success',
    index: true
  },
  
  // Severity level for filtering
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'low',
    index: true
  },
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: true
});

// Create text index for searching
AuditLogSchema.index({ 
  description: 'text', 
  username: 'text',
  action: 'text'
});

// Create compound indexes for common queries
AuditLogSchema.index({ userId: 1, createdAt: -1 });
AuditLogSchema.index({ category: 1, createdAt: -1 });
AuditLogSchema.index({ severity: 1, createdAt: -1 });
AuditLogSchema.index({ status: 1, createdAt: -1 });

// Static method to create a new audit log entry
AuditLogSchema.statics.createLog = async function(logData) {
  try {
    return await this.create(logData);
  } catch (error) {
    console.error('Error creating audit log:', error);
    // Don't throw error to prevent disrupting main application flow
    return null;
  }
};

// Static method to get logs for a specific user
AuditLogSchema.statics.getUserLogs = async function(userId, options = {}) {
  const { limit = 50, skip = 0, sort = { createdAt: -1 } } = options;
  
  try {
    return await this.find({ userId })
      .sort(sort)
      .skip(skip)
      .limit(limit);
  } catch (error) {
    console.error('Error getting user logs:', error);
    throw error;
  }
};

// Static method to search logs
AuditLogSchema.statics.searchLogs = async function(query = {}, options = {}) {
  const { 
    limit = 50, 
    skip = 0, 
    sort = { createdAt: -1 },
    startDate,
    endDate
  } = options;
  
  // Build filter
  const filter = { ...query };
  
  // Add date range if provided
  if (startDate || endDate) {
    filter.createdAt = {};
    if (startDate) filter.createdAt.$gte = new Date(startDate);
    if (endDate) filter.createdAt.$lte = new Date(endDate);
  }
  
  try {
    return await this.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit);
  } catch (error) {
    console.error('Error searching logs:', error);
    throw error;
  }
};

const AuditLog = mongoose.model('AuditLog', AuditLogSchema);

module.exports = AuditLog; 