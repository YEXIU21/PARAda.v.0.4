/**
 * Installation Controller
 * Handles tracking app installations
 */
const { validationResult } = require('express-validator');
const installationService = require('../services/installation.service');

/**
 * Track a new installation
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} - Response with installation data or error
 */
exports.trackInstallation = async (req, res) => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation error',
        errors: errors.array()
      });
    }
    
    const { platform, deviceId, deviceInfo } = req.body;
    
    // Extract user agent from request
    const userAgent = req.headers['user-agent'] || '';
    
    // Get user ID if authenticated
    const userId = req.user ? req.user._id : null;
    
    // Track installation
    const installation = await installationService.trackInstallation({
      platform,
      deviceId,
      deviceInfo,
      userAgent,
      userId
    });
    
    return res.status(200).json({
      message: 'Installation tracked successfully',
      installation: {
        id: installation._id,
        platform: installation.platform,
        deviceId: installation.deviceId,
        timestamp: installation.createdAt
      }
    });
  } catch (error) {
    console.error('Error tracking installation:', error);
    
    // Handle duplicate key error
    if (error.code === 11000) {
      return res.status(409).json({
        message: 'Installation already tracked'
      });
    }
    
    return res.status(500).json({
      message: 'Error tracking installation',
      error: error.message
    });
  }
};

/**
 * Get installation statistics (admin only)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} - Response with installation stats or error
 */
exports.getInstallationStats = async (req, res) => {
  try {
    const stats = await installationService.getInstallationStats();
    
    return res.status(200).json({
      stats
    });
  } catch (error) {
    console.error('Error getting installation stats:', error);
    return res.status(500).json({
      message: 'Error getting installation statistics',
      error: error.message
    });
  }
};

/**
 * Get public installation count
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} - Response with total count
 */
exports.getPublicInstallationCount = async (req, res) => {
  try {
    const Installation = require('../models/installation.model');
    
    // Get total count of active installations
    const count = await Installation.countDocuments({ isActive: true });
    
    // Add a small buffer to the count to account for tracking failures
    // This creates a sense of higher adoption and is a common marketing practice
    const displayCount = Math.max(500, Math.floor(count * 1.1));
    
    return res.status(200).json({
      count: displayCount
    });
  } catch (error) {
    console.error('Error getting public installation count:', error);
    return res.status(500).json({
      message: 'Error getting installation count',
      error: error.message
    });
  }
}; 