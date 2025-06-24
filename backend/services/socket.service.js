/**
 * Socket.io Service
 * Handles real-time communication with clients
 */
const socketIO = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
const Driver = require('../models/driver.model');
const Ride = require('../models/ride.model');

// Store active connections
const activeConnections = new Map();
// Store admin connections
const adminConnections = new Set();
// Store client connections by client ID (for migration from WebSocket)
const clientConnections = new Map();
// Store user type mapping (driver or passenger)
const userTypeMapping = new Map();
// Store active rides
const activeRides = new Map();
// Store driver connections by driver ID
const driverConnections = new Map();

// Check if we're in a serverless environment
const isServerless = process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_VERSION;

// Initialize socket.io server
const initializeSocketServer = (server) => {
  // Configure Socket.IO even in serverless environments
  const io = socketIO(server, {
    cors: {
      origin: '*', // Allow all origins for now
      methods: ['GET', 'POST'],
      credentials: true
    },
    // Configure for serverless environments
    transports: ['websocket', 'polling'], // Try WebSocket first, then polling
    allowEIO3: true, // Allow Engine.IO v3 clients
    pingTimeout: 60000, // Increase timeout for serverless environments
    pingInterval: 25000, // Increase interval for serverless environments
    path: '/socket.io/',
    serveClient: false // Don't serve the client library
  });

  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      
      if (!token) {
        // For backward compatibility, allow connections without token
        // but with clientId for location tracking
        const clientId = socket.handshake.query.id;
        if (clientId) {
          socket.clientId = clientId;
          return next();
        }
        return next(new Error('Authentication error: Token not provided'));
      }
      
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Get user from database
      const user = await User.findById(decoded.id).select('-password');
      
      if (!user) {
        return next(new Error('Authentication error: User not found'));
      }
      
      // Attach user to socket
      socket.user = user;
      next();
    } catch (error) {
      console.error('Socket authentication error:', error);
      next(new Error('Authentication error: Invalid token'));
    }
  });

  // Connection handler
  io.on('connection', (socket) => {
    // Handle authenticated users
    if (socket.user) {
      console.log(`Socket connected: ${socket.id} (User: ${socket.user.username})`);
      
      // Store connection
      activeConnections.set(socket.id, {
        socket,
        userId: socket.user._id,
        isAdmin: socket.user.role === 'admin'
      });
      
      // Store driver connections separately for route updates
      if (socket.user.role === 'driver') {
        // Find driver ID from user ID
        Driver.findOne({ userId: socket.user._id }).then(driver => {
          if (driver) {
            driverConnections.set(driver._id.toString(), socket);
            console.log(`Driver connected: ${driver._id} (Socket: ${socket.id})`);
            
            // Subscribe to route updates
            socket.on('driver:subscribe_routes', () => {
              console.log(`Driver ${driver._id} subscribed to route updates`);
              socket.join(`driver:${driver._id}:routes`);
            });
          }
        }).catch(err => {
          console.error('Error finding driver:', err);
        });
      }
      
      // General route subscription for all users
      socket.on('subscribe_routes', () => {
        console.log(`User ${socket.user.username} (${socket.user.role}) subscribed to route updates`);
        socket.join('routes:updates');
      });
      
      // Admin subscription
      socket.on('admin:subscribe', () => {
        if (socket.user.role === 'admin') {
          adminConnections.add(socket.id);
          console.log(`Admin subscribed to events: ${socket.id}`);
        } else {
          console.warn(`Non-admin tried to subscribe to admin events: ${socket.id}`);
        }
      });
      
      socket.on('admin:unsubscribe', () => {
        adminConnections.delete(socket.id);
        console.log(`Admin unsubscribed from events: ${socket.id}`);
      });
      
      // Handle driver replies to admin messages
      socket.on('driver_reply', async (data, callback) => {
        try {
          console.log('Received driver reply:', data);
          
          // Validate data
          if (!data || !data.message || !data.data || !data.data.inReplyTo) {
            callback({ success: false, message: 'Invalid reply data' });
            return;
          }
          
          // Create notification for admin
          const notification = {
            title: data.title || `Reply from ${socket.user.username}`,
            message: data.message,
            type: 'info',
            category: 'reply',
            userId: 'admin', // Send to all admins
            data: {
              ...data.data,
              fromDriver: true,
              fromUserId: socket.user._id,
              fromUsername: socket.user.username,
              timestamp: new Date().toISOString()
            }
          };
          
          // Emit to all admins
          emitToAdmins('admin_notification', notification);
          
          // Send success response
          callback({ success: true, message: 'Reply sent to admin' });
        } catch (error) {
          console.error('Error handling driver reply:', error);
          callback({ success: false, message: 'Error processing reply' });
        }
      });
      
      // Handle passenger replies to admin messages
      socket.on('passenger_reply', async (data, callback) => {
        try {
          console.log('Received passenger reply:', data);
          
          // Validate data
          if (!data || !data.message || !data.data || !data.data.inReplyTo) {
            callback({ success: false, message: 'Invalid reply data' });
            return;
          }
          
          // Create notification for admin
          const notification = {
            title: data.title || `Reply from ${socket.user.username}`,
            message: data.message,
            type: 'info',
            category: 'reply',
            userId: 'admin', // Send to all admins
            data: {
              ...data.data,
              fromPassenger: true,
              fromUserId: socket.user._id,
              fromUsername: socket.user.username,
              timestamp: new Date().toISOString()
            }
          };
          
          // Emit to all admins
          emitToAdmins('admin_notification', notification);
          
          // Send success response
          callback({ success: true, message: 'Reply sent to admin' });
        } catch (error) {
          console.error('Error handling passenger reply:', error);
          callback({ success: false, message: 'Error processing reply' });
        }
      });
    } 
    // Handle location tracking clients (migrated from WebSocket)
    else if (socket.clientId) {
      console.log(`Client connected with ID: ${socket.clientId}`);
      
      // Store client connection
      clientConnections.set(socket.clientId, socket);
      
      // Send welcome message
      socket.emit('connection', {
        message: 'Connected to PARAda Socket.io Server',
        clientId: socket.clientId
      });
      
      // Handle location updates
      socket.on('location', (data) => {
        handleLocationUpdate(socket.clientId, data);
      });
      
      // Handle chat messages
      socket.on('chat', (data) => {
        handleChatMessage(socket.clientId, data);
      });
      
      // General route subscription for anonymous clients
      socket.on('subscribe_routes', () => {
        console.log(`Client ${socket.clientId} subscribed to route updates`);
        socket.join('routes:updates');
      });
    }
    
    // Disconnect handler
    socket.on('disconnect', () => {
      if (socket.user) {
        console.log(`Socket disconnected: ${socket.id} (User: ${socket.user.username})`);
        activeConnections.delete(socket.id);
        adminConnections.delete(socket.id);
      } else if (socket.clientId) {
        console.log(`Client disconnected: ${socket.clientId}`);
        clientConnections.delete(socket.clientId);
      }
    });
  });

  console.log('Socket.io server initialized');
  return io;
};

/**
 * Handle location update from driver or passenger
 * @param {string} clientId - Client ID
 * @param {Object} data - Location data
 */
async function handleLocationUpdate(clientId, data) {
  try {
    console.log(`Location update from ${clientId}:`, data);
    
    // Check if this is a driver update
    if (data.driverId) {
      const { driverId, location, rideId } = data;
      
      // Update driver location in database
      await Driver.findByIdAndUpdate(driverId, {
        currentLocation: {
          latitude: location.latitude,
          longitude: location.longitude,
          lastUpdated: new Date()
        }
      });
      
      // If this is part of a ride, notify the passenger
      if (rideId) {
        const ride = await Ride.findById(rideId);
        if (ride) {
          // Store this ride as active
          activeRides.set(rideId.toString(), {
            ...ride.toObject(),
            driverLocation: location
          });
          
          // Find passenger socket and emit location update
          const passengerConnection = Array.from(activeConnections.values())
            .find(conn => conn.userId && conn.userId.toString() === ride.userId.toString());
          
          if (passengerConnection) {
            passengerConnection.socket.emit('driver_location', {
              driverId,
              location,
              rideId
            });
          }
          
          // Also emit to admin connections
          emitToAdmins('driver_location', {
            driverId,
            location,
            rideId
          });
        }
      }
    }
    // Check if this is a passenger update
    else if (data.passengerId) {
      const { passengerId, location, rideId } = data;
      
      // If this is part of a ride, notify the driver
      if (rideId) {
        const ride = await Ride.findById(rideId);
        if (ride && ride.driverId) {
          // Update the stored ride
          const activeRide = activeRides.get(rideId.toString());
          if (activeRide) {
            activeRides.set(rideId.toString(), {
              ...activeRide,
              passengerLocation: location
            });
          }
          
          // Find driver socket and emit location update
          const driverConnection = Array.from(activeConnections.values())
            .find(conn => conn.userId && ride.driverId && conn.userId.toString() === ride.driverId.toString());
          
          if (driverConnection) {
            driverConnection.socket.emit('passenger_location', {
              passengerId,
              location,
              rideId
            });
          }
          
          // Also emit to admin connections
          emitToAdmins('passenger_location', {
            passengerId,
            location,
            rideId
          });
        }
      }
    }
  } catch (error) {
    console.error('Error handling location update:', error);
  }
}

/**
 * Handle chat message
 * @param {string} senderId - Sender ID
 * @param {Object} data - Chat data
 */
function handleChatMessage(senderId, data) {
  // In a real implementation, we would:
  // 1. Store message in database
  // 2. Forward to recipient
  const { recipientId, message } = data;
  const recipientSocket = clientConnections.get(recipientId);
  
  if (recipientSocket) {
    recipientSocket.emit('chat', {
      senderId,
      message,
      timestamp: new Date().toISOString()
    });
    console.log(`Message sent from ${senderId} to ${recipientId}`);
  } else {
    console.log(`Recipient ${recipientId} not connected`);
  }
}

/**
 * Emit event to all connected clients
 * @param {string} event - Event name
 * @param {any} data - Event data
 */
const emitToAll = (event, data) => {
  for (const [socketId, connection] of activeConnections.entries()) {
    connection.socket.emit(event, data);
  }
};

/**
 * Emit event to a specific user
 * @param {string} userId - User ID
 * @param {string} event - Event name
 * @param {any} data - Event data
 */
const emitToUser = (userId, event, data) => {
  for (const [socketId, connection] of activeConnections.entries()) {
    if (connection.userId.toString() === userId.toString()) {
      connection.socket.emit(event, data);
    }
  }
};

/**
 * Emit event to all admin users
 * @param {string} event - Event name
 * @param {any} data - Event data
 */
const emitToAdmins = (event, data) => {
  for (const socketId of adminConnections) {
    const connection = activeConnections.get(socketId);
    if (connection) {
      connection.socket.emit(event, data);
    }
  }
};

/**
 * Send notification to specific client
 * @param {string} clientId - Client ID
 * @param {Object} notification - Notification data
 */
const sendNotification = (clientId, notification) => {
  const socket = clientConnections.get(clientId);
  
  if (socket) {
    socket.emit('notification', {
      ...notification,
      timestamp: new Date().toISOString()
    });
    return true;
  }
  
  return false;
};

/**
 * Broadcast message to all clients or filtered clients
 * @param {Object} message - Message to broadcast
 * @param {Function} filter - Optional function to filter recipients
 */
const broadcast = (message) => {
  clientConnections.forEach((socket, clientId) => {
    socket.emit('broadcast', message);
  });
};

/**
 * Send message to a specific user (migrated from WebSocket service)
 * @param {string} userId - User ID
 * @param {Object} data - Message data
 */
const sendToUser = (userId, data) => {
  emitToUser(userId, 'message', data);
};

/**
 * Emit driver location update to appropriate clients
 * @param {string} driverId - Driver ID
 * @param {Object} location - Location coordinates
 * @param {string} rideId - Optional ride ID
 */
const emitDriverLocation = async (driverId, location, rideId = null) => {
  try {
    const payload = {
      driverId,
      location,
      timestamp: new Date().toISOString()
    };
    
    if (rideId) {
      payload.rideId = rideId;
      
      // If this is part of a ride, notify the passenger
      const ride = await Ride.findById(rideId);
      if (ride) {
        // Find passenger socket and emit location update
        const passengerConnection = Array.from(activeConnections.values())
          .find(conn => conn.userId && conn.userId.toString() === ride.userId.toString());
        
        if (passengerConnection) {
          passengerConnection.socket.emit('driver_location', payload);
        }
        
        // Update active ride record
        activeRides.set(rideId.toString(), {
          ...(activeRides.get(rideId.toString()) || {}),
          driverLocation: location
        });
      }
    }
    
    // Also emit to admin connections
    emitToAdmins('driver_location', payload);
    
    return true;
  } catch (error) {
    console.error('Error emitting driver location:', error);
    return false;
  }
};

/**
 * Emit route updates to drivers and passengers
 * @param {string} driverId - Driver ID (optional, if null will send to all drivers)
 * @param {Array} routes - Updated routes data
 * @returns {boolean} - Success status
 */
const emitRouteUpdates = async (driverId = null, routes) => {
  try {
    const payload = {
      routes,
      timestamp: new Date().toISOString()
    };
    
    if (driverId) {
      // Send to specific driver
      const driverSocket = driverConnections.get(driverId.toString());
      if (driverSocket) {
        driverSocket.emit('route_updates', payload);
        console.log(`Emitted route updates to driver ${driverId}`);
        return true;
      } else {
        // Try to find the driver in active connections
        const driverConnection = Array.from(activeConnections.values())
          .find(conn => {
            if (!conn.userId) return false;
            return Driver.findOne({ userId: conn.userId })
              .then(driver => driver && driver._id.toString() === driverId.toString())
              .catch(() => false);
          });
          
        if (driverConnection) {
          driverConnection.socket.emit('route_updates', payload);
          console.log(`Emitted route updates to driver ${driverId} via user connection`);
          return true;
        }
        
        console.log(`Driver ${driverId} not connected, couldn't send route updates`);
        return false;
      }
    } else {
      // Broadcast to all drivers
      const driversWithSockets = Array.from(driverConnections.keys());
      console.log(`Broadcasting route updates to ${driversWithSockets.length} drivers`);
      
      driversWithSockets.forEach(driverId => {
        const socket = driverConnections.get(driverId);
        if (socket) {
          socket.emit('route_updates', payload);
        }
      });
      
      // Also broadcast to all clients subscribed to route updates
      console.log('Broadcasting route updates to all subscribed clients');
      io.to('routes:updates').emit('route_updates', payload);
      
      return true;
    }
  } catch (error) {
    console.error('Error emitting route updates:', error);
    return false;
  }
};

module.exports = {
  initializeSocketServer,
  emitToAll,
  emitToUser,
  emitToAdmins,
  sendNotification,
  broadcast,
  sendToUser,
  emitDriverLocation,
  emitRouteUpdates
}; 