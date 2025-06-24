/**
 * Ride API Service
 * Handles all ride-related API calls
 */
import axios from 'axios';
import { BASE_URL, ENDPOINTS } from './endpoints';
import { getAuthToken } from './auth.api';

/**
 * Request a ride
 * @param {Object} rideData - Ride request data
 * @returns {Promise<Object>} - Ride request response
 */
export const requestRide = async (rideData) => {
  try {
    const token = await getAuthToken();
    if (!token) throw new Error('Authentication required');
    
    const url = `${BASE_URL}/api/rides/request`;
    
    const response = await axios.post(url, rideData, {
      headers: { 'x-access-token': token }
    });
    
    return response.data;
  } catch (error) {
    console.error('Error requesting ride:', error);
    throw error;
  }
};

/**
 * Get ride status
 * @param {string} rideId - Ride ID
 * @returns {Promise<Object>} - Ride status
 */
export const getRideStatus = async (rideId) => {
  try {
    const token = await getAuthToken();
    if (!token) throw new Error('Authentication required');
    
    const url = `${BASE_URL}/api/rides/${rideId}/status`;
    
    const response = await axios.get(url, {
      headers: { 'x-access-token': token }
    });
    
    return response.data;
  } catch (error) {
    console.error('Error getting ride status:', error);
    throw error;
  }
};

/**
 * Cancel ride
 * @param {string} rideId - Ride ID
 * @param {string} reason - Cancellation reason
 * @returns {Promise<Object>} - Cancellation response
 */
export const cancelRide = async (rideId, reason = '') => {
  try {
    const token = await getAuthToken();
    if (!token) throw new Error('Authentication required');
    
    const url = `${BASE_URL}/api/rides/${rideId}/cancel`;
    
    const response = await axios.post(url, { reason }, {
      headers: { 'x-access-token': token }
    });
    
    return response.data;
  } catch (error) {
    console.error('Error cancelling ride:', error);
    throw error;
  }
};

/**
 * Accept ride (for drivers)
 * @param {string} rideId - Ride ID
 * @returns {Promise<Object>} - Acceptance response
 */
export const acceptRide = async (rideId) => {
  try {
    const token = await getAuthToken();
    if (!token) throw new Error('Authentication required');
    
    const url = `${BASE_URL}/api/rides/${rideId}/accept`;
    
    const response = await axios.post(url, {}, {
      headers: { 'x-access-token': token }
    });
    
    return response.data;
  } catch (error) {
    console.error('Error accepting ride:', error);
    throw error;
  }
};

/**
 * Update ride status (for drivers)
 * @param {string} rideId - Ride ID
 * @param {string} status - New status
 * @returns {Promise<Object>} - Update response
 */
export const updateRideStatus = async (rideId, status) => {
  try {
    const token = await getAuthToken();
    if (!token) throw new Error('Authentication required');
    
    const url = `${BASE_URL}/api/rides/${rideId}/status`;
    
    const response = await axios.put(url, { status }, {
      headers: { 'x-access-token': token }
    });
    
    return response.data;
  } catch (error) {
    console.error('Error updating ride status:', error);
    throw error;
  }
};

/**
 * Get ride history
 * @param {Object} options - Query options
 * @returns {Promise<Array>} - Ride history
 */
export const getRideHistory = async (options = {}) => {
  try {
    const token = await getAuthToken();
    if (!token) throw new Error('Authentication required');
    
    // Build query string from options
    const queryParams = new URLSearchParams();
    
    if (options.limit) {
      queryParams.append('limit', options.limit);
    }
    
    if (options.skip) {
      queryParams.append('skip', options.skip);
    }
    
    if (options.status) {
      queryParams.append('status', options.status);
    }
    
    const queryString = queryParams.toString();
    const url = `${BASE_URL}/api/rides/history${queryString ? `?${queryString}` : ''}`;
    
    const response = await axios.get(url, {
      headers: { 'x-access-token': token }
    });
    
    return response.data.rides;
  } catch (error) {
    console.error('Error getting ride history:', error);
    throw error;
  }
};

/**
 * Get ride by ID
 * @param {string} rideId - Ride ID
 * @returns {Promise<Object>} - Ride details
 */
export const getRideById = async (rideId) => {
  try {
    const token = await getAuthToken();
    if (!token) throw new Error('Authentication required');

    const response = await axios.get(
      `${BASE_URL}/api/rides/${rideId}`,
      {
        headers: { 'x-access-token': token }
      }
    );
    
    return response.data.ride;
  } catch (error) {
    console.error(`Error getting ride ${rideId}:`, error);
    throw error;
  }
};

/**
 * Get user's active rides
 * @returns {Promise<Array>} - List of active rides
 */
export const getUserActiveRides = async () => {
  try {
    const token = await getAuthToken();
    if (!token) throw new Error('Authentication required');

    const response = await axios.get(
      `${BASE_URL}/api/rides/active`,
      {
        headers: { 'x-access-token': token }
      }
    );
    
    return response.data.rides;
  } catch (error) {
    console.error('Error getting active rides:', error);
    throw error;
  }
};

/**
 * Update driver location during a ride
 * @param {string} rideId - Ride ID
 * @param {Object} location - Location coordinates {latitude, longitude}
 * @returns {Promise<Object>} - Updated location
 */
export const updateDriverLocation = async (rideId, location) => {
  try {
    const token = await getAuthToken();
    if (!token) throw new Error('Authentication required');

    const response = await axios.post(
      `${BASE_URL}/api/rides/${rideId}/location`,
      { location },
      {
        headers: { 'x-access-token': token }
      }
    );
    
    return response.data;
  } catch (error) {
    console.error(`Error updating driver location for ride ${rideId}:`, error);
    throw error;
  }
}; 