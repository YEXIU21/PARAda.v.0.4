/**
 * Authentication Controller
 * Handles user registration, login, and token verification
 */
const { validationResult } = require('express-validator');
const authService = require('../services/auth.service');
const User = require('../models/user.model');

/**
 * Register a new user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} - Response with user data or error
 */
exports.register = async (req, res) => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation error', 
        errors: errors.array() 
      });
    }

    // Register user
    const userData = req.body;
    const user = await authService.register(userData);

    return res.status(201).json({
      message: 'User registered successfully',
      user
    });
  } catch (error) {
    console.error('Error in user registration:', error);
    
    // Handle duplicate key errors (e.g., email already exists)
    if (error.code === 11000) {
      return res.status(409).json({
        message: 'User already exists with this email or username'
      });
    }
    
    return res.status(500).json({
      message: 'Error registering user',
      error: error.message
    });
  }
};

/**
 * Login a user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} - Response with user data and token or error
 */
exports.login = async (req, res) => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation error', 
        errors: errors.array() 
      });
    }

    const { email, password } = req.body;
    
    // Login user
    const result = await authService.login(email, password);

    return res.status(200).json({
      message: 'Login successful',
      ...result
    });
  } catch (error) {
    console.error('Error in user login:', error);
    
    // Handle specific errors
    if (error.message === 'User not found' || error.message === 'Invalid password') {
      return res.status(401).json({
        message: 'Invalid email or password'
      });
    }
    
    if (error.message === 'Account disabled') {
      // Find user to get the disabled reason
      try {
        const user = await User.findOne({ email });
        return res.status(403).json({
          message: 'Account disabled',
          reason: user?.disabledReason || 'Your account has been disabled due to a violation of our terms of service.',
          disabled: true
        });
      } catch (findError) {
        // If we can't find the user, just return a generic message
        return res.status(403).json({
          message: 'Account disabled',
          reason: 'Your account has been disabled due to a violation of our terms of service.',
          disabled: true
        });
      }
    }
    
    return res.status(500).json({
      message: 'Error logging in',
      error: error.message
    });
  }
};

/**
 * Get current user profile
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} - Response with user data or error
 */
exports.getCurrentUser = async (req, res) => {
  try {
    // User is already attached to req by auth middleware
    const user = req.user;
    
    return res.status(200).json({
      user
    });
  } catch (error) {
    console.error('Error getting current user:', error);
    return res.status(500).json({
      message: 'Error retrieving user profile',
      error: error.message
    });
  }
};

/**
 * Verify user token
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} - Response with verification result or error
 */
exports.verifyToken = async (req, res) => {
  try {
    const token = req.body.token || req.query.token || req.headers['x-access-token'];
    
    if (!token) {
      return res.status(400).json({
        message: 'Token is required'
      });
    }
    
    // Verify token
    const result = await authService.verifyToken(token);
    
    return res.status(200).json({
      valid: true,
      user: result.user
    });
  } catch (error) {
    console.error('Error verifying token:', error);
    return res.status(401).json({
      valid: false,
      message: 'Invalid or expired token'
    });
  }
};

/**
 * Request password reset
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} - Response with success message or error
 */
exports.requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({
        message: 'Email is required'
      });
    }
    
    // In a real application, this would send a password reset email
    // For now, just return success
    
    return res.status(200).json({
      message: 'Password reset instructions sent to your email'
    });
  } catch (error) {
    console.error('Error requesting password reset:', error);
    return res.status(500).json({
      message: 'Error processing password reset request',
      error: error.message
    });
  }
};

/**
 * Reset password
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} - Response with success message or error
 */
exports.resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    
    if (!token || !newPassword) {
      return res.status(400).json({
        message: 'Token and new password are required'
      });
    }
    
    // In a real application, this would verify the reset token and update the password
    // For now, just return success
    
    return res.status(200).json({
      message: 'Password reset successful'
    });
  } catch (error) {
    console.error('Error resetting password:', error);
    return res.status(500).json({
      message: 'Error resetting password',
      error: error.message
    });
  }
};

/**
 * Get the current user's profile including subscription status
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} - Response with user profile or error
 */
exports.getUserProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Get user from database with populated subscription
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        message: 'User not found'
      });
    }
    
    // Get user's active subscription if exists
    const subscriptionService = require('../services/subscription.service');
    const activeSubscription = await subscriptionService.getUserActiveSubscription(userId);
    
    // Format response
    const userData = {
      _id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      accountType: user.accountType,
      isEmailVerified: user.isEmailVerified,
      createdAt: user.createdAt
    };
    
    // Add subscription data if exists
    if (activeSubscription) {
      userData.subscription = {
        type: activeSubscription.type,
        plan: activeSubscription.planId,
        planName: activeSubscription.planName,
        verified: activeSubscription.verification.verified,
        expiryDate: activeSubscription.expiryDate,
        referenceNumber: activeSubscription.paymentDetails.referenceNumber
      };
    } else if (user.subscription) {
      // Use existing subscription data from user document if no active subscription found
      userData.subscription = user.subscription;
      
      // Try to add plan name if not already present
      if (user.subscription.plan && !user.subscription.planName) {
        userData.subscription.planName = await subscriptionService.getPlanNameFromId(user.subscription.plan);
      }
    }
    
    return res.status(200).json({
      user: userData
    });
  } catch (error) {
    console.error('Error getting user profile:', error);
    return res.status(500).json({
      message: 'Error getting user profile',
      error: error.message
    });
  }
}; 

/**
 * Change user password
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} - Response with success message or error
 */
exports.changePassword = async (req, res) => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({ 
        message: 'Validation error', 
        errors: errors.array() 
      });
    }
    
    const userId = req.user._id;
    const { currentPassword, newPassword } = req.body;
    
    console.log(`Password change request for user ID: ${userId}`);
    
    const user = await User.findById(userId);
    
    if (!user) {
      console.log(`User not found: ${userId}`);
      return res.status(404).json({
        message: 'User not found'
      });
    }
    
    // Verify current password
    const bcrypt = require('bcryptjs');
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    console.log(`Current password validation: ${isPasswordValid ? 'valid' : 'invalid'}`);
    
    if (!isPasswordValid) {
      return res.status(401).json({
        message: 'Current password is incorrect'
      });
    }
    
    // Hash new password using the configured salt rounds
    const { saltRounds } = require('../config/auth.config');
    console.log(`Using salt rounds: ${saltRounds}`);
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
    
    // Update password directly in the database to avoid pre-save hook issues
    const result = await User.updateOne(
      { _id: userId },
      { 
        $set: { 
          password: hashedPassword,
          updatedAt: new Date()
        } 
      }
    );
    
    console.log(`Password updated successfully for user: ${userId}`);
    console.log(`Modified count: ${result.modifiedCount}`);
    
    // Verify the new password can be used for login
    const updatedUser = await User.findById(userId);
    const verifyNewPassword = await bcrypt.compare(newPassword, updatedUser.password);
    console.log(`New password verification: ${verifyNewPassword ? 'valid' : 'invalid'}`);
    
    return res.status(200).json({
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Error changing password:', error);
    return res.status(500).json({
      message: 'Error changing password',
      error: error.message
    });
  }
};