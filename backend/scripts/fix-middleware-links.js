#!/usr/bin/env node

/**
 * Script to fix middleware links during deployment
 * This script creates a symlink from auth.middleware.js to auth.js in the middleware directory
 * to fix the "Cannot find module '../middleware/auth'" error
 */
const fs = require('fs');
const path = require('path');

console.log('Starting middleware links fix script...');

try {
  // Get the middleware directory path
  const middlewareDir = path.resolve(__dirname, '..', 'middleware');
  console.log(`Middleware directory: ${middlewareDir}`);
  
  // Check if the middleware directory exists
  if (!fs.existsSync(middlewareDir)) {
    console.error(`Error: Middleware directory not found at ${middlewareDir}`);
    process.exit(1);
  }
  
  // Check if auth.middleware.js exists
  const authMiddlewarePath = path.join(middlewareDir, 'auth.middleware.js');
  if (!fs.existsSync(authMiddlewarePath)) {
    console.error(`Error: auth.middleware.js not found at ${authMiddlewarePath}`);
    process.exit(1);
  }
  
  // Create a copy of auth.middleware.js as auth.js
  const authPath = path.join(middlewareDir, 'auth.js');
  fs.copyFileSync(authMiddlewarePath, authPath);
  console.log(`Created a copy of auth.middleware.js as auth.js`);
  
  console.log('Middleware links fixed successfully');
} catch (error) {
  console.error(`Error fixing middleware links: ${error.message}`);
  process.exit(1);
} 