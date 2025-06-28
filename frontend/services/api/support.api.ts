import axios from 'axios';
import ENV from '../../constants/environment';
import { getAuthHeader } from './auth.api';

// API URL
const API_URL = ENV.apiUrl;

// Ticket interfaces
export interface TicketMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: 'user' | 'support';
  message: string;
  createdAt: string;
}

export interface Ticket {
  id: string;
  userId: string;
  username: string;
  userEmail?: string;
  subject: string;
  status: 'open' | 'in-progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  category: string;
  description?: string;
  createdAt: string;
  lastUpdated: string;
  messages?: TicketMessage[];
}

export interface SupportSettings {
  notifications: {
    newTicket: boolean;
    ticketReply: boolean;
    ticketEscalation: boolean;
    ticketAssignment: boolean;
    ticketOverdue: boolean;
  };
  display: {
    ticketsPerPage: number;
    defaultFilter: string;
    autoRefresh: boolean;
    refreshInterval: number;
  };
  email: {
    emailNotifications: boolean;
    emailDigest: string;
  };
}

// Get all tickets with optional filters
export const getTickets = async (queryParams?: string) => {
  try {
    const authHeader = await getAuthHeader();
    const url = queryParams 
      ? `${API_URL}/api/support/tickets?${queryParams}`
      : `${API_URL}/api/support/tickets`;
      
    const response = await axios.get(url, { headers: authHeader });
    return response.data;
  } catch (error) {
    console.error('Error fetching tickets:', error);
    return { success: false, message: 'Failed to fetch tickets' };
  }
};

// Get ticket statistics
export const getTicketStats = async (queryParams?: string) => {
  try {
    const authHeader = await getAuthHeader();
    const url = queryParams 
      ? `${API_URL}/api/support/tickets/stats?${queryParams}`
      : `${API_URL}/api/support/tickets/stats`;
      
    const response = await axios.get(url, { headers: authHeader });
    return response.data;
  } catch (error) {
    console.error('Error fetching ticket stats:', error);
    return { success: false, message: 'Failed to fetch ticket statistics' };
  }
};

// Get ticket details by ID
export const getTicketById = async (ticketId: string) => {
  try {
    const authHeader = await getAuthHeader();
    const response = await axios.get(`${API_URL}/api/support/tickets/${ticketId}`, { 
      headers: authHeader 
    });
    return response.data;
  } catch (error) {
    console.error(`Error fetching ticket ${ticketId}:`, error);
    return { success: false, message: 'Failed to fetch ticket details' };
  }
};

// Update ticket status
export const updateTicketStatus = async (ticketId: string, status: string) => {
  try {
    const authHeader = await getAuthHeader();
    const response = await axios.patch(
      `${API_URL}/api/support/tickets/${ticketId}/status`, 
      { status }, 
      { headers: authHeader }
    );
    return response.data;
  } catch (error) {
    console.error(`Error updating ticket ${ticketId} status:`, error);
    return { success: false, message: 'Failed to update ticket status' };
  }
};

// Update ticket priority
export const updateTicketPriority = async (ticketId: string, priority: string) => {
  try {
    const authHeader = await getAuthHeader();
    const response = await axios.patch(
      `${API_URL}/api/support/tickets/${ticketId}/priority`, 
      { priority }, 
      { headers: authHeader }
    );
    return response.data;
  } catch (error) {
    console.error(`Error updating ticket ${ticketId} priority:`, error);
    return { success: false, message: 'Failed to update ticket priority' };
  }
};

// Add reply to ticket
export const addTicketReply = async (ticketId: string, message: string) => {
  try {
    const authHeader = await getAuthHeader();
    const response = await axios.post(
      `${API_URL}/api/support/tickets/${ticketId}/reply`, 
      { message }, 
      { headers: authHeader }
    );
    return response.data;
  } catch (error) {
    console.error(`Error adding reply to ticket ${ticketId}:`, error);
    return { success: false, message: 'Failed to add reply to ticket' };
  }
};

// Get support settings
export const getSupportSettings = async () => {
  try {
    const authHeader = await getAuthHeader();
    const response = await axios.get(`${API_URL}/api/support/settings`, { 
      headers: authHeader 
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching support settings:', error);
    return { success: false, message: 'Failed to fetch support settings' };
  }
};

// Update support settings
export const updateSupportSettings = async (settings: Partial<SupportSettings>) => {
  try {
    const authHeader = await getAuthHeader();
    const response = await axios.put(
      `${API_URL}/api/support/settings`, 
      settings, 
      { headers: authHeader }
    );
    return response.data;
  } catch (error) {
    console.error('Error updating support settings:', error);
    return { success: false, message: 'Failed to update support settings' };
  }
};

// Create new ticket (for support staff to create tickets on behalf of users)
export const createTicket = async (ticketData: Partial<Ticket>) => {
  try {
    const authHeader = await getAuthHeader();
    const response = await axios.post(
      `${API_URL}/api/support/tickets`, 
      ticketData, 
      { headers: authHeader }
    );
    return response.data;
  } catch (error) {
    console.error('Error creating ticket:', error);
    return { success: false, message: 'Failed to create ticket' };
  }
};

// Assign ticket to support staff
export const assignTicket = async (ticketId: string, assigneeId: string) => {
  try {
    const authHeader = await getAuthHeader();
    const response = await axios.patch(
      `${API_URL}/api/support/tickets/${ticketId}/assign`, 
      { assigneeId }, 
      { headers: authHeader }
    );
    return response.data;
  } catch (error) {
    console.error(`Error assigning ticket ${ticketId}:`, error);
    return { success: false, message: 'Failed to assign ticket' };
  }
}; 