/**
 * Installation API Service
 * Handles tracking app installations
 */
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL, ENDPOINTS, AXIOS_CONFIG } from './api.config';
import { Platform } from 'react-native';
import { v4 as uuidv4 } from 'uuid';

// Add installations endpoint to API config
if (!ENDPOINTS.INSTALLATIONS) {
  ENDPOINTS.INSTALLATIONS = {
    BASE: '/api/installations',
    STATS: '/api/installations/stats'
  };
}

/**
 * Generate a unique device ID or retrieve the existing one
 * @returns {Promise<string>} - Device ID
 */
export const getDeviceId = async () => {
  try {
    // Try to get existing device ID
    let deviceId = await AsyncStorage.getItem('deviceId');
    
    // If no device ID exists, generate a new one
    if (!deviceId) {
      deviceId = uuidv4();
      await AsyncStorage.setItem('deviceId', deviceId);
    }
    
    return deviceId;
  } catch (error) {
    console.error('Error getting device ID:', error);
    // Fallback to a random ID if AsyncStorage fails
    return uuidv4();
  }
};

/**
 * Determine the platform type
 * @returns {string} - Platform type (ios, android, web, pwa)
 */
export const getPlatformType = () => {
  if (Platform.OS === 'ios') return 'ios';
  if (Platform.OS === 'android') return 'android';
  
  // For web, check if it's a PWA
  if (Platform.OS === 'web') {
    // Check if running as installed PWA
    if (window.matchMedia('(display-mode: standalone)').matches || 
        window.navigator.standalone === true) {
      return 'pwa';
    }
    return 'web';
  }
  
  return 'web'; // Default fallback
};

/**
 * Get basic device information
 * @returns {Object} - Device info
 */
export const getDeviceInfo = () => {
  const info = {
    platform: Platform.OS,
    version: Platform.Version || 'unknown'
  };
  
  // Add web-specific info
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    info.userAgent = window.navigator.userAgent;
    info.language = window.navigator.language;
    info.screenWidth = window.screen.width;
    info.screenHeight = window.screen.height;
    info.timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  }
  
  return info;
};

/**
 * Track app installation
 * @returns {Promise<Object>} - Installation data
 */
export const trackInstallation = async () => {
  try {
    // Get device ID
    const deviceId = await getDeviceId();
    
    // Determine platform type
    const platformType = getPlatformType();
    
    // Get device info
    const deviceInfo = getDeviceInfo();
    
    // Check if we've already tracked this installation
    const installationTracked = await AsyncStorage.getItem('installationTracked');
    if (installationTracked === 'true') {
      console.log('Installation already tracked');
      return { alreadyTracked: true };
    }
    
    // Send installation data to API
    console.log(`Tracking installation: ${platformType} device ${deviceId}`);
    const response = await axios.post(
      `${BASE_URL}${ENDPOINTS.INSTALLATIONS.BASE}`,
      {
        platform: platformType,
        deviceId,
        deviceInfo
      },
      AXIOS_CONFIG
    );
    
    // Mark as tracked
    await AsyncStorage.setItem('installationTracked', 'true');
    
    console.log('Installation tracked successfully');
    return response.data;
  } catch (error) {
    console.error('Error tracking installation:', error);
    
    // If it's a 409 (already tracked), still mark as tracked locally
    if (error.response && error.response.status === 409) {
      await AsyncStorage.setItem('installationTracked', 'true');
      return { alreadyTracked: true };
    }
    
    throw error;
  }
};

/**
 * Get installation statistics (admin only)
 * @returns {Promise<Object>} - Installation statistics
 */
export const getInstallationStats = async () => {
  try {
    const token = await AsyncStorage.getItem('token');
    if (!token) throw new Error('Authentication required');
    
    const response = await axios.get(
      `${BASE_URL}${ENDPOINTS.INSTALLATIONS.STATS}`,
      {
        headers: { 'x-access-token': token }
      }
    );
    
    return response.data.stats;
  } catch (error) {
    console.error('Error getting installation stats:', error);
    throw error;
  }
}; 