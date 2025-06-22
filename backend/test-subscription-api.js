/**
 * Test script to verify subscription API endpoints
 */
require('dotenv').config();
const axios = require('axios');

// Base URL for API
const API_URL = 'http://localhost:5000';

// Admin user credentials
const adminCredentials = {
  email: 'admin@parada.com',
  password: 'admin123'
};

// Test user credentials
const userCredentials = {
  email: 'passenger@example.com',
  password: 'passenger123'
};

// Sample subscription data
const subscriptionData = {
  planId: 'basic',
  paymentMethod: 'gcash',
  referenceNumber: `GC${Date.now().toString().substring(5)}`,
  autoRenew: false
};

// Helper for colored console output
const log = {
  info: msg => console.log('\x1b[36m%s\x1b[0m', `[INFO] ${msg}`),
  success: msg => console.log('\x1b[32m%s\x1b[0m', `[SUCCESS] ${msg}`),
  error: msg => console.log('\x1b[31m%s\x1b[0m', `[ERROR] ${msg}`),
  result: (label, data) => {
    console.log('\x1b[33m%s\x1b[0m', `\n[${label}]`);
    console.log(JSON.stringify(data, null, 2));
    console.log();
  }
};

// Login function
async function login(credentials) {
  try {
    log.info(`Logging in as ${credentials.email}...`);
    const response = await axios.post(`${API_URL}/api/auth/login`, credentials);
    log.success(`Login successful for ${credentials.email}`);
    return response.data.accessToken;
  } catch (error) {
    log.error(`Login failed: ${error.message}`);
    if (error.response) {
      log.result('Error Response', error.response.data);
    }
    throw error;
  }
}

// Get subscription plans
async function getSubscriptionPlans() {
  try {
    log.info('Getting subscription plans...');
    const response = await axios.get(`${API_URL}/api/subscriptions/plans`);
    log.success('Successfully retrieved subscription plans');
    log.result('Subscription Plans', response.data);
    return response.data;
  } catch (error) {
    log.error(`Failed to get subscription plans: ${error.message}`);
    if (error.response) {
      log.result('Error Response', error.response.data);
    }
    throw error;
  }
}

// Create subscription
async function createSubscription(token, data) {
  try {
    log.info('Creating subscription...');
    log.result('Subscription Data', data);
    
    const response = await axios.post(
      `${API_URL}/api/subscriptions`,
      data,
      {
        headers: { 'x-access-token': token }
      }
    );
    
    log.success('Successfully created subscription');
    log.result('Subscription Response', response.data);
    return response.data.subscription;
  } catch (error) {
    log.error(`Failed to create subscription: ${error.message}`);
    if (error.response) {
      log.result('Error Response', error.response.data);
    }
    throw error;
  }
}

// Get pending subscriptions (admin only)
async function getPendingSubscriptions(adminToken) {
  try {
    log.info('Getting pending subscriptions...');
    
    const response = await axios.get(
      `${API_URL}/api/subscriptions/pending`,
      {
        headers: { 'x-access-token': adminToken }
      }
    );
    
    log.success('Successfully retrieved pending subscriptions');
    log.result('Pending Subscriptions', response.data);
    return response.data.subscriptions;
  } catch (error) {
    log.error(`Failed to get pending subscriptions: ${error.message}`);
    if (error.response) {
      log.result('Error Response', error.response.data);
    }
    throw error;
  }
}

// Approve subscription (admin only)
async function approveSubscription(adminToken, subscriptionId) {
  try {
    log.info(`Approving subscription with ID: ${subscriptionId}...`);
    
    const response = await axios.post(
      `${API_URL}/api/subscriptions/verify`,
      {
        subscriptionId,
        approved: true
      },
      {
        headers: { 'x-access-token': adminToken }
      }
    );
    
    log.success('Successfully approved subscription');
    log.result('Approved Subscription', response.data);
    return response.data;
  } catch (error) {
    log.error(`Failed to approve subscription: ${error.message}`);
    if (error.response) {
      log.result('Error Response', error.response.data);
    }
    throw error;
  }
}

// Get user's active subscription
async function getUserSubscription(token) {
  try {
    log.info('Getting user subscription...');
    
    const response = await axios.get(
      `${API_URL}/api/subscriptions/me`,
      {
        headers: { 'x-access-token': token }
      }
    );
    
    log.success('Successfully retrieved user subscription');
    log.result('User Subscription', response.data);
    return response.data.subscription;
  } catch (error) {
    if (error.response && error.response.status === 404) {
      log.info('No active subscription found for user');
      return null;
    }
    
    log.error(`Failed to get user subscription: ${error.message}`);
    if (error.response) {
      log.result('Error Response', error.response.data);
    }
    throw error;
  }
}

// Main test function
async function runTest() {
  try {
    console.log('\n======== SUBSCRIPTION API TEST ========\n');
    
    // Get subscription plans (public endpoint)
    await getSubscriptionPlans();
    
    // Login as normal user
    const userToken = await login(userCredentials);
    
    // Check if user already has an active subscription
    const existingSubscription = await getUserSubscription(userToken);
    
    // Create a new subscription
    if (!existingSubscription) {
      const newSubscription = await createSubscription(userToken, subscriptionData);
      
      // Login as admin
      const adminToken = await login(adminCredentials);
      
      // Get pending subscriptions
      const pendingSubscriptions = await getPendingSubscriptions(adminToken);
      
      // Approve subscription if there are any pending
      if (pendingSubscriptions && pendingSubscriptions.length > 0) {
        await approveSubscription(adminToken, pendingSubscriptions[0]._id);
        
        // Verify user's subscription is now active
        await getUserSubscription(userToken);
      }
    }
    
    console.log('\n======== TEST COMPLETED SUCCESSFULLY ========\n');
  } catch (error) {
    console.error('\n======== TEST FAILED ========\n');
    console.error(error);
  }
}

// Run the test
runTest(); 