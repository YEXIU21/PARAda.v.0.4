/**
 * Authentication Service
 * Handles user authentication, registration and token verification
 */
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
const Driver = require('../models/driver.model');
const { secret, jwtExpiration } = require('../config/auth.config');

/**
 * Register a new user
 * @param {Object} userData - User registration data
 * @returns {Promise<Object>} - Newly created user object
 */
exports.register = async (userData) => {
  try {
    // Create the user
    const user = new User({
      username: userData.username,
      email: userData.email,
      password: userData.password, // Will be hashed by pre-save hook
      role: userData.role || 'passenger',
      accountType: userData.accountType || 'regular',
      studentId: userData.studentId
    });

    const savedUser = await user.save();

    // If registering as driver, create driver profile
    if (userData.role === 'driver' && userData.licensePlate) {
      const driver = new Driver({
        userId: savedUser._id,
        routeId: null,
        vehicleType: userData.vehicleType || 'jeep',
        vehicleDetails: {
          licensePlate: userData.licensePlate,
          model: userData.vehicleModel || '',
          capacity: userData.vehicleCapacity || 4
        },
        status: 'inactive',
        verified: false
      });
      
      await driver.save();
    }

    // Return user without password
    const userResponse = savedUser.toObject();
    delete userResponse.password;
    
    return userResponse;
  } catch (error) {
    throw error;
  }
};

/**
 * Authenticate user and generate JWT token
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise<Object>} - User data and JWT token
 */
exports.login = async (email, password) => {
  try {
    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      throw new Error('User not found');
    }

    // Check if account is active
    if (!user.isActive) {
      throw new Error('Account disabled');
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      throw new Error('Invalid password');
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, role: user.role },
      secret,
      { expiresIn: jwtExpiration }
    );

    // Get additional user data if driver
    let driverData = null;
    if (user.role === 'driver') {
      driverData = await Driver.findOne({ userId: user._id });
    }

    // Return user data and token
    const userResponse = user.toObject();
    delete userResponse.password;
    
    return {
      user: userResponse,
      driverData,
      accessToken: token
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Verify JWT token
 * @param {string} token - JWT token
 * @returns {Promise<Object>} - Decoded token data
 */
exports.verifyToken = async (token) => {
  try {
    const decoded = jwt.verify(token, secret);
    
    // Check if user exists
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      throw new Error('User not found');
    }
    
    return {
      user,
      decoded
    };
  } catch (error) {
    throw error;
  }
}; 