/**
 * Destination API Service
 * Handles all destination-related API calls
 */
import axios from 'axios';
import { BASE_URL, ENDPOINTS } from './endpoints';
import { getAuthToken } from './auth.api';

/**
 * Get popular destinations
 * @returns {Promise<Array>} - List of popular destinations
 */
export const getPopularDestinations = async () => {
  try {
    const url = `${BASE_URL}/api/destinations/popular`;
    const token = await getAuthToken();
    
    const response = await axios.get(url, {
      headers: token ? { 'x-access-token': token } : {}
    });
    
    return response.data.destinations;
  } catch (error) {
    console.error('Error fetching popular destinations:', error);
    throw error;
  }
};

/**
 * Search destinations by query
 * @param {string} query - Search query
 * @returns {Promise<Array>} - List of matching destinations
 */
export const searchDestinations = async (query) => {
  try {
    if (!query || query.trim() === '') {
      return [];
    }
    
    const url = `${BASE_URL}/api/destinations/search?query=${encodeURIComponent(query)}`;
    const token = await getAuthToken();
    
    const response = await axios.get(url, {
      headers: token ? { 'x-access-token': token } : {}
    });
    
    return response.data.destinations;
  } catch (error) {
    console.error('Error searching destinations:', error);
    throw error;
  }
};

/**
 * Get nearby destinations based on user location
 * @param {Object} location - User location {latitude, longitude}
 * @param {number} radius - Search radius in kilometers (default: 5)
 * @returns {Promise<Array>} - List of nearby destinations
 */
export const getNearbyDestinations = async (location, radius = 5) => {
  try {
    if (!location || !location.latitude || !location.longitude) {
      throw new Error('Valid location is required');
    }
    
    const url = `${BASE_URL}/api/destinations/nearby?latitude=${location.latitude}&longitude=${location.longitude}&radius=${radius}`;
    const token = await getAuthToken();
    
    const response = await axios.get(url, {
      headers: token ? { 'x-access-token': token } : {}
    });
    
    return response.data.destinations;
  } catch (error) {
    console.error('Error fetching nearby destinations:', error);
    throw error;
  }
};

/**
 * Get destination details by ID
 * @param {string} destinationId - Destination ID
 * @returns {Promise<Object>} - Destination details
 */
export const getDestinationById = async (destinationId) => {
  try {
    const url = `${BASE_URL}/api/destinations/${destinationId}`;
    const token = await getAuthToken();
    
    const response = await axios.get(url, {
      headers: token ? { 'x-access-token': token } : {}
    });
    
    return response.data.destination;
  } catch (error) {
    console.error(`Error fetching destination ${destinationId}:`, error);
    throw error;
  }
}; 