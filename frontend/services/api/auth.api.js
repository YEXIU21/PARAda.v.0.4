/**
 * Auth API Service
 * Handles all authentication-related API calls
 */
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL, ENDPOINTS, AXIOS_CONFIG } from './api.config';
import { Platform } from 'react-native';
import axiosInstance from './api.config';

// Constants for multiple storage keys to ensure persistence
const TOKEN_KEYS = {
  PRIMARY: 'token',
  SECONDARY: 'authToken',
  BACKUP: 'backup_token',
  WEB_STORAGE: 'parada_token'
};

/**
 * Save authentication token to multiple storage locations for redundancy
 * @param {string} token - Authentication token
 * @returns {Promise<void>}
 */
export const saveAuthToken = async (token) => {
  if (!token) {
    console.warn('Attempted to save empty token');
    return;
  }
  
  try {
    // Save to all AsyncStorage keys
    await AsyncStorage.setItem(TOKEN_KEYS.PRIMARY, token);
    await AsyncStorage.setItem(TOKEN_KEYS.SECONDARY, token);
    await AsyncStorage.setItem(TOKEN_KEYS.BACKUP, token);
    
    // If on web platform, also save to localStorage and sessionStorage
    if (Platform.OS === 'web') {
      try {
        localStorage.setItem(TOKEN_KEYS.WEB_STORAGE, token);
        sessionStorage.setItem(TOKEN_KEYS.WEB_STORAGE, token);
      } catch (e) {
        console.error('Error saving token to web storage:', e);
      }
    }
    
    console.log('Authentication token saved to multiple locations');
  } catch (error) {
    console.error('Error saving auth token:', error);
  }
};

/**
 * Get authentication token from AsyncStorage with fallback mechanisms
 * @returns {Promise<string|null>} - Authentication token or null
 */
export const getAuthToken = async () => {
  try {
    // Try to get token from the primary location
    let token = await AsyncStorage.getItem(TOKEN_KEYS.PRIMARY);
    
    // If not found, try secondary locations
    if (!token) {
      console.log('Primary token not found, trying secondary...');
      token = await AsyncStorage.getItem(TOKEN_KEYS.SECONDARY);
    }
    
    // If still not found, try backup location
    if (!token) {
      console.log('Secondary token not found, trying backup...');
      token = await AsyncStorage.getItem(TOKEN_KEYS.BACKUP);
    }
    
    // If on web, also try web storage as last resort
    if (!token && Platform.OS === 'web') {
      console.log('Backup token not found, trying web storage...');
      try {
        token = localStorage.getItem(TOKEN_KEYS.WEB_STORAGE) || 
                sessionStorage.getItem(TOKEN_KEYS.WEB_STORAGE);
      } catch (e) {
        console.error('Error accessing web storage:', e);
      }
    }
    
    // If token found in any alternate location, restore it to all locations
    if (token && !await AsyncStorage.getItem(TOKEN_KEYS.PRIMARY)) {
      console.log('Token found in alternate location, restoring to all locations...');
      await saveAuthToken(token);
    }
    
    if (!token) {
      console.warn('No authentication token found in any storage location');
      
      // For debugging, log all available keys in AsyncStorage
      const keys = await AsyncStorage.getAllKeys();
      console.log('Available AsyncStorage keys:', keys);
      return null;
    }
    
    // Verify token with backend if possible (but don't block the request)
    validateTokenInBackground(token);
    
    return token;
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
};

/**
 * Validate token with backend in background
 * @param {string} token - Token to validate
 * @returns {Promise<boolean>} - Whether token is valid
 */
const validateTokenInBackground = async (token) => {
  if (!token) return false;
  
  try {
    // Use a short timeout for validation to avoid blocking
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    
    const response = await axios.post(
      `${BASE_URL}${ENDPOINTS.AUTH.VERIFY}`,
      { token },
      { 
        signal: controller.signal,
        headers: { 'Content-Type': 'application/json' } 
      }
    );
    
    clearTimeout(timeoutId);
    
    if (response.data && response.data.valid === false) {
      console.warn('Token validation failed in background check');
      return false;
    }
    
    return true;
  } catch (error) {
    // Don't log errors for aborted requests
    if (error.name !== 'AbortError') {
      console.error('Background token validation error:', error);
    }
    
    // Return true on network errors to avoid logging out users unnecessarily
    return true;
  }
};

/**
 * Get authentication header for API requests
 * @returns {Promise<Object>} - Header object with authentication token
 */
export const getAuthHeader = async () => {
  try {
    const token = await getAuthToken();
    if (!token) return {};
    
    return { 
      'x-access-token': token,
      'Authorization': `Bearer ${token}`
    };
  } catch (error) {
    console.error('Error creating auth headers:', error);
    return {};
  }
};

/**
 * Login user
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise<Object>} - User data and token
 */
export const login = async (email, password) => {
  try {
    console.log(`Logging in to ${BASE_URL}${ENDPOINTS.AUTH.LOGIN}`);
    const response = await axiosInstance.post(
      `${BASE_URL}${ENDPOINTS.AUTH.LOGIN}`, 
      { email, password }
    );
    
    if (response.data && response.data.accessToken) {
      // Save token to all storage locations
      await saveAuthToken(response.data.accessToken);
      
      return {
        user: response.data.user,
        token: response.data.accessToken
      };
    }
    
    throw new Error('Login failed');
  } catch (error) {
    console.error('Login error:', error);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else if (error.request) {
      console.error('Request was made but no response received');
    } else {
      console.error('Error setting up request:', error.message);
    }
    throw error;
  }
};

/**
 * Register user
 * @param {Object} userData - User registration data
 * @returns {Promise<Object>} - User data
 */
export const register = async (userData) => {
  try {
    console.log(`Registering user at ${BASE_URL}${ENDPOINTS.AUTH.REGISTER}`);
    console.log('Registration data:', { ...userData, password: '[REDACTED]' });
    
    const response = await axiosInstance.post(
      `${BASE_URL}${ENDPOINTS.AUTH.REGISTER}`, 
      userData
    );
    
    if (response.status === 201 || (response.data && response.data.user)) {
      console.log('Registration successful:', response.data);
      return response.data.user || response.data;
    }
    
    throw new Error('Registration failed');
  } catch (error) {
    console.error('Registration error:', error);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
      
      // If there are validation errors, extract and throw the first one
      if (error.response.data && error.response.data.errors && Array.isArray(error.response.data.errors)) {
        const validationErrors = error.response.data.errors;
        if (validationErrors.length > 0) {
          throw new Error(validationErrors[0].msg || 'Validation error');
        }
      }
      
      // If there's a specific error message from the server, use it
      if (error.response.data && error.response.data.message) {
        throw new Error(error.response.data.message);
      }
    } else if (error.request) {
      console.error('Request was made but no response received');
      console.error('Request details:', error.request);
      throw new Error('Server not responding. Please check your internet connection.');
    }
    
    // Re-throw the original error if we couldn't extract a better message
    throw error;
  }
};

/**
 * Logout user - ensure all tokens are cleared
 * @returns {Promise<void>}
 */
export const logout = async () => {
  try {
    // Clear all token storage locations
    await AsyncStorage.removeItem(TOKEN_KEYS.PRIMARY);
    await AsyncStorage.removeItem(TOKEN_KEYS.SECONDARY);
    await AsyncStorage.removeItem(TOKEN_KEYS.BACKUP);
    await AsyncStorage.removeItem('user');
    
    // Clear web storage if on web
    if (Platform.OS === 'web') {
      try {
        localStorage.removeItem(TOKEN_KEYS.WEB_STORAGE);
        localStorage.removeItem('parada_last_path');
        sessionStorage.removeItem(TOKEN_KEYS.WEB_STORAGE);
        sessionStorage.removeItem('parada_last_path');
      } catch (e) {
        console.error('Error clearing web storage:', e);
      }
    }
    
    console.log('All auth tokens cleared');
  } catch (error) {
    console.error('Logout error:', error);
    throw error;
  }
};

/**
 * Get authenticated user
 * @returns {Promise<Object|null>} - User data or null
 */
export const getAuthUser = async () => {
  try {
    console.log(`Fetching user data from ${BASE_URL}${ENDPOINTS.AUTH.ME}`);
    const response = await axiosInstance.get(`${BASE_URL}${ENDPOINTS.AUTH.ME}`);
    
    console.log('Auth user response:', response.data);
    return response.data.user;
  } catch (error) {
    console.error('Error getting authenticated user:', error);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
    return null;
  }
};

/**
 * Refresh user data including subscription status
 * @returns {Promise<{
 *   id: string,
 *   username: string,
 *   email: string,
 *   role: string,
 *   subscription?: {
 *     type: string,
 *     plan: string,
 *     verified: boolean,
 *     expiryDate: string,
 *     referenceNumber: string
 *   }
 * }>} - User data with updated subscription status
 */
export const refreshUserData = async () => {
  try {
    const token = await getAuthToken();
    if (!token) throw new Error('Authentication required');

    // Ensure we have a valid URL
    const url = new URL(`${BASE_URL}/api/auth/profile`);
    
    console.log(`Refreshing user data from: ${url.toString()}`);
    
    const response = await axios.get(
      url.toString(),
      {
        headers: { 'x-access-token': token }
      }
    );
    
    console.log('Received user data from API:', response.data);
    
    // Check if the user has subscription data
    if (response.data && response.data.subscription) {
      console.log('User has subscription data:', response.data.subscription);
      
      // Verify that the subscription actually exists in the database
      try {
        // Import subscription API dynamically to avoid circular dependencies
        const { getUserSubscription } = require('./subscription.api');
        
        // Check if there's an actual subscription in the database
        const dbSubscription = await getUserSubscription();
        
        if (!dbSubscription) {
          console.log('WARNING: User has subscription data but no subscription found in database');
          console.log('Clearing subscription data from user object');
          
          // Remove subscription data from the user object
          delete response.data.subscription;
          
          // Update the user in AsyncStorage without subscription data
          const userData = {
            ...response.data,
            subscription: null
          };
          
          await AsyncStorage.setItem('user', JSON.stringify(userData));
          console.log('Updated user in AsyncStorage without subscription data');
        } else {
          // Subscription exists in database, update local storage with the data
          const subscriptionData = {
            type: response.data.subscription.type,
            plan: response.data.subscription.plan,
            verified: response.data.subscription.verified,
            expiryDate: response.data.subscription.expiryDate,
            referenceNumber: response.data.subscription.referenceNumber
          };
          
          await AsyncStorage.setItem('userSubscription', JSON.stringify(subscriptionData));
          console.log('Updated AsyncStorage with subscription data from API');
          
          // Update the user in AsyncStorage with subscription data
          await AsyncStorage.setItem('user', JSON.stringify(response.data));
          console.log('Updated user in AsyncStorage with subscription data');
        }
      } catch (error) {
        console.error('Error verifying subscription in database:', error);
        // In case of error, still return the user data as is
      }
    } else {
      // No subscription data in user object, make sure local storage is cleared
      await AsyncStorage.removeItem('userSubscription');
      
      // Update the user in AsyncStorage
      await AsyncStorage.setItem('user', JSON.stringify(response.data));
    }
    
    return {
      id: response.data._id,
      username: response.data.username,
      email: response.data.email,
      role: response.data.role,
      accountType: response.data.accountType || 'regular',
      studentId: response.data.studentId,
      profilePicture: response.data.profilePicture,
      isEmailVerified: response.data.isEmailVerified,
      lastLogin: response.data.lastLogin,
      subscription: response.data.subscription,
      isActive: response.data.isActive !== false, // Default to true if not specified
      disabledReason: response.data.disabledReason
    };
  } catch (error) {
    console.error('Error refreshing user data:', error);
    throw error;
  }
};

/**
 * Change user password
 * @param {string} userId - User ID
 * @param {string} currentPassword - Current password
 * @param {string} newPassword - New password
 * @returns {Promise<Object>} - Response with success message
 */
export const changePassword = async (userId, currentPassword, newPassword) => {
  try {
    console.log(`Changing password for user ID: ${userId}`);
    
    const token = await getAuthToken();
    if (!token) {
      console.error('Authentication token not found');
      throw new Error('Authentication required');
    }

    const url = `${BASE_URL}${ENDPOINTS.USER.CHANGE_PASSWORD(userId)}`;
    console.log(`Making password change request to: ${url}`);
    
    const response = await axios.put(
      url,
      { currentPassword, newPassword },
      {
        headers: { 'x-access-token': token }
      }
    );
    
    console.log('Password change API response:', response.status);
    return response.data;
  } catch (error) {
    console.error('Error changing password:', error);
    
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
      
      // Throw specific error message from backend if available
      if (error.response.data && error.response.data.message) {
        throw new Error(error.response.data.message);
      }
    }
    
    // If we don't have a specific error message, throw a generic one
    throw new Error('Failed to change password. Please try again.');
  }
}; 