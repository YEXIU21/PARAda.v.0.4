/**
 * Location Socket Service
 * Handles real-time location tracking
 */
import { io } from 'socket.io-client';
import { API_URL } from '../../constants/environment.js';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Store socket connection
let socket = null;
let socketInitializing = false;
let socketInitPromise = null;
let socketFailedAttempts = 0;
const MAX_RETRY_ATTEMPTS = 3;

// Store location data
let driverLocations = new Map();
let passengerLocations = new Map();
let activeRide = null;
let availableRoutes = [];
let driverRoutes = [];

// Queue for messages that need to be sent after socket is connected
const messageQueue = [];

// Callbacks for different event types
const notificationCallbacks = [];
const chatCallbacks = [];
const broadcastCallbacks = [];
const routeUpdateCallbacks = [];

// Determine if we're running in development or production
const isDevelopment = process.env.NODE_ENV !== 'production';
const FALLBACK_HTTP_POLLING = true;

/**
 * Get the correct Socket.IO URL based on environment
 * @returns {string} Socket.IO URL
 */
function getSocketUrl() {
  // Always use localhost:5000 in development
  const defaultUrl = 'http://localhost:5000';
  
  // Only use environment variable if explicitly set
  let url = process.env.NEXT_PUBLIC_API_URL || defaultUrl;
  
  // Remove any trailing slashes
  url = url.replace(/\/$/, '');
  
  // Ensure we never use Vercel URL for WebSocket connections
  if (url.includes('vercel.app')) {
    console.warn('Detected Vercel URL in API_URL. Using localhost instead for socket connections.');
    return defaultUrl;
  }
  
  console.log('Using socket connection URL:', url);
  return url;
}

/**
 * Socket event handlers
 */
const setupSocketEventHandlers = (socket) => {
  // Listen for route updates
  socket.on('route_updates', (data) => {
    console.log('Received route updates:', data);
    if (data && data.routes) {
      // Update the local cache of routes
      if (Array.isArray(data.routes)) {
        // For driver-specific routes
        driverRoutes = data.routes;
      } else {
        // For available routes
        availableRoutes = data.routes;
      }
      
      // Notify all registered callbacks
      routeUpdateCallbacks.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('Error in route update callback:', error);
        }
      });
    }
  });
  
  // Listen for notifications
  socket.on('notification', (data) => {
    console.log('Received notification:', data);
    
    // Notify all registered callbacks
    notificationCallbacks.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error('Error in notification callback:', error);
      }
    });
  });
  
  // Listen for chat messages
  socket.on('chat', (data) => {
    console.log('Received chat message:', data);
    
    // Notify all registered callbacks
    chatCallbacks.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error('Error in chat callback:', error);
      }
    });
  });
  
  // Listen for broadcast messages
  socket.on('broadcast', (data) => {
    console.log('Received broadcast message:', data);
    
    // Notify all registered callbacks
    broadcastCallbacks.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error('Error in broadcast callback:', error);
      }
    });
  });
  
  // Listen for connection events
  socket.on('connect', () => {
    console.log('Socket connected with ID:', socket.id);
    socketFailedAttempts = 0; // Reset failure count on successful connection
    
    // Process any queued messages
    if (messageQueue.length > 0) {
      console.log(`Processing ${messageQueue.length} queued messages`);
      messageQueue.forEach(({ event, data }) => {
        socket.emit(event, data);
      });
      messageQueue.length = 0; // Clear the queue
    }
    
    // Subscribe to route updates for all clients
    socket.emit('subscribe_routes');
  });
  
  socket.on('connection', (data) => {
    console.log('Socket connection confirmed:', data);
  });
  
  socket.on('connect_error', (error) => {
    console.error('Socket connection error:', error.message);
    socketFailedAttempts++;
    
    if (socketFailedAttempts === 1 && FALLBACK_HTTP_POLLING) {
      console.log('WebSocket connection failed, falling back to HTTP polling');
    }
  });
  
  socket.on('disconnect', (reason) => {
    console.log('Socket disconnected:', reason);
  });
  
  socket.on('reconnect', (attemptNumber) => {
    console.log('Socket reconnected after', attemptNumber, 'attempts');
    
    // Resubscribe to route updates
    socket.emit('subscribe_routes');
  });
  
  socket.on('reconnect_error', (error) => {
    console.error('Socket reconnection error:', error);
  });
  
  socket.on('error', (error) => {
    console.error('Socket error:', error);
  });
};

/**
 * Initialize location tracking socket
 * @param {string} clientId - Client ID for tracking
 * @param {string} token - Authentication token
 * @returns {Promise<SocketIOClient.Socket>} - Socket instance
 */
export const initializeLocationSocket = async (clientId, token) => {
  // If socket is already initialized or initializing, return the existing socket or promise
  if (socket && socket.connected) return socket;
  if (socketInitializing && socketInitPromise) return socketInitPromise;
  
  // If we've failed too many times, don't keep trying
  if (socketFailedAttempts >= MAX_RETRY_ATTEMPTS) {
    console.warn(`Socket initialization failed ${socketFailedAttempts} times. Using HTTP fallback.`);
    return null;
  }
  
  socketInitializing = true;
  
  // Create a promise that will resolve when the socket is initialized
  socketInitPromise = new Promise(async (resolve, reject) => {
    try {
      const socketUrl = getSocketUrl();
      console.log('Initializing location tracking socket connection to:', socketUrl);
      
      // If no token is provided, try to get it from AsyncStorage
      if (!token) {
        token = await AsyncStorage.getItem('token');
        if (!token) {
          token = await AsyncStorage.getItem('authToken');
        }
        
        if (!token) {
          console.warn('No auth token available for socket connection');
        }
      }
      
      // Connect to the socket server with client ID and auth token
      socket = io(socketUrl, {
        query: { id: clientId },
        auth: { token },
        transports: FALLBACK_HTTP_POLLING ? ['websocket', 'polling'] : ['websocket'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        timeout: 20000
      });
      
      // Set up event handlers
      setupSocketEventHandlers(socket);
      
      // Wait for the connection to establish or fail
      const connectionTimeout = setTimeout(() => {
        if (!socket.connected) {
          socketFailedAttempts++;
          socketInitializing = false;
          console.error('Socket connection timeout after 10 seconds');
          
          if (FALLBACK_HTTP_POLLING && socket.io?.opts?.transports?.[0] === 'websocket') {
            console.log('Falling back to HTTP polling');
            socket.io.opts.transports = ['polling', 'websocket'];
            resolve(socket); // Resolve with the socket even though it's not connected yet
          } else {
            reject(new Error('Connection timeout'));
          }
        }
      }, 10000);
      
      // Clear timeout when connected
        socket.on('connect', () => {
          clearTimeout(connectionTimeout);
          socketInitializing = false;
          resolve(socket);
        });
        
      // Reject on connection error
        socket.on('connect_error', (error) => {
        clearTimeout(connectionTimeout);
          socketInitializing = false;
        reject(error);
        });
    } catch (error) {
      console.error('Error initializing socket:', error);
      socketInitializing = false;
      reject(error);
    }
  });
  
  return socketInitPromise;
};

/**
 * Send location update to server via HTTP fallback if socket isn't available
 * @param {string} endpoint - API endpoint
 * @param {Object} data - Location data
 * @returns {Promise<boolean>} - Success indicator
 */
async function sendLocationViaHttp(endpoint, data) {
  try {
    const token = await AsyncStorage.getItem('token') || await AsyncStorage.getItem('authToken');
    if (!token) return false;
    
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-access-token': token
      },
      body: JSON.stringify(data)
    });
    
    return response.ok;
  } catch (error) {
    console.error(`HTTP fallback failed for ${endpoint}:`, error);
    return false;
  }
}

/**
 * Get the location socket instance
 * @returns {SocketIOClient.Socket|null} - Socket instance or null if not initialized
 */
export const getLocationSocket = () => {
  return socket;
};

/**
 * Disconnect location socket
 */
export const disconnectLocationSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
    socketInitializing = false;
    socketInitPromise = null;
    console.log('Location socket disconnected and reset');
  }
};

/**
 * Ensure socket is initialized, or queue the message for later
 * @param {string} event - Event name
 * @param {Object} data - Event data
 * @returns {Promise<boolean>} - True if sent immediately, false if queued
 */
async function ensureSocketInitialized(event, data) {
  if (!socket && !socketInitializing) {
    // Try to get client ID and token from storage
    try {
      const [clientId, token] = await Promise.all([
        AsyncStorage.getItem('driverId') || AsyncStorage.getItem('userId'),
        AsyncStorage.getItem('token') || AsyncStorage.getItem('authToken')
      ]);
      
      if (clientId && token) {
        await initializeLocationSocket(clientId, token);
        return true;
      } else {
        console.warn('Cannot initialize socket: Missing clientId or token');
        messageQueue.push({ event, data });
        return false;
      }
    } catch (error) {
      console.error('Error auto-initializing socket:', error);
      messageQueue.push({ event, data });
      return false;
    }
  } else if (socketInitializing) {
    // Socket is initializing, queue the message
    messageQueue.push({ event, data });
    return false;
  } else if (socket && !socket.connected) {
    // Socket exists but not connected
    messageQueue.push({ event, data });
    return false;
  }
  
  return true;
}

/**
 * Send driver location update
 * @param {string} driverId - Driver ID
 * @param {Object} location - Location coordinates {latitude, longitude}
 * @param {string} rideId - Ride ID (optional)
 */
export const sendDriverLocation = async (driverId, location, rideId = null) => {
  const locationData = {
    driverId,
    location,
    timestamp: new Date().toISOString()
  };
  
  // Add ride ID if provided
  if (rideId) {
    locationData.rideId = rideId;
  }
  
  let sent = false;
  
  // Try to send via socket if available
  if (socket && socket.connected) {
    socket.emit('driver_location', locationData);
    sent = true;
    console.log('Sent driver location update via socket:', locationData);
  } else {
    // Try to ensure socket is initialized
    const isReady = await ensureSocketInitialized('driver_location', locationData);
    
    if (isReady && socket && socket.connected) {
      socket.emit('driver_location', locationData);
      sent = true;
      console.log('Sent driver location update via socket (after init):', locationData);
    } else {
      console.log('Socket not available for driver location update, using HTTP fallback');
      
      // Use HTTP fallback
      const success = await sendLocationViaHttp('/api/drivers/location', locationData);
      if (success) {
        sent = true;
        console.log('Sent driver location update via HTTP fallback');
      } else {
        console.log('Failed to send driver location update via HTTP, queuing for later');
        messageQueue.push({ event: 'driver_location', data: locationData });
      }
    }
  }
  
  // Update local cache regardless
  driverLocations.set(driverId, location);
  
  return location;
};

/**
 * Send passenger location update
 * @param {Object} location - Location data { latitude, longitude }
 * @param {string} passengerId - Passenger ID
 * @param {string} rideId - Optional ride ID
 */
export const sendPassengerLocation = async (location, passengerId, rideId = null) => {
  const payload = { 
    passengerId,
    location,
    timestamp: new Date().toISOString()
  };
  
  if (rideId) {
    payload.rideId = rideId;
  }
  
  let sent = false;
  
  // Try to send via socket if available
  if (socket && socket.connected) {
    socket.emit('passenger_location', payload);
    sent = true;
    console.log('Sent passenger location update via socket:', payload);
  } else {
    // Try to ensure socket is initialized
    const isReady = await ensureSocketInitialized('passenger_location', payload);
    
    if (isReady && socket && socket.connected) {
      socket.emit('passenger_location', payload);
      sent = true;
      console.log('Sent passenger location update via socket (after init):', payload);
    } else {
      console.log('Socket not available for passenger location update, using HTTP fallback');
      
      // Use HTTP fallback
      const success = await sendLocationViaHttp('/api/passengers/location', payload);
      if (success) {
        sent = true;
        console.log('Sent passenger location update via HTTP fallback');
      } else {
        console.log('Failed to send passenger location update via HTTP, queuing for later');
        messageQueue.push({ event: 'passenger_location', data: payload });
      }
    }
  }
  
  // Update local cache regardless
  passengerLocations.set(passengerId, location);
  
  return sent;
};

/**
 * Get driver location by ID
 * @param {string} driverId - Driver ID
 * @returns {Object|null} - Driver location or null if not found
 */
export const getDriverLocation = (driverId) => {
  return driverLocations.get(driverId) || null;
};

/**
 * Get passenger location by ID
 * @param {string} passengerId - Passenger ID
 * @returns {Object|null} - Passenger location or null if not found
 */
export const getPassengerLocation = (passengerId) => {
  return passengerLocations.get(passengerId) || null;
};

/**
 * Get active ride data
 * @returns {Object|null} - Active ride data or null if no active ride
 */
export const getActiveRide = () => {
  return activeRide;
};

/**
 * Subscribe to chat messages
 * @param {Function} callback - Callback function for chat messages
 */
export const subscribeToChatMessages = (callback) => {
  if (!socket) {
    console.warn('Location socket not initialized, cannot subscribe to chat messages');
    return;
  }
  
  socket.on('chat', callback);
  console.log('Subscribed to chat messages');
};

/**
 * Send chat message
 * @param {string} recipientId - Recipient ID
 * @param {string} message - Message text
 */
export const sendChatMessage = (recipientId, message) => {
  if (!socket) {
    console.warn('Location socket not initialized, cannot send chat message');
    return;
  }
  
  socket.emit('chat', { recipientId, message });
  console.log('Sent chat message to', recipientId);
};

/**
 * Subscribe to notifications
 * @param {Function} callback - Callback function for notifications
 */
export const subscribeToNotifications = (callback) => {
  if (!socket) {
    console.warn('Location socket not initialized, cannot subscribe to notifications');
    return;
  }
  
  socket.on('notification', callback);
  console.log('Subscribed to notifications');
};

/**
 * Subscribe to broadcast messages
 * @param {Function} callback - Callback function to handle broadcast messages
 * @returns {Function} - Unsubscribe function
 */
export const subscribeToBroadcast = (callback) => {
  broadcastCallbacks.push(callback);
  
  // Return unsubscribe function
  return () => {
    const index = broadcastCallbacks.indexOf(callback);
    if (index !== -1) {
      broadcastCallbacks.splice(index, 1);
    }
  };
};

/**
 * Subscribe to route updates
 * @param {Function} callback - Callback function to handle route updates
 * @returns {Function} - Unsubscribe function
 */
export const subscribeToRouteUpdates = (callback) => {
  routeUpdateCallbacks.push(callback);
  
  // If we have a connected socket, subscribe to route updates
  if (socket && socket.connected) {
    socket.emit('driver:subscribe_routes');
  }
  
  // Return unsubscribe function with explicit void return type
  return () => {
    const index = routeUpdateCallbacks.indexOf(callback);
    if (index !== -1) {
      routeUpdateCallbacks.splice(index, 1);
    }
  };
};

/**
 * Get cached available routes
 * @returns {Array} - Array of available routes
 */
export const getAvailableRoutes = () => {
  return availableRoutes;
};

/**
 * Get cached driver routes
 * @returns {Array} - Array of driver routes
 */
export const getDriverRoutes = () => {
  return driverRoutes;
}; 