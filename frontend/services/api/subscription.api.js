/**
 * Subscription API Service
 * Handles all subscription-related API calls
 */
import axios from 'axios';
import { BASE_URL, ENDPOINTS } from './api.config';
import { getAuthToken } from './auth.api';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Get all subscription plans
 * @returns {Promise<Array>} - List of subscription plans
 */
export const getSubscriptionPlans = async () => {
  try {
    console.log('Fetching subscription plans from public API');
    
    // Try to get plans directly from the new public-plans endpoint first
    try {
      // Check if we have user data to determine if student status should be included
      let isStudent = false;
      let accountType = 'standard';
      
      try {
        const userData = await AsyncStorage.getItem('user');
        if (userData) {
          const parsedUserData = JSON.parse(userData);
          isStudent = parsedUserData.accountType === 'student';
          accountType = parsedUserData.accountType || 'standard';
          console.log(`User account type detected: ${accountType}, isStudent: ${isStudent}`);
        }
      } catch (userDataError) {
        console.error('Error getting user data for subscription plans:', userDataError);
      }
      
      console.log('Trying new public-plans endpoint with student status:', isStudent);
      const response = await axios.get(`${BASE_URL}${ENDPOINTS.SUBSCRIPTION.BASE}/public-plans`, {
        params: { 
          isStudent: isStudent,
          accountType: accountType
        }
      });
      
      if (response.data && Array.isArray(response.data) && response.data.length > 0) {
        console.log('Successfully fetched subscription plans from public-plans endpoint:', response.data);
        
        // Ensure the plans have a consistent structure
        const normalizedPlans = response.data.map(plan => ({
          id: plan.id || plan.planId || plan._id || `plan-${Math.random().toString(36).substr(2, 9)}`,
          planId: plan.planId,
          _id: plan._id,
          name: plan.name || 'Unnamed Plan',
          price: typeof plan.price === 'string' ? parseFloat(plan.price) : (plan.price || 0),
          duration: typeof plan.duration === 'string' ? parseInt(plan.duration, 10) : (plan.duration || 30),
          features: Array.isArray(plan.features) ? plan.features : [],
          recommended: plan.recommended || false,
          // Include student discount information if provided
          originalPrice: plan.originalPrice,
          discountPercent: plan.discountPercent
        }));
        
        // Log detailed information for debugging
        if (normalizedPlans.length > 0) {
          console.log('DEBUG - Subscription plan format from API:', JSON.stringify(normalizedPlans[0], null, 2));
          console.log('Plan IDs - Standard format:', normalizedPlans.map(p => p.id));
          console.log('Plan IDs - MongoDB format:', normalizedPlans.map(p => p._id));
          console.log('Plan IDs - Backend format:', normalizedPlans.map(p => p.planId));
        }
        
        return normalizedPlans;
      }
      
      console.warn('Public-plans endpoint returned invalid data:', response.data);
      throw new Error('Invalid data from public-plans endpoint');
    } catch (publicPlansError) {
      console.warn('Error from public-plans endpoint, trying legacy plans endpoint:', publicPlansError);
      
      // Try the old plans endpoint as fallback
      try {
        const response = await axios.get(`${BASE_URL}${ENDPOINTS.SUBSCRIPTION.PLANS}`);
        
        // Debug log full response for troubleshooting
        console.log('Public API response:', response.data);
        
        // Make sure we return the same data structure as admin API
        if (response.data && Array.isArray(response.data.plans) && response.data.plans.length > 0) {
          console.log('Successfully fetched subscription plans from public API:', response.data.plans);
          
          // Ensure the plans have the same structure as admin plans
          const normalizedPlans = response.data.plans.map(plan => ({
            id: plan.id || plan.planId || plan._id || `plan-${Math.random().toString(36).substr(2, 9)}`,
            planId: plan.planId,
            _id: plan._id,
            name: plan.name || 'Unnamed Plan',
            price: typeof plan.price === 'string' ? parseFloat(plan.price) : (plan.price || 0),
            duration: typeof plan.duration === 'string' ? parseInt(plan.duration, 10) : (plan.duration || 30),
            features: Array.isArray(plan.features) ? plan.features : [],
            recommended: plan.recommended || false,
            // Include student discount information if provided
            originalPrice: plan.originalPrice,
            discountPercent: plan.discountPercent
          }));
          
          return normalizedPlans;
        }
        
        // If the public API returned an empty or invalid response, throw an error to fall back to the admin API
        console.warn('Public API returned invalid or empty plans data:', response.data);
        throw new Error('Invalid data from public API');
      } catch (publicApiError) {
        console.warn('Error or invalid data from public API, trying admin API as fallback:', publicApiError);
        
        // Fallback: Try the admin API endpoint
        try {
          // Import the admin API function dynamically to avoid circular dependencies
          const { getAdminSubscriptionPlans } = await import('./admin.api');
          const adminPlans = await getAdminSubscriptionPlans();
          
          if (adminPlans && Array.isArray(adminPlans) && adminPlans.length > 0) {
            console.log('Successfully fetched subscription plans from admin API:', adminPlans);
            return adminPlans;
          } 
          
          throw new Error('No valid plans from admin API');
        } catch (adminApiError) {
          console.error('Error fetching from admin API:', adminApiError);
          
          // If all APIs fail, return default plans from the database
          return await fetchDefaultPlansFromBackend();
        }
      }
    }
  } catch (error) {
    console.error('Error in getSubscriptionPlans:', error);
    // Return empty array instead of throwing to prevent crashes
    return [];
  }
};

/**
 * Fallback function to get default plans from backend
 * @returns {Promise<Array>} - List of default subscription plans
 */
const fetchDefaultPlansFromBackend = async () => {
  console.log('Fetching default plans from backend');
  
  try {
    // Use a special endpoint to get default plans
    const response = await axios.get(`${BASE_URL}/api/subscriptions/default-plans`);
    
    if (response.data && Array.isArray(response.data.plans) && response.data.plans.length > 0) {
      console.log('Successfully fetched default plans:', response.data.plans);
      return response.data.plans;
    }
  } catch (error) {
    console.error('Error fetching default plans:', error);
  }
  
  // If all else fails, return hardcoded default plans
  console.log('Using hardcoded default plans');
  return [
    {
      id: 'basic',
      planId: 'basic',
      name: 'Basic',
      price: 99,
      duration: 30,
      features: ['Real-time tracking', 'Schedule access', 'Traffic updates']
    },
    {
      id: 'premium',
      planId: 'premium',
      name: 'Premium',
      price: 199,
      duration: 30,
      features: ['All Basic features', 'Priority notifications', 'Offline maps', 'No advertisements'],
      recommended: true
    },
    {
      id: 'annual',
      planId: 'annual',
      name: 'Annual',
      price: 999,
      duration: 365,
      features: ['All Premium features', '24/7 support', 'Schedule alarms', 'Trip history']
    }
  ];
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
      
      // Ensure planName is available - use planId as fallback
      if (!subscription.planName && subscription.planId) {
        console.log('Plan name not provided by API, using planId as fallback');
        subscription.planName = subscription.planId;
      }
      
      return subscription;
    } catch (userError) {
      console.error('Error fetching from /user endpoint:', userError);
      
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
          
          // Ensure planName is available - use planId as fallback
          if (!subscription.planName && subscription.planId) {
            console.log('Plan name not provided by API, using planId as fallback');
            subscription.planName = subscription.planId;
          }
          
          return subscription;
        } catch (meError) {
          console.error('Error fetching from /me endpoint:', meError);
          throw meError;
        }
      } else {
        throw userError;
      }
    }
  } catch (error) {
    console.error('Error fetching user subscription:', error);
    throw error;
  }
};

/**
 * Create a new subscription
 * @param {Object} subscriptionData - Subscription data
 * @returns {Promise<Object>} - Created subscription
 */
export const createSubscription = async (subscriptionData) => {
  try {
    // First try to get the auth token to see if user is authenticated
    const token = await AsyncStorage.getItem('token');
    const userData = await AsyncStorage.getItem('user');
    let parsedUserData = null;
    
    // Parse user data if available
    try {
      if (userData) {
        parsedUserData = JSON.parse(userData);
      }
    } catch (parseError) {
      console.error('Error parsing user data:', parseError);
    }
    
    // For now, always use the public endpoint to avoid auth issues
    console.log('Using public endpoint for subscription creation');
    
    // Include user information in the request and ensure all required fields
    const publicSubscriptionData = {
      ...subscriptionData,
      username: parsedUserData?.username || subscriptionData.username || 'Guest User',
      email: parsedUserData?.email || subscriptionData.email || 'guest@example.com',
      userId: parsedUserData?.id || null,
      
      // Ensure we have both price and amount (backend may use either)
      price: subscriptionData.price || subscriptionData.amount || 0,
      amount: subscriptionData.amount || subscriptionData.price || 0,
      
      // Ensure we have a duration
      duration: subscriptionData.duration || 30,
      
      // Ensure we have a name for the plan
      name: subscriptionData.name || 'Custom Plan',
      
      // Ensure plan ID is properly set and consistent
      planId: subscriptionData.planId || subscriptionData.id || 'custom',
      plan: subscriptionData.plan || subscriptionData.planId || subscriptionData.id || 'custom',
      
      // Always include referenceNumber
      referenceNumber: subscriptionData.referenceNumber || ''
    };
    
    // Ensure all IDs and numbers are properly formatted
    if (publicSubscriptionData.planId && typeof publicSubscriptionData.planId !== 'string') {
      publicSubscriptionData.planId = String(publicSubscriptionData.planId);
    }
    
    if (publicSubscriptionData.plan && typeof publicSubscriptionData.plan !== 'string') {
      publicSubscriptionData.plan = String(publicSubscriptionData.plan);
    }
    
    // Ensure numerical values are actually numbers
    publicSubscriptionData.price = parseFloat(publicSubscriptionData.price) || 0;
    publicSubscriptionData.amount = parseFloat(publicSubscriptionData.amount) || 0;
    publicSubscriptionData.duration = parseInt(publicSubscriptionData.duration) || 30;
    
    // Log the data being sent
    console.log('Sending subscription data to API:', {
      planId: publicSubscriptionData.planId,
      plan: publicSubscriptionData.plan,
      price: publicSubscriptionData.price,
      amount: publicSubscriptionData.amount,
      duration: publicSubscriptionData.duration,
      referenceNumber: publicSubscriptionData.referenceNumber
    });
    
    // Add a timeout to the request
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout
    
    try {
      const response = await axios.post(
        `${BASE_URL}${ENDPOINTS.SUBSCRIPTION.PUBLIC_CREATE}`, 
        publicSubscriptionData,
        { signal: controller.signal }
      );
      clearTimeout(timeoutId);
      return response.data;
    } catch (axiosError) {
      clearTimeout(timeoutId);
      // Detailed error logging
      console.error('Subscription API error:');
      if (axiosError.response) {
        console.error('Status:', axiosError.response.status);
        console.error('Data:', axiosError.response.data);
      } else if (axiosError.request) {
        console.error('No response received');
      } else {
        console.error('Error message:', axiosError.message);
      }
      throw axiosError;
    }
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