/**
 * CORS Configuration
 * Sets up Cross-Origin Resource Sharing for the API
 */

module.exports = {
  origin: [
    // Local development
    'http://localhost:3000', 
    'http://localhost:5000',
    'http://localhost:5173',
    'http://localhost:19006',
    
    // Production
    'https://parada-api.vercel.app',
    'https://paradacebuv1.vercel.app',
    'https://paradacebubackendv1.vercel.app',
    
    // Render.com deployment
    'https://paradabackend.onrender.com'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Origin', 
    'X-Requested-With', 
    'Content-Type', 
    'Accept', 
    'Authorization', 
    'x-access-token'
  ],
  credentials: true,
  maxAge: 86400 // 24 hours
}; 