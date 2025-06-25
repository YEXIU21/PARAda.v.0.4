/**
 * Admin Middleware
 * Checks if the user is an admin
 */

/**
 * Check if the user is an admin
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 * @returns {Object|Function} - Response or next function
 */
module.exports = (req, res, next) => {
  try {
    // Check if user is admin (should have been set by auth middleware)
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized. Admin access required.'
      });
    }

    // If user is admin, proceed
    next();
  } catch (error) {
    console.error('Admin middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error checking admin permissions',
      error: error.message
    });
  }
}; 