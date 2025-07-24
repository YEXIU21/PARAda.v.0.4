#!/usr/bin/env node

/**
 * Script to fix npm vulnerabilities during deployment
 * This script will run npm audit fix to address vulnerabilities
 */
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('Starting vulnerability fix script...');

try {
  // Get the backend directory path
  const backendDir = path.resolve(__dirname, '..');
  console.log(`Backend directory: ${backendDir}`);
  
  // Check if we're in the right directory
  if (!fs.existsSync(path.join(backendDir, 'package.json'))) {
    console.error('Error: package.json not found in backend directory');
    process.exit(1);
  }
  
  // Run npm audit fix
  console.log('Running npm audit fix...');
  execSync('npm audit fix --force', { 
    cwd: backendDir, 
    stdio: 'inherit' 
  });
  
  console.log('Vulnerability fixes applied successfully');
} catch (error) {
  console.error(`Error fixing vulnerabilities: ${error.message}`);
  process.exit(1);
} 