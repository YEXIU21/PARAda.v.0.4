/**
 * Test script for subscription API endpoints
 * Run with: node backend/scripts/test-subscription-api.js
 */
const axios = require('axios');
const mongoose = require('mongoose');
require('dotenv').config();

// MongoDB connection string
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://angelfreitzd:angelfreitzdparada2025@parada.5bz6m2a.mongodb.net/parada?retryWrites=true&w=majority&appName=PARAda';

// API URL
const API_URL = 'http://localhost:5000';

// Test user credentials
const TEST_USER = {
  email: 'admin@parada.com',
  password: 'admin123'
};

// Test functions
async function testGetPlans() {
  try {
    console.log('\n=== Testing GET /api/subscriptions/plans ===');
    const response = await axios.get(`${API_URL}/api/subscriptions/plans`);
    console.log('Status:', response.status);
    console.log('Plans found:', response.data.plans.length);
    return true;
  } catch (error) {
    console.error('Error testing plans endpoint:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
    return false;
  }
}

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
    console.log('\n=== Logging in ===');
    console.log('Using credentials:', TEST_USER.email);
    const response = await axios.post(`${API_URL}/api/auth/login`, TEST_USER);
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

async function testDatabaseConnection() {
  try {
    console.log('\n=== Testing MongoDB Connection ===');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');
    
    // Get database name
    const dbName = mongoose.connection.db.databaseName;
    console.log('Database name:', dbName);
    
    // List collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('Collections:', collections.map(c => c.name).join(', '));
    
    await mongoose.disconnect();
    return true;
  } catch (error) {
    console.error('Database connection error:', error.message);
    return false;
  }
}

// Run tests
async function runTests() {
  console.log('=== Starting API Tests ===');
  
  // Test database connection
  await testDatabaseConnection();
  
  // Test plans endpoint (public)
  const plansResult = await testGetPlans();
  
  // Login and test authenticated endpoints
  const token = await login();
  if (token) {
    await testUserSubscription(token);
  } else {
    console.error('Cannot test authenticated endpoints without token');
  }
  
  console.log('\n=== Tests Completed ===');
}

runTests().catch(console.error); 