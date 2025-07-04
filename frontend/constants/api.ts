import { Platform } from 'react-native';

// Determine API URL based on environment
let API_URL: string;

// Check if we're running on Vercel
const isVercel = typeof window !== 'undefined' && 
  (window.location.hostname.includes('vercel.app') || 
   window.location.hostname.includes('parada'));

if (__DEV__) {
  // Development environment
  if (Platform.OS === 'web') {
    // Web development - use relative URL
    API_URL = '';
  } else if (Platform.OS === 'android') {
    // Android development - use 10.0.2.2 (emulator localhost)
    API_URL = 'http://10.0.2.2:3000';
  } else {
    // iOS development
    API_URL = 'http://localhost:3000';
  }
} else {
  // Production environment - use the deployed API URL
  API_URL = 'https://parada-backend.onrender.com';
  
  // Log the environment detection
  if (typeof window !== 'undefined') {
    console.log('Vercel deployment detected, using production environment');
  }
}

// Log the API URL for debugging
if (typeof window !== 'undefined') {
  console.log('Using API URL:', API_URL);
  console.log('Environment:', __DEV__ ? 'development' : (isVercel ? 'production (Vercel)' : 'production'));
  console.log('Origin:', typeof window !== 'undefined' ? window.location.origin : 'unknown');
}

// Socket URL (usually the same as API_URL but can be different)
export const SOCKET_URL = API_URL;

// API endpoints
export const ENDPOINTS = {
  AUTH: {
    LOGIN: '/api/auth/login',
    REGISTER: '/api/auth/register',
    LOGOUT: '/api/auth/logout',
    VERIFY: '/api/auth/verify',
    REFRESH: '/api/auth/refresh',
    CHANGE_PASSWORD: '/api/auth/change-password',
  },
  USER: {
    PROFILE: '/api/users/profile',
    UPDATE: '/api/users/update',
    SEARCH: '/api/users/search',
  },
  SUBSCRIPTION: {
    CREATE: '/api/subscriptions/create',
    VERIFY: '/api/subscriptions/verify',
    LIST: '/api/subscriptions/list',
    USER: '/api/subscriptions/user',
  },
  NOTIFICATIONS: {
    LIST: '/api/notifications/list',
    MARK_READ: '/api/notifications/mark-read',
    UNREAD_COUNT: '/api/notifications/unread-count',
  },
  MESSAGES: {
    SEND: '/api/messages/send',
    LIST: '/api/messages/list',
    READ: '/api/messages/read',
  },
  INSTALLATIONS: {
    COUNT: '/api/installations/count',
    REGISTER: '/api/installations/register',
  },
};

export { API_URL }; 