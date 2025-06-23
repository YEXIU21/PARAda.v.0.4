/**
 * API Configuration
 * Central configuration for API calls
 */
import ENV from '../../constants/environment';

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
  'Accept': 'application/json',
  'Origin': typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'
};

// Axios configuration options
export const AXIOS_CONFIG = {
  timeout: 10000, // 10 seconds timeout
  withCredentials: false, // Don't send cookies with cross-origin requests
  headers: DEFAULT_HEADERS
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
    PLANS: '/api/subscriptions/plans',
    CREATE: '/api/subscriptions',
    ME: '/api/subscriptions/me',
    USER: '/api/subscriptions/user',
    ALL: '/api/subscriptions',
    BY_ID: (id) => `/api/subscriptions/${id}`,
    PENDING: '/api/subscriptions/pending',
    VERIFY: '/api/subscriptions/verify',
    APPROVE: '/api/subscriptions/approve',
    ADMIN_PENDING: '/api/subscriptions/admin/pending', // Add the new debug endpoint
    VERIFIED: '/api/subscriptions/verified' // Add the verified subscriptions endpoint
  },
  
  // User endpoints
  USER: {
    PROFILE: '/api/users/profile',
    UPDATE: '/api/users/profile',
  },
  
  // Notification endpoints
  NOTIFICATION: {
    ALL: '/api/notifications',
    UNREAD: '/api/notifications/unread',
    READ: (id) => `/api/notifications/${id}/read`,
    READ_ALL: '/api/notifications/read-all'
  }
}; 