/**
 * Chat API Service
 * Handles direct messaging between users
 */
import axios from 'axios';
import { BASE_URL, ENDPOINTS } from './endpoints';
import { getAuthToken } from './auth.api';
import socketService from '../socket/socket.service';

/**
 * Send a direct message to a user
 * @param {string} recipientId - Recipient user ID
 * @param {string} message - Message content
 * @param {Object} data - Additional data
 * @returns {Promise<Object>} - Response from API
 */
export const sendDirectMessage = async (recipientId, message, data = {}) => {
  try {
    const token = await getAuthToken();
    if (!token) throw new Error('Authentication required');

    // Create a message via the messages API
    const response = await axios.post(
      `${BASE_URL}${ENDPOINTS.MESSAGE.SEND}`,
      {
        recipientId,
        message,
        data: {
          ...data
        }
      },
      {
        headers: { 'x-access-token': token }
      }
    );
    
    // Try to emit via socket for real-time delivery
    try {
      if (socketService && socketService.isConnected()) {
        socketService.emitEvent('direct_message', {
          recipientId,
          message,
          data: {
            ...data,
            messageId: response.data.message?._id
          }
        });
      }
    } catch (socketError) {
      console.warn('Could not emit message via socket:', socketError);
      // Continue even if socket emission fails
    }
    
    return response.data;
  } catch (error) {
    console.error('Error sending direct message:', error);
    
    // More detailed error logging
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    } else if (error.request) {
      console.error('No response received, request was:', error.request);
    } else {
      console.error('Error message:', error.message);
    }
    
    // If API call fails, try sending via socket only
    try {
      if (socketService && socketService.isConnected()) {
        socketService.emitEvent('direct_message', {
          recipientId,
          message,
          data: {
            ...data,
            offlineQueued: true
          }
        });
        
        return {
          success: true,
          message: 'Message queued for delivery via socket',
          offlineQueued: true
        };
      }
    } catch (socketError) {
      console.error('Socket fallback also failed:', socketError);
    }
    
    throw error;
  }
};

/**
 * Get message history with a specific user
 * @param {string} userId - User ID to get history with
 * @returns {Promise<Array>} - List of messages
 */
export const getMessageHistory = async (userId) => {
  try {
    const token = await getAuthToken();
    if (!token) throw new Error('Authentication required');

    const response = await axios.get(
      `${BASE_URL}${ENDPOINTS.MESSAGE.GET_HISTORY(userId)}`,
      {
        headers: { 'x-access-token': token }
      }
    );
    
    return response.data.messages || [];
  } catch (error) {
    console.error('Error getting message history:', error);
    
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
 * Mark a message as read
 * @param {string} messageId - Message ID
 * @returns {Promise<Object>} - Response from API
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
 * @param {string} messageId - Message ID
 * @returns {Promise<Object>} - Response from API
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
 * @returns {Promise<number>} - Number of unread messages
 */
export const getUnreadMessageCount = async () => {
  try {
    const token = await getAuthToken();
    if (!token) throw new Error('Authentication required');

    const response = await axios.get(
      `${BASE_URL}${ENDPOINTS.MESSAGE.UNREAD_COUNT}`,
      {
        headers: { 'x-access-token': token }
      }
    );
    
    return response.data.count || 0;
  } catch (error) {
    console.error('Error getting unread message count:', error);
    return 0;
  }
}; 