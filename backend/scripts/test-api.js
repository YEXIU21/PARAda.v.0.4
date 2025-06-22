/**
 * Test API Script for PARAda Authentication
 * 
 * This script tests the authentication endpoints of the PARAda API
 */
require('dotenv').config();
const axios = require('axios');
const chalk = require('chalk');

// Use a hardcoded URL since we're testing locally
const API_URL = 'http://localhost:5000';

// Test user credentials
const testUser = {
  email: 'passenger@example.com',
  password: 'passenger123'
};

// Function to log with colors
const log = {
  info: (msg) => console.log(chalk.blue('ℹ️ INFO: ') + msg),
  success: (msg) => console.log(chalk.green('✅ SUCCESS: ') + msg),
  error: (msg) => console.log(chalk.red('❌ ERROR: ') + msg),
  warning: (msg) => console.log(chalk.yellow('⚠️ WARNING: ') + msg),
  result: (label, data) => {
    console.log(chalk.cyan(`\n📋 ${label}:`));
    console.log(JSON.stringify(data, null, 2));
    console.log();
  }
};

// Test the health endpoint
async function testHealth() {
  try {
    log.info('Testing health endpoint...');
    const response = await axios.get('http://localhost:5000/health');
    log.success('Health check successful');
    log.result('Health Response', response.data);
    return true;
  } catch (error) {
    log.error(`Health check failed: ${error.message}`);
    if (error.response) {
      log.result('Error Response', error.response.data);
    } else if (error.code === 'ECONNREFUSED') {
      log.error('Server is not running. Please start the server first.');
    }
    return false;
  }
}

// Test login endpoint
async function testLogin() {
  try {
    log.info('Testing login endpoint...');
    const response = await axios.post(`${API_URL}/auth/login`, testUser);
    log.success('Login successful');
    log.result('Login Response', {
      user: {
        id: response.data.user._id,
        username: response.data.user.username,
        email: response.data.user.email,
        role: response.data.user.role
      },
      token: response.data.accessToken ? '(Token received)' : '(No token)'
    });
    return response.data.accessToken;
  } catch (error) {
    log.error(`Login failed: ${error.message}`);
    if (error.response) {
      log.result('Error Response', error.response.data);
    }
    return null;
  }
}

// Test token verification
async function testVerifyToken(token) {
  if (!token) {
    log.warning('No token provided for verification test. Skipping.');
    return false;
  }

  try {
    log.info('Testing token verification endpoint...');
    const response = await axios.post(`${API_URL}/auth/verify`, { token });
    log.success('Token verification successful');
    log.result('Verification Response', {
      valid: response.data.valid,
      user: {
        id: response.data.user._id,
        username: response.data.user.username,
        email: response.data.user.email,
        role: response.data.user.role
      }
    });
    return true;
  } catch (error) {
    log.error(`Token verification failed: ${error.message}`);
    if (error.response) {
      log.result('Error Response', error.response.data);
    }
    return false;
  }
}

// Test user profile (protected route)
async function testUserProfile(token) {
  if (!token) {
    log.warning('No token provided for user profile test. Skipping.');
    return false;
  }

  try {
    log.info('Testing user profile endpoint (protected route)...');
    const response = await axios.get(`${API_URL}/auth/me`, {
      headers: {
        'x-access-token': token
      }
    });
    log.success('User profile retrieved successfully');
    log.result('User Profile Response', {
      id: response.data.user._id,
      username: response.data.user.username,
      email: response.data.user.email,
      role: response.data.user.role,
      accountType: response.data.user.accountType
    });
    return true;
  } catch (error) {
    log.error(`User profile retrieval failed: ${error.message}`);
    if (error.response) {
      log.result('Error Response', error.response.data);
    }
    return false;
  }
}

// Main test function
async function runTests() {
  console.log(chalk.bold('\n🚀 PARAda API Test Runner 🚀\n'));
  
  log.info(`API URL: ${API_URL}`);
  log.info(`Test User: ${testUser.email}\n`);
  
  // Test health endpoint
  const healthOk = await testHealth();
  
  if (!healthOk) {
    log.error('Aborting tests due to health check failure');
    return;
  }
  
  // Test login
  const token = await testLogin();
  
  if (!token) {
    log.error('Aborting tests due to login failure');
    return;
  }
  
  // Test token verification
  await testVerifyToken(token);
  
  // Test user profile
  await testUserProfile(token);
  
  console.log(chalk.bold('\n🏁 All tests completed 🏁\n'));
}

// Run the tests
runTests().catch(error => {
  log.error(`Unhandled error: ${error.message}`);
  process.exit(1);
}); 