/**
 * Authentication configuration
 */
module.exports = {
  // JWT secret key
  secret: process.env.JWT_SECRET || 'parada-secret-key',
  
  // JWT token expiration time
  jwtExpiration: process.env.JWT_EXPIRATION || '7d',
  
  // Password hashing rounds - increase for production
  saltRounds: process.env.NODE_ENV === 'production' ? 12 : 10,

  // Cookie settings for web version
  cookie: {
    // Only send cookies over HTTPS in production
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'strict'
  }
}; 