/**
 * API Configuration
 * Central configuration for API calls
 */
import ENV from '../../constants/environment';
import axios from 'axios';
import { getAuthToken } from './auth.api';

// The base URL for all API calls - ensure it's a valid URL without trailing slash
export const BASE_URL = (() => {
  // Check if we're running on Vercel (production)
  const isVercel = typeof window !== 'undefined' && 
                  window.location && 
                  (window.location.hostname.includes('vercel.app') || 
                   window.location.hostname.includes('parada'));
  
  // Use environment-specific URL
  const url = isVercel ? 'https://parada-backend.onrender.com' : ENV.apiUrl;
  
  console.log('Using API URL:', url);
  console.log('Environment:', isVercel ? 'production (Vercel)' : 'development');
  console.log('Origin:', typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');
  
  // Remove any trailing slash
  return url.replace(/\/$/, '');
})();

// Default headers for API calls
export const DEFAULT_HEADERS = {
  'Content-Type': 'application/json',
  'Accept': 'application/json'
  // Removed Origin header as it's causing "Refused to set unsafe header" errors
};

// Axios configuration options
export const AXIOS_CONFIG = {
  timeout: 10000, // 10 seconds timeout
  withCredentials: false, // Don't send cookies with cross-origin requests
  headers: DEFAULT_HEADERS
};

/**
 * Make an API request with authentication
 * @param {string} method - HTTP method (GET, POST, PUT, DELETE)
 * @param {string} endpoint - API endpoint (should start with a slash)
 * @param {Object} data - Request data (for POST, PUT)
 * @returns {Promise<Object>} - API response
 */
export const apiRequest = async (method, endpoint, data = null) => {
  try {
    const token = await getAuthToken();
    if (!token) throw new Error('Authentication required');
    
    const url = `${BASE_URL}${endpoint}`;
    
    const config = {
      method,
      url,
      headers: { 
        ...DEFAULT_HEADERS,
        'x-access-token': token 
      },
      ...(data && { data })
    };
    
    return await axios(config);
  } catch (error) {
    console.error(`API request error (${method} ${endpoint}):`, error);
    throw error;
  }
};

// API endpoints - ensure all paths start with a slash
export const ENDPOINTS = {
  // Auth endpoints
  AUTH: {
    LOGIN: '/api/auth/login',
    REGISTER: '/api/auth/register',
    ME: '/api/auth/me',
    VERIFY: '/api/auth/verify'
  },
  
  // Subscription endpoints
  SUBSCRIPTION: {
    BASE: '/api/subscriptions',
    PLANS: '/api/subscriptions/plans',
    PUBLIC_PLANS: '/api/subscriptions/public-plans',
    PUBLIC_CREATE: '/api/subscriptions/public-create',
    CREATE: '/api/subscriptions',
    ME: '/api/subscriptions/me',
    USER: '/api/subscriptions/user',
    ALL: '/api/subscriptions',
    BY_ID: (id) => `/api/subscriptions/${id}`,
    PENDING: '/api/subscriptions/pending',
    VERIFY: '/api/subscriptions/verify',
    APPROVE: '/api/subscriptions/approve',
    ADMIN_PENDING: '/api/subscriptions/admin/pending',
    CANCEL: (id) => `/api/subscriptions/${id}`
  },
  
  // User endpoints
  USER: {
    PROFILE: '/api/users/profile',
    UPDATE: '/api/users/profile',
    CHANGE_PASSWORD: (id) => `/api/users/${id}/password`,
  },
  
  // Notification endpoints
  NOTIFICATION: {
    ALL: '/api/notifications',
    UNREAD: '/api/notifications/unread',
    READ: (id) => `/api/notifications/${id}/read`,
    READ_ALL: '/api/notifications/read-all'
  },
  
  // Admin endpoints
  ADMIN: {
    SUBSCRIPTION_PLANS: '/api/admin/subscription-plans',
    USERS: '/api/admin/users',
    DRIVERS: '/api/admin/drivers',
    ROUTES: '/api/admin/routes',
    STATISTICS: '/api/admin/statistics',
    STUDENT_DISCOUNT: '/api/admin/student-discount'
  }
}; 