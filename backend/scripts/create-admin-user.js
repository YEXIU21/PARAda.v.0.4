/**
 * Script to create an admin user in the database
 * Run with: node backend/scripts/create-admin-user.js
 */
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// MongoDB connection string
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://angelfreitzd:angelfreitzdparada2025@parada.5bz6m2a.mongodb.net/parada?retryWrites=true&w=majority&appName=PARAda';

// Admin user details
const ADMIN_USER = {
  username: 'admin',
  email: 'admin@parada.com',
  password: 'admin123',
  role: 'admin',
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

// Create admin user
async function createAdminUser() {
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
    
    // Check if admin user already exists
    const existingAdmin = await User.findOne({ email: ADMIN_USER.email });
    if (existingAdmin) {
      console.log('Admin user already exists');
      return existingAdmin;
    }
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(ADMIN_USER.password, salt);
    
    // Create new admin user
    const newAdmin = new User({
      username: ADMIN_USER.username,
      email: ADMIN_USER.email,
      password: hashedPassword,
      role: ADMIN_USER.role,
      isEmailVerified: ADMIN_USER.isEmailVerified,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    // Save admin user
    const savedAdmin = await newAdmin.save();
    console.log('Admin user created successfully');
    console.log(`Username: ${ADMIN_USER.username}`);
    console.log(`Email: ${ADMIN_USER.email}`);
    console.log(`Password: ${ADMIN_USER.password}`);
    
    return savedAdmin;
  } catch (error) {
    console.error('Error creating admin user:', error.message);
    throw error;
  }
}

// Main function
async function main() {
  try {
    await connectDB();
    await createAdminUser();
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('MongoDB disconnected');
  }
}

// Run script
main(); 