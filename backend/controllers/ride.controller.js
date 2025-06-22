/**
 * Ride Controller
 * Handles ride requests, assignments, and status updates
 */
const { validationResult } = require('express-validator');
const rideService = require('../services/ride.service');
const driverService = require('../services/driver.service');
const socketService = require('../services/socket.service');

/**
 * Request a new ride
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} - Response with created ride or error
 */
exports.requestRide = async (req, res) => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation error', 
        errors: errors.array() 
      });
    }
    
    // Add user ID to ride data
    const rideData = {
      ...req.body,
      userId: req.user._id
    };
    
    const ride = await rideService.requestRide(rideData);
    
    // Notify nearby drivers about the new ride request
    if (ride.routeId) {
      socketService.broadcast({
        type: 'new_ride_request',
        rideId: ride._id.toString(),
        userId: req.user._id.toString(),
        routeId: ride.routeId.toString(),
        pickup: ride.pickupLocation,
        destination: ride.destination,
        timestamp: new Date().toISOString()
      });
    }
    
    return res.status(201).json({
      message: 'Ride request created successfully',
      ride
    });
  } catch (error) {
    console.error('Error requesting ride:', error);
    
    if (error.message === 'Route not found') {
      return res.status(404).json({
        message: 'Route not found'
      });
    }
    
    return res.status(500).json({
      message: 'Error creating ride request',
      error: error.message
    });
  }
};

/**
 * Get user's ride history
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} - Response with rides or error
 */
exports.getUserRideHistory = async (req, res) => {
  try {
    // Get pagination parameters
    const limit = parseInt(req.query.limit) || 10;
    const skip = parseInt(req.query.skip) || 0;
    
    const rides = await rideService.getUserRideHistory(req.user._id, limit, skip);
    
    return res.status(200).json({
      rides
    });
  } catch (error) {
    console.error('Error getting user ride history:', error);
    return res.status(500).json({
      message: 'Error retrieving ride history',
      error: error.message
    });
  }
};

/**
 * Get driver's active rides
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} - Response with rides or error
 */
exports.getDriverActiveRides = async (req, res) => {
  try {
    const { driverId } = req.params;
    
    const rides = await rideService.getDriverActiveRides(driverId);
    
    return res.status(200).json({
      rides
    });
  } catch (error) {
    console.error('Error getting driver active rides:', error);
    return res.status(500).json({
      message: 'Error retrieving active rides',
      error: error.message
    });
  }
};

/**
 * Assign a driver to a ride
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} - Response with updated ride or error
 */
exports.assignDriver = async (req, res) => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation error', 
        errors: errors.array() 
      });
    }
    
    const { rideId } = req.params;
    const { driverId } = req.body;
    
    const ride = await rideService.assignDriver(rideId, driverId);
    
    // Notify the user that a driver has been assigned
    if (ride.userId) {
      socketService.sendToUser(ride.userId.toString(), {
        type: 'driver_assigned',
        rideId: ride._id.toString(),
        driverId: driverId,
        driverDetails: ride.driverDetails,
        estimatedArrival: ride.estimatedArrival
      });
    }
    
    return res.status(200).json({
      message: 'Driver assigned to ride successfully',
      ride
    });
  } catch (error) {
    console.error('Error assigning driver to ride:', error);
    
    if (error.message === 'Ride not found') {
      return res.status(404).json({
        message: 'Ride not found'
      });
    }
    
    if (error.message === 'Driver not found') {
      return res.status(404).json({
        message: 'Driver not found'
      });
    }
    
    if (error.message === 'Ride is no longer available') {
      return res.status(400).json({
        message: 'Ride is no longer available'
      });
    }
    
    return res.status(500).json({
      message: 'Error assigning driver to ride',
      error: error.message
    });
  }
};

/**
 * Update ride status
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} - Response with updated ride or error
 */
exports.updateRideStatus = async (req, res) => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation error', 
        errors: errors.array() 
      });
    }
    
    const { rideId } = req.params;
    const { status, reason, rating, feedback } = req.body;
    
    // Additional data for the status update
    const updateData = {
      reason,
      rating,
      feedback,
      cancelledBy: req.user.role // To track who cancelled the ride
    };
    
    const ride = await rideService.updateRideStatus(rideId, status, updateData);
    
    // Notify relevant parties about the status change
    if (ride.userId && ride.driverId) {
      const statusUpdate = {
        type: 'ride_status_update',
        rideId: ride._id.toString(),
        status: status,
        timestamp: new Date().toISOString()
      };
      
      // Notify passenger
      socketService.sendToUser(ride.userId.toString(), statusUpdate);
      
      // Notify driver (if different from the current user)
      if (ride.driverId.toString() !== req.user._id.toString()) {
        socketService.sendToUser(ride.driverId.toString(), statusUpdate);
      }
    }
    
    return res.status(200).json({
      message: `Ride status updated to ${status}`,
      ride
    });
  } catch (error) {
    console.error('Error updating ride status:', error);
    
    if (error.message === 'Ride not found') {
      return res.status(404).json({
        message: 'Ride not found'
      });
    }
    
    return res.status(500).json({
      message: 'Error updating ride status',
      error: error.message
    });
  }
};

/**
 * Rate a completed ride
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} - Response with updated ride or error
 */
exports.rateRide = async (req, res) => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation error', 
        errors: errors.array() 
      });
    }
    
    const { rideId } = req.params;
    const { rating, feedback } = req.body;
    
    // Update ride with rating and feedback
    const ride = await rideService.updateRideStatus(rideId, 'completed', { rating, feedback });
    
    return res.status(200).json({
      message: 'Ride rated successfully',
      ride
    });
  } catch (error) {
    console.error('Error rating ride:', error);
    
    if (error.message === 'Ride not found') {
      return res.status(404).json({
        message: 'Ride not found'
      });
    }
    
    return res.status(500).json({
      message: 'Error rating ride',
      error: error.message
    });
  }
};

/**
 * Get ride by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} - Response with ride or error
 */
exports.getRideById = async (req, res) => {
  try {
    const { rideId } = req.params;
    
    const ride = await rideService.getRideById(rideId);
    
    // Check if user is authorized to view this ride
    if (ride.userId.toString() !== req.user._id.toString() && 
        (!ride.driverId || ride.driverId.toString() !== req.user._id.toString()) && 
        req.user.role !== 'admin') {
      return res.status(403).json({
        message: 'You are not authorized to view this ride'
      });
    }
    
    return res.status(200).json({
      ride
    });
  } catch (error) {
    console.error('Error getting ride by ID:', error);
    
    if (error.message === 'Ride not found') {
      return res.status(404).json({
        message: 'Ride not found'
      });
    }
    
    return res.status(500).json({
      message: 'Error retrieving ride',
      error: error.message
    });
  }
};

/**
 * Get nearby available drivers
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} - Response with drivers or error
 */
exports.getNearbyDrivers = async (req, res) => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation error', 
        errors: errors.array() 
      });
    }
    
    const { location } = req.body;
    const { vehicleType } = req.query;
    
    if (!location || !location.latitude || !location.longitude) {
      return res.status(400).json({
        message: 'Valid location is required'
      });
    }
    
    // Get nearby drivers
    const drivers = await driverService.getNearbyDrivers(
      location,
      vehicleType,
      5000 // 5km radius
    );
    
    return res.status(200).json({
      drivers
    });
  } catch (error) {
    console.error('Error getting nearby drivers:', error);
    return res.status(500).json({
      message: 'Error retrieving nearby drivers',
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
    const { latitude, longitude, rideId } = req.body;
    
    // Update driver location
    await driverService.updateDriverLocation(driverId, { latitude, longitude });
    
    // If ride ID is provided, broadcast location to the passenger
    if (rideId) {
      const ride = await rideService.getRideById(rideId);
      
      if (ride && ride.userId) {
        socketService.sendToUser(ride.userId.toString(), {
          type: 'driver_location_update',
          rideId: rideId,
          driverId: driverId,
          location: { latitude, longitude },
          timestamp: new Date().toISOString()
        });
      }
    }
    
    return res.status(200).json({
      message: 'Driver location updated successfully',
      location: { latitude, longitude }
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