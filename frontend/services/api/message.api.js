/**
 * Message API Service
 * Handles all message-related API calls
 */
import axios from 'axios';
import { BASE_URL, ENDPOINTS } from './endpoints';
import { getAuthToken } from './auth.api';

// Admin account ID - this definitely exists
const ADMIN_ID = '684fedc6e5eadd76e619f887';

// Support account ID - created by the script
// Support account IDs - created by the script
const SUPPORT_ID = '685fb303bce74865309f692e';
const HELP_ID = '685fc671b5863c8e291c8d13';
const CUSTOMERSERVICE_ID = '685fc672b5863c8e291c8d16';

// Known system user IDs that regular users can't search for
const SYSTEM_USERS = {
  // Admin users - full system access
  'admin@parada.com': ADMIN_ID,
  'admin': ADMIN_ID,
  
  // Support users - dedicated support accounts
  'support@parada.com': SUPPORT_ID,
  'support': SUPPORT_ID,
  'help@parada.com': HELP_ID,
  'help': HELP_ID,
  'customerservice@parada.com': CUSTOMERSERVICE_ID,
  'customerservice': CUSTOMERSERVICE_ID,
  
  // System notifications
  'system': ADMIN_ID,
  'noreply@parada.com': ADMIN_ID
};

/**
 * Find a user by email or username
 * @param {string} query - Email or username to search for
 * @returns {Promise<Object>} - User object or null
 */
export const findUserByEmailOrUsername = async (query) => {
  try {
    // Check for known system users first (like admin or support)
    const lowerQuery = query.toLowerCase();
    if (SYSTEM_USERS[lowerQuery]) {
      console.log(`Found known system user for ${query}: ${SYSTEM_USERS[lowerQuery]}`);
      
      // Determine if this is admin or support based on the email
      const isSupport = lowerQuery.includes('support') || 
                        lowerQuery.includes('help') || 
                        lowerQuery.includes('customerservice');
      
      return { 
        _id: SYSTEM_USERS[lowerQuery], 
        email: query, 
        username: query.split('@')[0],
        role: isSupport ? 'support' : 'admin'
      };
    }
    
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
      try {
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
      } catch (allUsersError) {
        console.error('Error getting all users:', allUsersError);
        console.error('Error details:', allUsersError.response?.data || allUsersError.message);
        
        // Check again for known users in case the search failed due to permissions
        if (SYSTEM_USERS[lowerQuery]) {
          console.log(`Using known system user for ${query} after search failed`);
          
          // Determine if this is admin or support based on the email
          const isSupport = lowerQuery.includes('support') || 
                            lowerQuery.includes('help') || 
                            lowerQuery.includes('customerservice');
          
          return { 
            _id: SYSTEM_USERS[lowerQuery], 
            email: query, 
            username: query.split('@')[0],
            role: isSupport ? 'support' : 'admin'
          };
        }
        
        return null;
      }
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
    let isSystemUser = false;
    let recipientRole = null;
    
    // If recipient looks like an email or username (not a MongoDB ObjectId)
    if (recipient.includes('@') || !recipient.match(/^[0-9a-fA-F]{24}$/)) {
      console.log('Recipient appears to be an email or username, searching for user ID');
      
      // Check for known system users first (like admin or support)
      const lowerRecipient = recipient.toLowerCase();
      if (SYSTEM_USERS[lowerRecipient]) {
        recipientId = SYSTEM_USERS[lowerRecipient];
        isSystemUser = true;
        
        // Determine if this is admin or support based on the email
        recipientRole = lowerRecipient.includes('support') || 
                        lowerRecipient.includes('help') || 
                        lowerRecipient.includes('customerservice') ? 'support' : 'admin';
        
        console.log(`Using known system user ID for ${recipient}: ${recipientId} (${recipientRole})`);
        
        // Add a note if sending to support but it's actually going to admin
        if (recipientRole === 'support' && recipientId === ADMIN_ID) {
          console.log('Note: Support messages are currently routed to admin until a dedicated support account is created');
        }
      } else {
        // Try to find user by email or username
        const user = await findUserByEmailOrUsername(recipient);
        
        if (!user) {
          // Suggest contacting support instead if user not found
          console.error(`User not found with email/username: ${recipient}`);
          throw new Error(`User not found with email/username: ${recipient}. Please check the recipient or contact support@parada.com instead.`);
        } else {
          recipientId = user._id;
          recipientRole = user.role;
          console.log(`Found user ID ${recipientId} for recipient ${recipient} (${recipientRole || 'unknown role'})`);
        }
      }
    }

    console.log('Sending message to recipient ID:', recipientId);

    // Add special metadata for system users
    const messageData = {
      ...data,
      subject,
      recipientRole
    };
    
    // If sending to support, add support-specific metadata
    if (recipientRole === 'support') {
      messageData.supportRequest = true;
      messageData.category = data.category || 'general';
      messageData.priority = data.priority || 'normal';
      
      // Add a tag to indicate this was sent to support but routed to admin
      if (recipientId === ADMIN_ID) {
        messageData.routedToAdmin = true;
        messageData.originalRecipient = recipient;
      }
    }

    const response = await axios.post(
      `${BASE_URL}${ENDPOINTS.MESSAGE.SEND}`,
      {
        recipientId,
        subject,
        message,
        data: messageData
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