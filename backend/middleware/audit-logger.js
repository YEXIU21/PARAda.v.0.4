/**
 * Audit Logger Middleware
 * 
 * This middleware creates audit logs for user activities.
 * It's designed to be non-blocking and fail-safe to avoid impacting application performance.
 */

const AuditLog = require('../models/audit-log.model');

/**
 * Create an audit log entry
 * 
 * @param {Object} req - Express request object
 * @param {Object} options - Logging options
 * @returns {Promise} - Promise resolving to the created log entry or null
 */
const createAuditLog = async (req, options) => {
  try {
    const {
      action,
      category,
      description,
      entityId,
      entityType,
      metadata = {},
      status = 'success',
      severity = 'low'
    } = options;

    // Skip logging if no user is authenticated
    if (!req.user || !req.user._id) {
      return null;
    }

    const logData = {
      userId: req.user._id,
      username: req.user.username || req.user.email || 'unknown',
      userRole: req.user.role || 'unknown',
      action,
      category,
      description,
      ipAddress: req.ip || req.connection.remoteAddress || 'unknown',
      userAgent: req.headers['user-agent'] || 'unknown',
      status,
      severity
    };

    // Add optional fields if provided
    if (entityId) logData.entityId = entityId;
    if (entityType) logData.entityType = entityType;
    if (Object.keys(metadata).length > 0) logData.metadata = metadata;

    // Create log entry asynchronously (don't await to avoid blocking)
    AuditLog.createLog(logData)
      .catch(err => console.error('Failed to create audit log:', err));

    return true;
  } catch (error) {
    console.error('Error in audit logger:', error);
    return null;
  }
};

/**
 * Middleware for logging authentication events
 */
const logAuthentication = (action) => {
  return (req, res, next) => {
    // Get the original end method
    const originalEnd = res.end;

    // Override the end method
    res.end = function(chunk, encoding) {
      // Restore the original end method
      res.end = originalEnd;
      
      // Call the original end method
      res.end(chunk, encoding);
      
      // Determine status based on response
      const status = res.statusCode >= 400 ? 'failure' : 'success';
      const severity = status === 'failure' ? 'medium' : 'low';
      
      // Create log entry
      createAuditLog(req, {
        action,
        category: 'authentication',
        description: `User ${action} attempt - ${status}`,
        status,
        severity,
        metadata: {
          responseCode: res.statusCode,
          email: req.body?.email || 'unknown'
        }
      });
    };
    
    next();
  };
};

/**
 * Middleware for logging user management events
 */
const logUserManagement = (action) => {
  return (req, res, next) => {
    // Get the original end method
    const originalEnd = res.end;

    // Override the end method
    res.end = function(chunk, encoding) {
      // Restore the original end method
      res.end = originalEnd;
      
      // Call the original end method
      res.end(chunk, encoding);
      
      // Determine status based on response
      const status = res.statusCode >= 400 ? 'failure' : 'success';
      const severity = status === 'failure' ? 'low' : 'medium';
      
      // Get target user ID
      const targetUserId = req.params.id || req.body?.userId || 'unknown';
      
      // Create log entry
      createAuditLog(req, {
        action,
        category: 'user_management',
        description: `User management: ${action}`,
        status,
        severity,
        entityId: targetUserId !== 'unknown' ? targetUserId : undefined,
        entityType: 'user',
        metadata: {
          responseCode: res.statusCode,
          targetUser: targetUserId,
          changes: req.body
        }
      });
    };
    
    next();
  };
};

/**
 * Middleware for logging message events
 */
const logMessageActivity = (action) => {
  return (req, res, next) => {
    // Get the original end method
    const originalEnd = res.end;

    // Override the end method
    res.end = function(chunk, encoding) {
      // Restore the original end method
      res.end = originalEnd;
      
      // Call the original end method
      res.end(chunk, encoding);
      
      // Determine status based on response
      const status = res.statusCode >= 400 ? 'failure' : 'success';
      
      // Get message ID
      const messageId = req.params.id || req.body?.messageId || 'unknown';
      const recipientId = req.body?.recipientId || 'unknown';
      
      // Create log entry
      createAuditLog(req, {
        action,
        category: 'message',
        description: `Message ${action}`,
        status,
        severity: 'low',
        entityId: messageId !== 'unknown' ? messageId : undefined,
        entityType: 'message',
        metadata: {
          responseCode: res.statusCode,
          messageId,
          recipientId
        }
      });
    };
    
    next();
  };
};

/**
 * Middleware for logging data access events
 */
const logDataAccess = (action, entityType, severity = 'medium') => {
  return (req, res, next) => {
    // Get the original end method
    const originalEnd = res.end;

    // Override the end method
    res.end = function(chunk, encoding) {
      // Restore the original end method
      res.end = originalEnd;
      
      // Call the original end method
      res.end(chunk, encoding);
      
      // Determine status based on response
      const status = res.statusCode >= 400 ? 'failure' : 'success';
      
      // Get entity ID
      const entityId = req.params.id || req.body?.id || 'unknown';
      
      // Create log entry
      createAuditLog(req, {
        action,
        category: 'data_access',
        description: `Data access: ${action} ${entityType}`,
        status,
        severity,
        entityId: entityId !== 'unknown' ? entityId : undefined,
        entityType,
        metadata: {
          responseCode: res.statusCode,
          query: req.query,
          params: req.params
        }
      });
    };
    
    next();
  };
};

/**
 * Generic audit logging middleware
 */
const logActivity = (options) => {
  return (req, res, next) => {
    // Get the original end method
    const originalEnd = res.end;

    // Override the end method
    res.end = function(chunk, encoding) {
      // Restore the original end method
      res.end = originalEnd;
      
      // Call the original end method
      res.end(chunk, encoding);
      
      // Determine status based on response
      const status = res.statusCode >= 400 ? 'failure' : 'success';
      
      // Create log entry
      createAuditLog(req, {
        ...options,
        status,
        metadata: {
          ...options.metadata,
          responseCode: res.statusCode,
          path: req.path,
          method: req.method
        }
      });
    };
    
    next();
  };
};

module.exports = {
  createAuditLog,
  logAuthentication,
  logUserManagement,
  logMessageActivity,
  logDataAccess,
  logActivity
}; 