/**
 * Authentication Middleware
 * Verifies JWT tokens and protects routes
 */
const jwt = require('jsonwebtoken');
const { secret } = require('../config/auth.config');
const User = require('../models/user.model');

/**
 * Verify JWT token middleware
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
exports.verifyToken = async (req, res, next) => {
  try {
    // Get token from header, query, or body
    const token = req.headers['x-access-token'] || req.headers['authorization']?.split(' ')[1] || req.query.token || req.body.token;
    
    if (!token) {
      return res.status(401).json({
        message: 'No token provided'
      });
    }
    
    // Verify token
    const decoded = jwt.verify(token, secret);
    
    // Find user
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      return res.status(401).json({
        message: 'Invalid token: User not found'
      });
    }
    
    // Check if user account is active
    if (!user.isActive) {
      return res.status(403).json({
        message: 'Account disabled',
        reason: user.disabledReason || 'Your account has been disabled due to a violation of our terms of service.',
        disabled: true
      });
    }
    
    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    console.error('Error verifying token:', error);
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        message: 'Token expired'
      });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        message: 'Invalid token'
      });
    }
    
    return res.status(500).json({
      message: 'Error authenticating user',
      error: error.message
    });
  }
};

/**
 * Check if user is admin
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
exports.isAdmin = (req, res, next) => {
  try {
    // User should be attached by verifyToken middleware
    if (!req.user) {
      return res.status(401).json({
        message: 'Unauthorized'
      });
    }
    
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        message: 'Requires admin role'
      });
    }
    
    next();
  } catch (error) {
    console.error('Error checking admin role:', error);
    return res.status(500).json({
      message: 'Error checking user role',
      error: error.message
    });
  }
};

/**
 * Check if user is driver
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
exports.isDriver = (req, res, next) => {
  try {
    // User should be attached by verifyToken middleware
    if (!req.user) {
      return res.status(401).json({
        message: 'Unauthorized'
      });
    }
    
    if (req.user.role !== 'driver' && req.user.role !== 'admin') {
      return res.status(403).json({
        message: 'Requires driver role'
      });
    }
    
    next();
  } catch (error) {
    console.error('Error checking driver role:', error);
    return res.status(500).json({
      message: 'Error checking user role',
      error: error.message
    });
  }
};

/**
 * Check if user is admin or driver
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
exports.isAdminOrDriver = (req, res, next) => {
  try {
    // User should be attached by verifyToken middleware
    if (!req.user) {
      return res.status(401).json({
        message: 'Unauthorized'
      });
    }
    
    if (req.user.role !== 'admin' && req.user.role !== 'driver') {
      return res.status(403).json({
        message: 'Requires admin or driver role'
      });
    }
    
    next();
  } catch (error) {
    console.error('Error checking admin/driver role:', error);
    return res.status(500).json({
      message: 'Error checking user role',
      error: error.message
    });
  }
};

/**
 * Check if user has active subscription
 * Drivers don't need subscriptions as they provide the service rather than consume it.
 * Only passenger users need active subscriptions to access premium features.
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
exports.hasActiveSubscription = async (req, res, next) => {
  try {
    // User should be attached by verifyToken middleware
    if (!req.user) {
      return res.status(401).json({
        message: 'Unauthorized'
      });
    }
    
    // Admin and drivers bypass subscription check
    if (req.user.role === 'admin' || req.user.role === 'driver') {
      return next();
    }
    
    // Check subscription
    const Subscription = require('../models/subscription.model');
    const now = new Date();
    
    const subscription = await Subscription.findOne({
      userId: req.user._id,
      isActive: true,
      expiryDate: { $gt: now }
    });
    
    if (!subscription) {
      return res.status(403).json({
        message: 'Active subscription required',
        subscriptionRequired: true
      });
    }
    
    // Attach subscription to request
    req.subscription = subscription;
    next();
  } catch (error) {
    console.error('Error checking subscription:', error);
    return res.status(500).json({
      message: 'Error checking subscription status',
      error: error.message
    });
  }
}; 