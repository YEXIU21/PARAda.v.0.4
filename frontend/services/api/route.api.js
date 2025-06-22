/**
 * Route API Service
 * Handles all route-related API calls
 */
import axios from 'axios';
import { BASE_URL, ENDPOINTS } from './endpoints';
import { getAuthToken } from './auth.api';

/**
 * Get all routes
 * @param {Object} filters - Optional filters
 * @returns {Promise<Array>} - List of routes
 */
export const getRoutes = async (filters = {}) => {
  try {
    // Build query string from filters
    const queryParams = new URLSearchParams();
    
    if (filters.active !== undefined) {
      queryParams.append('active', filters.active);
    }
    
    if (filters.vehicleType) {
      queryParams.append('vehicleType', filters.vehicleType);
    }
    
    if (filters.origin) {
      queryParams.append('origin', filters.origin);
    }
    
    if (filters.destination) {
      queryParams.append('destination', filters.destination);
    }
    
    const queryString = queryParams.toString();
    const url = `${BASE_URL}${ENDPOINTS.ROUTE.ALL}${queryString ? `?${queryString}` : ''}`;
    
    const response = await axios.get(url);
    return response.data.routes;
  } catch (error) {
    console.error('Error fetching routes:', error);
    throw error;
  }
};

/**
 * Get route by ID
 * @param {string} routeId - Route ID
 * @returns {Promise<Object>} - Route data
 */
export const getRouteById = async (routeId) => {
  try {
    const response = await axios.get(`${BASE_URL}${ENDPOINTS.ROUTE.BY_ID(routeId)}`);
    return response.data.route;
  } catch (error) {
    console.error(`Error fetching route ${routeId}:`, error);
    throw error;
  }
};

/**
 * Create a new route
 * @param {Object} routeData - Route data
 * @returns {Promise<Object>} - Created route
 */
export const createRoute = async (routeData) => {
  try {
    const token = await getAuthToken();
    if (!token) throw new Error('Authentication required');

    // Create a clean copy of route data
    const cleanedRouteData = { ...routeData };

    // Ensure all required fields are present
    const requiredFields = ['name', 'vehicleType', 'stops'];
    for (const field of requiredFields) {
      if (!cleanedRouteData[field]) {
        throw new Error(`Missing required field: ${field}`);
      }
    }

    // Ensure stops has at least 2 entries with valid coordinates
    if (!Array.isArray(cleanedRouteData.stops) || cleanedRouteData.stops.length < 2) {
      throw new Error('Route must have at least 2 stops');
    }
    
    // Validate each stop has name and coordinates
    cleanedRouteData.stops.forEach((stop, index) => {
      if (!stop.name) {
        throw new Error(`Stop ${index + 1} is missing a name`);
      }
      if (!stop.coordinates || !stop.coordinates.latitude || !stop.coordinates.longitude) {
        throw new Error(`Stop ${index + 1} is missing valid coordinates`);
      }
    });

    // Make sure schedule has valid format if provided
    if (cleanedRouteData.schedule) {
      const scheduleTypes = ['weekdays', 'weekends'];
      scheduleTypes.forEach(type => {
        if (cleanedRouteData.schedule[type]) {
          const { start, end, frequency } = cleanedRouteData.schedule[type];
          if (!start || !end) {
            throw new Error(`Schedule ${type} must have start and end times`);
          }
          if (!frequency || isNaN(frequency)) {
            cleanedRouteData.schedule[type].frequency = type === 'weekdays' ? 30 : 45; // Default values
          }
        }
      });
    }

    // Ensure fare is a number if provided
    if (cleanedRouteData.fare !== undefined) {
      cleanedRouteData.fare = parseFloat(cleanedRouteData.fare);
      if (isNaN(cleanedRouteData.fare)) {
        cleanedRouteData.fare = 0;
      }
    }

    // Remove fields that might not be expected by the backend
    if (cleanedRouteData.companyId) {
      console.log('Removing companyId field as it may not be expected by the backend');
      delete cleanedRouteData.companyId;
    }

    console.log('Creating route with data:', JSON.stringify(cleanedRouteData, null, 2));
    
    const response = await axios.post(
      `${BASE_URL}${ENDPOINTS.ROUTE.CREATE}`,
      cleanedRouteData,
      {
        headers: { 
          'x-access-token': token,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('Route created successfully:', response.data);
    return response.data.route;
  } catch (error) {
    console.error('Error creating route:', error);
    
    // Log detailed error information
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('Error response data:', error.response.data);
      console.error('Error response status:', error.response.status);
      console.error('Error response headers:', error.response.headers);
      
      // If there are validation errors, log them specifically
      if (error.response.data && error.response.data.errors) {
        console.error('Validation errors:', error.response.data.errors);
      }
    } else if (error.request) {
      // The request was made but no response was received
      console.error('Error request:', error.request);
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('Error message:', error.message);
    }
    
    throw error;
  }
};

/**
 * Update an existing route
 * @param {string} routeId - Route ID
 * @param {Object} updateData - Data to update
 * @returns {Promise<Object>} - Updated route
 */
export const updateRoute = async (routeId, updateData) => {
  try {
    const token = await getAuthToken();
    if (!token) throw new Error('Authentication required');

    if (!routeId) throw new Error('Route ID is required');

    // Create a clean copy of update data
    const cleanedUpdateData = { ...updateData };

    // Validate stops if they're being updated
    if (cleanedUpdateData.stops) {
      // Ensure stops has at least 2 entries with valid coordinates
      if (!Array.isArray(cleanedUpdateData.stops) || cleanedUpdateData.stops.length < 2) {
        throw new Error('Route must have at least 2 stops');
      }
      
      // Validate each stop has name and coordinates
      cleanedUpdateData.stops.forEach((stop, index) => {
        if (!stop.name) {
          throw new Error(`Stop ${index + 1} is missing a name`);
        }
        if (!stop.coordinates || !stop.coordinates.latitude || !stop.coordinates.longitude) {
          throw new Error(`Stop ${index + 1} is missing valid coordinates`);
        }
      });
    }

    // Make sure schedule has valid format if provided
    if (cleanedUpdateData.schedule) {
      const scheduleTypes = ['weekdays', 'weekends'];
      scheduleTypes.forEach(type => {
        if (cleanedUpdateData.schedule[type]) {
          const { start, end, frequency } = cleanedUpdateData.schedule[type];
          if (!start || !end) {
            throw new Error(`Schedule ${type} must have start and end times`);
          }
          if (!frequency || isNaN(frequency)) {
            cleanedUpdateData.schedule[type].frequency = type === 'weekdays' ? 30 : 45; // Default values
          }
        }
      });
    }

    // Ensure fare is a number if provided
    if (cleanedUpdateData.fare !== undefined) {
      cleanedUpdateData.fare = parseFloat(cleanedUpdateData.fare);
      if (isNaN(cleanedUpdateData.fare)) {
        cleanedUpdateData.fare = 0;
      }
    }

    // Remove fields that might not be expected by the backend
    if (cleanedUpdateData.companyId) {
      console.log('Removing companyId field as it may not be expected by the backend');
      delete cleanedUpdateData.companyId;
    }

    console.log(`Updating route ${routeId} with data:`, JSON.stringify(cleanedUpdateData, null, 2));

    const response = await axios.put(
      `${BASE_URL}${ENDPOINTS.ROUTE.UPDATE(routeId)}`,
      cleanedUpdateData,
      {
        headers: { 
          'x-access-token': token,
          'Content-Type': 'application/json'
        }
      }
    );
    
    return response.data.route;
  } catch (error) {
    console.error('Error updating route:', error);
    
    // Log detailed error information
    if (error.response) {
      console.error('Error response data:', error.response.data);
      console.error('Error response status:', error.response.status);
      
      // If there are validation errors, log them specifically
      if (error.response.data && error.response.data.errors) {
        console.error('Validation errors:', error.response.data.errors);
      }
    }
    
    throw error;
  }
};

/**
 * Delete a route
 * @param {string} routeId - Route ID
 * @returns {Promise<Object>} - Response data
 */
export const deleteRoute = async (routeId) => {
  try {
    console.log(`API: Attempting to delete route with ID: ${routeId}`);
    
    if (!routeId || routeId === 'undefined') {
      throw new Error('Invalid route ID provided to deleteRoute API');
    }
    
    const token = await getAuthToken();
    if (!token) throw new Error('Authentication required');

    console.log(`API: Sending DELETE request to ${BASE_URL}${ENDPOINTS.ROUTE.DELETE(routeId)}`);

    const response = await axios.delete(
      `${BASE_URL}${ENDPOINTS.ROUTE.DELETE(routeId)}`,
      {
        headers: { 'x-access-token': token }
      }
    );
    
    console.log('API: Delete route response:', response.data);
    return response.data;
  } catch (error) {
    console.error('API: Error deleting route:', error);
    
    // Log detailed error information
    if (error.response) {
      console.error('API: Error response status:', error.response.status);
      console.error('API: Error response data:', error.response.data);
    } else if (error.request) {
      console.error('API: Error request (no response received):', error.request);
    } else {
      console.error('API: Error message:', error.message);
    }
    
    throw error;
  }
};

/**
 * Toggle route active status
 * @param {string} routeId - Route ID
 * @param {boolean} active - New active status
 * @returns {Promise<Object>} - Updated route
 */
export const toggleRouteStatus = async (routeId, active) => {
  try {
    const token = await getAuthToken();
    if (!token) throw new Error('Authentication required');

    return await updateRoute(routeId, { active });
  } catch (error) {
    console.error('Error toggling route status:', error);
    throw error;
  }
};

/**
 * Assign a driver to a route
 * @param {string} routeId - Route ID
 * @param {string} driverId - Driver ID
 * @returns {Promise<Object>} - Updated route
 */
export const assignDriverToRoute = async (routeId, driverId) => {
  try {
    const token = await getAuthToken();
    if (!token) throw new Error('Authentication required');
    
    const response = await axios.post(
      `${BASE_URL}${ENDPOINTS.ROUTE.ASSIGN_DRIVER(routeId)}`,
      { driverId },
      {
        headers: { 'x-access-token': token }
      }
    );
    
    return response.data;
  } catch (error) {
    console.error('Error assigning driver to route:', error);
    throw error;
  }
};
    
/**
 * Unassign a driver from a route
 * @param {string} routeId - Route ID
 * @param {string} driverId - Driver ID
 * @returns {Promise<Object>} - Response data
 */
export const unassignDriverFromRoute = async (routeId, driverId) => {
  try {
    const token = await getAuthToken();
    if (!token) throw new Error('Authentication required');

    const response = await axios.delete(
      `${BASE_URL}${ENDPOINTS.ROUTE.UNASSIGN_DRIVER(routeId, driverId)}`,
      {
        headers: { 'x-access-token': token }
      }
    );
    
    return response.data;
  } catch (error) {
    console.error('Error unassigning driver from route:', error);
    throw error;
  }
};

/**
 * Remove driver from route
 * @param {string} routeId - Route ID
 * @param {string} driverId - Driver ID
 * @returns {Promise<Object>} - Updated route data
 */
export const removeDriverFromRoute = async (routeId, driverId) => {
  try {
    const token = await getAuthToken();
    if (!token) throw new Error('Authentication required');
    
    const response = await axios.delete(
      `${BASE_URL}${ENDPOINTS.ROUTE.ASSIGN_DRIVER(routeId, driverId)}`,
      {
        headers: { 'x-access-token': token }
      }
    );
    
    return response.data.route;
  } catch (error) {
    console.error(`Error removing driver ${driverId} from route ${routeId}:`, error);
    throw error;
  }
};

/**
 * Request a custom route
 * @param {Object} routeRequest - Route request data
 * @returns {Promise<Object>} - Route request data
 */
export const requestCustomRoute = async (routeRequest) => {
  try {
    const token = await getAuthToken();
    if (!token) throw new Error('Authentication required');
    
    const response = await axios.post(
      `${BASE_URL}${ENDPOINTS.ROUTE.REQUEST_CUSTOM}`,
      routeRequest,
      {
        headers: { 'x-access-token': token }
      }
    );
    
    return response.data;
  } catch (error) {
    console.error('Error requesting custom route:', error);
    throw error;
  }
};