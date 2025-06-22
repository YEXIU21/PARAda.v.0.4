/**
 * Route Service
 * Handles route management, including creation, updates, and queries
 */
const Route = require('../models/route.model');
const Driver = require('../models/driver.model');
const { mapsClient, API_KEY, defaultOptions } = require('../config/maps.config');

/**
 * Create a new route
 * @param {Object} routeData - Route data
 * @returns {Promise<Object>} - Created route
 */
exports.createRoute = async (routeData) => {
  try {
    // Validate route data
    if (!routeData.name || !routeData.vehicleType || !routeData.stops || routeData.stops.length < 2) {
      throw new Error('Invalid route data. Name, vehicle type, and at least 2 stops are required.');
    }

    // Check if route with same name already exists
    const existingRoute = await Route.findOne({ name: routeData.name });
    if (existingRoute) {
      throw new Error('A route with this name already exists');
    }

    // Generate path points between stops using Google Maps Directions API
    const pathPoints = await generatePathBetweenStops(routeData.stops);

    // Create route
    const route = new Route({
      name: routeData.name,
      description: routeData.description || '',
      vehicleType: routeData.vehicleType,
      stops: routeData.stops,
      path: pathPoints,
      active: routeData.active !== undefined ? routeData.active : true,
      createdBy: routeData.createdBy,
      fare: routeData.fare ? Number(routeData.fare) : 0, // Ensure fare is properly set
      schedule: routeData.schedule || {
        weekdays: {
          start: '06:00',
          end: '22:00',
          frequency: 30 // minutes
        },
        weekends: {
          start: '08:00',
          end: '20:00',
          frequency: 45 // minutes
        }
      }
    });

    const savedRoute = await route.save();
    return savedRoute;
  } catch (error) {
    throw error;
  }
};

/**
 * Update an existing route
 * @param {string} routeId - Route ID
 * @param {Object} updateData - Data to update
 * @returns {Promise<Object>} - Updated route
 */
exports.updateRoute = async (routeId, updateData) => {
  try {
    const route = await Route.findById(routeId);
    if (!route) {
      throw new Error('Route not found');
    }

    // Check if name is being updated and if it's already taken
    if (updateData.name && updateData.name !== route.name) {
      const existingRoute = await Route.findOne({ name: updateData.name });
      if (existingRoute) {
        throw new Error('A route with this name already exists');
      }
    }

    // If stops are being updated, regenerate path
    if (updateData.stops && updateData.stops.length >= 2) {
      updateData.path = await generatePathBetweenStops(updateData.stops);
    }

    // Update route fields
    Object.keys(updateData).forEach(key => {
      route[key] = updateData[key];
    });

    const updatedRoute = await route.save();
    return updatedRoute;
  } catch (error) {
    throw error;
  }
};

/**
 * Delete a route
 * @param {string} routeId - Route ID
 * @returns {Promise<Object>} - Deleted route
 */
exports.deleteRoute = async (routeId) => {
  try {
    console.log(`[SERVICE] Deleting route with ID: ${routeId}`);
    
    // Find any drivers assigned to this route
    const assignedDrivers = await Driver.find({ routeId });
    console.log(`[SERVICE] Found ${assignedDrivers.length} drivers assigned to route ${routeId}`);
    
    // Update all assigned drivers to have no route
    if (assignedDrivers.length > 0) {
      console.log(`[SERVICE] Updating ${assignedDrivers.length} drivers assigned to route ${routeId}`);
      
      try {
        // Update all drivers to remove the route assignment
        const updateResult = await Driver.updateMany(
          { routeId: routeId },
          { $set: { routeId: null } }
        );
        console.log(`[SERVICE] Updated ${updateResult.modifiedCount} drivers successfully`);
      } catch (driverUpdateError) {
        console.error('[SERVICE] Error updating drivers:', driverUpdateError);
        throw new Error(`Failed to update drivers: ${driverUpdateError.message}`);
    }
    }

    console.log(`[SERVICE] Finding route to delete: ${routeId}`);
    const deletedRoute = await Route.findByIdAndDelete(routeId);
    
    if (!deletedRoute) {
      console.error(`[SERVICE] Route not found with ID: ${routeId}`);
      throw new Error('Route not found');
    }

    console.log(`[SERVICE] Successfully deleted route: ${deletedRoute.name} (${routeId})`);
    return deletedRoute;
  } catch (error) {
    console.error(`[SERVICE] Error in deleteRoute service: ${error.message}`);
    throw error;
  }
};

/**
 * Get all routes
 * @param {Object} filter - Filter criteria
 * @returns {Promise<Array>} - List of routes
 */
exports.getRoutes = async (filter = {}) => {
  try {
    const query = {};
    
    // Apply filters
    if (filter.vehicleType) {
      query.vehicleType = filter.vehicleType;
    }
    
    if (filter.active !== undefined) {
      query.active = filter.active;
    }

    const routes = await Route.find(query)
      .populate('createdBy', 'username')
      .populate('drivers');
    
    return routes;
  } catch (error) {
    throw error;
  }
};

/**
 * Get a single route by ID
 * @param {string} routeId - Route ID
 * @returns {Promise<Object>} - Route data
 */
exports.getRouteById = async (routeId) => {
  try {
    const route = await Route.findById(routeId)
      .populate('createdBy', 'username')
      .populate('drivers');
    
    if (!route) {
      throw new Error('Route not found');
    }
    
    return route;
  } catch (error) {
    throw error;
  }
};

/**
 * Assign a driver to a route
 * @param {string} routeId - Route ID
 * @param {string} driverId - Driver ID
 * @returns {Promise<Object>} - Updated route
 */
exports.assignDriverToRoute = async (routeId, driverId) => {
  try {
    const route = await Route.findById(routeId);
    if (!route) {
      throw new Error('Route not found');
    }

    const driver = await Driver.findById(driverId);
    if (!driver) {
      throw new Error('Driver not found');
    }

    // Check if driver is already assigned to this route
    if (driver.routeId && driver.routeId.toString() === routeId) {
      return route; // Already assigned
    }

    // Update driver's route
    driver.routeId = routeId;
    await driver.save();

    // Add driver to route's drivers array if not already there
    if (!route.drivers.includes(driverId)) {
      route.drivers.push(driverId);
      await route.save();
    }

    return await Route.findById(routeId)
      .populate('createdBy', 'username')
      .populate('drivers');
  } catch (error) {
    throw error;
  }
};

/**
 * Remove a driver from a route
 * @param {string} routeId - Route ID
 * @param {string} driverId - Driver ID
 * @returns {Promise<Object>} - Updated route
 */
exports.removeDriverFromRoute = async (routeId, driverId) => {
  try {
    const route = await Route.findById(routeId);
    if (!route) {
      throw new Error('Route not found');
    }

    const driver = await Driver.findById(driverId);
    if (!driver) {
      throw new Error('Driver not found');
    }

    // Check if driver is assigned to this route
    if (!driver.routeId || driver.routeId.toString() !== routeId) {
      return route; // Not assigned to this route
    }

    // Update driver's route
    driver.routeId = null;
    await driver.save();

    // Remove driver from route's drivers array
    route.drivers = route.drivers.filter(id => id.toString() !== driverId);
    await route.save();

    return await Route.findById(routeId)
      .populate('createdBy', 'username')
      .populate('drivers');
  } catch (error) {
    throw error;
  }
};

/**
 * Generate path points between stops using Google Maps Directions API
 * @param {Array} stops - Array of stops with coordinates
 * @returns {Promise<Array>} - Array of path points
 */
async function generatePathBetweenStops(stops) {
  try {
    if (stops.length < 2) {
      return [];
    }

    const pathPoints = [];
    
    // Process each pair of consecutive stops
    for (let i = 0; i < stops.length - 1; i++) {
      const origin = stops[i].coordinates;
      const destination = stops[i + 1].coordinates;
      
      // Call Google Maps Directions API
      const directions = await mapsClient.directions({
        params: {
          origin: `${origin.latitude},${origin.longitude}`,
          destination: `${destination.latitude},${destination.longitude}`,
          key: API_KEY,
          ...defaultOptions
        }
      });
      
      // Extract path points from the response
      if (directions.data.routes && directions.data.routes.length > 0) {
        const route = directions.data.routes[0];
        
        if (route.overview_path) {
          // Use overview path for simplified path
          route.overview_path.forEach(point => {
            pathPoints.push({
              latitude: point.lat,
              longitude: point.lng
            });
          });
        } else if (route.legs && route.legs.length > 0) {
          // Use detailed steps if overview path is not available
          route.legs.forEach(leg => {
            leg.steps.forEach(step => {
              if (step.polyline && step.polyline.points) {
                const decodedPath = decodePolyline(step.polyline.points);
                decodedPath.forEach(point => {
                  pathPoints.push({
                    latitude: point.lat,
                    longitude: point.lng
                  });
                });
              }
            });
          });
        }
      }
    }
    
    return pathPoints;
  } catch (error) {
    console.error('Error generating path between stops:', error);
    // Return direct lines between stops as fallback
    return stops.map(stop => ({
      latitude: stop.coordinates.latitude,
      longitude: stop.coordinates.longitude
    }));
  }
}

/**
 * Decode a Google Maps polyline string
 * @param {string} encoded - Encoded polyline string
 * @returns {Array} - Array of lat/lng points
 */
function decodePolyline(encoded) {
  const points = [];
  let index = 0, lat = 0, lng = 0;

  while (index < encoded.length) {
    let b, shift = 0, result = 0;
    
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    
    const dlat = ((result & 1) ? ~(result >> 1) : (result >> 1));
    lat += dlat;
    
    shift = 0;
    result = 0;
    
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    
    const dlng = ((result & 1) ? ~(result >> 1) : (result >> 1));
    lng += dlng;
    
    points.push({
      lat: lat * 1e-5,
      lng: lng * 1e-5
    });
  }
  
  return points;
} 