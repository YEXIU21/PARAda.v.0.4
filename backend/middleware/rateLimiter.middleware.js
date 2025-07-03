/**
 * Rate Limiter Middleware
 * 
 * This middleware implements rate limiting for API endpoints
 * to prevent abuse and excessive requests.
 */

const rateLimit = require('express-rate-limit');

// Create a store for rate limiting
const limiters = {};

/**
 * Create a rate limiter for specific routes
 * 
 * @param {Object} options - Rate limiter options
 * @param {number} options.windowMs - Time window in milliseconds
 * @param {number} options.max - Maximum number of requests in the time window
 * @param {string} options.message - Message to send when rate limit is exceeded
 * @param {string} options.keyGenerator - Function to generate keys for rate limiting
 * @returns {Function} - Express middleware function
 */
const createRateLimiter = (options = {}) => {
  const defaultOptions = {
    windowMs: 15 * 60 * 1000, // 15 minutes by default
    max: 100, // 100 requests per windowMs by default
    message: 'Too many requests, please try again later.',
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    keyGenerator: (req) => {
      // Use IP address as default key
      return req.ip;
    }
  };

  const limiterOptions = { ...defaultOptions, ...options };
  
  return rateLimit(limiterOptions);
};

/**
 * Password rate limiter - specifically for password-related endpoints
 * Very restrictive to prevent brute force attacks on passwords
 */
const passwordLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per 15 minutes
  message: 'Too many password attempts, please try again after 15 minutes.',
});

/**
 * Auth rate limiter - for non-password authentication routes
 * More lenient to allow normal operation
 */
const authLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Increased from 10 to 100 requests per 15 minutes
  message: 'Too many authentication attempts, please try again after 15 minutes.',
});

/**
 * Admin rate limiter - for admin routes
 * More lenient to allow admin dashboard functionality
 */
const adminLimiter = createRateLimiter({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 200, // 200 requests per 5 minutes for admin routes
  message: 'Too many admin requests, please try again after 5 minutes.',
});

/**
 * API rate limiter - for general API routes
 * Less restrictive for normal API usage
 */
const apiLimiter = createRateLimiter({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 100, // 100 requests per 5 minutes
  message: 'Too many API requests, please try again after 5 minutes.',
});

/**
 * User-specific rate limiter - for user-specific routes
 * Uses user ID as part of the key to track per-user limits
 */
const userLimiter = createRateLimiter({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 50, // 50 requests per 5 minutes per user
  message: 'Too many requests for this user, please try again after 5 minutes.',
  keyGenerator: (req) => {
    // Use user ID if available, otherwise fall back to IP
    return req.user ? `${req.user._id}-${req.ip}` : req.ip;
  }
});

module.exports = {
  passwordLimiter,
  authLimiter,
  adminLimiter,
  apiLimiter,
  userLimiter,
  createRateLimiter
}; 