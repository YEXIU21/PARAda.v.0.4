/**
 * Role Middleware
 * Restricts routes based on user roles
 */

/**
 * Restrict access to specific roles
 * @param {Array} roles - Array of allowed roles
 * @returns {Function} - Express middleware function
 */
exports.restrictTo = (roles) => {
  return (req, res, next) => {
    try {
      // User should be attached by verifyToken middleware
      if (!req.user) {
        return res.status(401).json({
          message: 'Unauthorized'
        });
      }
      
      if (!roles.includes(req.user.role)) {
        return res.status(403).json({
          message: `Access denied. Requires one of these roles: ${roles.join(', ')}`
        });
      }
      
      next();
    } catch (error) {
      console.error('Error checking role permissions:', error);
      return res.status(500).json({
        message: 'Error checking role permissions',
        error: error.message
      });
    }
  };
};

/**
 * Check if user is the owner of the resource or has a specific role
 * @param {Function} getResourceUserId - Function to extract the user ID from the resource
 * @param {Array} roles - Array of roles that bypass ownership check
 * @returns {Function} - Express middleware function
 */
exports.isOwnerOrHasRole = (getResourceUserId, roles = ['admin']) => {
  return async (req, res, next) => {
    try {
      // User should be attached by verifyToken middleware
      if (!req.user) {
        return res.status(401).json({
          message: 'Unauthorized'
        });
      }
      
      // Allow if user has one of the specified roles
      if (roles.includes(req.user.role)) {
        return next();
      }
      
      // Get the user ID associated with the resource
      const resourceUserId = await getResourceUserId(req);
      
      // Check if the current user is the owner
      if (req.user._id.toString() === resourceUserId.toString()) {
        return next();
      }
      
      // If not the owner and doesn't have the required role
      return res.status(403).json({
        message: 'Access denied. You do not have permission to access this resource.'
      });
    } catch (error) {
      console.error('Error checking ownership or role:', error);
      return res.status(500).json({
        message: 'Error checking permissions',
        error: error.message
      });
    }
  };
}; 