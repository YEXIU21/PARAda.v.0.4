/**
 * Support API Service
 * Handles support-specific API calls
 */
import axios from 'axios';
import { BASE_URL, ENDPOINTS } from './endpoints';
import { getAuthToken } from './auth.api';
import { apiRequest } from './api.config';

/**
 * Get support dashboard data
 * @returns {Promise<Object>} - Dashboard data
 */
export const getSupportDashboardData = async () => {
  try {
    const token = await getAuthToken();
    if (!token) throw new Error('Authentication required');

    // For now, we'll use the admin dashboard endpoint since there's no specific support endpoint yet
    const response = await axios.get(
      `${BASE_URL}${ENDPOINTS.ADMIN.DASHBOARD}`,
      {
        headers: { 'x-access-token': token }
      }
    );
    
    return response.data;
  } catch (error) {
    console.error('Error fetching support dashboard data:', error);
    throw error;
  }
};

/**
 * Get support tickets with pagination
 * @param {Object} options - Query options
 * @returns {Promise<Object>} - Tickets data with pagination
 */
export const getSupportTickets = async (options = {}) => {
  try {
    const token = await getAuthToken();
    if (!token) throw new Error('Authentication required');

    // Build query string
    const queryParams = new URLSearchParams();
    if (options.limit) queryParams.append('limit', options.limit.toString());
    if (options.skip) queryParams.append('skip', options.skip.toString());
    if (options.status) queryParams.append('status', options.status);
    if (options.priority) queryParams.append('priority', options.priority);
    if (options.search) queryParams.append('search', options.search);

    // Since we don't have a specific support tickets endpoint yet, we'll use messages as a proxy
    const response = await axios.get(
      `${BASE_URL}/api/messages?${queryParams.toString()}`,
      {
        headers: { 'x-access-token': token }
      }
    );
    
    // Transform messages into ticket format
    const tickets = response.data.messages.map(message => ({
      id: message._id,
      title: message.title || 'No Subject',
      message: message.message,
      user: message.sender?.email || 'Unknown User',
      status: message.read ? 'resolved' : 'pending',
      priority: getPriorityFromMessage(message),
      createdAt: message.createdAt
    }));
    
    return {
      tickets,
      total: response.data.total || tickets.length,
      hasMore: response.data.hasMore || false
    };
  } catch (error) {
    console.error('Error fetching support tickets:', error);
    throw error;
  }
};

/**
 * Get audit logs with pagination
 * @param {Object} options - Query options
 * @returns {Promise<Object>} - Audit logs data with pagination
 */
export const getAuditLogs = async (options = {}) => {
  try {
    const token = await getAuthToken();
    if (!token) throw new Error('Authentication required');

    // Build query string
    const queryParams = new URLSearchParams();
    if (options.limit) queryParams.append('limit', options.limit.toString());
    if (options.page) queryParams.append('page', options.page.toString());
    if (options.action) queryParams.append('action', options.action);
    if (options.resourceType) queryParams.append('resourceType', options.resourceType);
    if (options.userId) queryParams.append('userId', options.userId);
    if (options.startDate) queryParams.append('startDate', options.startDate);
    if (options.endDate) queryParams.append('endDate', options.endDate);

    const response = await axios.get(
      `${BASE_URL}/api/audit/logs?${queryParams.toString()}`,
      {
        headers: { 'x-access-token': token }
      }
    );
    
    return response.data;
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    throw error;
  }
};

/**
 * Get user management data with pagination
 * @param {Object} options - Query options
 * @returns {Promise<Object>} - Users data with pagination
 */
export const getSupportUsers = async (options = {}) => {
  try {
    const token = await getAuthToken();
    if (!token) throw new Error('Authentication required');

    // Build query string
    const queryParams = new URLSearchParams();
    if (options.limit) queryParams.append('limit', options.limit.toString());
    if (options.skip) queryParams.append('skip', options.skip.toString());
    if (options.role) queryParams.append('role', options.role);
    if (options.search) queryParams.append('search', options.search);

    // Use the user search endpoint
    const response = await axios.get(
      `${BASE_URL}/api/users/search?${queryParams.toString()}`,
      {
        headers: { 'x-access-token': token }
      }
    );
    
    return response.data;
  } catch (error) {
    console.error('Error fetching users for support:', error);
    throw error;
  }
};

/**
 * Get ticket details by ID
 * @param {string} ticketId - Ticket ID
 * @returns {Promise<Object>} - Ticket details
 */
export const getTicketById = async (ticketId) => {
  try {
    const token = await getAuthToken();
    if (!token) throw new Error('Authentication required');

    // Since we don't have a specific ticket endpoint, we'll use the message endpoint
    const response = await axios.get(
      `${BASE_URL}/api/messages/${ticketId}`,
      {
        headers: { 'x-access-token': token }
      }
    );
    
    // Transform message into ticket format
    const message = response.data;
    return {
      id: message._id,
      title: message.title || 'No Subject',
      message: message.message,
      user: message.sender?.email || 'Unknown User',
      userId: message.sender?._id,
      status: message.read ? 'resolved' : 'pending',
      priority: getPriorityFromMessage(message),
      createdAt: message.createdAt,
      replies: message.replies || []
    };
  } catch (error) {
    console.error(`Error fetching ticket ${ticketId}:`, error);
    throw error;
  }
};

/**
 * Update ticket status
 * @param {string} ticketId - Ticket ID
 * @param {string} status - New status (pending, in-progress, resolved)
 * @returns {Promise<Object>} - Updated ticket
 */
export const updateTicketStatus = async (ticketId, status) => {
  try {
    const token = await getAuthToken();
    if (!token) throw new Error('Authentication required');

    // Map status to appropriate action
    let endpoint;
    if (status === 'resolved') {
      endpoint = `${BASE_URL}/api/messages/${ticketId}/read`;
    } else {
      // For now, we don't have endpoints for other statuses
      throw new Error('Only resolved status is supported currently');
    }

    const response = await axios.put(
      endpoint,
      {},
      {
        headers: { 'x-access-token': token }
      }
    );
    
    return response.data;
  } catch (error) {
    console.error(`Error updating ticket ${ticketId} status:`, error);
    throw error;
  }
};

/**
 * Reply to a ticket
 * @param {string} ticketId - Ticket ID
 * @param {string} message - Reply message
 * @returns {Promise<Object>} - Updated ticket
 */
export const replyToTicket = async (ticketId, message) => {
  try {
    const token = await getAuthToken();
    if (!token) throw new Error('Authentication required');

    // Since we don't have a specific reply endpoint, we'll use the message reply endpoint
    const response = await axios.post(
      `${BASE_URL}/api/messages/${ticketId}/reply`,
      { message },
      {
        headers: { 
          'x-access-token': token,
          'Content-Type': 'application/json'
        }
      }
    );
    
    return response.data;
  } catch (error) {
    console.error(`Error replying to ticket ${ticketId}:`, error);
    throw error;
  }
};

/**
 * Helper function to determine priority from message content
 * @param {Object} message - Message object
 * @returns {string} - Priority level (critical, high, medium, low)
 */
function getPriorityFromMessage(message) {
  // Default priority is medium
  let priority = 'medium';
  
  // Check if message has a priority field
  if (message.priority) {
    return message.priority;
  }
  
  // Check message title and content for priority keywords
  const text = `${message.title || ''} ${message.message || ''}`.toLowerCase();
  
  if (text.includes('urgent') || text.includes('emergency') || text.includes('critical')) {
    priority = 'critical';
  } else if (text.includes('important') || text.includes('error') || text.includes('issue')) {
    priority = 'high';
  } else if (text.includes('question') || text.includes('help') || text.includes('assistance')) {
    priority = 'medium';
  } else if (text.includes('feedback') || text.includes('suggestion') || text.includes('thank')) {
    priority = 'low';
  }
  
  return priority;
} 