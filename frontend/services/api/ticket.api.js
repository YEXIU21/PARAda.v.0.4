/**
 * Ticket API Service
 * Handles API calls related to support tickets
 */
import axios from 'axios';
import { BASE_URL } from './endpoints';
import { getAuthToken } from './auth.api';

/**
 * Create a new ticket
 * @param {Object} ticketData - Ticket data
 * @returns {Promise<Object>} - Created ticket
 */
export const createTicket = async (ticketData) => {
  try {
    // Try to get auth token if available
    let headers = { 'Content-Type': 'application/json' };
    try {
      const token = await getAuthToken();
      if (token) {
        headers['x-access-token'] = token;
      }
    } catch (error) {
      console.log('No auth token available, creating ticket anonymously');
    }

    const response = await axios.post(
      `${BASE_URL}/api/tickets`,
      ticketData,
      { headers }
    );
    
    return response.data;
  } catch (error) {
    console.error('Error creating ticket:', error);
    throw error;
  }
};

/**
 * Get ticket by ID
 * @param {string} ticketId - Ticket ID
 * @returns {Promise<Object>} - Ticket data with comments
 */
export const getTicketById = async (ticketId) => {
  try {
    const token = await getAuthToken();
    if (!token) {
      throw new Error('Authentication required');
    }

    const response = await axios.get(
      `${BASE_URL}/api/tickets/${ticketId}`,
      {
        headers: {
          'x-access-token': token
        }
      }
    );
    
    return response.data;
  } catch (error) {
    console.error('Error getting ticket:', error);
    throw error;
  }
};

/**
 * Get tickets with filtering, sorting, and pagination
 * @param {Object} filters - Filter criteria
 * @param {Object} options - Query options (sort, pagination)
 * @returns {Promise<Object>} - Tickets and pagination info
 */
export const getTickets = async (filters = {}, options = {}) => {
  try {
    const token = await getAuthToken();
    if (!token) {
      throw new Error('Authentication required');
    }

    // Build query string
    const queryParams = new URLSearchParams();
    
    // Add filters
    if (filters.status) queryParams.append('status', filters.status);
    if (filters.priority) queryParams.append('priority', filters.priority);
    if (filters.category) queryParams.append('category', filters.category);
    if (filters.assignedTo) queryParams.append('assignedTo', filters.assignedTo);
    if (filters.search) queryParams.append('search', filters.search);
    
    // Add options
    if (options.page) queryParams.append('page', options.page);
    if (options.limit) queryParams.append('limit', options.limit);
    if (options.sortBy) queryParams.append('sortBy', options.sortBy);
    if (options.sortOrder) queryParams.append('sortOrder', options.sortOrder);
    
    const response = await axios.get(
      `${BASE_URL}/api/tickets?${queryParams.toString()}`,
      {
        headers: {
          'x-access-token': token
        }
      }
    );
    
    return response.data;
  } catch (error) {
    console.error('Error getting tickets:', error);
    throw error;
  }
};

/**
 * Update ticket
 * @param {string} ticketId - Ticket ID
 * @param {Object} updateData - Data to update
 * @returns {Promise<Object>} - Updated ticket
 */
export const updateTicket = async (ticketId, updateData) => {
  try {
    const token = await getAuthToken();
    if (!token) {
      throw new Error('Authentication required');
    }

    const response = await axios.put(
      `${BASE_URL}/api/tickets/${ticketId}`,
      updateData,
      {
        headers: {
          'x-access-token': token,
          'Content-Type': 'application/json'
        }
      }
    );
    
    return response.data;
  } catch (error) {
    console.error('Error updating ticket:', error);
    throw error;
  }
};

/**
 * Assign ticket to support agent
 * @param {string} ticketId - Ticket ID
 * @param {string} userId - User ID to assign to
 * @returns {Promise<Object>} - Updated ticket
 */
export const assignTicket = async (ticketId, userId) => {
  try {
    const token = await getAuthToken();
    if (!token) {
      throw new Error('Authentication required');
    }

    const response = await axios.post(
      `${BASE_URL}/api/tickets/${ticketId}/assign`,
      { userId },
      {
        headers: {
          'x-access-token': token,
          'Content-Type': 'application/json'
        }
      }
    );
    
    return response.data;
  } catch (error) {
    console.error('Error assigning ticket:', error);
    throw error;
  }
};

/**
 * Add comment to ticket
 * @param {string} ticketId - Ticket ID
 * @param {string} content - Comment content
 * @param {boolean} isInternal - Whether comment is internal
 * @returns {Promise<Object>} - Created comment
 */
export const addComment = async (ticketId, content, isInternal = false) => {
  try {
    const token = await getAuthToken();
    if (!token) {
      throw new Error('Authentication required');
    }

    const response = await axios.post(
      `${BASE_URL}/api/tickets/${ticketId}/comments`,
      { content, isInternal },
      {
        headers: {
          'x-access-token': token,
          'Content-Type': 'application/json'
        }
      }
    );
    
    return response.data;
  } catch (error) {
    console.error('Error adding comment:', error);
    throw error;
  }
};

/**
 * Get ticket statistics
 * @returns {Promise<Object>} - Ticket statistics
 */
export const getTicketStatistics = async () => {
  try {
    const token = await getAuthToken();
    if (!token) {
      throw new Error('Authentication required');
    }

    const response = await axios.get(
      `${BASE_URL}/api/tickets/statistics`,
      {
        headers: {
          'x-access-token': token
        }
      }
    );
    
    return response.data;
  } catch (error) {
    console.error('Error getting ticket statistics:', error);
    throw error;
  }
}; 