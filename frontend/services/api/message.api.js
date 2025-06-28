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

    // Try to search for user using the search endpoint
    try {
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
    } catch (searchError) {
      console.error('Error with user search endpoint:', searchError);
      console.log('Falling back to getting all users and filtering');
      
      // Fallback: Get all users and filter
      const allUsersResponse = await axios.get(
        `${BASE_URL}${ENDPOINTS.USER.ALL}`,
        {
          headers: { 
            'x-access-token': token,
            'Content-Type': 'application/json'
          },
          timeout: 10000 // 10 second timeout
        }
      );
      
      if (!allUsersResponse.data || !allUsersResponse.data.users) {
        console.error('Failed to get users list');
        return null;
      }
      
      // Filter users by email or username
      const matchedUser = allUsersResponse.data.users.find(user => 
        (user.email && user.email.toLowerCase() === query.toLowerCase()) || 
        (user.username && user.username.toLowerCase() === query.toLowerCase())
      );
      
      console.log('User match result:', matchedUser ? 'Found' : 'Not found');
      return matchedUser || null;
    }
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
        // Instead of using a hardcoded ID, we'll try an alternative approach
        console.warn(`User not found with email/username: ${recipient}. Trying to create a temporary user.`);
        
        // Try to create a temporary user or get user by email directly
        try {
          // Option 1: Try to use a special endpoint that can look up or create users by email
          const lookupResponse = await axios.post(
            `${BASE_URL}/api/users/lookup`,
            { 
              email: recipient.includes('@') ? recipient : null,
              username: !recipient.includes('@') ? recipient : null
            },
            {
              headers: { 
                'x-access-token': token,
                'Content-Type': 'application/json'
              },
              timeout: 10000
            }
          );
          
          if (lookupResponse.data && lookupResponse.data.user && lookupResponse.data.user._id) {
            recipientId = lookupResponse.data.user._id;
            console.log(`Found/created user with ID ${recipientId} for recipient ${recipient}`);
          } else {
            throw new Error('Lookup endpoint did not return a valid user');
          }
        } catch (lookupError) {
          console.error('Error looking up/creating user:', lookupError);
          
          // Option 2: Fall back to sending message with email directly
          // This requires backend support for handling email recipients
          try {
            console.log('Trying to send message with email directly');
            
            const response = await axios.post(
              `${BASE_URL}${ENDPOINTS.MESSAGE.SEND_BY_EMAIL}`,
              {
                recipientEmail: recipient.includes('@') ? recipient : null,
                recipientUsername: !recipient.includes('@') ? recipient : null,
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
                timeout: 10000
              }
            );
            
            console.log('Message sent by email/username successfully:', response.data);
            return response.data;
          } catch (emailSendError) {
            console.error('Error sending message by email/username:', emailSendError);
            throw new Error(`User not found with email/username: ${recipient}. Please check the recipient and try again.`);
          }
        }
      } else {
        recipientId = user._id;
        console.log(`Found user ID ${recipientId} for recipient ${recipient}`);
      }
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