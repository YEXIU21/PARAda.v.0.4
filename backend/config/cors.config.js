/**
 * CORS Configuration
 * Sets up Cross-Origin Resource Sharing for the API
 */

module.exports = {
  origin: ['http://localhost:3000', 'http://localhost:5000', 'https://parada-api.vercel.app'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
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