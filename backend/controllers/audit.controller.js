/**
 * Audit Controller
 * 
 * Handles API requests for audit logs
 */

const AuditLog = require('../models/audit-log.model');

/**
 * Get audit logs with filtering and pagination
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getAuditLogs = async (req, res) => {
  try {
    // Extract query parameters
    const {
      userId,
      username,
      userRole,
      action,
      category,
      status,
      severity,
      entityId,
      entityType,
      startDate,
      endDate,
      page = 1,
      limit = 50,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;
    
    // Build query object
    const query = {};
    
    // Add filters if provided
    if (userId) query.userId = userId;
    if (username) query.username = { $regex: new RegExp(username, 'i') };
    if (userRole) query.userRole = userRole;
    if (action) query.action = { $regex: new RegExp(action, 'i') };
    if (category) query.category = category;
    if (status) query.status = status;
    if (severity) query.severity = severity;
    if (entityId) query.entityId = entityId;
    if (entityType) query.entityType = entityType;
    
    // Add date range if provided
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }
    
    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;
    
    // Get total count for pagination
    const totalCount = await AuditLog.countDocuments(query);
    
    // Get logs
    const logs = await AuditLog.find(query)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));
    
    // Return response
    return res.status(200).json({
      success: true,
      count: logs.length,
      total: totalCount,
      page: parseInt(page),
      pages: Math.ceil(totalCount / parseInt(limit)),
      data: logs
    });
  } catch (error) {
    console.error('Error getting audit logs:', error);
    return res.status(500).json({
      success: false,
      message: 'Error retrieving audit logs',
      error: error.message
    });
  }
};

/**
 * Get audit logs for a specific user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getUserAuditLogs = async (req, res) => {
  try {
    const userId = req.params.userId;
    const { page = 1, limit = 50 } = req.query;
    
    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Get total count for pagination
    const totalCount = await AuditLog.countDocuments({ userId });
    
    // Get logs
    const logs = await AuditLog.getUserLogs(userId, {
      limit: parseInt(limit),
      skip
    });
    
    // Return response
    return res.status(200).json({
      success: true,
      count: logs.length,
      total: totalCount,
      page: parseInt(page),
      pages: Math.ceil(totalCount / parseInt(limit)),
      data: logs
    });
  } catch (error) {
    console.error('Error getting user audit logs:', error);
    return res.status(500).json({
      success: false,
      message: 'Error retrieving user audit logs',
      error: error.message
    });
  }
};

/**
 * Get audit log statistics
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getAuditStats = async (req, res) => {
  try {
    // Get time range from query params
    const { startDate, endDate } = req.query;
    
    // Build date filter
    const dateFilter = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
      if (endDate) dateFilter.createdAt.$lte = new Date(endDate);
    }
    
    // Get counts by category
    const categoryStats = await AuditLog.aggregate([
      { $match: dateFilter },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    // Get counts by severity
    const severityStats = await AuditLog.aggregate([
      { $match: dateFilter },
      { $group: { _id: '$severity', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    // Get counts by status
    const statusStats = await AuditLog.aggregate([
      { $match: dateFilter },
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    // Get counts by user role
    const roleStats = await AuditLog.aggregate([
      { $match: dateFilter },
      { $group: { _id: '$userRole', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    // Get top users by activity
    const topUsers = await AuditLog.aggregate([
      { $match: dateFilter },
      { $group: { _id: { userId: '$userId', username: '$username' }, count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
      { $project: { _id: 0, userId: '$_id.userId', username: '$_id.username', count: 1 } }
    ]);
    
    // Return response
    return res.status(200).json({
      success: true,
      data: {
        categoryStats,
        severityStats,
        statusStats,
        roleStats,
        topUsers
      }
    });
  } catch (error) {
    console.error('Error getting audit stats:', error);
    return res.status(500).json({
      success: false,
      message: 'Error retrieving audit statistics',
      error: error.message
    });
  }
};

/**
 * Get a single audit log by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getAuditLogById = async (req, res) => {
  try {
    const logId = req.params.id;
    
    // Get log
    const log = await AuditLog.findById(logId);
    
    if (!log) {
      return res.status(404).json({
        success: false,
        message: 'Audit log not found'
      });
    }
    
    // Return response
    return res.status(200).json({
      success: true,
      data: log
    });
  } catch (error) {
    console.error('Error getting audit log by ID:', error);
    return res.status(500).json({
      success: false,
      message: 'Error retrieving audit log',
      error: error.message
    });
  }
};

/**
 * Delete audit logs older than a specified date
 * Only accessible by admin users
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.deleteOldAuditLogs = async (req, res) => {
  try {
    // Only allow admin users
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }
    
    const { olderThan } = req.body;
    
    if (!olderThan) {
      return res.status(400).json({
        success: false,
        message: 'olderThan date is required'
      });
    }
    
    const date = new Date(olderThan);
    
    // Delete logs older than the specified date
    const result = await AuditLog.deleteMany({
      createdAt: { $lt: date }
    });
    
    // Return response
    return res.status(200).json({
      success: true,
      message: `Deleted ${result.deletedCount} audit logs older than ${date.toISOString()}`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('Error deleting old audit logs:', error);
    return res.status(500).json({
      success: false,
      message: 'Error deleting old audit logs',
      error: error.message
    });
  }
}; 