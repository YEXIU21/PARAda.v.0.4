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
 * @returns {Promise<SocketIOClient.Socket>} - The socket instance
 */
export const initializeSocket = async () => {
  try {
    if (socket) return socket;
    
    const token = await getAuthToken();
    if (!token) throw new Error('Authentication required for socket connection');
    
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
      transports: ['polling', 'websocket'], // Always start with polling for better compatibility
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      timeout: 20000,
      path: '/socket.io/',
      forceNew: true
    });
    
    // Set up event listeners
    socket.on('connect', () => {
      console.log('Socket connected with ID:', socket.id);
    });
    
    socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      // If the server disconnected us, try to reconnect
      if (reason === 'io server disconnect') {
        socket.connect();
      }
    });
    
    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      // If WebSocket fails, try polling only
      if (socket.io.opts.transports.includes('websocket')) {
        console.log('Falling back to polling transport only');
        socket.io.opts.transports = ['polling'];
      }
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
    throw error;
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
 */
export const subscribeToEvent = (event, callback) => {
  if (!socket) {
    console.warn('Socket not initialized, cannot subscribe to event:', event);
    return;
  }
  
  socket.on(event, callback);
  console.log('Subscribed to event:', event);
};

/**
 * Unsubscribe from a specific event
 * @param {string} event - The event name
 * @param {Function} callback - The callback function
 */
export const unsubscribeFromEvent = (event, callback) => {
  if (!socket) {
    console.warn('Socket not initialized, cannot unsubscribe from event:', event);
    return;
  }
  
  if (callback) {
    socket.off(event, callback);
    console.log('Unsubscribed from event with specific callback:', event);
  } else {
    socket.off(event);
    console.log('Unsubscribed from all callbacks for event:', event);
  }
};

/**
 * Emit an event to the server
 * @param {string} event - The event name
 * @param {any} data - The data to send
 */
export const emitEvent = (event, data) => {
  if (!socket) {
    console.warn('Socket not initialized, cannot emit event:', event);
    return;
  }
  
  socket.emit(event, data);
  console.log('Emitted event:', event, data);
}; 