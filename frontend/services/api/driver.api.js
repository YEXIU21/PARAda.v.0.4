import axios from 'axios';
import { BASE_URL } from './api.config';
import { ENDPOINTS } from './endpoints';
import { getAuthToken } from './auth.api';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Get driver profile by user ID
 * @returns {Promise<Object>} - Driver profile data
 */
export const getDriverProfile = async () => {
  try {
    const token = await getAuthToken();
    if (!token) throw new Error('Authentication required');

    const response = await axios.get(
      `${BASE_URL}${ENDPOINTS.DRIVER.PROFILE}`,
      {
        headers: { 'x-access-token': token }
      }
    );
    
    return response.data.driver;
  } catch (error) {
    console.error('Error fetching driver profile:', error);
    
    // Check for specific error types to provide better messages
    if (error.response) {
      // The request was made and the server responded with a status code outside the 2xx range
      if (error.response.status === 404) {
        throw new Error('Driver profile not found. You might need to register as a driver first.');
      } else if (error.response.status === 401) {
        throw new Error('Authentication required. Please log in again.');
      } else if (error.response.status === 403) {
        throw new Error('You do not have permission to access the driver profile.');
      } else {
        throw new Error(`Server error: ${error.response.data?.message || 'Unknown error occurred'}`);
      }
    } else if (error.request) {
      // The request was made but no response was received
      throw new Error('Unable to reach the server. Please check your internet connection.');
    } else {
      // Something happened in setting up the request that triggered an Error
      throw error;
    }
  }
};

/**
 * Get driver by ID
 * @param {string} driverId - Driver ID
 * @returns {Promise<Object>} - Driver data
 */
export const getDriverById = async (driverId) => {
  try {
    const token = await getAuthToken();
    if (!token) throw new Error('Authentication required');

    const response = await axios.get(
      `${BASE_URL}${ENDPOINTS.DRIVER.BY_ID(driverId)}`,
      {
        headers: { 'x-access-token': token }
      }
    );
    
    return response.data.driver;
  } catch (error) {
    console.error(`Error fetching driver ${driverId}:`, error);
    
    // Handle specific error cases
    if (error.response) {
      if (error.response.status === 404) {
        throw new Error(`Driver with ID ${driverId} not found.`);
      } else {
        throw new Error(`Server error: ${error.response.data?.message || 'Unknown error occurred'}`);
      }
    } else if (error.request) {
      throw new Error('Unable to reach the server. Please check your internet connection.');
    } else {
      throw error;
    }
  }
};

/**
 * Get driver's assigned routes
 * @returns {Promise<Array>} - List of routes assigned to the driver
 */
export const getDriverRoutes = async () => {
  try {
    const token = await getAuthToken();
    if (!token) throw new Error('Authentication required');

    const response = await axios.get(
      `${BASE_URL}${ENDPOINTS.DRIVER.ROUTES}`,
      {
        headers: { 'x-access-token': token }
      }
    );
    
    return response.data.routes || [];
  } catch (error) {
    console.error('Error fetching driver routes:', error);
    
    if (error.response) {
      if (error.response.status === 404) {
        return []; // Return empty array if no routes found
      } else if (error.response.status === 401) {
        throw new Error('Authentication required. Please log in again.');
      } else if (error.response.status === 403) {
        throw new Error('You do not have permission to access driver routes.');
      } else {
        throw new Error(`Server error: ${error.response.data?.message || 'Unknown error occurred'}`);
      }
    } else if (error.request) {
      throw new Error('Unable to reach the server. Please check your internet connection.');
    } else {
      throw error;
    }
  }
};

/**
 * Update driver status (active, offline, inactive)
 * @param {string} status - New status
 * @returns {Promise<Object>} - Updated driver data
 */
export const updateDriverStatus = async (status) => {
  try {
    console.log(`[DRIVER STATUS] Attempting to update driver status to: ${status}`);
    
    // Update local storage first for immediate UI response
    try {
      await AsyncStorage.setItem('driverDutyStatus', status);
      console.log('[DRIVER STATUS] Updated local storage with status:', status);
    } catch (storageError) {
      console.warn('[DRIVER STATUS] Could not save driver status to storage:', storageError);
    }
    
    const token = await getAuthToken();
    if (!token) {
      console.error('[DRIVER STATUS] No auth token found for status update');
      throw new Error('Authentication required');
    }

    const url = `${BASE_URL}${ENDPOINTS.DRIVER.STATUS}`;
    console.log(`[DRIVER STATUS] Sending status update to: ${url} with status: ${status}`);
    console.log(`[DRIVER STATUS] Token available: ${!!token}`);
    
    // Set a longer timeout for this specific request
    const response = await axios.put(
      url,
      { status },
      {
        headers: { 
          'x-access-token': token,
          'Content-Type': 'application/json'
        },
        timeout: 60000 // 60 seconds timeout - increased from 15s
      }
    );
    
    console.log('[DRIVER STATUS] Driver status update successful:', response.data);
    return response.data.driver;
  } catch (error) {
    console.error('[DRIVER STATUS] Error updating driver status:', error);
    
    // If there was an error, try to revert the local storage
    try {
      // Get current status from storage to check what it was before
      const currentStatus = await AsyncStorage.getItem('driverDutyStatus');
      // Only revert if we failed after setting it
      if (currentStatus === status) {
        // Revert to opposite status
        const revertStatus = status === 'active' ? 'offline' : 'active';
        await AsyncStorage.setItem('driverDutyStatus', revertStatus);
        console.log('[DRIVER STATUS] Reverted local storage status due to API error');
      }
    } catch (storageError) {
      console.warn('[DRIVER STATUS] Could not revert driver status in storage:', storageError);
    }
    
    if (error.response) {
      console.error('[DRIVER STATUS] Response status:', error.response.status);
      console.error('[DRIVER STATUS] Response data:', error.response.data);
      
      if (error.response.status === 400) {
        throw new Error(`Invalid status: ${error.response.data?.message || 'Status must be active, offline, or inactive'}`);
      } else if (error.response.status === 401) {
        throw new Error('Authentication required. Please log in again.');
      } else if (error.response.status === 403) {
        throw new Error('You do not have permission to update driver status.');
      } else {
        throw new Error(`Server error: ${error.response.data?.message || 'Unknown error occurred'}`);
      }
    } else if (error.request) {
      console.error('[DRIVER STATUS] No response received from server');
      console.error('[DRIVER STATUS] Request details:', error.request);
      
      // If network error, update local state but inform user
      if (error.code === 'ECONNABORTED') {
        // Request timed out
        throw new Error('Request timed out. The status may not have been updated on the server.');
      } else {
        throw new Error('Unable to reach the server. Please check your internet connection.');
      }
    } else {
      console.error('[DRIVER STATUS] Error message:', error.message);
      throw error;
    }
  }
};

/**
 * Update driver location
 * @param {Object} location - Location coordinates {latitude, longitude}
 * @returns {Promise<Object>} - Updated location
 */
export const updateDriverLocation = async (location) => {
  try {
    const token = await getAuthToken();
    if (!token) throw new Error('Authentication required');

    const response = await axios.put(
      `${BASE_URL}${ENDPOINTS.DRIVER.LOCATION}`,
      location,
      {
        headers: { 'x-access-token': token }
      }
    );
    
    return response.data;
  } catch (error) {
    console.error('Error updating driver location:', error);
    
    if (error.response) {
      if (error.response.status === 400) {
        throw new Error(`Invalid location data: ${error.response.data?.message || 'Latitude and longitude are required'}`);
      } else if (error.response.status === 401) {
        throw new Error('Authentication required. Please log in again.');
      } else if (error.response.status === 403) {
        throw new Error('You do not have permission to update location.');
      } else {
        throw new Error(`Server error: ${error.response.data?.message || 'Unknown error occurred'}`);
      }
    } else if (error.request) {
      // For location updates, we can fail silently as they happen frequently in the background
      console.warn('Location update failed, will retry later');
      return { success: false };
    } else {
      throw error;
    }
  }
}; 