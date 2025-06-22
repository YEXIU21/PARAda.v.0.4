/**
 * Ride Service
 * Handles ride requests, assignments, and status updates
 */
const Ride = require('../models/ride.model');
const Driver = require('../models/driver.model');
const Route = require('../models/route.model');
const User = require('../models/user.model');
const Notification = require('../models/notification.model');
const { mapsClient, API_KEY, defaultOptions } = require('../config/maps.config');
const notificationService = require('./notification.service');

/**
 * Request a new ride
 * @param {Object} rideData - Ride request data
 * @returns {Promise<Object>} - Created ride
 */
async function requestRide(rideData) {
  try {
    // Validate route if provided
    if (rideData.routeId) {
      const route = await Route.findById(rideData.routeId);
      if (!route) {
        throw new Error('Route not found');
      }
    }
    
    // Create ride request
    const ride = new Ride({
      userId: rideData.userId,
      routeId: rideData.routeId,
      pickupLocation: rideData.pickupLocation,
      destination: rideData.destination,
      vehicleType: rideData.vehicleType,
      requestTime: new Date(),
      status: 'waiting',
      fare: rideData.fare || 0,
      estimatedDistance: rideData.estimatedDistance || 0,
      estimatedDuration: rideData.estimatedDuration || 0
    });
    
    await ride.save();
    
    // Get user details for notifications
    const user = await User.findById(rideData.userId);
    
    // Notify available drivers on this route
    if (rideData.routeId) {
      const drivers = await Driver.find({
        routeId: rideData.routeId,
        status: 'active'
      }).populate('userId');
      
      // Send notifications to drivers
      drivers.forEach(async (driver) => {
        if (driver.userId) {
          await notificationService.createNotification({
            userId: driver.userId._id,
            title: 'New Ride Request',
            message: `A passenger is requesting a ride near your route`,
            type: 'info',
            category: 'ride',
            data: {
              rideId: ride._id,
              pickupLocation: ride.pickupLocation,
              destination: ride.destination
            }
          });
        }
      });
    }
    
    // Return populated ride
    return await Ride.findById(ride._id)
      .populate('userId', 'username profilePicture')
      .populate('routeId', 'name')
      .populate({
        path: 'driverId',
        populate: {
          path: 'userId',
          select: 'username profilePicture'
        }
      });
  } catch (error) {
    console.error('Error requesting ride:', error);
    throw error;
  }
}

/**
 * Get user's ride history
 * @param {string} userId - User ID
 * @param {number} limit - Maximum number of rides to return
 * @param {number} skip - Number of rides to skip
 * @returns {Promise<Array>} - Array of rides
 */
async function getUserRideHistory(userId, limit = 10, skip = 0) {
  try {
    const rides = await Ride.find({ userId })
      .sort({ requestTime: -1 })
      .skip(skip)
      .limit(limit)
      .populate('driverId', 'userId vehicleType licensePlate rating')
      .populate('routeId', 'name');
    
    return rides;
  } catch (error) {
    console.error(`Error getting ride history for user ${userId}:`, error);
    throw error;
  }
}

/**
 * Get driver's active rides
 * @param {string} driverId - Driver ID
 * @returns {Promise<Array>} - Array of active rides
 */
async function getDriverActiveRides(driverId) {
  try {
    const rides = await Ride.find({
      driverId,
      status: { $in: ['assigned', 'picked_up'] }
    })
      .sort({ assignmentTime: -1 })
      .populate('userId', 'username profilePicture')
      .populate('routeId', 'name');
    
    return rides;
  } catch (error) {
    console.error(`Error getting active rides for driver ${driverId}:`, error);
    throw error;
  }
}

/**
 * Assign a driver to a ride
 * @param {string} rideId - Ride ID
 * @param {string} driverId - Driver ID
 * @returns {Promise<Object>} - Updated ride
 */
async function assignDriver(rideId, driverId) {
  try {
    // Check if ride exists and is available
    const ride = await Ride.findById(rideId);
    if (!ride) {
      throw new Error('Ride not found');
    }
    
    if (ride.status !== 'waiting') {
      throw new Error('Ride is no longer available');
    }
    
    // Check if driver exists
    const driver = await Driver.findById(driverId).populate('userId');
    if (!driver) {
      throw new Error('Driver not found');
    }
    
    // Update ride
    ride.driverId = driverId;
    ride.status = 'assigned';
    ride.assignmentTime = new Date();
    
    // Calculate estimated arrival time (5-15 minutes from now)
    const arrivalMinutes = Math.floor(Math.random() * 10) + 5; // 5-15 minutes
    const estimatedArrival = new Date();
    estimatedArrival.setMinutes(estimatedArrival.getMinutes() + arrivalMinutes);
    ride.estimatedArrival = estimatedArrival;
    
    await ride.save();
    
    // Update driver status
    driver.status = 'busy';
    await driver.save();
    
    // Notify passenger
    const user = await User.findById(ride.userId);
    if (user) {
      await notificationService.createNotification({
        userId: user._id,
        title: 'Driver Assigned',
        message: `${driver.userId.username} has been assigned to your ride`,
        type: 'success',
        category: 'ride',
        data: {
          rideId: ride._id,
          driverId: driver._id,
          driverName: driver.userId.username,
          estimatedArrival: ride.estimatedArrival
        }
      });
    }
    
    // Return populated ride
    return await Ride.findById(rideId)
      .populate('userId', 'username profilePicture')
      .populate('routeId', 'name')
      .populate({
        path: 'driverId',
        populate: {
          path: 'userId',
          select: 'username profilePicture'
        }
      });
  } catch (error) {
    console.error(`Error assigning driver ${driverId} to ride ${rideId}:`, error);
    throw error;
  }
}

/**
 * Update ride status
 * @param {string} rideId - Ride ID
 * @param {string} status - New status
 * @param {Object} updateData - Additional data for the update
 * @returns {Promise<Object>} - Updated ride
 */
async function updateRideStatus(rideId, status, updateData = {}) {
  try {
    // Check if ride exists
    const ride = await Ride.findById(rideId);
    if (!ride) {
      throw new Error('Ride not found');
    }
    
    // Update ride status and related fields
    ride.status = status;
    
    switch (status) {
      case 'picked_up':
        ride.pickupTime = new Date();
        break;
      case 'completed':
        ride.completionTime = new Date();
        if (updateData.rating) {
          ride.rating = updateData.rating;
        }
        if (updateData.feedback) {
          ride.feedback = updateData.feedback;
        }
        
        // Update driver stats if available
        if (ride.driverId) {
          const driver = await Driver.findById(ride.driverId);
          if (driver) {
            if (updateData.rating) {
              await driver.updateRating(updateData.rating);
            }
            await driver.updateRideStats('completed');
            
            // Update driver status back to active
            driver.status = 'active';
            await driver.save();
          }
        }
        break;
      case 'cancelled':
        ride.cancellationTime = new Date();
        ride.cancellationReason = updateData.reason || 'No reason provided';
        ride.cancelledBy = updateData.cancelledBy || 'user';
        
        // Update driver stats and status if available
        if (ride.driverId) {
          const driver = await Driver.findById(ride.driverId);
          if (driver) {
            await driver.updateRideStats('cancelled');
            
            // Update driver status back to active
            driver.status = 'active';
            await driver.save();
          }
        }
        break;
    }
    
    await ride.save();
    
    // Send notifications based on status change
    if (ride.userId) {
      let notificationTitle = '';
      let notificationMessage = '';
      let notificationType = 'info';
      
      switch (status) {
        case 'picked_up':
          notificationTitle = 'Driver Arrived';
          notificationMessage = 'Your driver has arrived at the pickup location';
          notificationType = 'success';
          break;
        case 'completed':
          notificationTitle = 'Ride Completed';
          notificationMessage = 'Your ride has been completed successfully';
          notificationType = 'success';
          break;
        case 'cancelled':
          notificationTitle = 'Ride Cancelled';
          notificationMessage = `Your ride has been cancelled. Reason: ${ride.cancellationReason}`;
          notificationType = 'warning';
          break;
      }
      
      if (notificationTitle) {
        await notificationService.createNotification({
          userId: ride.userId,
          title: notificationTitle,
          message: notificationMessage,
          type: notificationType,
          category: 'ride',
          data: {
            rideId: ride._id,
            status
          }
        });
      }
    }
    
    // Return populated ride
    return await Ride.findById(rideId)
      .populate('userId', 'username profilePicture')
      .populate('routeId', 'name')
      .populate({
        path: 'driverId',
        populate: {
          path: 'userId',
          select: 'username profilePicture'
        }
      });
  } catch (error) {
    console.error(`Error updating ride ${rideId} status to ${status}:`, error);
    throw error;
  }
}

/**
 * Get ride by ID
 * @param {string} rideId - Ride ID
 * @returns {Promise<Object>} - Ride object
 */
async function getRideById(rideId) {
  try {
    const ride = await Ride.findById(rideId)
      .populate('userId', 'username profilePicture')
      .populate('routeId', 'name')
      .populate({
        path: 'driverId',
        populate: {
          path: 'userId',
          select: 'username profilePicture'
        }
      });
    
    if (!ride) {
      throw new Error('Ride not found');
    }
    
    return ride;
  } catch (error) {
    console.error(`Error getting ride ${rideId}:`, error);
    throw error;
  }
}

module.exports = {
  requestRide,
  getUserRideHistory,
  getDriverActiveRides,
  assignDriver,
  updateRideStatus,
  getRideById
}; 