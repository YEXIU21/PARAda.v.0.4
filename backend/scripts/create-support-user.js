/**
 * Script to create a support user in the database
 * Run with: node backend/scripts/create-support-user.js
 */
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// MongoDB connection string
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://angelfreitzd:angelfreitzdparada2025@parada.5bz6m2a.mongodb.net/parada?retryWrites=true&w=majority&appName=PARAda';

// Support user details
const SUPPORT_USER = {
  username: 'support',
  email: 'support@parada.com',
  password: 'support123',
  role: 'support',
  isEmailVerified: true
};

// Connect to MongoDB
async function connectDB() {
  try {
    const conn = await mongoose.connect(MONGODB_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    console.log(`Database name: ${conn.connection.db.databaseName}`);
    return conn;
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    process.exit(1);
  }
}

// Create support user
async function createSupportUser() {
  try {
    // Check if User model is defined
    let User;
    try {
      User = mongoose.model('User');
    } catch (error) {
      // If model is not defined, define it
      const userSchema = new mongoose.Schema({
        username: String,
        email: String,
        password: String,
        role: String,
        isEmailVerified: Boolean,
        createdAt: Date,
        updatedAt: Date
      });
      User = mongoose.model('User', userSchema);
    }
    
    // Check if support user already exists
    const existingSupport = await User.findOne({ email: SUPPORT_USER.email });
    if (existingSupport) {
      console.log('Support user already exists');
      return existingSupport;
    }
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(SUPPORT_USER.password, salt);
    
    // Create new support user
    const newSupport = new User({
      username: SUPPORT_USER.username,
      email: SUPPORT_USER.email,
      password: hashedPassword,
      role: SUPPORT_USER.role,
      isEmailVerified: SUPPORT_USER.isEmailVerified,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    // Save support user
    const savedSupport = await newSupport.save();
    console.log('Support user created successfully');
    console.log(`Username: ${SUPPORT_USER.username}`);
    console.log(`Email: ${SUPPORT_USER.email}`);
    console.log(`Password: ${SUPPORT_USER.password}`);
    
    return savedSupport;
  } catch (error) {
    console.error('Error creating support user:', error.message);
    throw error;
  }
}

// Main function
async function main() {
  try {
    await connectDB();
    await createSupportUser();
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('MongoDB disconnected');
  }
}

// Run script
main(); 