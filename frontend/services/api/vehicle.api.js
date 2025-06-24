/**
 * Vehicle API Service
 * Handles all vehicle-related API calls
 */
import axios from 'axios';
import { BASE_URL, ENDPOINTS } from './endpoints';
import { getAuthToken } from './auth.api';

/**
 * Get all vehicles
 * @param {Object} filters - Optional filters
 * @returns {Promise<Array>} - List of vehicles
 */
export const getVehicles = async (filters = {}) => {
  try {
    // Build query string from filters
    const queryParams = new URLSearchParams();
    
    if (filters.type) {
      queryParams.append('type', filters.type);
    }
    
    if (filters.nearby && filters.location) {
      queryParams.append('nearby', 'true');
      queryParams.append('latitude', filters.location.latitude);
      queryParams.append('longitude', filters.location.longitude);
      
      if (filters.radius) {
        queryParams.append('radius', filters.radius);
      }
    }
    
    const token = await getAuthToken();
    const queryString = queryParams.toString();
    const url = `${BASE_URL}${ENDPOINTS.VEHICLE.ALL}${queryString ? `?${queryString}` : ''}`;
    
    const response = await axios.get(url, {
      headers: token ? { 'x-access-token': token } : {}
    });
    
    return response.data.vehicles;
  } catch (error) {
    console.error('Error fetching vehicles:', error);
    throw error;
  }
};

/**
 * Get vehicle by ID
 * @param {string} vehicleId - Vehicle ID
 * @returns {Promise<Object>} - Vehicle data
 */
export const getVehicleById = async (vehicleId) => {
  try {
    const token = await getAuthToken();
    const url = `${BASE_URL}${ENDPOINTS.VEHICLE.BY_ID(vehicleId)}`;
    
    const response = await axios.get(url, {
      headers: token ? { 'x-access-token': token } : {}
    });
    
    return response.data.vehicle;
  } catch (error) {
    console.error(`Error fetching vehicle ${vehicleId}:`, error);
    throw error;
  }
};

/**
 * Get nearby vehicles based on location
 * @param {Object} location - User location {latitude, longitude}
 * @param {number} radius - Search radius in kilometers (default: 5)
 * @returns {Promise<Array>} - List of nearby vehicles
 */
export const getNearbyVehicles = async (location, radius = 5) => {
  try {
    if (!location || !location.latitude || !location.longitude) {
      throw new Error('Valid location is required');
    }
    
    return getVehicles({
      nearby: true,
      location,
      radius
    });
  } catch (error) {
    console.error('Error fetching nearby vehicles:', error);
    throw error;
  }
};

/**
 * Get vehicle types
 * @returns {Promise<Array>} - List of vehicle types
 */
export const getVehicleTypes = async () => {
  try {
    const url = `${BASE_URL}${ENDPOINTS.VEHICLE.TYPES}`;
    const response = await axios.get(url);
    return response.data.types;
  } catch (error) {
    console.error('Error fetching vehicle types:', error);
    throw error;
  }
}; 