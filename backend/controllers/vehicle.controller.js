/**
 * Vehicle Controller
 * Handles all vehicle-related operations
 */
const { validationResult } = require('express-validator');
const mongoose = require('mongoose');
const Vehicle = require('../models/vehicle.model');
const Driver = require('../models/driver.model');
const vehicleService = require('../services/vehicle.service');

/**
 * Get all vehicles
 * @route GET /api/vehicles
 * @access Private/Admin
 */
exports.getAllVehicles = async (req, res) => {
  try {
    const vehicles = await Vehicle.find()
      .populate('driver', 'name phoneNumber rating')
      .populate('routeId', 'name');
    
    res.status(200).json(vehicles);
  } catch (error) {
    console.error('Error getting vehicles:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Get vehicle by ID
 * @route GET /api/vehicles/:id
 * @access Private/Admin
 */
exports.getVehicleById = async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id)
      .populate('driver', 'name phoneNumber rating')
      .populate('routeId', 'name');
    
    if (!vehicle) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }
    
    res.status(200).json(vehicle);
  } catch (error) {
    console.error('Error getting vehicle by ID:', error);
    
    if (error instanceof mongoose.Error.CastError) {
      return res.status(400).json({ message: 'Invalid vehicle ID' });
    }
    
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Get nearby vehicles
 * @route POST /api/vehicles/nearby
 * @access Public
 */
exports.getNearbyVehicles = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { latitude, longitude, radius = 2000, type } = req.body; // radius in meters
    
    // Base query
    const query = {
      status: 'available',
      'currentLocation.latitude': { $ne: null },
      'currentLocation.longitude': { $ne: null },
      active: true
    };
    
    // Add vehicle type filter if provided
    if (type) {
      query.type = type;
    }
    
    // Find vehicles with rough location filtering first
    const vehicles = await Vehicle.find({
      ...query,
      'currentLocation.latitude': { $gte: latitude - 0.05, $lte: latitude + 0.05 },
      'currentLocation.longitude': { $gte: longitude - 0.05, $lte: longitude + 0.05 }
    })
    .populate('driver', 'name phoneNumber rating')
    .populate('routeId', 'name');
    
    // Calculate actual distance and filter by radius
    const nearbyVehicles = vehicles
      .map(vehicle => {
        const distance = calculateDistance(
          latitude, longitude,
          vehicle.currentLocation.latitude, vehicle.currentLocation.longitude
        );
        return { ...vehicle.toObject(), distance };
      })
      .filter(vehicle => vehicle.distance <= radius)
      .sort((a, b) => a.distance - b.distance);
    
    res.status(200).json(nearbyVehicles);
  } catch (error) {
    console.error('Error getting nearby vehicles:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Create a new vehicle
 * @route POST /api/vehicles
 * @access Private/Admin
 */
exports.createVehicle = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const {
      type,
      plateNumber,
      capacity,
      driverId,
      routeId,
      features
    } = req.body;
    
    // Check if vehicle with same plate number already exists
    const existingVehicle = await Vehicle.findOne({ plateNumber });
    if (existingVehicle) {
      return res.status(400).json({ message: 'Vehicle with this plate number already exists' });
    }
    
    // Create new vehicle
    const newVehicle = new Vehicle({
      type,
      plateNumber,
      capacity,
      routeId,
      features
    });
    
    // Assign driver if provided
    if (driverId) {
      const driver = await Driver.findById(driverId);
      if (!driver) {
        return res.status(404).json({ message: 'Driver not found' });
      }
      
      newVehicle.driver = driverId;
      
      // Update driver's vehicle reference
      driver.vehicle = newVehicle._id;
      await driver.save();
    }
    
    await newVehicle.save();
    
    res.status(201).json(newVehicle);
  } catch (error) {
    console.error('Error creating vehicle:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Update a vehicle
 * @route PUT /api/vehicles/:id
 * @access Private/Admin
 */
exports.updateVehicle = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const updates = req.body;
    
    // Check if vehicle exists
    const vehicle = await Vehicle.findById(req.params.id);
    if (!vehicle) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }
    
    // Check if plate number is being updated and if it already exists
    if (updates.plateNumber && updates.plateNumber !== vehicle.plateNumber) {
      const existingVehicle = await Vehicle.findOne({ plateNumber: updates.plateNumber });
      if (existingVehicle) {
        return res.status(400).json({ message: 'Vehicle with this plate number already exists' });
      }
    }
    
    // Handle driver assignment/removal
    if (updates.driverId !== undefined) {
      const oldDriverId = vehicle.driver;
      
      // If driver is being removed
      if (updates.driverId === null && oldDriverId) {
        // Remove vehicle reference from old driver
        await Driver.findByIdAndUpdate(oldDriverId, { $unset: { vehicle: 1 } });
        updates.driver = null;
      } 
      // If driver is being assigned or changed
      else if (updates.driverId) {
        const newDriver = await Driver.findById(updates.driverId);
        if (!newDriver) {
          return res.status(404).json({ message: 'Driver not found' });
        }
        
        // Remove vehicle reference from old driver if exists
        if (oldDriverId) {
          await Driver.findByIdAndUpdate(oldDriverId, { $unset: { vehicle: 1 } });
        }
        
        // Update new driver's vehicle reference
        newDriver.vehicle = vehicle._id;
        await newDriver.save();
        
        updates.driver = updates.driverId;
      }
      
      // Remove driverId from updates as we've handled it separately
      delete updates.driverId;
    }
    
    const updatedVehicle = await Vehicle.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true }
    ).populate('driver', 'name phoneNumber rating');
    
    res.status(200).json(updatedVehicle);
  } catch (error) {
    console.error('Error updating vehicle:', error);
    
    if (error instanceof mongoose.Error.CastError) {
      return res.status(400).json({ message: 'Invalid vehicle ID' });
    }
    
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Update vehicle location
 * @route PUT /api/vehicles/:id/location
 * @access Private
 */
exports.updateVehicleLocation = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { latitude, longitude } = req.body;
    
    const vehicle = await Vehicle.findById(req.params.id);
    if (!vehicle) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }
    
    // Update vehicle location
    vehicle.currentLocation = {
      latitude,
      longitude,
      updatedAt: new Date()
    };
    
    await vehicle.save();
    
    // Emit socket event for real-time updates
    if (global.io) {
      global.io.emit('vehicleLocationUpdate', {
        vehicleId: vehicle._id,
        type: vehicle.type,
        location: vehicle.currentLocation
      });
    }
    
    res.status(200).json({
      message: 'Vehicle location updated',
      location: vehicle.currentLocation
    });
  } catch (error) {
    console.error('Error updating vehicle location:', error);
    
    if (error instanceof mongoose.Error.CastError) {
      return res.status(400).json({ message: 'Invalid vehicle ID' });
    }
    
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Update vehicle status
 * @route PUT /api/vehicles/:id/status
 * @access Private
 */
exports.updateVehicleStatus = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { status } = req.body;
    
    const vehicle = await Vehicle.findById(req.params.id);
    if (!vehicle) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }
    
    vehicle.status = status;
    await vehicle.save();
    
    // Emit socket event for real-time updates
    if (global.io) {
      global.io.emit('vehicleStatusUpdate', {
        vehicleId: vehicle._id,
        type: vehicle.type,
        status: vehicle.status
      });
    }
    
    res.status(200).json({
      message: 'Vehicle status updated',
      status: vehicle.status
    });
  } catch (error) {
    console.error('Error updating vehicle status:', error);
    
    if (error instanceof mongoose.Error.CastError) {
      return res.status(400).json({ message: 'Invalid vehicle ID' });
    }
    
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Delete a vehicle
 * @route DELETE /api/vehicles/:id
 * @access Private/Admin
 */
exports.deleteVehicle = async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);
    
    if (!vehicle) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }
    
    // If vehicle has a driver, remove vehicle reference from driver
    if (vehicle.driver) {
      await Driver.findByIdAndUpdate(vehicle.driver, { $unset: { vehicle: 1 } });
    }
    
    // Soft delete by marking as inactive
    vehicle.active = false;
    await vehicle.save();
    
    res.status(200).json({ message: 'Vehicle deleted successfully' });
  } catch (error) {
    console.error('Error deleting vehicle:', error);
    
    if (error instanceof mongoose.Error.CastError) {
      return res.status(400).json({ message: 'Invalid vehicle ID' });
    }
    
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param {Number} lat1 - Latitude of first point
 * @param {Number} lon1 - Longitude of first point
 * @param {Number} lat2 - Latitude of second point
 * @param {Number} lon2 - Longitude of second point
 * @returns {Number} - Distance in meters
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c; // Distance in meters
}

/**
 * Get nearby vehicles (GET method)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} - Response with nearby vehicles or error
 */
exports.getNearbyVehiclesGet = async (req, res) => {
  try {
    const { latitude, longitude, radius = 10, type } = req.query;
    
    // Validate required parameters
    if (!latitude || !longitude) {
      return res.status(400).json({
        message: 'Latitude and longitude are required'
      });
    }
    
    // Convert string parameters to numbers
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    const rad = parseFloat(radius);
    
    // Get nearby vehicles
    const vehicles = await vehicleService.getNearbyVehicles({
      latitude: lat,
      longitude: lng
    }, type, rad * 1000); // Convert km to meters
    
    return res.status(200).json({
      vehicles
    });
  } catch (error) {
    console.error('Error getting nearby vehicles:', error);
    return res.status(500).json({
      message: 'Error retrieving nearby vehicles',
      error: error.message
    });
  }
}; 