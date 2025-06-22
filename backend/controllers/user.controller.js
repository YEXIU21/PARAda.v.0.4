/**
 * User Controller
 * Handles user management operations
 */
const { validationResult } = require('express-validator');
const User = require('../models/user.model');

/**
 * Get all users (admin only)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} - Response with users or error
 */
exports.getUsers = async (req, res) => {
  try {
    // Get pagination parameters
    const limit = parseInt(req.query.limit) || 10;
    const skip = parseInt(req.query.skip) || 0;
    
    // Get users with pagination
    const users = await User.find()
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    // Get total count for pagination
    const total = await User.countDocuments();
    
    return res.status(200).json({
      users,
      pagination: {
        total,
        limit,
        skip,
        hasMore: skip + users.length < total
      }
    });
  } catch (error) {
    console.error('Error getting users:', error);
    return res.status(500).json({
      message: 'Error retrieving users',
      error: error.message
    });
  }
};

/**
 * Get user by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} - Response with user or error
 */
exports.getUserById = async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Check if user is requesting their own profile or is admin
    if (userId !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        message: 'You are not authorized to view this user profile'
      });
    }
    
    const user = await User.findById(userId).select('-password');
    
    if (!user) {
      return res.status(404).json({
        message: 'User not found'
      });
    }
    
    return res.status(200).json({
      user
    });
  } catch (error) {
    console.error('Error getting user by ID:', error);
    return res.status(500).json({
      message: 'Error retrieving user',
      error: error.message
    });
  }
};

/**
 * Update user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} - Response with updated user or error
 */
exports.updateUser = async (req, res) => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation error', 
        errors: errors.array() 
      });
    }
    
    const { userId } = req.params;
    
    // Check if user is updating their own profile or is admin
    if (userId !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        message: 'You are not authorized to update this user profile'
      });
    }
    
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        message: 'User not found'
      });
    }
    
    // Update user fields
    const updatableFields = [
      'username', 
      'email', 
      'profilePicture', 
      'accountType', 
      'studentId'
    ];
    
    // Only admin can update role
    if (req.user.role === 'admin' && req.body.role) {
      user.role = req.body.role;
    }
    
    updatableFields.forEach(field => {
      if (req.body[field] !== undefined) {
        user[field] = req.body[field];
      }
    });
    
    const updatedUser = await user.save();
    
    // Return user without password
    const userResponse = updatedUser.toObject();
    delete userResponse.password;
    
    return res.status(200).json({
      message: 'User updated successfully',
      user: userResponse
    });
  } catch (error) {
    console.error('Error updating user:', error);
    
    // Handle duplicate key errors (e.g., email already exists)
    if (error.code === 11000) {
      return res.status(409).json({
        message: 'Email or username already in use'
      });
    }
    
    return res.status(500).json({
      message: 'Error updating user',
      error: error.message
    });
  }
};

/**
 * Delete user (admin only)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} - Response with success message or error
 */
exports.deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const deletedUser = await User.findByIdAndDelete(userId);
    
    if (!deletedUser) {
      return res.status(404).json({
        message: 'User not found'
      });
    }
    
    return res.status(200).json({
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    return res.status(500).json({
      message: 'Error deleting user',
      error: error.message
    });
  }
};

/**
 * Register push notification token
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} - Response with success message or error
 */
exports.registerPushToken = async (req, res) => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation error', 
        errors: errors.array() 
      });
    }
    
    const { token } = req.body;
    const userId = req.user._id;
    
    // Update user with push token
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        message: 'User not found'
      });
    }
    
    // Add or update push token
    user.pushTokens = user.pushTokens || [];
    
    // Check if token already exists
    const tokenExists = user.pushTokens.includes(token);
    
    if (!tokenExists) {
      user.pushTokens.push(token);
      await user.save();
    }
    
    return res.status(200).json({
      message: 'Push notification token registered successfully'
    });
  } catch (error) {
    console.error('Error registering push token:', error);
    return res.status(500).json({
      message: 'Error registering push notification token',
      error: error.message
    });
  }
}; 