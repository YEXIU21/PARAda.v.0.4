/**
 * Main server entry point for PARAda backend
 */
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
const http = require('http');
const rateLimit = require('express-rate-limit');

// Import configuration
const connectDB = require('./config/db.config');

// Import routes
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const driverRoutes = require('./routes/driver.routes');
const routeRoutes = require('./routes/route.routes');
const rideRoutes = require('./routes/ride.routes');
const subscriptionRoutes = require('./routes/subscription.routes');
const notificationRoutes = require('./routes/notification.routes');
const messageRoutes = require('./routes/message.routes');
const adminRoutes = require('./routes/admin.routes');
const mongodbRoutes = require('./routes/mongodb.routes');

// Import socket service
const socketService = require('./services/socket.service');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Create HTTP server
const server = http.createServer(app);

// Check if we're in a serverless environment
const isServerless = process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_VERSION;

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply middleware
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Get frontend URL from environment variable
    const frontendUrl = process.env.FRONTEND_URL;
    
    // List of allowed origins
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:5173',
      'http://localhost:8080',
      'http://localhost:19006', // Expo web development server
      'https://parada-transport.vercel.app',
      'https://parada-app.netlify.app',
      'https://parada-web.netlify.app',
      'https://parada.app',
      'https://parada.vercel.app',
      'https://parada-web.vercel.app',
      'https://parada-v-0-1.vercel.app',
      'https://paradav1.vercel.app',
      'https://parada1.vercel.app',
      'https://paradabackendv1.vercel.app',
      'https://parada-frontend.vercel.app'
    ];
    
    // Add the frontend URL from environment variable if it exists
    if (frontendUrl && !allowedOrigins.includes(frontendUrl)) {
      allowedOrigins.push(frontendUrl);
    }
    
    // Check if origin is allowed or if we're in development mode
    if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV !== 'production') {
      callback(null, true);
    } else {
      // Check for Vercel preview deployments which have dynamic URLs
      if (origin && (
          origin.endsWith('.vercel.app') || 
          origin.includes('vercel-preview') || 
          origin.includes('parada')
        )
      ) {
        console.log('Allowing CORS for Vercel deployment:', origin);
        callback(null, true);
      } else {
        console.log('CORS blocked for origin:', origin);
        callback(new Error('Not allowed by CORS'));
      }
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'x-access-token', 'Origin', 'Accept']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));
app.use('/api', limiter);

// Set up routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/drivers', driverRoutes);
app.use('/api/routes', routeRoutes);
app.use('/api/rides', rideRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/mongodb', mongodbRoutes);

// Health check route
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Server is running' });
});

// Root route
app.get('/', (req, res) => {
  res.status(200).json({ message: 'Welcome to PARAda API' });
});

// Handle 404 routes
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Global error:', err);
  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error',
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// Connect to MongoDB
connectDB()
  .then(() => {
    // Only start the server if not in a serverless environment
    if (!isServerless) {
      // Start the server
      server.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
      });
      
      // Initialize Socket.io server
      const io = socketService.initializeSocketServer(server);
      console.log('Socket.io server initialized');
      
      // Make socket.io instance available globally
      global.io = io;
    } else {
      console.log('Running in serverless environment, skipping server.listen()');
    }
  })
  .catch(err => {
    console.error('Failed to connect to MongoDB:', err);
    if (!isServerless) {
      process.exit(1);
    }
  });

module.exports = server; // Export for testing purposes 