/**
 * Message API Service
 * Handles all message-related API calls
 */
import axios from 'axios';
import { BASE_URL, ENDPOINTS } from './endpoints';
import { getAuthToken } from './auth.api';

/**
 * Find a user by email or username
 * @param {string} query - Email or username to search for
 * @returns {Promise<Object>} - User object or null
 */
export const findUserByEmailOrUsername = async (query) => {
  try {
    const token = await getAuthToken();
    if (!token) {
      console.error('No auth token available');
      throw new Error('Authentication required');
    }

    console.log('Searching for user with query:', query);

    // Search for user
    const response = await axios.get(
      `${BASE_URL}/api/users/search?query=${encodeURIComponent(query)}`,
      {
        headers: { 
          'x-access-token': token,
          'Content-Type': 'application/json'
        },
        timeout: 10000 // 10 second timeout
      }
    );
    
    console.log('User search results:', response.data);
    return response.data.users && response.data.users.length > 0 ? response.data.users[0] : null;
  } catch (error) {
    console.error('Error finding user:', error);
    console.error('Error details:', error.response?.data || error.message);
    return null;
  }
};

/**
 * Send a message to another user
 * @param {string} recipient - Recipient email, username, or ID
 * @param {string} subject - Message subject
 * @param {string} message - Message content
 * @param {Object} data - Additional data (optional)
 * @returns {Promise<Object>} - Sent message
 */
export const sendMessage = async (recipient, subject, message, data = {}) => {
  try {
    const token = await getAuthToken();
    if (!token) {
      console.error('No auth token available');
      throw new Error('Authentication required');
    }

    let recipientId = recipient;
    
    // If recipient looks like an email or username (not a MongoDB ObjectId)
    if (recipient.includes('@') || !recipient.match(/^[0-9a-fA-F]{24}$/)) {
      console.log('Recipient appears to be an email or username, searching for user ID');
      const user = await findUserByEmailOrUsername(recipient);
      
      if (!user) {
        throw new Error(`User not found with email/username: ${recipient}`);
      }
      
      recipientId = user._id;
      console.log(`Found user ID ${recipientId} for recipient ${recipient}`);
    }

    console.log('Sending message to recipient ID:', recipientId);

    const response = await axios.post(
      `${BASE_URL}${ENDPOINTS.MESSAGE.SEND}`,
      {
        recipientId,
        subject,
        message,
        data: {
          ...data,
          subject
        }
      },
      {
        headers: { 
          'x-access-token': token,
          'Content-Type': 'application/json'
        },
        timeout: 10000 // 10 second timeout
      }
    );
    
    console.log('Message sent successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error sending message:', error);
    console.error('Error details:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * Get message history with a specific user
 * @param {string} userId - ID of the other user
 * @param {Object} options - Query options
 * @param {number} [options.limit] - Maximum number of messages to return
 * @param {number} [options.skip] - Number of messages to skip (for pagination)
 * @returns {Promise<Object>} - Messages with pagination info
 */
export const getMessageHistory = async (userId, options = {}) => {
  try {
    const token = await getAuthToken();
    if (!token) throw new Error('Authentication required');
    
    // Build query string
    const queryParams = new URLSearchParams();
    if (options.limit) queryParams.append('limit', options.limit.toString());
    if (options.skip) queryParams.append('skip', options.skip.toString());

    const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
    
    const response = await axios.get(
      `${BASE_URL}${ENDPOINTS.MESSAGE.GET_HISTORY(userId)}${queryString}`,
      {
        headers: { 'x-access-token': token }
      }
    );
    
    return response.data;
  } catch (error) {
    console.error('Error getting message history:', error);
    throw error;
  }
};

/**
 * Mark a message as read
 * @param {string} messageId - ID of the message to mark as read
 * @returns {Promise<Object>} - Updated message
 */
export const markMessageAsRead = async (messageId) => {
  try {
    const token = await getAuthToken();
    if (!token) throw new Error('Authentication required');
    
    const response = await axios.put(
      `${BASE_URL}${ENDPOINTS.MESSAGE.READ(messageId)}`,
      {},
      {
        headers: { 'x-access-token': token }
      }
    );
    
    return response.data;
  } catch (error) {
    console.error('Error marking message as read:', error);
    throw error;
  }
};

/**
 * Delete a message
 * @param {string} messageId - ID of the message to delete
 * @returns {Promise<Object>} - Result
 */
export const deleteMessage = async (messageId) => {
  try {
    const token = await getAuthToken();
    if (!token) throw new Error('Authentication required');
    
    const response = await axios.delete(
      `${BASE_URL}${ENDPOINTS.MESSAGE.DELETE(messageId)}`,
      {
        headers: { 'x-access-token': token }
      }
    );
    
    return response.data;
  } catch (error) {
    console.error('Error deleting message:', error);
    throw error;
  }
};

/**
 * Get unread message count
 * @returns {Promise<number>} - Count of unread messages
 */
export const getUnreadCount = async () => {
  try {
    const token = await getAuthToken();
    if (!token) throw new Error('Authentication required');
    
    const response = await axios.get(
      `${BASE_URL}${ENDPOINTS.MESSAGE.UNREAD_COUNT}`,
      {
        headers: { 'x-access-token': token }
      }
    );
    
    return response.data.count;
  } catch (error) {
    console.error('Error fetching unread message count:', error);
    return 0; // Return 0 as fallback
  }
}; 