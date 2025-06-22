/**
 * Test script for passenger subscription API endpoints
 * Run with: node backend/scripts/test-passenger-subscription.js
 */
const axios = require('axios');
require('dotenv').config();

// API URL
const API_URL = 'http://localhost:5000';

// Passenger user credentials
const PASSENGER_USER = {
  email: 'passenger@parada.com',
  password: 'passenger123'
};

// Test functions
async function testUserSubscription(token) {
  try {
    console.log('\n=== Testing GET /api/subscriptions/me ===');
    const response = await axios.get(
      `${API_URL}/api/subscriptions/me`,
      {
        headers: { 'x-access-token': token }
      }
    );
    console.log('Status:', response.status);
    console.log('Subscription:', response.data.subscription);
    return true;
  } catch (error) {
    console.error('Error testing user subscription endpoint:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
    return false;
  }
}

async function login() {
  try {
    console.log('\n=== Logging in as passenger ===');
    console.log('Using credentials:', PASSENGER_USER.email);
    const response = await axios.post(`${API_URL}/api/auth/login`, PASSENGER_USER);
    console.log('Login successful');
    return response.data.accessToken;
  } catch (error) {
    console.error('Login failed:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
    return null;
  }
}

async function testUserProfile(token) {
  try {
    console.log('\n=== Testing GET /api/auth/me ===');
    const response = await axios.get(
      `${API_URL}/api/auth/me`,
      {
        headers: { 'x-access-token': token }
      }
    );
    console.log('Status:', response.status);
    console.log('User:', response.data.user);
    return true;
  } catch (error) {
    console.error('Error testing user profile endpoint:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
    return false;
  }
}

// Run tests
async function runTests() {
  console.log('=== Starting Passenger API Tests ===');
  
  // Login and test authenticated endpoints
  const token = await login();
  if (token) {
    await testUserProfile(token);
    await testUserSubscription(token);
  } else {
    console.error('Cannot test authenticated endpoints without token');
  }
  
  console.log('\n=== Tests Completed ===');
}

runTests().catch(console.error); 