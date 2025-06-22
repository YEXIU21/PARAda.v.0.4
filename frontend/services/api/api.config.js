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
                  window.location.hostname.includes('vercel.app');
  
  // Use environment-specific URL
  const url = isVercel ? 'https://parada-backendv1.vercel.app' : ENV.apiUrl;
  
  console.log('Using API URL:', url);
  
  // Remove any trailing slash
  return url.replace(/\/$/, '');
})();

// Default headers for API calls
export const DEFAULT_HEADERS = {
  'Content-Type': 'application/json',
  'Accept': 'application/json'
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