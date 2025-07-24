/**
 * Re-export auth.middleware.js to fix the module not found error
 * This file is created to handle imports like require('../middleware/auth')
 */

// Re-export all exports from auth.middleware.js
module.exports = require('./auth.middleware'); 