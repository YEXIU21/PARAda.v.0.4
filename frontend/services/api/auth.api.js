/**
 * Authentication API Service
 * Handles all authentication-related API calls
 */
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL, ENDPOINTS } from '@/services/api/api.config';

/**
 * Get authentication token from AsyncStorage
 * @returns {Promise<string|null>} - Authentication token or null
 */
export const getAuthToken = async () => {
  try {
    // First try the current 'token' key
    let token = await AsyncStorage.getItem('token');
    
    // If token not found, try the alternate 'authToken' key
    if (!token) {
      token = await AsyncStorage.getItem('authToken');
      
      // If found under 'authToken', migrate it to 'token' for consistency
      if (token) {
        console.log('Found token under authToken key, migrating...');
        await AsyncStorage.setItem('token', token);
      }
    }
    
    if (!token) {
      console.warn('No authentication token found in storage.');
      
      // For debugging, log all available keys in AsyncStorage
      const keys = await AsyncStorage.getAllKeys();
      console.log('Available AsyncStorage keys:', keys);
      return null;
    }
    
    return token;
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
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
    const response = await axios.post(`${BASE_URL}${ENDPOINTS.AUTH.LOGIN}`, { email, password });
    
    if (response.data && response.data.accessToken) {
      // Save token
      await AsyncStorage.setItem('token', response.data.accessToken);
      
      return {
        user: response.data.user,
        token: response.data.accessToken
      };
    }
    
    throw new Error('Login failed');
  } catch (error) {
    console.error('Login error:', error);
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
    const response = await axios.post(`${BASE_URL}${ENDPOINTS.AUTH.REGISTER}`, userData);
    
    if (response.status === 201 && response.data.user) {
      return response.data.user;
    }
    
    throw new Error('Registration failed');
  } catch (error) {
    console.error('Registration error:', error);
    throw error;
  }
};

/**
 * Logout user
 * @returns {Promise<void>}
 */
export const logout = async () => {
  try {
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('user');
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
    const token = await getAuthToken();
    if (!token) {
      console.log('No auth token found');
      return null;
    }
    
    console.log(`Fetching user data from ${BASE_URL}${ENDPOINTS.AUTH.ME}`);
    const response = await axios.get(
      `${BASE_URL}${ENDPOINTS.AUTH.ME}`,
      {
        headers: { 'x-access-token': token }
      }
    );
    
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