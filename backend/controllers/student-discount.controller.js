/**
 * Student Discount Controller
 * Handles student discount settings operations
 */
const { validationResult } = require('express-validator');
const subscriptionService = require('../services/subscription.service');

/**
 * Get student discount settings
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} - Response with settings or error
 */
exports.getSettings = async (req, res) => {
  try {
    const settings = await subscriptionService.getStudentDiscountSettings();
    
    return res.status(200).json({
      success: true,
      settings
    });
  } catch (error) {
    console.error('Error getting student discount settings:', error);
    return res.status(500).json({
      success: false,
      message: 'Error getting student discount settings',
      error: error.message
    });
  }
};

/**
 * Update student discount settings
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} - Response with updated settings or error
 */
exports.updateSettings = async (req, res) => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors.array()
      });
    }
    
    const { isEnabled, discountPercent } = req.body;
    
    // Validate discount percent
    if (discountPercent < 0 || discountPercent > 100) {
      return res.status(400).json({
        success: false,
        message: 'Discount percentage must be between 0 and 100'
      });
    }
    
    // Update settings
    const settings = {
      isEnabled: isEnabled !== undefined ? isEnabled : true,
      discountPercent: discountPercent !== undefined ? discountPercent : 20
    };
    
    const updatedSettings = await subscriptionService.updateStudentDiscountSettings(settings, req.user._id);
    
    return res.status(200).json({
      success: true,
      message: 'Student discount settings updated successfully',
      settings: updatedSettings
    });
  } catch (error) {
    console.error('Error updating student discount settings:', error);
    return res.status(500).json({
      success: false,
      message: 'Error updating student discount settings',
      error: error.message
    });
  }
}; 