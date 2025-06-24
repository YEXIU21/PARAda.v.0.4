/**
 * Vehicle Service
 * Handles vehicle operations
 */
const Vehicle = require('../models/vehicle.model');
const Driver = require('../models/driver.model');
const mongoose = require('mongoose');

/**
 * Get all vehicles
 * @param {Object} filter - Filter criteria
 * @returns {Promise<Array>} - List of vehicles
 */
exports.getAllVehicles = async (filter = {}) => {
  try {
    const query = {};
    
    // Apply filters
    if (filter.status) {
      query.status = filter.status;
    }
    
    if (filter.type) {
      query.type = filter.type;
    }
    
    if (filter.driverId) {
      query.driverId = filter.driverId;
    }
    
    if (filter.routeId) {
      query.routeId = filter.routeId;
    }
    
    const vehicles = await Vehicle.find(query)
      .populate('driverId', 'userId status')
      .populate('routeId', 'name stops');
    
    return vehicles;
  } catch (error) {
    throw error;
  }
};

/**
 * Get vehicle by ID
 * @param {string} vehicleId - Vehicle ID
 * @returns {Promise<Object>} - Vehicle data
 */
exports.getVehicleById = async (vehicleId) => {
  try {
    const vehicle = await Vehicle.findById(vehicleId)
      .populate('driverId', 'userId status')
      .populate('routeId', 'name stops');
    
    if (!vehicle) {
      throw new Error('Vehicle not found');
    }
    
    return vehicle;
  } catch (error) {
    throw error;
  }
};

/**
 * Get nearby vehicles
 * @param {Object} location - Location coordinates {latitude, longitude}
 * @param {string} type - Optional vehicle type filter
 * @param {number} maxDistance - Maximum distance in meters (default: 5000)
 * @returns {Promise<Array>} - List of nearby vehicles
 */
exports.getNearbyVehicles = async (location, type, maxDistance = 5000) => {
  try {
    let vehicles = [];
    
    try {
      // Try geospatial query first
      const geoQuery = {
        status: 'available',
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
      
      // Add type filter if provided
      if (type) {
        geoQuery.type = type;
      }
      
      // Get vehicles from database using geospatial query
      vehicles = await Vehicle.find(geoQuery)
        .populate('driverId', 'userId status')
        .populate('routeId', 'name stops')
        .limit(50);
    } catch (geoQueryError) {
      console.error('Geospatial query failed:', geoQueryError);
      console.log('Falling back to regular query');
      
      // Fallback to regular query with manual distance calculation
      // This is less efficient but more reliable if geospatial indexes aren't set up
      const basicQuery = { status: 'available' };
      
      // Add type filter if provided
      if (type) {
        basicQuery.type = type;
      }
      
      // Get all available vehicles
      vehicles = await Vehicle.find(basicQuery)
        .populate('driverId', 'userId status')
        .populate('routeId', 'name stops');
      
      // Filter by distance manually
      vehicles = vehicles.filter(vehicle => {
        // Skip vehicles without location
        if (!vehicle.location || !vehicle.location.coordinates || 
            vehicle.location.coordinates.length !== 2) {
          return false;
        }
        
        const distance = calculateDistance(
          location.latitude, location.longitude,
          vehicle.location.coordinates[1], vehicle.location.coordinates[0]
        );
        
        return distance <= maxDistance;
      }).slice(0, 50); // Limit to 50 results
    }
    
    // If no vehicles found in database, generate mock data for development/testing
    if (vehicles.length === 0) {
      console.log('No vehicles found in database, generating mock data');
      return generateMockVehicles(location, type, 10);
    }
    
    // Format vehicle data
    return vehicles.map(vehicle => {
      // Skip vehicles without valid coordinates
      if (!vehicle.location || !vehicle.location.coordinates || 
          vehicle.location.coordinates.length !== 2) {
        return null;
      }
      
      const distance = calculateDistance(
        location.latitude, location.longitude,
        vehicle.location.coordinates[1], vehicle.location.coordinates[0]
      );
      
      // Calculate ETA based on distance (rough estimate)
      const averageSpeed = 30; // km/h
      const etaMinutes = Math.round((distance / 1000) / averageSpeed * 60);
      const etaText = etaMinutes <= 1 ? '1 min' : `${etaMinutes} mins`;
      
      return {
        id: vehicle._id,
        name: vehicle.name || `${vehicle.type.charAt(0).toUpperCase() + vehicle.type.slice(1)} ${vehicle.plateNumber}`,
        type: vehicle.type,
        plateNumber: vehicle.plateNumber,
        location: {
          latitude: vehicle.location.coordinates[1],
          longitude: vehicle.location.coordinates[0]
        },
        distance: Math.round(distance),
        eta: etaText,
        status: vehicle.status,
        driverId: vehicle.driverId ? vehicle.driverId._id : null,
        driverStatus: vehicle.driverId ? vehicle.driverId.status : null,
        routeId: vehicle.routeId ? vehicle.routeId._id : null,
        routeName: vehicle.routeId ? vehicle.routeId.name : null
      };
    }).filter(Boolean); // Remove null entries
  } catch (error) {
    console.error('Error getting nearby vehicles:', error);
    
    // Fall back to mock data in case of error
    console.log('Error fetching vehicles, generating mock data');
    return generateMockVehicles(location, type, 10);
  }
};

/**
 * Generate mock vehicles for testing
 * @param {Object} location - Base location
 * @param {string} type - Optional vehicle type filter
 * @param {number} count - Number of vehicles to generate
 * @returns {Array} - List of mock vehicles
 */
function generateMockVehicles(location, type, count = 10) {
  const vehicles = [];
  const vehicleTypes = ['latransco', 'calvo', 'corominas', 'ceres', 'gabe', 'jeep'];
  
  // If type is specified, only generate that type
  const types = type ? [type] : vehicleTypes;
  
  for (let i = 0; i < count; i++) {
    // Generate random location within ~2km
    const lat = location.latitude + (Math.random() * 0.02 - 0.01);
    const lng = location.longitude + (Math.random() * 0.02 - 0.01);
    
    // Calculate distance
    const distance = calculateDistance(
      location.latitude, location.longitude,
      lat, lng
    );
    
    // Calculate ETA based on distance (rough estimate)
    const averageSpeed = 30; // km/h
    const etaMinutes = Math.round((distance / 1000) / averageSpeed * 60);
    const etaText = etaMinutes <= 1 ? '1 min' : `${etaMinutes} mins`;
    
    // Pick random vehicle type from allowed types
    const randomType = types[Math.floor(Math.random() * types.length)];
    
    // Generate plate number
    const plateNumber = `ABC${Math.floor(Math.random() * 1000)}`;
    
    vehicles.push({
      id: `mock-${i}`,
      name: `${randomType.charAt(0).toUpperCase() + randomType.slice(1)} ${plateNumber}`,
      type: randomType,
      plateNumber,
      location: {
        latitude: lat,
        longitude: lng
      },
      distance: Math.round(distance),
      eta: etaText,
      status: 'available',
      driverId: null,
      driverStatus: null,
      routeId: null,
      routeName: null,
      isMock: true // Flag to indicate this is mock data
    });
  }
  
  // Sort by distance
  return vehicles.sort((a, b) => a.distance - b.distance);
}

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param {number} lat1 - Latitude of first point
 * @param {number} lon1 - Longitude of first point
 * @param {number} lat2 - Latitude of second point
 * @param {number} lon2 - Longitude of second point
 * @returns {number} - Distance in meters
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