/**
 * Notification API Service
 * Handles all notification-related API calls
 */
import axios from 'axios';
import { BASE_URL, ENDPOINTS } from '@/services/api/endpoints';
import { getAuthToken } from '@/services/api/auth.api';

/**
 * Get all notifications for the current user
 * @param {Object} options - Query options
 * @param {boolean} [options.unreadOnly] - Whether to fetch only unread notifications
 * @param {string} [options.category] - Filter by category (optional)
 * @param {number} [options.limit] - Maximum number of notifications to return
 * @param {number} [options.skip] - Number of notifications to skip (for pagination)
 * @returns {Promise<Object>} - Notifications with pagination info
 */
export const getUserNotifications = async (options = {}) => {
  try {
    const token = await getAuthToken();
    if (!token) {
      console.error('No auth token available');
      throw new Error('Authentication required');
    }

    console.log('Getting notifications with options:', options);

    // Build query string
    const queryParams = new URLSearchParams();
    if (options.unreadOnly) queryParams.append('read', 'false');
    if (options.category) queryParams.append('category', options.category);
    if (options.limit) queryParams.append('limit', options.limit.toString());
    if (options.skip) queryParams.append('skip', options.skip.toString());

    const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
    const endpoint = `${BASE_URL}${ENDPOINTS.NOTIFICATION.ALL}${queryString}`;
    
    console.log('Fetching notifications from:', endpoint);
    
    const response = await axios.get(
      endpoint,
      {
        headers: { 
          'x-access-token': token,
          'Content-Type': 'application/json'
        },
        timeout: 15000 // 15 second timeout
      }
    );
    
    // Log the raw response data for debugging
    console.log('Notification API response status:', response.status);
    console.log('Notification API response contains notifications array:', !!response?.data?.notifications);
    
    // Ensure we have a valid response structure
    if (!response.data) {
      console.warn('Empty response data from notifications API');
      return { notifications: [], total: 0, page: 1, limit: options.limit || 10 };
    }
    
    // Handle different response formats
    let result = {
      notifications: [],
      total: 0,
      page: 1,
      limit: options.limit || 10,
      hasMore: false
    };
    
    // Copy properties from response.data to result
    if (response.data.notifications) result.notifications = response.data.notifications;
    if (response.data.total !== undefined) result.total = response.data.total;
    if (response.data.page !== undefined) result.page = response.data.page;
    if (response.data.limit !== undefined) result.limit = response.data.limit;
    if (response.data.hasMore !== undefined) result.hasMore = response.data.hasMore;
    
    // Ensure notifications is always an array
    if (!Array.isArray(result.notifications)) {
      // If notifications is not an array but exists, try to convert it
      console.warn('Non-array notifications response:', typeof result.notifications);
      
      if (typeof result.notifications === 'object') {
        // If it's an object with numeric keys, convert to array
        try {
          const notificationValues = Object.values(result.notifications);
          if (notificationValues.length > 0) {
            result.notifications = notificationValues;
            console.log('Converted object to array with', notificationValues.length, 'items');
          } else {
            result.notifications = [];
          }
        } catch (error) {
          console.error('Error converting notifications object to array:', error);
      result.notifications = [];
        }
      } else {
      result.notifications = [];
      }
    }
    
    console.log('Returning', result.notifications.length, 'notifications');
    return result;
  } catch (error) {
    console.error('Error fetching notifications:', error);
    console.error('Error details:', error.response?.data || error.message);
    
    // Return a safe default response
    return { 
      notifications: [], 
      total: 0, 
      page: 1, 
      limit: options.limit || 10,
      error: error.message
    };
  }
};

/**
 * Get unread notification count
 * @returns {Promise<number>} - Count of unread notifications
 */
export const getUnreadCount = async () => {
  try {
    const token = await getAuthToken();
    if (!token) throw new Error('Authentication required');
    
    const response = await axios.get(
      `${BASE_URL}${ENDPOINTS.NOTIFICATION.UNREAD}`,
      {
        headers: { 'x-access-token': token }
      }
    );
    
    return response.data.count;
  } catch (error) {
    console.error('Error fetching unread notification count:', error);
    return 0; // Return 0 as fallback
  }
};

/**
 * Mark a notification as read
 * @param {string} notificationId - ID of the notification to mark as read
 * @returns {Promise<Object>} - Updated notification
 */
export const markAsRead = async (notificationId) => {
  try {
    console.log(`Marking notification ${notificationId} as read`);
    
    const token = await getAuthToken();
    if (!token) {
      console.error('No auth token available for marking notification as read');
      throw new Error('Authentication required');
    }
    
    const endpoint = `${BASE_URL}${ENDPOINTS.NOTIFICATION.READ(notificationId)}`;
    console.log(`Sending PUT request to: ${endpoint}`);
    
    const response = await axios.put(
      endpoint,
      {},
      {
        headers: { 
          'x-access-token': token,
          'Content-Type': 'application/json'
        },
        timeout: 10000 // 10 second timeout
      }
    );
    
    console.log(`Successfully marked notification ${notificationId} as read`);
    return response.data.notification;
  } catch (error) {
    console.error('Error marking notification as read:', error);
    console.error('Error details:', error.response?.data || error.message);
    
    // Return a default object so UI doesn't break
    return {
      _id: notificationId,
      read: true,
      readAt: new Date().toISOString(),
      error: error.message
    };
  }
};

/**
 * Mark all notifications as read
 * @returns {Promise<Object>} - Result with count of updated notifications
 */
export const markAllAsRead = async () => {
  try {
    const token = await getAuthToken();
    if (!token) throw new Error('Authentication required');
    
    const response = await axios.put(
      `${BASE_URL}${ENDPOINTS.NOTIFICATION.READ_ALL}`,
      {},
      {
        headers: { 'x-access-token': token }
      }
    );
    
    return response.data;
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    throw error;
  }
};

/**
 * Delete a notification
 * @param {string} notificationId - ID of the notification to delete
 * @returns {Promise<Object>} - Result
 */
export const deleteNotification = async (notificationId) => {
  try {
    console.log(`Deleting notification ${notificationId}`);
    
    const token = await getAuthToken();
    if (!token) {
      console.error('No auth token available for deleting notification');
      throw new Error('Authentication required');
    }
    
    const endpoint = `${BASE_URL}${ENDPOINTS.NOTIFICATION.ALL}/${notificationId}`;
    console.log(`Sending DELETE request to: ${endpoint}`);
    
    const response = await axios.delete(
      endpoint,
      {
        headers: { 
          'x-access-token': token,
          'Content-Type': 'application/json'
        },
        timeout: 10000 // 10 second timeout
      }
    );
    
    console.log(`Successfully deleted notification ${notificationId}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting notification:', error);
    console.error('Error details:', error.response?.data || error.message);
    
    // Return a default success object so UI doesn't break
    // This allows the UI to remove the message even if the API call fails
    return { 
      success: true,
      message: 'Message removed from local storage',
      error: error.message
    };
  }
};

/**
 * Send a system notification (admin only)
 * @param {Object} notificationData - Notification data
 * @param {string} notificationData.title - Notification title
 * @param {string} notificationData.message - Notification message
 * @param {string} notificationData.type - Notification type (info, success, warning, error)
 * @param {string} notificationData.category - Notification category
 * @param {Array<string>} targetRoles - Target roles (optional)
 * @returns {Promise<Object>} - Result
 */
export const sendSystemNotification = async (notificationData, targetRoles = []) => {
  try {
    const token = await getAuthToken();
    if (!token) throw new Error('Authentication required');
    
    const response = await axios.post(
      `${BASE_URL}${ENDPOINTS.NOTIFICATION.SYSTEM}`,
      {
        ...notificationData,
        targetRoles
      },
      {
        headers: { 'x-access-token': token }
      }
    );
    
    return response.data;
  } catch (error) {
    console.error('Error sending system notification:', error);
    throw error;
  }
}; 