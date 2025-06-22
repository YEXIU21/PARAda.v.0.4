/**
 * API Configuration
 * Central configuration for API calls
 */

// The base URL for all API calls - ensure it's a valid URL without trailing slash
export const BASE_URL = (() => {
  // Only use NEXT_PUBLIC_API_URL if it's explicitly set
  const isProduction = process.env.NEXT_PUBLIC_ENV === 'production';
  const defaultUrl = isProduction ? 'https://parada-backendv1.vercel.app' : 'http://localhost:5000';
  
  const url = process.env.NEXT_PUBLIC_API_URL || defaultUrl;
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