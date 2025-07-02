/**
 * API endpoints configuration
 */

// Base URL for API - ensure it's a valid URL without trailing slash
export const BASE_URL = (() => {
  // Check if we're running on Vercel (production)
  const isVercel = typeof window !== 'undefined' && 
                  window.location && 
                  (window.location.hostname.includes('vercel.app') || 
                   window.location.hostname.includes('parada'));
  
  // Use environment-specific URL
  const url = isVercel ? 'https://parada-backend.onrender.com' : 'http://localhost:5000';
  
  console.log('Using endpoints API URL:', url);
  
  // Remove any trailing slash
  return url.replace(/\/$/, '');
})();

// API endpoints - ensure all paths start with a slash
export const ENDPOINTS = {
  AUTH: {
    LOGIN: '/api/auth/login',
    REGISTER: '/api/auth/register',
    ME: '/api/auth/me',
    VERIFY: '/api/auth/verify'
  },
  
  USER: {
    ME: '/api/users/me',
    BY_ID: (id) => `/api/users/${id}`,
    UPDATE: '/api/users/profile',
    ALL: '/api/users',
    DRIVERS: '/api/users/drivers',
    PASSENGERS: '/api/users/passengers',
    PROFILE: '/api/auth/profile'  // This is the correct endpoint
  },
  
  SUBSCRIPTION: {
    PLANS: '/api/subscriptions/plans',
    CREATE: '/api/subscriptions',
    ME: '/api/subscriptions/user',
    ALL: '/api/subscriptions',
    BY_ID: (id) => `/api/subscriptions/${id}`,
    PENDING: '/api/subscriptions/pending',
    VERIFY: '/api/subscriptions/verify',
    APPROVE: '/api/subscriptions/approve',
    ADMIN_PENDING: '/api/subscriptions/admin/pending',
    VERIFIED: '/api/subscriptions/verified'
  },
  
  VEHICLE: {
    CREATE: '/api/vehicles',
    BY_ID: (id) => `/api/vehicles/${id}`,
    USER: '/api/vehicles/user',
    ALL: '/api/vehicles',
    TYPES: '/api/vehicles/types'
  },
  
  NOTIFICATION: {
    ALL: '/api/notifications',
    UNREAD: '/api/notifications/unread',
    UNREAD_COUNT: '/api/notifications/unread-count',
    READ: (id) => `/api/notifications/${id}/read`,
    READ_ALL: '/api/notifications/read-all',
    SYSTEM: '/api/notifications/system',
    PUSH: '/api/notifications/push',
    PUSH_USER: (userId) => `/api/notifications/push/${userId}`
  },
  
  MESSAGE: {
    SEND: '/api/messages',
    GET_HISTORY: (userId) => `/api/messages/${userId}`,
    READ: (id) => `/api/messages/${id}/read`,
    DELETE: (id) => `/api/messages/${id}`,
    UNREAD_COUNT: '/api/messages/unread'
  },
  
  LOCATION: {
    UPDATE: '/api/locations/update',
    USER: (userId) => `/api/locations/user/${userId}`,
    NEARBY: '/api/locations/nearby'
  },
  
  RIDE: {
    REQUEST: '/api/rides/request',
    CANCEL: (id) => `/api/rides/${id}/cancel`,
    ACCEPT: (id) => `/api/rides/${id}/accept`,
    COMPLETE: (id) => `/api/rides/${id}/complete`,
    USER: '/api/rides/user',
    ACTIVE: '/api/rides/active',
    BY_ID: (id) => `/api/rides/${id}`
  },
  
  PAYMENT: {
    METHODS: '/api/payments/methods',
    PROCESS: '/api/payments/process',
    VERIFY: '/api/payments/verify',
    HISTORY: '/api/payments/history'
  },
  
  FEEDBACK: {
    CREATE: '/api/feedback',
    BY_RIDE: (rideId) => `/api/feedback/ride/${rideId}`,
    USER: '/api/feedback/user'
  },
  
  ADMIN: {
    DASHBOARD: '/api/admin/dashboard',
    USERS: '/api/admin/users',
    DRIVERS: '/api/admin/drivers',
    RIDES: '/api/admin/rides',
    SUBSCRIPTIONS: '/api/admin/subscriptions',
    REPORTS: '/api/admin/reports',
    VERIFY_DRIVER: (driverId) => `/api/admin/drivers/${driverId}/verify`,
    DELETE_DRIVER: (driverId) => `/api/admin/drivers/${driverId}`
  },
  
  DRIVER: {
    PROFILE: '/api/drivers/profile',
    BY_ID: (id) => `/api/drivers/${id}`,
    ROUTES: '/api/drivers/routes',
    STATUS: '/api/drivers/status',
    LOCATION: '/api/drivers/location',
    ACCEPT_RIDE: (rideId) => `/api/rides/${rideId}/accept`,
    COMPLETE_RIDE: (rideId) => `/api/rides/${rideId}/complete`,
    CANCEL_RIDE: (rideId) => `/api/rides/${rideId}/cancel`
  },
  
  ROUTE: {
    ALL: '/api/routes',
    BY_ID: (id) => `/api/routes/${id}`,
    CREATE: '/api/routes',
    UPDATE: (id) => `/api/routes/${id}`,
    DELETE: (id) => `/api/routes/${id}`,
    ASSIGN_DRIVER: (routeId) => `/api/routes/${routeId}/drivers`,
    UNASSIGN_DRIVER: (routeId, driverId) => `/api/routes/${routeId}/drivers/${driverId}`,
    REQUEST_CUSTOM: '/api/routes/request-custom'
  }
}; 