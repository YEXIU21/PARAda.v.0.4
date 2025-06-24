/**
 * Driver Controller
 * Handles driver management operations
 */
const { validationResult } = require('express-validator');
const driverService = require('../services/driver.service');

/**
 * Get all drivers
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} - Response with drivers or error
 */
exports.getDrivers = async (req, res) => {
  try {
    // Get filter parameters
    const filter = {
      status: req.query.status,
      vehicleType: req.query.vehicleType,
      verified: req.query.verified === 'true' ? true : (req.query.verified === 'false' ? false : undefined),
      routeId: req.query.routeId
    };
    
    const drivers = await driverService.getDrivers(filter);
    
    return res.status(200).json({
      drivers
    });
  } catch (error) {
    console.error('Error getting drivers:', error);
    return res.status(500).json({
      message: 'Error retrieving drivers',
      error: error.message
    });
  }
};

/**
 * Get driver by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} - Response with driver or error
 */
exports.getDriverById = async (req, res) => {
  try {
    const { driverId } = req.params;
    
    const driver = await driverService.getDriverById(driverId);
    
    return res.status(200).json({
      driver
    });
  } catch (error) {
    console.error('Error getting driver by ID:', error);
    
    if (error.message === 'Driver not found') {
      return res.status(404).json({
        message: 'Driver not found'
      });
    }
    
    return res.status(500).json({
      message: 'Error retrieving driver',
      error: error.message
    });
  }
};

/**
 * Get driver by user ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} - Response with driver or error
 */
exports.getDriverByUserId = async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Check if user is requesting their own driver profile or is admin
    if (userId !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        message: 'You are not authorized to view this driver profile'
      });
    }
    
    const driver = await driverService.getDriverByUserId(userId);
    
    return res.status(200).json({
      driver
    });
  } catch (error) {
    console.error('Error getting driver by user ID:', error);
    
    if (error.message === 'Driver not found') {
      return res.status(404).json({
        message: 'Driver not found'
      });
    }
    
    return res.status(500).json({
      message: 'Error retrieving driver',
      error: error.message
    });
  }
};

/**
 * Create a new driver profile
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} - Response with created driver or error
 */
exports.createDriver = async (req, res) => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation error', 
        errors: errors.array() 
      });
    }
    
    const driver = await driverService.createDriver(req.body);
    
    return res.status(201).json({
      message: 'Driver profile created successfully',
      driver
    });
  } catch (error) {
    console.error('Error creating driver:', error);
    
    if (error.message === 'User not found') {
      return res.status(404).json({
        message: 'User not found'
      });
    }
    
    if (error.message === 'Driver profile already exists for this user') {
      return res.status(409).json({
        message: 'Driver profile already exists for this user'
      });
    }
    
    return res.status(500).json({
      message: 'Error creating driver profile',
      error: error.message
    });
  }
};

/**
 * Update driver profile
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} - Response with updated driver or error
 */
exports.updateDriver = async (req, res) => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation error', 
        errors: errors.array() 
      });
    }
    
    const { driverId } = req.params;
    
    const driver = await driverService.updateDriver(driverId, req.body);
    
    return res.status(200).json({
      message: 'Driver profile updated successfully',
      driver
    });
  } catch (error) {
    console.error('Error updating driver:', error);
    
    if (error.message === 'Driver not found') {
      return res.status(404).json({
        message: 'Driver not found'
      });
    }
    
    return res.status(500).json({
      message: 'Error updating driver profile',
      error: error.message
    });
  }
};

/**
 * Update driver location
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} - Response with success message or error
 */
exports.updateDriverLocation = async (req, res) => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation error', 
        errors: errors.array() 
      });
    }
    
    const { driverId } = req.params;
    const { latitude, longitude } = req.body;
    
    const result = await driverService.updateDriverLocation(driverId, { latitude, longitude });
    
    return res.status(200).json({
      message: 'Driver location updated successfully',
      location: result.location
    });
  } catch (error) {
    console.error('Error updating driver location:', error);
    
    if (error.message === 'Driver not found') {
      return res.status(404).json({
        message: 'Driver not found'
      });
    }
    
    return res.status(500).json({
      message: 'Error updating driver location',
      error: error.message
    });
  }
};

/**
 * Update driver status
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} - Response with updated driver or error
 */
exports.updateDriverStatus = async (req, res) => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation error', 
        errors: errors.array() 
      });
    }
    
    const { driverId } = req.params;
    const { status } = req.body;
    
    const driver = await driverService.updateDriverStatus(driverId, status);
    
    return res.status(200).json({
      message: `Driver status updated to ${status}`,
      driver
    });
  } catch (error) {
    console.error('Error updating driver status:', error);
    
    if (error.message === 'Driver not found') {
      return res.status(404).json({
        message: 'Driver not found'
      });
    }
    
    if (error.message && error.message.includes('Invalid status')) {
      return res.status(400).json({
        message: error.message
      });
    }
    
    return res.status(500).json({
      message: 'Error updating driver status',
      error: error.message
    });
  }
};

/**
 * Verify a driver
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} - Response with updated driver or error
 */
exports.verifyDriver = async (req, res) => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation error', 
        errors: errors.array() 
      });
    }
    
    const { driverId } = req.params;
    const { verified } = req.body;
    
    const driver = await driverService.verifyDriver(driverId, verified);
    
    return res.status(200).json({
      message: verified ? 'Driver verified successfully' : 'Driver verification updated',
      driver
    });
  } catch (error) {
    console.error('Error verifying driver:', error);
    
    if (error.message === 'Driver not found') {
      return res.status(404).json({
        message: 'Driver not found'
      });
    }
    
    return res.status(500).json({
      message: 'Error updating driver verification',
      error: error.message
    });
  }
};

/**
 * Get current driver profile (from auth token)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} - Response with driver or error
 */
exports.getDriverProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    
    const driver = await driverService.getDriverByUserId(userId);
    
    return res.status(200).json({
      driver
    });
  } catch (error) {
    console.error('Error getting driver profile:', error);
    
    if (error.message === 'Driver not found') {
      return res.status(404).json({
        message: 'Driver profile not found'
      });
    }
    
    return res.status(500).json({
      message: 'Error retrieving driver profile',
      error: error.message
    });
  }
};

/**
 * Get routes assigned to the current driver
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} - Response with routes or error
 */
exports.getDriverRoutes = async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Get driver first
    const driver = await driverService.getDriverByUserId(userId);
    
    // Get routes
    const routes = await driverService.getDriverRoutes(driver._id);
    
    return res.status(200).json({
      routes
    });
  } catch (error) {
    console.error('Error getting driver routes:', error);
    
    if (error.message === 'Driver not found') {
      return res.status(404).json({
        message: 'Driver not found'
      });
    }
    
    return res.status(500).json({
      message: 'Error retrieving driver routes',
      error: error.message
    });
  }
};

/**
 * Update current driver's status
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} - Response with updated driver or error
 */
exports.updateCurrentDriverStatus = async (req, res) => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation error', 
        errors: errors.array() 
      });
    }
    
    const userId = req.user._id;
    const { status } = req.body;
    
    // Get driver first
    const driver = await driverService.getDriverByUserId(userId);
    
    // Update the status
    const updatedDriver = await driverService.updateDriverStatus(driver._id, status);
    
    return res.status(200).json({
      message: 'Driver status updated successfully',
      driver: updatedDriver
    });
  } catch (error) {
    console.error('Error updating driver status:', error);
    
    if (error.message === 'Driver not found') {
      return res.status(404).json({
        message: 'Driver not found'
      });
    }
    
    return res.status(500).json({
      message: 'Error updating driver status',
      error: error.message
    });
  }
};

/**
 * Update current driver's location
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} - Response with success message or error
 */
exports.updateCurrentDriverLocation = async (req, res) => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation error', 
        errors: errors.array() 
      });
    }
    
    const userId = req.user._id;
    const { latitude, longitude } = req.body;
    
    // Get driver first
    const driver = await driverService.getDriverByUserId(userId);
    
    // Update location
    const result = await driverService.updateDriverLocation(driver._id, { latitude, longitude });
    
    return res.status(200).json({
      message: 'Driver location updated successfully',
      location: result.location
    });
  } catch (error) {
    console.error('Error updating driver location:', error);
    
    if (error.message === 'Driver not found') {
      return res.status(404).json({
        message: 'Driver not found'
      });
    }
    
    return res.status(500).json({
      message: 'Error updating driver location',
      error: error.message
    });
  }
};

/**
 * Update driver location via HTTP fallback (used when WebSockets aren't available)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} - Response with success message or error
 */
exports.updateLocationViaHttp = async (req, res) => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation error', 
        errors: errors.array() 
      });
    }
    
    const userId = req.user._id;
    const { location, driverId, rideId } = req.body;
    
    // If explicit driverId provided, check authorization
    let targetDriverId = driverId;
    
    if (!targetDriverId) {
      // Get driver from user ID
      const driver = await driverService.getDriverByUserId(userId);
      targetDriverId = driver._id;
    } else {
      // Check if user is authorized to update this driver's location
      if (req.user.role !== 'admin') {
        const driver = await driverService.getDriverByUserId(userId);
        if (driver._id.toString() !== targetDriverId.toString()) {
          return res.status(403).json({
            message: 'You are not authorized to update this driver\'s location'
          });
        }
      }
    }
    
    // Update location
    const result = await driverService.updateDriverLocation(targetDriverId, location);
    
    // If rideId provided, forward event to ride service
    if (rideId) {
      // Forward to socket service to emit to appropriate clients
      // This part would typically use socket.io server-side emit
      const socketService = require('../services/socket.service');
      socketService.emitDriverLocation(targetDriverId, location, rideId);
    }
    
    return res.status(200).json({
      message: 'Driver location updated successfully via HTTP',
      location: result.location
    });
  } catch (error) {
    console.error('Error updating driver location via HTTP:', error);
    
    if (error.message === 'Driver not found') {
      return res.status(404).json({
        message: 'Driver not found'
      });
    }
    
    return res.status(500).json({
      message: 'Error updating driver location',
      error: error.message
    });
  }
};

/**
 * Update trip status for a driver
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} - Response with updated trip status or error
 */
exports.updateTripStatus = async (req, res) => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation error', 
        errors: errors.array() 
      });
    }
    
    const { driverId } = req.params;
    const { routeId, status, location } = req.body;
    
    // Verify the driver exists
    const driver = await driverService.getDriverById(driverId);
    
    // Verify the user has permission to update this driver's trip
    // Only allow if the user is the driver or an admin
    if (req.user.role !== 'admin' && (!driver.userId || driver.userId.toString() !== req.user._id.toString())) {
      return res.status(403).json({
        message: 'You are not authorized to update this driver\'s trip status'
      });
    }
    
    // Update the trip status
    const result = await driverService.updateTripStatus(driverId, routeId, status, location);
    
    // If socket service is available, emit the trip status update
    try {
      const socketService = require('../services/socket.service');
      socketService.emitTripStatusUpdate({
        driverId,
        routeId,
        status,
        location,
        timestamp: new Date()
      });
    } catch (socketError) {
      console.warn('Could not emit trip status update via socket:', socketError);
    }
    
    return res.status(200).json({
      message: 'Trip status updated successfully',
      trip: result
    });
  } catch (error) {
    console.error('Error updating trip status:', error);
    
    if (error.message === 'Driver not found') {
      return res.status(404).json({
        message: 'Driver not found'
      });
    }
    
    if (error.message === 'Route not found') {
      return res.status(404).json({
        message: 'Route not found'
      });
    }
    
    return res.status(500).json({
      message: 'Error updating trip status',
      error: error.message
    });
  }
}; 