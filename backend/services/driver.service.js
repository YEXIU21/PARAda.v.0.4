/**
 * Driver Service
 * Handles driver management, including profile updates, location updates, and status changes
 */
const Driver = require('../models/driver.model');
const User = require('../models/user.model');
const Route = require('../models/route.model');
const Trip = require('../models/trip.model');
const Notification = require('../models/notification.model');
const mongoose = require('mongoose');

/**
 * Get all drivers
 * @param {Object} filter - Filter criteria
 * @returns {Promise<Array>} - List of drivers
 */
exports.getDrivers = async (filter = {}) => {
  try {
    const query = {};
    
    // Apply filters
    if (filter.status) {
      query.status = filter.status;
    }
    
    if (filter.vehicleType) {
      query.vehicleType = filter.vehicleType;
    }
    
    if (filter.verified !== undefined) {
      query.verified = filter.verified;
    }
    
    if (filter.routeId) {
      query.routeId = filter.routeId;
    }

    const drivers = await Driver.find(query)
      .populate('userId', 'username email profilePicture')
      .populate('routeId', 'name');
    
    return drivers;
  } catch (error) {
    throw error;
  }
};

/**
 * Get a driver by ID
 * @param {string} driverId - Driver ID
 * @returns {Promise<Object>} - Driver data
 */
exports.getDriverById = async (driverId) => {
  try {
    const driver = await Driver.findById(driverId)
      .populate('userId', 'username email profilePicture')
      .populate('routeId', 'name stops schedule');
    
    if (!driver) {
      throw new Error('Driver not found');
    }
    
    return driver;
  } catch (error) {
    throw error;
  }
};

/**
 * Get a driver by user ID
 * @param {string} userId - User ID
 * @returns {Promise<Object>} - Driver data
 */
exports.getDriverByUserId = async (userId) => {
  try {
    const driver = await Driver.findOne({ userId })
      .populate('userId', 'username email profilePicture')
      .populate('routeId', 'name stops schedule');
    
    if (!driver) {
      throw new Error('Driver not found');
    }
    
    return driver;
  } catch (error) {
    throw error;
  }
};

/**
 * Create a new driver profile
 * @param {Object} driverData - Driver data
 * @returns {Promise<Object>} - Created driver
 */
exports.createDriver = async (driverData) => {
  try {
    // Check if user exists
    const user = await User.findById(driverData.userId);
    if (!user) {
      throw new Error('User not found');
    }
    
    // Check if user already has a driver profile
    const existingDriver = await Driver.findOne({ userId: driverData.userId });
    if (existingDriver) {
      throw new Error('Driver profile already exists for this user');
    }
    
    // Update user role if not already a driver
    if (user.role !== 'driver') {
      user.role = 'driver';
      await user.save();
    }
    
    // Create driver profile
    const driver = new Driver({
      userId: driverData.userId,
      routeNumber: driverData.routeNumber,
      status: driverData.status || 'inactive',
      vehicleType: driverData.vehicleType,
      vehicleDetails: driverData.vehicleDetails || {
        licensePlate: driverData.licensePlate,
        model: driverData.vehicleModel || '',
        capacity: driverData.vehicleCapacity || 0
      },
      verified: driverData.verified || false,
      lastActive: new Date()
    });
    
    const savedDriver = await driver.save();
    
    // If route is specified, assign driver to route
    if (driverData.routeId) {
      const route = await Route.findById(driverData.routeId);
      if (route) {
        driver.routeId = driverData.routeId;
        await driver.save();
        
        if (!route.drivers.includes(savedDriver._id)) {
          route.drivers.push(savedDriver._id);
          await route.save();
        }
      }
    }
    
    return await Driver.findById(savedDriver._id)
      .populate('userId', 'username email profilePicture')
      .populate('routeId', 'name');
  } catch (error) {
    throw error;
  }
};

/**
 * Update a driver's profile
 * @param {string} driverId - Driver ID
 * @param {Object} updateData - Data to update
 * @returns {Promise<Object>} - Updated driver
 */
exports.updateDriver = async (driverId, updateData) => {
  try {
    const driver = await Driver.findById(driverId);
    if (!driver) {
      throw new Error('Driver not found');
    }
    
    // Update driver fields
    const updatableFields = [
      'routeNumber', 
      'status', 
      'vehicleType', 
      'vehicleDetails',
      'verified',
      'location'
    ];
    
    updatableFields.forEach(field => {
      if (updateData[field] !== undefined) {
        if (field === 'vehicleDetails' && typeof updateData[field] === 'object') {
          // Merge vehicleDetails object
          driver.vehicleDetails = {
            ...driver.vehicleDetails,
            ...updateData[field]
          };
        } else {
          driver[field] = updateData[field];
        }
      }
    });
    
    // Update lastActive if status is changing
    if (updateData.status) {
      driver.lastActive = new Date();
    }
    
    const updatedDriver = await driver.save();
    
    return await Driver.findById(updatedDriver._id)
      .populate('userId', 'username email profilePicture')
      .populate('routeId', 'name');
  } catch (error) {
    throw error;
  }
};

/**
 * Update driver's location
 * @param {string} driverId - Driver ID
 * @param {Object} location - Location coordinates
 * @returns {Promise<Object>} - Updated driver
 */
exports.updateDriverLocation = async (driverId, location) => {
  try {
    const driver = await Driver.findById(driverId);
    if (!driver) {
      throw new Error('Driver not found');
    }
    
    // Update location and lastActive
    driver.location = location;
    driver.lastActive = new Date();
    
    await driver.save();
    
    return { success: true, location };
  } catch (error) {
    throw error;
  }
};

/**
 * Update driver's status
 * @param {string} driverId - Driver ID
 * @param {string} status - New status ('active', 'offline', 'inactive')
 * @returns {Promise<Object>} - Updated driver
 */
exports.updateDriverStatus = async (driverId, status) => {
  try {
    const driver = await Driver.findById(driverId);
    if (!driver) {
      throw new Error('Driver not found');
    }
    
    // Validate status
    const validStatuses = ['active', 'offline', 'inactive'];
    if (!validStatuses.includes(status)) {
      throw new Error('Invalid status. Must be one of: ' + validStatuses.join(', '));
    }
    
    // Update status and lastActive
    driver.status = status;
    driver.lastActive = new Date();
    driver.lastStatusUpdate = new Date();
    
    await driver.save();
    
    return await Driver.findById(driverId)
      .populate('userId', 'username email profilePicture')
      .populate('routeId', 'name');
  } catch (error) {
    throw error;
  }
};

/**
 * Verify a driver
 * @param {string} driverId - Driver ID
 * @param {boolean} verified - Verification status
 * @returns {Promise<Object>} - Updated driver
 */
exports.verifyDriver = async (driverId, verified = true) => {
  try {
    const driver = await Driver.findById(driverId);
    if (!driver) {
      throw new Error('Driver not found');
    }
    
    // Update verification status
    driver.verified = verified;
    driver.verificationDate = new Date();
    driver.lastActive = new Date();
    
    const updatedDriver = await driver.save();
    
    // Get user details
    const user = await User.findById(driver.userId);
    
    // Create notification for driver
    if (user) {
      const notification = new Notification({
        userId: driver.userId,
        title: verified ? 'Account Verified' : 'Account Verification Update',
        message: verified 
          ? 'Your driver account has been verified. You can now accept ride requests.'
          : 'Your driver account verification status has been updated. Please check your profile for details.',
        type: verified ? 'success' : 'info',
        category: 'user'
      });
      
      await notification.save();
    }
    
    return await Driver.findById(updatedDriver._id)
      .populate('userId', 'username email profilePicture')
      .populate('routeId', 'name');
  } catch (error) {
    throw error;
  }
};

/**
 * Add document to driver's profile
 * @param {string} driverId - Driver ID
 * @param {Object} document - Document data
 * @returns {Promise<Object>} - Updated driver
 */
exports.addDriverDocument = async (driverId, document) => {
  try {
    const driver = await Driver.findById(driverId);
    if (!driver) {
      throw new Error('Driver not found');
    }
    
    // Validate document data
    if (!document.type || !document.url) {
      throw new Error('Document type and URL are required');
    }
    
    // Add document
    driver.documents.push({
      type: document.type,
      url: document.url,
      verified: false,
      uploadDate: new Date()
    });
    
    const updatedDriver = await driver.save();
    
    // Create notification for admin
    const adminNotification = new Notification({
      title: 'New Driver Document',
      message: `Driver ${driver._id} has uploaded a new ${document.type} document.`,
      type: 'info',
      category: 'user',
      relatedId: driver._id,
      relatedModel: 'Driver',
      data: {
        documentType: document.type,
        driverId: driver._id
      }
    });
    
    await adminNotification.save();
    
    return await Driver.findById(updatedDriver._id)
      .populate('userId', 'username email profilePicture')
      .populate('routeId', 'name');
  } catch (error) {
    throw error;
  }
};

/**
 * Verify driver's document
 * @param {string} driverId - Driver ID
 * @param {string} documentId - Document ID
 * @param {boolean} verified - Verification status
 * @returns {Promise<Object>} - Updated driver
 */
exports.verifyDriverDocument = async (driverId, documentId, verified = true) => {
  try {
    const driver = await Driver.findById(driverId);
    if (!driver) {
      throw new Error('Driver not found');
    }
    
    // Find document
    const documentIndex = driver.documents.findIndex(doc => doc._id.toString() === documentId);
    if (documentIndex === -1) {
      throw new Error('Document not found');
    }
    
    // Update document verification status
    driver.documents[documentIndex].verified = verified;
    
    const updatedDriver = await driver.save();
    
    // Create notification for driver
    const notification = new Notification({
      userId: driver.userId,
      title: 'Document Verification Update',
      message: verified 
        ? `Your ${driver.documents[documentIndex].type} document has been verified.`
        : `Your ${driver.documents[documentIndex].type} document verification status has been updated.`,
      type: verified ? 'success' : 'info',
      category: 'user'
    });
    
    await notification.save();
    
    return await Driver.findById(updatedDriver._id)
      .populate('userId', 'username email profilePicture')
      .populate('routeId', 'name');
  } catch (error) {
    throw error;
  }
};

/**
 * Get nearby drivers
 * @param {Object} location - Location coordinates
 * @param {string} vehicleType - Optional vehicle type filter
 * @param {number} maxDistance - Maximum distance in meters
 * @returns {Promise<Array>} - Array of nearby drivers
 */
exports.getNearbyDrivers = async (location, vehicleType, maxDistance = 5000) => {
  try {
    // Build query
    const query = {
      status: 'active',
      verified: true,
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [location.longitude, location.latitude]
          },
          $maxDistance: maxDistance
        }
      }
    };
    
    if (vehicleType) {
      query.vehicleType = vehicleType;
    }
    
    // Get nearby drivers
    const drivers = await Driver.find(query)
      .populate('userId', 'username profilePicture')
      .populate('routeId', 'name');
    
    // Format response
    return drivers.map(driver => ({
      id: driver._id,
      userId: driver.userId._id,
      username: driver.userId.username,
      profilePicture: driver.userId.profilePicture,
      vehicleType: driver.vehicleType,
      licensePlate: driver.licensePlate,
      vehicleModel: driver.vehicleModel,
      routeId: driver.routeId ? driver.routeId._id : null,
      routeName: driver.routeId ? driver.routeId.name : null,
      location: {
        latitude: driver.location.coordinates[1],
        longitude: driver.location.coordinates[0]
      },
      rating: driver.rating,
      status: driver.status
    }));
  } catch (error) {
    console.error('Error getting nearby drivers:', error);
    throw error;
  }
};

/**
 * Get driver's assigned routes
 * @param {string} driverId - Driver ID
 * @returns {Promise<Array>} - List of routes assigned to the driver
 */
exports.getDriverRoutes = async (driverId) => {
  try {
    const driver = await Driver.findById(driverId);
    if (!driver) {
      throw new Error('Driver not found');
    }
    
    // If driver has a routeId, fetch that route
    if (driver.routeId) {
      const route = await Route.findById(driver.routeId)
        .populate('stops')
        .populate('drivers');
      
      return route ? [route] : [];
    }
    
    // If no specific route is assigned, find all routes where this driver is in the drivers array
    const routes = await Route.find({ drivers: driverId })
      .populate('stops')
      .populate('drivers');
    
    return routes;
  } catch (error) {
    throw error;
  }
};

/**
 * Update driver's trip status
 * @param {string} driverId - Driver ID
 * @param {string} routeId - Route ID
 * @param {string} status - Trip status ('waiting', 'in_progress', 'completed', 'cancelled')
 * @param {Object} location - Optional location coordinates
 * @returns {Promise<Object>} - Updated trip information
 */
exports.updateTripStatus = async (driverId, routeId, status, location = null) => {
  try {
    // Verify driver exists
    const driver = await Driver.findById(driverId);
    if (!driver) {
      throw new Error('Driver not found');
    }
    
    // Verify route exists
    const route = await Route.findOne({ 
      $or: [
        { _id: routeId },
        { routeNumber: routeId }
      ]
    });
    
    if (!route) {
      throw new Error('Route not found');
    }
    
    // Create or update trip record
    let trip = await Trip.findOne({
      driverId,
      routeId: route._id,
      status: { $nin: ['completed', 'cancelled'] }
    });
    
    if (!trip) {
      // Create new trip if none exists
      trip = new Trip({
        driverId,
        routeId: route._id,
        status,
        startTime: new Date(),
        locations: location ? [{ location, timestamp: new Date() }] : []
      });
    } else {
      // Update existing trip
      trip.status = status;
      
      // Add location if provided
      if (location) {
        trip.locations.push({
          location,
          timestamp: new Date()
        });
      }
      
      // Set end time if trip is completed or cancelled
      if (status === 'completed' || status === 'cancelled') {
        trip.endTime = new Date();
      }
    }
    
    await trip.save();
    
    // Update driver's active trip reference
    if (status === 'in_progress') {
      driver.activeTrip = trip._id;
    } else if (status === 'completed' || status === 'cancelled') {
      driver.activeTrip = null;
    }
    
    // Update driver location if provided
    if (location) {
      driver.location = location;
      driver.lastActive = new Date();
    }
    
    await driver.save();
    
    return trip;
  } catch (error) {
    console.error('Error updating trip status:', error);
    throw error;
  }
}; 