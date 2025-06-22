/**
 * Route Controller
 * Handles route management operations
 */
const { validationResult } = require('express-validator');
const routeService = require('../services/route.service');
const socketService = require('../services/socket.service');
const Driver = require('../models/driver.model');

/**
 * Get all routes
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} - Response with routes or error
 */
exports.getRoutes = async (req, res) => {
  try {
    // Get filter parameters
    const filter = {
      vehicleType: req.query.vehicleType,
      active: req.query.active === 'true' ? true : (req.query.active === 'false' ? false : undefined)
    };
    
    const routes = await routeService.getRoutes(filter);
    
    return res.status(200).json({
      routes
    });
  } catch (error) {
    console.error('Error getting routes:', error);
    return res.status(500).json({
      message: 'Error retrieving routes',
      error: error.message
    });
  }
};

/**
 * Get route by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} - Response with route or error
 */
exports.getRouteById = async (req, res) => {
  try {
    const { routeId } = req.params;
    
    const route = await routeService.getRouteById(routeId);
    
    return res.status(200).json({
      route
    });
  } catch (error) {
    console.error('Error getting route by ID:', error);
    
    if (error.message === 'Route not found') {
      return res.status(404).json({
        message: 'Route not found'
      });
    }
    
    return res.status(500).json({
      message: 'Error retrieving route',
      error: error.message
    });
  }
};

/**
 * Create a new route
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} - Response with created route or error
 */
exports.createRoute = async (req, res) => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation error', 
        errors: errors.array() 
      });
    }
    
    const route = await routeService.createRoute(req.body);
    
    // Notify drivers about the new route
    try {
      // If drivers are assigned to this route, notify them specifically
      if (route.drivers && route.drivers.length > 0) {
        for (const driverId of route.drivers) {
          socketService.emitRouteUpdates(driverId.toString(), [route]);
        }
      } else {
        // Otherwise broadcast to all drivers
        socketService.emitRouteUpdates(null, [route]);
      }
    } catch (socketError) {
      console.error('Error emitting route update:', socketError);
      // Don't fail the request if socket emission fails
    }
    
    return res.status(201).json({
      message: 'Route created successfully',
      route
    });
  } catch (error) {
    console.error('Error creating route:', error);
    
    if (error.message.includes('A route with this name already exists')) {
      return res.status(409).json({
        message: 'A route with this name already exists'
      });
    }
    
    return res.status(500).json({
      message: 'Error creating route',
      error: error.message
    });
  }
};

/**
 * Update a route
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} - Response with updated route or error
 */
exports.updateRoute = async (req, res) => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation error', 
        errors: errors.array() 
      });
    }
    
    const { routeId } = req.params;
    
    const route = await routeService.updateRoute(routeId, req.body);
    
    // Notify drivers about the updated route
    try {
      // Get all drivers assigned to this route
      const assignedDrivers = route.drivers || [];
      
      // Find drivers that have this route assigned
      const driversWithRoute = await Driver.find({ routeId: route._id });
      
      // Combine all affected driver IDs
      const affectedDriverIds = new Set([
        ...assignedDrivers.map(id => id.toString()),
        ...driversWithRoute.map(driver => driver._id.toString())
      ]);
      
      // Notify each affected driver
      for (const driverId of affectedDriverIds) {
        socketService.emitRouteUpdates(driverId, [route]);
      }
      
      // Also broadcast to all drivers if the route is active
      if (route.active) {
        socketService.emitRouteUpdates(null, [route]);
      }
    } catch (socketError) {
      console.error('Error emitting route update:', socketError);
      // Don't fail the request if socket emission fails
    }
    
    return res.status(200).json({
      message: 'Route updated successfully',
      route
    });
  } catch (error) {
    console.error('Error updating route:', error);
    
    if (error.message === 'Route not found') {
      return res.status(404).json({
        message: 'Route not found'
      });
    }
    
    if (error.message.includes('A route with this name already exists')) {
      return res.status(409).json({
        message: 'A route with this name already exists'
      });
    }
    
    return res.status(500).json({
      message: 'Error updating route',
      error: error.message
    });
  }
};

/**
 * Delete a route
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} - Response with success message or error
 */
exports.deleteRoute = async (req, res) => {
  try {
    const { routeId } = req.params;
    console.log(`[CONTROLLER] Received delete request for route ID: ${routeId}`);
    
    // Get the route before deleting to get affected drivers
    try {
      const route = await routeService.getRouteById(routeId);
      console.log(`[CONTROLLER] Found route to delete: ${route.name}`);
      
      // Store affected drivers before deletion
      let affectedDriverIds = [];
      if (route) {
        // Get all drivers assigned to this route
        const assignedDrivers = route.drivers || [];
        
        // Find drivers that have this route assigned
        const driversWithRoute = await Driver.find({ routeId: route._id });
        console.log(`[CONTROLLER] Found ${driversWithRoute.length} drivers with this route assigned`);
        
        // Combine all affected driver IDs
        affectedDriverIds = [...new Set([
          ...assignedDrivers.map(id => id.toString()),
          ...driversWithRoute.map(driver => driver._id.toString())
        ])];
        console.log(`[CONTROLLER] Total affected drivers: ${affectedDriverIds.length}`);
      }
      
      // Delete the route
      console.log(`[CONTROLLER] Calling route service to delete route: ${routeId}`);
      const deletedRoute = await routeService.deleteRoute(routeId);
      console.log(`[CONTROLLER] Route deleted successfully: ${deletedRoute.name}`);
      
      // Notify all affected drivers specifically
      if (affectedDriverIds.length > 0) {
        console.log(`[CONTROLLER] Notifying ${affectedDriverIds.length} affected drivers`);
        
        // Create a special payload with deleted flag for proper client-side handling
        const deletedRoutePayload = {
          ...deletedRoute.toObject(),
          deleted: true // Add deleted flag to indicate this is a deletion notification
        };
        
        // Notify each affected driver individually
        for (const driverId of affectedDriverIds) {
          try {
            socketService.emitRouteUpdates(driverId, [deletedRoutePayload]);
          } catch (socketError) {
            console.error(`[CONTROLLER] Error notifying driver ${driverId}:`, socketError);
          }
        }
      }
      
      // Also broadcast to all clients (including passengers) for proper UI updates
      try {
        // Create a special payload with deleted flag
        const deletedRoutePayload = {
          ...deletedRoute.toObject(),
          deleted: true // Add deleted flag to indicate this is a deletion notification
        };
        
        // Broadcast deletion to all clients
        console.log(`[CONTROLLER] Broadcasting route deletion to all clients`);
        socketService.emitRouteUpdates(null, [deletedRoutePayload]);
      } catch (socketError) {
        console.error('[CONTROLLER] Error broadcasting route deletion:', socketError);
      }
      
      return res.status(200).json({
        message: 'Route deleted successfully',
        route: deletedRoute
      });
    } catch (error) {
      console.error('[CONTROLLER] Error in route deletion:', error);
      
      if (error.message === 'Route not found') {
        return res.status(404).json({
          message: 'Route not found'
        });
      }
      
      throw error;
    }
  } catch (error) {
    console.error(`[CONTROLLER] Error in deleteRoute controller: ${error.message}`);
    return res.status(500).json({
      message: 'Error deleting route',
      error: error.message
    });
  }
};

/**
 * Assign a driver to a route
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} - Response with updated route or error
 */
exports.assignDriverToRoute = async (req, res) => {
  try {
    const { routeId, driverId } = req.params;
    
    const route = await routeService.assignDriverToRoute(routeId, driverId);
    
    return res.status(200).json({
      message: 'Driver assigned to route successfully',
      route
    });
  } catch (error) {
    console.error('Error assigning driver to route:', error);
    
    if (error.message === 'Route not found') {
      return res.status(404).json({
        message: 'Route not found'
      });
    }
    
    if (error.message === 'Driver not found') {
      return res.status(404).json({
        message: 'Driver not found'
      });
    }
    
    return res.status(500).json({
      message: 'Error assigning driver to route',
      error: error.message
    });
  }
};

/**
 * Remove a driver from a route
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} - Response with updated route or error
 */
exports.removeDriverFromRoute = async (req, res) => {
  try {
    const { routeId, driverId } = req.params;
    
    const route = await routeService.removeDriverFromRoute(routeId, driverId);
    
    return res.status(200).json({
      message: 'Driver removed from route successfully',
      route
    });
  } catch (error) {
    console.error('Error removing driver from route:', error);
    
    if (error.message === 'Route not found') {
      return res.status(404).json({
        message: 'Route not found'
      });
    }
    
    if (error.message === 'Driver not found') {
      return res.status(404).json({
        message: 'Driver not found'
      });
    }
    
    return res.status(500).json({
      message: 'Error removing driver from route',
      error: error.message
    });
  }
}; 