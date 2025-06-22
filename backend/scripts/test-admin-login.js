/**
 * Test Admin Login Script
 * 
 * This script tests logging in with the admin credentials directly
 */
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/user.model');
const jwt = require('jsonwebtoken');
const { secret, jwtExpiration } = require('../config/auth.config');

// Get database URI from environment variables
const dbURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/parada';

// Connect to the database
mongoose.connect(dbURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => {
  console.log('MongoDB Connected:', mongoose.connection.host);
  console.log('Database name:', mongoose.connection.name);
  testAdminLogin();
})
.catch(err => {
  console.error('Database connection error:', err);
  process.exit(1);
});

// Function to test admin login
async function testAdminLogin() {
  try {
    const email = 'admin@parada.com';
    const password = 'admin123';
    
    console.log(`Testing login with ${email} / ${password}`);
    
    // Find user by email
    const user = await User.findOne({ email });
    
    if (!user) {
      console.error('Admin user not found!');
      mongoose.connection.close();
      process.exit(1);
    }
    
    console.log('Found admin user:', {
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role
    });
    
    // Test password directly with bcrypt
    const isPasswordValid = await bcrypt.compare(password, user.password);
    console.log('Password valid with bcrypt.compare():', isPasswordValid);
    
    // Test password with model method
    const isPasswordValidMethod = await user.comparePassword(password);
    console.log('Password valid with user.comparePassword():', isPasswordValidMethod);
    
    if (isPasswordValid) {
      // Generate JWT token
      const token = jwt.sign(
        { id: user._id, role: user.role },
        secret,
        { expiresIn: jwtExpiration }
      );
      
      console.log('JWT token generated:', token);
      console.log('Login should work with these credentials');
    } else {
      console.log('Password is incorrect. Reset password might not have worked correctly.');
    }
    
    // Close connection
    mongoose.connection.close();
    console.log('Database connection closed');
    process.exit(0);
  } catch (error) {
    console.error('Error testing admin login:', error);
    mongoose.connection.close();
    process.exit(1);
  }
} 