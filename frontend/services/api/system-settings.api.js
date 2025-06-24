/**
 * System Settings API Service
 * Handles system settings API calls
 */
import axios from 'axios';
import { BASE_URL, ENDPOINTS } from './endpoints';
import { getAuthToken } from './auth.api';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Get system settings
 * @returns {Promise<Object>} - System settings data
 */
export const getSystemSettings = async () => {
  try {
    const token = await getAuthToken();
    if (!token) {
      // Fallback to local settings if not authenticated
      return getLocalSystemSettings();
    }

    const response = await axios.get(
      `${BASE_URL}${ENDPOINTS.ADMIN.SYSTEM_SETTINGS}`,
      {
        headers: { 'x-access-token': token }
      }
    );
    
    // Cache the settings locally for offline use
    await AsyncStorage.setItem('systemSettings', JSON.stringify(response.data));
    
    return response.data;
  } catch (error) {
    console.error('Error fetching system settings:', error);
    
    // More detailed error logging
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    } else if (error.request) {
      console.error('No response received, request was:', error.request);
    } else {
      console.error('Error message:', error.message);
    }
    
    // Fallback to local settings
    return getLocalSystemSettings();
  }
};

/**
 * Update system settings
 * @param {Object} settings - Updated settings object
 * @returns {Promise<Object>} - Updated settings data
 */
export const updateSystemSettings = async (settings) => {
  try {
    const token = await getAuthToken();
    if (!token) throw new Error('Authentication required');

    const response = await axios.put(
      `${BASE_URL}${ENDPOINTS.ADMIN.SYSTEM_SETTINGS}`,
      settings,
      {
        headers: { 'x-access-token': token }
      }
    );
    
    // Update local cache
    await AsyncStorage.setItem('systemSettings', JSON.stringify(response.data));
    
    return response.data;
  } catch (error) {
    console.error('Error updating system settings:', error);
    
    // More detailed error logging
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    } else if (error.request) {
      console.error('No response received, request was:', error.request);
    } else {
      console.error('Error message:', error.message);
    }
    
    // Save locally even if API fails
    await AsyncStorage.setItem('systemSettings', JSON.stringify(settings));
    
    throw error;
  }
};

/**
 * Clear app cache
 * @returns {Promise<Object>} - Response from the API
 */
export const clearAppCache = async () => {
  try {
    const token = await getAuthToken();
    if (!token) throw new Error('Authentication required');

    const response = await axios.post(
      `${BASE_URL}${ENDPOINTS.ADMIN.CLEAR_CACHE}`,
      {},
      {
        headers: { 'x-access-token': token }
      }
    );
    
    return response.data;
  } catch (error) {
    console.error('Error clearing app cache:', error);
    throw error;
  }
};

/**
 * Reset system settings to defaults
 * @returns {Promise<Object>} - Default settings data
 */
export const resetSystemSettings = async () => {
  try {
    const token = await getAuthToken();
    if (!token) throw new Error('Authentication required');

    const response = await axios.post(
      `${BASE_URL}${ENDPOINTS.ADMIN.RESET_SETTINGS}`,
      {},
      {
        headers: { 'x-access-token': token }
      }
    );
    
    // Update local cache with default settings
    await AsyncStorage.setItem('systemSettings', JSON.stringify(response.data));
    
    return response.data;
  } catch (error) {
    console.error('Error resetting system settings:', error);
    throw error;
  }
};

/**
 * Get system settings from local storage
 * @returns {Promise<Object>} - System settings from local storage
 */
const getLocalSystemSettings = async () => {
  try {
    const savedSettings = await AsyncStorage.getItem('systemSettings');
    if (savedSettings) {
      return JSON.parse(savedSettings);
    }
    return null;
  } catch (error) {
    console.error('Error getting local system settings:', error);
    return null;
  }
}; 