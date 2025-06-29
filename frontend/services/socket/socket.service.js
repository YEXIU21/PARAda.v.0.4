/**
 * Socket Service
 * Handles WebSocket connections
 */
import { io } from 'socket.io-client';
import { BASE_URL } from '../api/api.config';
import { getAuthToken } from '../api/auth.api';

// Create a singleton socket instance
let socket = null;

/**
 * Initialize the socket connection
 * @returns {Promise<SocketIOClient.Socket|null>} - The socket instance or null if not authenticated
 */
export const initializeSocket = async () => {
  try {
    if (socket) return socket;
    
    const token = await getAuthToken();
    if (!token) {
      console.log('No authentication token available, skipping socket connection');
      return null;
    }
    
    console.log('Initializing socket connection to:', BASE_URL);
    
    // Check if we're running on Vercel (production)
    const isVercel = typeof window !== 'undefined' && 
                    window.location && 
                    (window.location.hostname.includes('vercel.app') || 
                     window.location.hostname.includes('parada'));

    // Connect to the socket server with auth token
    socket = io(BASE_URL, {
      auth: {
        token
      },
      transports: isVercel ? ['polling', 'websocket'] : ['websocket', 'polling'], // Use polling first on Vercel
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });
    
    // Set up event listeners
    socket.on('connect', () => {
      console.log('Socket connected with ID:', socket.id);
    });
    
    socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
    });
    
    socket.on('error', (error) => {
      console.error('Socket error:', error);
    });
    
    socket.on('reconnect', (attemptNumber) => {
      console.log('Socket reconnected after', attemptNumber, 'attempts');
    });
    
    socket.on('reconnect_error', (error) => {
      console.error('Socket reconnection error:', error);
    });
    
    return socket;
  } catch (error) {
    console.error('Failed to initialize socket:', error);
    return null;
  }
};

/**
 * Get the socket instance
 * @returns {SocketIOClient.Socket|null} - The socket instance or null if not initialized
 */
export const getSocket = () => {
  return socket;
};

/**
 * Disconnect the socket
 */
export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
    console.log('Socket disconnected and reset');
  }
};

/**
 * Subscribe to a specific event
 * @param {string} event - The event name
 * @param {Function} callback - The callback function
 * @returns {boolean} - Whether the subscription was successful
 */
export const subscribeToEvent = (event, callback) => {
  if (!socket) {
    console.warn('Socket not initialized, cannot subscribe to event:', event);
    return false;
  }
  
  socket.on(event, callback);
  console.log('Subscribed to event:', event);
  return true;
};

/**
 * Unsubscribe from a specific event
 * @param {string} event - The event name
 * @param {Function} callback - The callback function
 * @returns {boolean} - Whether the unsubscription was successful
 */
export const unsubscribeFromEvent = (event, callback) => {
  if (!socket) {
    console.warn('Socket not initialized, cannot unsubscribe from event:', event);
    return false;
  }
  
  if (callback) {
    socket.off(event, callback);
    console.log('Unsubscribed from event with specific callback:', event);
  } else {
    socket.off(event);
    console.log('Unsubscribed from all callbacks for event:', event);
  }
  
  return true;
};

/**
 * Emit an event to the server
 * @param {string} event - The event name
 * @param {any} data - The data to send
 * @returns {boolean} - Whether the event was emitted
 */
export const emitEvent = (event, data) => {
  if (!socket) {
    console.warn('Socket not initialized, cannot emit event:', event);
    return false;
  }
  
  socket.emit(event, data);
  console.log('Emitted event:', event, data);
  return true;
}; 