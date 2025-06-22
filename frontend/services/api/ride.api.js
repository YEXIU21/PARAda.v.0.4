/**
 * Ride API Service
 * Handles all ride-related API calls
 */
import axios from 'axios';
import { BASE_URL, ENDPOINTS } from '@/services/api/api.config';
import { getAuthToken } from '@/services/api/auth.api';

/**
 * Request a new ride
 * @param {Object} rideData - Ride request data including pickup location, destination, and vehicle type
 * @returns {Promise<Object>} - Created ride
 */
export const requestRide = async (rideData) => {
  try {
    const token = await getAuthToken();
    if (!token) throw new Error('Authentication required');

    const response = await axios.post(
      `${BASE_URL}/api/rides`,
      rideData,
      {
        headers: { 'x-access-token': token }
      }
    );
    
    return response.data.ride;
  } catch (error) {
    console.error('Error requesting ride:', error);
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
 * Accept a ride (for drivers)
 * @param {string} rideId - Ride ID
 * @returns {Promise<Object>} - Updated ride
 */
export const acceptRide = async (rideId) => {
  try {
    const token = await getAuthToken();
    if (!token) throw new Error('Authentication required');

    const response = await axios.post(
      `${BASE_URL}/api/rides/${rideId}/accept`,
      {},
      {
        headers: { 'x-access-token': token }
      }
    );
    
    return response.data.ride;
  } catch (error) {
    console.error(`Error accepting ride ${rideId}:`, error);
    throw error;
  }
};

/**
 * Update ride status
 * @param {string} rideId - Ride ID
 * @param {string} status - New status ('picked_up', 'in_progress', 'completed', 'cancelled')
 * @param {Object} additionalData - Additional data for the status update
 * @returns {Promise<Object>} - Updated ride
 */
export const updateRideStatus = async (rideId, status, additionalData = {}) => {
  try {
    const token = await getAuthToken();
    if (!token) throw new Error('Authentication required');

    const response = await axios.put(
      `${BASE_URL}/api/rides/${rideId}/status`,
      {
        status,
        ...additionalData
      },
      {
        headers: { 'x-access-token': token }
      }
    );
    
    return response.data.ride;
  } catch (error) {
    console.error(`Error updating ride ${rideId} status:`, error);
    throw error;
  }
};

/**
 * Cancel a ride
 * @param {string} rideId - Ride ID
 * @param {string} reason - Cancellation reason
 * @returns {Promise<Object>} - Cancelled ride
 */
export const cancelRide = async (rideId, reason = '') => {
  try {
    const token = await getAuthToken();
    if (!token) throw new Error('Authentication required');

    const response = await axios.post(
      `${BASE_URL}/api/rides/${rideId}/cancel`,
      { reason },
      {
        headers: { 'x-access-token': token }
      }
    );
    
    return response.data.ride;
  } catch (error) {
    console.error(`Error cancelling ride ${rideId}:`, error);
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