/**
 * Role Middleware
 * Handles role-based access control
 */

/**
 * Restricts access to specified roles
 * @param {Array} roles - Array of allowed roles
 * @returns {Function} - Express middleware function
 */
exports.restrictTo = (roles = []) => {
  return (req, res, next) => {
    try {
      // User should be attached by verifyToken middleware
      if (!req.user) {
        return res.status(401).json({
          message: 'Unauthorized'
        });
      }
      
      // Check if user's role is in the allowed roles
      if (!roles.includes(req.user.role)) {
        return res.status(403).json({
          message: `Forbidden: Requires one of these roles: ${roles.join(', ')}`
        });
      }
      
      // If role is allowed, proceed
      next();
    } catch (error) {
      console.error('Error checking role permissions:', error);
      return res.status(500).json({
        message: 'Server error checking role permissions',
        error: error.message
      });
    }
  };
};

/**
 * Check if user is support
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
exports.isSupport = (req, res, next) => {
  try {
    // User should be attached by verifyToken middleware
    if (!req.user) {
      return res.status(401).json({
        message: 'Unauthorized'
      });
    }
    
    if (req.user.role !== 'support' && req.user.role !== 'admin') {
      return res.status(403).json({
        message: 'Requires support or admin role'
      });
    }
    
    next();
  } catch (error) {
    console.error('Error checking support role:', error);
    return res.status(500).json({
      message: 'Error checking user role',
      error: error.message
    });
  }
};

/**
 * Check if user is admin or support
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
exports.isAdminOrSupport = (req, res, next) => {
  try {
    // User should be attached by verifyToken middleware
    if (!req.user) {
      return res.status(401).json({
        message: 'Unauthorized'
      });
    }
    
    if (req.user.role !== 'admin' && req.user.role !== 'support') {
      return res.status(403).json({
        message: 'Requires admin or support role'
      });
    }
    
    next();
  } catch (error) {
    console.error('Error checking admin/support role:', error);
    return res.status(500).json({
      message: 'Error checking user role',
      error: error.message
    });
  }
}; 