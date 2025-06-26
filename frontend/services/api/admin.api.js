/**
 * Admin API Service
 * Handles admin-specific API calls
 */
import axios from 'axios';
import { BASE_URL, ENDPOINTS } from './endpoints';
import { getAuthToken } from './auth.api';
import { apiRequest } from './api.config';

/**
 * Get admin dashboard data
 * @returns {Promise<Object>} - Dashboard data
 */
export const getDashboardData = async () => {
  try {
    const token = await getAuthToken();
    if (!token) throw new Error('Authentication required');

    const response = await axios.get(
      `${BASE_URL}${ENDPOINTS.ADMIN.DASHBOARD}`,
      {
        headers: { 'x-access-token': token }
      }
    );
    
    return response.data;
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    
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
 * Get reports data
 * @param {string} period - Period for reports (day, week, month, year)
 * @returns {Promise<Object>} - Reports data
 */
export const getReportsData = async (period = 'week') => {
  try {
    const token = await getAuthToken();
    if (!token) throw new Error('Authentication required');

    const response = await axios.get(
      `${BASE_URL}${ENDPOINTS.ADMIN.REPORTS}?period=${period}`,
      {
        headers: { 'x-access-token': token }
      }
    );
    
    return response.data;
  } catch (error) {
    console.error('Error fetching reports data:', error);
    
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
 * Get all users with pagination
 * @param {Object} options - Query options
 * @returns {Promise<Object>} - Users data with pagination
 */
export const getUsers = async (options = {}) => {
  try {
    const token = await getAuthToken();
    if (!token) throw new Error('Authentication required');

    // Build query string
    const queryParams = new URLSearchParams();
    if (options.limit) queryParams.append('limit', options.limit.toString());
    if (options.skip) queryParams.append('skip', options.skip.toString());
    if (options.sort) queryParams.append('sort', options.sort);
    if (options.order) queryParams.append('order', options.order);
    if (options.role) queryParams.append('role', options.role);
    if (options.search) queryParams.append('search', options.search);

    const response = await axios.get(
      `${BASE_URL}${ENDPOINTS.ADMIN.USERS}?${queryParams.toString()}`,
      {
        headers: { 'x-access-token': token }
      }
    );
    
    return response.data;
  } catch (error) {
    console.error('Error fetching users:', error);
    throw error;
  }
};

/**
 * Get all subscriptions with pagination
 * @param {Object} options - Query options
 * @returns {Promise<Object>} - Subscriptions data with pagination
 */
export const getSubscriptions = async (options = {}) => {
  try {
    const token = await getAuthToken();
    if (!token) throw new Error('Authentication required');

    // Build query string
    const queryParams = new URLSearchParams();
    if (options.limit) queryParams.append('limit', options.limit.toString());
    if (options.skip) queryParams.append('skip', options.skip.toString());
    if (options.isActive !== undefined) queryParams.append('isActive', options.isActive);
    if (options.verified !== undefined) queryParams.append('verified', options.verified);
    if (options.pending !== undefined) queryParams.append('pending', options.pending);
    if (options.planId) queryParams.append('planId', options.planId);
    if (options.userId) queryParams.append('userId', options.userId);

    console.log(`Sending request to ${BASE_URL}${ENDPOINTS.ADMIN.SUBSCRIPTIONS}?${queryParams.toString()}`);
    
    const response = await axios.get(
      `${BASE_URL}${ENDPOINTS.ADMIN.SUBSCRIPTIONS}?${queryParams.toString()}`,
      {
        headers: { 'x-access-token': token }
      }
    );
    
    console.log('API Response data:', response.data);
    
    // Ensure all subscriptions have planName field
    if (response.data.subscriptions && Array.isArray(response.data.subscriptions)) {
      response.data.subscriptions = response.data.subscriptions.map(subscription => {
        if (!subscription.planName && subscription.planId) {
          console.log(`Adding missing planName for subscription ${subscription._id} with planId ${subscription.planId}`);
          
          // Try to get plan name from standard plans
          let planName = subscription.planId;
          
          // Check standard plan IDs
          switch (subscription.planId.toLowerCase()) {
            case 'basic':
              planName = 'Basic Plan';
              break;
            case 'premium':
              planName = 'Premium Plan';
              break;
            case 'annual':
              planName = 'Annual Plan';
              break;
          }
          
          return {
            ...subscription,
            planName
          };
        }
        return subscription;
      });
    }
    
    return response.data;
  } catch (error) {
    console.error('Error fetching subscriptions:', error);
    
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
 * Verify a subscription
 * @param {string} subscriptionId - Subscription ID
 * @returns {Promise<Object>} - Verified subscription
 */
export const verifySubscription = async (subscriptionId) => {
  try {
    const token = await getAuthToken();
    if (!token) throw new Error('Authentication required');

    console.log(`Verifying subscription: ${subscriptionId}`);
    
    // Ensure proper URL construction with correct slashes
    const url = `${BASE_URL}/api/admin/subscriptions/verify/${subscriptionId}`;
    console.log(`Using URL: ${url}`);
    
    const response = await axios.post(
      url,
      {},
      {
        headers: { 'x-access-token': token }
      }
    );
    
    console.log('Verification response:', response.data);
    
    // Ensure the response includes planName
    if (response.data.subscription && !response.data.subscription.planName && response.data.subscription.planId) {
      console.log(`Adding missing planName for verified subscription with planId ${response.data.subscription.planId}`);
      
      // Try to get plan name from standard plans
      let planName = response.data.subscription.planId;
      
      // Check standard plan IDs
      switch (response.data.subscription.planId.toLowerCase()) {
        case 'basic':
          planName = 'Basic Plan';
          break;
        case 'premium':
          planName = 'Premium Plan';
          break;
        case 'annual':
          planName = 'Annual Plan';
          break;
      }
      
      response.data.subscription.planName = planName;
    }
    
    return response.data;
  } catch (error) {
    console.error('Error verifying subscription:', error);
    throw error;
  }
};

/**
 * Get all drivers with pagination
 * @param {Object} options - Query options
 * @returns {Promise<Object>} - Drivers data with pagination
 */
export const getDrivers = async (options = {}) => {
  try {
    const token = await getAuthToken();
    if (!token) throw new Error('Authentication required');

    // Build query string
    const queryParams = new URLSearchParams();
    if (options.limit) queryParams.append('limit', options.limit.toString());
    if (options.skip) queryParams.append('skip', options.skip.toString());
    if (options.sort) queryParams.append('sort', options.sort);
    if (options.order) queryParams.append('order', options.order);
    if (options.status) queryParams.append('status', options.status);
    if (options.vehicleType) queryParams.append('vehicleType', options.vehicleType);
    if (options.verified !== undefined) queryParams.append('verified', options.verified.toString());
    if (options.routeId) queryParams.append('routeId', options.routeId);

    const queryString = queryParams.toString();
    const url = `${BASE_URL}${ENDPOINTS.ADMIN.DRIVERS}${queryString ? `?${queryString}` : ''}`;
    
    const response = await axios.get(
      url,
      {
        headers: { 'x-access-token': token }
      }
    );
    
    return response.data;
  } catch (error) {
    console.error('Error fetching drivers:', error);
    
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
 * Send a message/notification to a specific driver
 * @param {string} driverId - Driver ID
 * @param {string} title - Message title
 * @param {string} message - Message content
 * @param {Object} data - Additional data
 * @returns {Promise<Object>} - Response from API
 */
export const sendMessageToDriver = async (driverId, title, message, data = {}) => {
  try {
    const token = await getAuthToken();
    if (!token) throw new Error('Authentication required');

    // First get the user ID from the driver
    const driverResponse = await axios.get(
      `${BASE_URL}${ENDPOINTS.DRIVER.BY_ID(driverId)}`,
      {
        headers: { 'x-access-token': token }
      }
    );
    
    if (!driverResponse.data || !driverResponse.data.driver || !driverResponse.data.driver.userId) {
      throw new Error('Could not find user ID for this driver');
    }
    
    const userId = driverResponse.data.driver.userId._id;
    
    console.log('Sending message to driver with userId:', userId);
    
    // Generate a unique notification ID to track duplicates
    const notificationId = `admin_msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    
    // Create an in-app notification for the user
    const notificationResponse = await axios.post(
      `${BASE_URL}${ENDPOINTS.NOTIFICATION.ALL}`,
      {
        userId,
        title,
        message,
        type: 'info',
        category: 'system',
        data: {
          ...data,
          fromAdmin: true,
          expiresIn: 1, // Expire in 1 day
          notificationId, // Add unique ID to identify duplicates
          source: 'direct'
        }
      },
      {
        headers: { 'x-access-token': token }
      }
    );
    
    // Try to send a system notification as well (more reliable than push)
    try {
      await axios.post(
        `${BASE_URL}${ENDPOINTS.NOTIFICATION.SYSTEM}`,
        {
          title,
          message,
          type: 'info',
          targetRoles: ['driver'],
          data: {
            ...data,
            fromAdmin: true,
            driverId,
            expiresIn: 1,
            notificationId, // Same ID to identify duplicates
            source: 'system'
          }
        },
        {
          headers: { 'x-access-token': token }
        }
      );
    } catch (systemNotifError) {
      console.warn('Could not send system notification to driver:', systemNotifError);
      // Continue even if system notification fails
    }
    
    return notificationResponse.data;
  } catch (error) {
    console.error('Error sending message to driver:', error);
    
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
 * Send a message/notification to a passenger user
 * @param {string} userId - User ID
 * @param {string} title - Message title
 * @param {string} message - Message content
 * @param {Object} data - Additional data
 * @returns {Promise<Object>} - Response from API
 */
export const sendMessageToPassenger = async (userId, title, message, data = {}) => {
  try {
    const token = await getAuthToken();
    if (!token) throw new Error('Authentication required');

    // First try to create a regular notification
    try {
      const notificationResponse = await axios.post(
        `${BASE_URL}${ENDPOINTS.NOTIFICATION.ALL}`,
        {
          userId,
          title,
          message,
          type: 'info',
          category: 'message',
          data: {
            ...data,
            fromAdmin: true,
            expiresIn: 1 // Expire in 1 day
          }
        },
        {
          headers: { 'x-access-token': token }
        }
      );
      
      console.log('Created in-app notification for user:', notificationResponse.data);
      
      // Try to emit via socket service if available
      try {
        const socketService = require('../socket/socket.service');
        if (socketService && socketService.isConnected()) {
          socketService.emitEvent('admin_message', {
            userId,
            title,
            message,
            data: {
              ...data,
              fromAdmin: true
            }
          });
          console.log('Emitted message via socket');
        }
      } catch (socketError) {
        console.warn('Could not emit message via socket:', socketError);
      }
      
      return notificationResponse.data;
    } catch (notifError) {
      console.error('Error creating notification:', notifError);
      
      // If notification creation fails, try push as fallback
    const response = await axios.post(
      `${BASE_URL}${ENDPOINTS.NOTIFICATION.PUSH_USER(userId)}`,
      {
        title,
        message,
        data: {
          ...data,
          type: 'info',
            category: 'message',
          expiresIn: 1, // Expire in 1 day
          fromAdmin: true
        }
      },
      {
        headers: { 'x-access-token': token }
      }
    );
    
    return response.data;
    }
  } catch (error) {
    console.error('Error sending message to passenger:', error);
    
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
 * Verify a driver
 * @param {string} driverId - ID of the driver to verify
 * @returns {Promise<Object>} - Response from the API
 */
export const verifyDriver = async (driverId) => {
  try {
    const token = await getAuthToken();
    if (!token) throw new Error('Authentication required');

    const response = await axios.post(
      `${BASE_URL}${ENDPOINTS.ADMIN.VERIFY_DRIVER(driverId)}`,
      {},
      {
        headers: { 'x-access-token': token }
      }
    );
    
    return response.data;
  } catch (error) {
    console.error('Error verifying driver:', error);
    
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
 * Remove a driver
 * @param {string} driverId - ID of the driver to remove
 * @param {boolean} deleteUser - Whether to completely delete the user account
 * @param {string} disableReason - Reason for disabling the account
 * @returns {Promise<Object>} - Response from the API
 */
export const removeDriver = async (driverId, deleteUser = false, disableReason = null) => {
  try {
    const token = await getAuthToken();
    if (!token) throw new Error('Authentication required');

    const response = await axios.delete(
      `${BASE_URL}${ENDPOINTS.ADMIN.DELETE_DRIVER(driverId)}`,
      {
        headers: { 'x-access-token': token },
        data: {
          deleteUser,
          disableReason
        }
      }
    );
    
    return response.data;
  } catch (error) {
    console.error('Error removing driver:', error);
    
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
 * Cancel a subscription
 * @param {string} subscriptionId - ID of the subscription to cancel
 * @returns {Promise<Object>} - Response from the API
 */
export const cancelSubscription = async (subscriptionId) => {
  try {
    console.log(`Starting cancellation process for subscription: ${subscriptionId}`);
    
    const token = await getAuthToken();
    if (!token) throw new Error('Authentication required');
    
    console.log(`Using endpoint: ${BASE_URL}/api/subscriptions/${subscriptionId}`);
    
    const response = await axios.delete(
      `${BASE_URL}/api/subscriptions/${subscriptionId}`,
      {
        headers: { 'x-access-token': token }
      }
    );
    
    console.log('Cancellation response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error cancelling subscription:', error);
    
    // More detailed error logging
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
      console.error('Response headers:', error.response.headers);
    } else if (error.request) {
      console.error('No response received, request was:', error.request);
    } else {
      console.error('Error message:', error.message);
    }
    
    throw error;
  }
};

/**
 * Create a new subscription plan
 * @param {Object} planData - Subscription plan data
 * @returns {Promise<Object>} - Created subscription plan
 */
export const createSubscriptionPlan = async (planData) => {
  try {
    console.log('Creating subscription plan with data:', planData);
    
    // Get token directly
    const token = await getAuthToken();
    if (!token) throw new Error('Authentication required');
    
    // Use direct axios call with explicit URL
    const url = `${BASE_URL}/api/admin/subscription-plans`;
    console.log('Using URL for create:', url);
    
    const response = await axios({
      method: 'POST',
      url: url,
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'x-access-token': token 
      },
      data: planData
    });
    
    console.log('Create plan response:', response.data);
    return response.data.plan;
  } catch (error) {
    console.error('Error creating subscription plan:', error);
    
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
 * Update a subscription plan
 * @param {string} planId - Plan ID
 * @param {Object} planData - Updated subscription plan data
 * @returns {Promise<Object>} - Updated subscription plan
 */
export const updateSubscriptionPlan = async (planId, planData) => {
  try {
    console.log(`Updating subscription plan ${planId} with data:`, planData);
    
    // Get token directly
    const token = await getAuthToken();
    if (!token) throw new Error('Authentication required');
    
    // Use direct axios call with explicit URL
    const url = `${BASE_URL}/api/admin/subscription-plans/${planId}`;
    console.log('Using URL:', url);
    
    const response = await axios({
      method: 'PUT',
      url: url,
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'x-access-token': token 
      },
      data: planData
    });
    
    console.log('Update plan response:', response.data);
    return response.data.plan;
  } catch (error) {
    console.error('Error updating subscription plan:', error);
    
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
 * Delete a subscription plan
 * @param {string} planId - Plan ID
 * @returns {Promise<Object>} - Response data
 */
export const deleteSubscriptionPlan = async (planId) => {
  try {
    console.log(`Deleting subscription plan: ${planId}`);
    
    // Get token directly
    const token = await getAuthToken();
    if (!token) throw new Error('Authentication required');
    
    // Use direct axios call with explicit URL
    const url = `${BASE_URL}/api/admin/subscription-plans/${planId}`;
    console.log('Using URL for delete:', url);
    
    const response = await axios({
      method: 'DELETE',
      url: url,
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'x-access-token': token 
      }
    });
    
    console.log('Delete plan response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error deleting subscription plan:', error);
    
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
 * Get student discount settings
 * @returns {Promise<Object>} - Student discount settings
 */
export const getStudentDiscountSettings = async () => {
  try {
    const response = await apiRequest('GET', '/api/admin/student-discount');
    return response.data.settings;
  } catch (error) {
    console.error('Error fetching student discount settings:', error);
    throw error;
  }
};

/**
 * Update student discount settings
 * @param {Object} settings - Student discount settings
 * @param {boolean} settings.isEnabled - Whether student discount is enabled
 * @param {number} settings.discountPercent - Student discount percentage
 * @returns {Promise<Object>} - Updated settings
 */
export const updateStudentDiscountSettings = async (settings) => {
  try {
    const response = await apiRequest('PUT', '/api/admin/student-discount', settings);
    return response.data.settings;
  } catch (error) {
    console.error('Error updating student discount settings:', error);
    throw error;
  }
};

/**
 * Get all subscription plans (admin version)
 * @returns {Promise<Array>} - List of subscription plans
 */
export const getAdminSubscriptionPlans = async () => {
  try {
    const response = await apiRequest('GET', '/api/admin/subscription-plans');
    return response.data.plans;
  } catch (error) {
    console.error('Error fetching admin subscription plans:', error);
    throw error;
  }
};

/**
 * Reject a subscription
 * @param {string} subscriptionId - Subscription ID
 * @returns {Promise<Object>} - Rejected subscription
 */
export const rejectSubscription = async (subscriptionId) => {
  try {
    const token = await getAuthToken();
    if (!token) throw new Error('Authentication required');

    console.log(`Rejecting subscription: ${subscriptionId}`);
    
    // Ensure proper URL construction with correct slashes
    const url = `${BASE_URL}/api/admin/subscriptions/reject/${subscriptionId}`;
    console.log(`Using URL: ${url}`);
    
    const response = await axios.post(
      url,
      {},
      {
        headers: { 'x-access-token': token }
      }
    );
    
    console.log('Rejection response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error rejecting subscription:', error);
    throw error;
  }
}; 