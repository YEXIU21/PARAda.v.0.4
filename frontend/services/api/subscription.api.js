/**
 * Subscription API Service
 * Handles all subscription-related API calls
 */
import axios from 'axios';
import { BASE_URL, ENDPOINTS } from './api.config';
import { getAuthToken } from './auth.api';

/**
 * Get all subscription plans
 * @returns {Promise<Array>} - List of subscription plans
 */
export const getSubscriptionPlans = async () => {
  try {
    const response = await axios.get(`${BASE_URL}${ENDPOINTS.SUBSCRIPTION.PLANS}`);
    return response.data.plans;
  } catch (error) {
    console.error('Error fetching subscription plans:', error);
    throw error;
  }
};

/**
 * Get user's active subscription
 * @returns {Promise<Object|null>} - Active subscription or null
 */
export const getUserSubscription = async () => {
  try {
    const token = await getAuthToken();
    if (!token) throw new Error('Authentication required');

    // Try the '/user' endpoint first since it's the primary endpoint
    try {
      const userEndpoint = `${BASE_URL}${ENDPOINTS.SUBSCRIPTION.USER}`;
      console.log(`Fetching subscription from: ${userEndpoint}`);
      
      const response = await axios.get(
        userEndpoint,
        {
          headers: { 'x-access-token': token },
          // Set a timeout to prevent hanging requests
          timeout: 10000
        }
      );
      
      console.log('Subscription response from /user:', response.data);
      
      // Handle case where subscription is explicitly null from backend
      if (response.data.subscription === null) {
        console.log('Backend returned null subscription from /user');
        return null;
      }
      
      // Validate that we have a valid subscription object
      const subscription = response.data.subscription;
      if (!subscription) {
        console.log('No subscription data in response from /user');
        return null;
      }
      
      // Check if this is a pending subscription and add the pending flag if needed
      if (response.data.pending && !subscription.pending) {
        subscription.pending = true;
      }
      
      // Validate that the subscription has the required fields
      if (!subscription.type || !subscription.planId) {
        console.log('Invalid subscription data from /user - missing required fields');
        return null;
      }
      
      return subscription;
    } catch (userError) {
      // If 404 from '/user', try the '/me' endpoint as fallback
      if (userError.response && userError.response.status === 404) {
        console.log('No subscription found at /user endpoint (404), trying /me endpoint');
        
        try {
          const meEndpoint = `${BASE_URL}${ENDPOINTS.SUBSCRIPTION.ME}`;
          console.log(`Fetching subscription from fallback endpoint: ${meEndpoint}`);
          
          const response = await axios.get(
            meEndpoint,
            {
              headers: { 'x-access-token': token },
              // Set a timeout to prevent hanging requests
              timeout: 10000
            }
          );
          
          console.log('Subscription response from /me:', response.data);
          
          // Handle case where subscription is explicitly null from backend
          if (response.data.subscription === null) {
            console.log('Backend returned null subscription from /me');
            return null;
          }
          
          // Validate that we have a valid subscription object
          const subscription = response.data.subscription;
          if (!subscription) {
            console.log('No subscription data in response from /me');
            return null;
          }
          
          // Check if this is a pending subscription and add the pending flag if needed
          if (response.data.pending && !subscription.pending) {
            subscription.pending = true;
          }
          
          // Validate that the subscription has the required fields
          if (!subscription.type || !subscription.planId) {
            console.log('Invalid subscription data from /me - missing required fields');
            return null;
          }
          
          return subscription;
        } catch (meError) {
          if (meError.response && meError.response.status === 404) {
            console.log('No active subscription found at /me endpoint (404)');
            return null;
          }
          
          // Log detailed error information
          console.error('Error fetching from /me endpoint:');
          if (meError.response) {
            console.error(`Status: ${meError.response.status}`);
            console.error('Response data:', meError.response.data);
          } else if (meError.request) {
            console.error('No response received:', meError.request);
          } else {
            console.error('Error message:', meError.message);
          }
          
          // Return null instead of throwing to prevent app crashes
          console.log('Returning null due to subscription API error');
          return null;
        }
      }
      
      // Log detailed error information
      console.error('Error fetching from /user endpoint:');
      if (userError.response) {
        console.error(`Status: ${userError.response.status}`);
        console.error('Response data:', userError.response.data);
      } else if (userError.request) {
        console.error('No response received:', userError.request);
      } else {
        console.error('Error message:', userError.message);
      }
      
      // Return null for any error (not just 404) to prevent app crashes
      console.log('Returning null due to subscription API error');
      return null;
    }
  } catch (error) {
    if (error.response && error.response.status === 404) {
      // No active subscription
      console.log('No active subscription found (404)');
      return null;
    }
    
    // Enhanced error logging
    console.error('Error fetching user subscription:');
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error('Response data:', error.response.data);
    } else if (error.request) {
      console.error('No response received:', error.request);
    } else {
      console.error('Error message:', error.message);
    }
    
    // Return null instead of throwing to prevent app crashes
    console.log('Returning null due to subscription API error');
    return null;
  }
};

/**
 * Create a new subscription
 * @param {Object} subscriptionData - Subscription data
 * @returns {Promise<Object>} - Created subscription
 */
export const createSubscription = async (subscriptionData) => {
  try {
    const token = await getAuthToken();
    if (!token) throw new Error('Authentication required');

    const response = await axios.post(
      `${BASE_URL}${ENDPOINTS.SUBSCRIPTION.CREATE}`,
      subscriptionData,
      {
        headers: { 'x-access-token': token }
      }
    );
    
    return response.data.subscription;
  } catch (error) {
    console.error('Error creating subscription:', error);
    throw error;
  }
};

/**
 * Cancel a subscription
 * @param {string} subscriptionId - ID of the subscription to cancel
 * @returns {Promise<Object>} - Cancelled subscription
 */
export const cancelSubscription = async (subscriptionId) => {
  try {
    const token = await getAuthToken();
    if (!token) throw new Error('Authentication required');

    const response = await axios.delete(
      `${BASE_URL}${ENDPOINTS.SUBSCRIPTION.BY_ID(subscriptionId)}`,
      {
        headers: { 'x-access-token': token }
      }
    );
    
    return response.data.subscription;
  } catch (error) {
    console.error('Error cancelling subscription:', error);
    throw error;
  }
};

/**
 * Get all pending subscriptions (admin only)
 * @returns {Promise<Array>} - List of pending subscriptions
 */
export const getPendingSubscriptions = async () => {
  try {
    const token = await getAuthToken();
    if (!token) throw new Error('Authentication required');

    // Ensure we have a valid URL by constructing it properly
    const url = new URL(`${BASE_URL}${ENDPOINTS.SUBSCRIPTION.PENDING}`);
    
    console.log(`Fetching pending subscriptions from: ${url.toString()}`);
    console.log('Using token:', token.substring(0, 15) + '...');
    
    const response = await axios.get(
      url.toString(),
      {
        headers: { 'x-access-token': token }
      }
    );
    
    console.log('Pending subscriptions response:', response.data);
    return response.data.subscriptions || [];
  } catch (error) {
    console.error('Error fetching pending subscriptions:', error);
    
    // More detailed error logging
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    } else if (error.request) {
      console.error('No response received, request was:', error.request);
    } else {
      console.error('Error message:', error.message);
    }
    
    throw error;
  }
};

/**
 * Verify a subscription (admin only)
 * @param {string} subscriptionId - ID of the subscription to verify
 * @param {boolean} approved - Whether the subscription is approved
 * @returns {Promise<Object>} - Verified subscription
 */
export const verifySubscription = async (subscriptionId, approved) => {
  try {
    const token = await getAuthToken();
    if (!token) throw new Error('Authentication required');

    const response = await axios.post(
      `${BASE_URL}${ENDPOINTS.SUBSCRIPTION.VERIFY}`,
      {
        subscriptionId,
        approved
      },
      {
        headers: { 'x-access-token': token }
      }
    );
    
    return response.data.subscription;
  } catch (error) {
    console.error('Error verifying subscription:', error);
    throw error;
  }
};

/**
 * Get all subscriptions (admin only)
 * @returns {Promise<Array>} - List of all subscriptions
 */
export const getAllSubscriptions = async () => {
  try {
    const token = await getAuthToken();
    if (!token) throw new Error('Authentication required');

    // Ensure we have a valid URL by constructing it properly
    const url = new URL(`${BASE_URL}${ENDPOINTS.SUBSCRIPTION.ALL}`);
    
    console.log(`Fetching all subscriptions from: ${url.toString()}`);
    console.log('Using token:', token.substring(0, 15) + '...');
    
    const response = await axios.get(
      url.toString(),
      {
        headers: { 'x-access-token': token }
      }
    );
    
    console.log('All subscriptions response status:', response.status);
    console.log('All subscriptions response data:', response.data);
    
    if (!response.data.subscriptions) {
      console.warn('No subscriptions array in response:', response.data);
      return [];
    }
    
    return response.data.subscriptions;
  } catch (error) {
    console.error('Error fetching all subscriptions:', error);
    
    // More detailed error logging
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    } else if (error.request) {
      console.error('No response received, request was:', error.request);
    } else {
      console.error('Error message:', error.message);
    }
    
    throw error;
  }
};

/**
 * Approve a subscription by user ID and reference number (admin only)
 * @param {string} userId - User ID
 * @param {string} referenceNumber - Payment reference number
 * @returns {Promise<Object>} - Approved subscription
 */
export const approveSubscriptionByReference = async (userId, referenceNumber) => {
  try {
    const token = await getAuthToken();
    if (!token) throw new Error('Authentication required');

    const response = await axios.put(
      `${BASE_URL}${ENDPOINTS.SUBSCRIPTION.APPROVE}`,
      {
        userId,
        referenceNumber
      },
      {
        headers: { 'x-access-token': token }
      }
    );
    
    return response.data.subscription;
  }
  catch (error) {
    console.error('Error approving subscription:', error);
    throw error;
  }
};

/**
 * Get all pending subscriptions using the admin debug endpoint
 * @returns {Promise<Array>} - List of pending subscriptions
 */
export const adminPendingSubscriptions = async () => {
  try {
    const token = await getAuthToken();
    if (!token) throw new Error('Authentication required');

    // Ensure we have a valid URL by constructing it properly
    const url = new URL(`${BASE_URL}${ENDPOINTS.SUBSCRIPTION.ADMIN_PENDING}`);
    
    console.log(`Fetching pending subscriptions from debug endpoint: ${url.toString()}`);
    console.log('Using token:', token.substring(0, 15) + '...');
    
    const response = await axios.get(
      url.toString(),
      {
        headers: { 'x-access-token': token }
      }
    );
    
    console.log('Admin debug endpoint response:', response.data);
    return response.data.subscriptions || [];
  } catch (error) {
    console.error('Error fetching from admin pending subscriptions endpoint:', error);
    
    // More detailed error logging
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    } else if (error.request) {
      console.error('No response received, request was:', error.request);
    } else {
      console.error('Error message:', error.message);
    }
    
    throw error;
  }
}; 

/**
 * Get all verified subscriptions (admin only)
 * @returns {Promise<Array>} - List of verified subscriptions
 */
export const getVerifiedSubscriptions = async () => {
  try {
    const token = await getAuthToken();
    if (!token) throw new Error('Authentication required');

    // First get all subscriptions
    const allSubscriptions = await getAllSubscriptions();
    
    // Filter for verified subscriptions only
    const verifiedSubscriptions = allSubscriptions.filter(
      subscription => subscription.verification?.verified === true
    );
    
    console.log(`Found ${verifiedSubscriptions.length} verified subscriptions`);
    return verifiedSubscriptions;
  } catch (error) {
    console.error('Error fetching verified subscriptions:', error);
    
    // More detailed error logging
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    } else if (error.request) {
      console.error('No response received, request was:', error.request);
    } else {
      console.error('Error message:', error.message);
    }
    
    throw error;
  }
}; 