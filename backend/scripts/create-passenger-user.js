/**
 * Script to create a passenger user in the database
 * Run with: node backend/scripts/create-passenger-user.js
 */
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// MongoDB connection string
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://angelfreitzd:angelfreitzdparada2025@parada.5bz6m2a.mongodb.net/parada?retryWrites=true&w=majority&appName=PARAda';

// Passenger user details
const PASSENGER_USER = {
  username: 'passenger',
  email: 'passenger@parada.com',
  password: 'passenger123',
  role: 'passenger',
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

// Create passenger user
async function createPassengerUser() {
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
    
    // Check if passenger user already exists
    const existingUser = await User.findOne({ email: PASSENGER_USER.email });
    if (existingUser) {
      console.log('Passenger user already exists');
      return existingUser;
    }
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(PASSENGER_USER.password, salt);
    
    // Create new passenger user
    const newUser = new User({
      username: PASSENGER_USER.username,
      email: PASSENGER_USER.email,
      password: hashedPassword,
      role: PASSENGER_USER.role,
      isEmailVerified: PASSENGER_USER.isEmailVerified,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    // Save passenger user
    const savedUser = await newUser.save();
    console.log('Passenger user created successfully');
    console.log(`Username: ${PASSENGER_USER.username}`);
    console.log(`Email: ${PASSENGER_USER.email}`);
    console.log(`Password: ${PASSENGER_USER.password}`);
    
    return savedUser;
  } catch (error) {
    console.error('Error creating passenger user:', error.message);
    throw error;
  }
}

// Main function
async function main() {
  try {
    await connectDB();
    await createPassengerUser();
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('MongoDB disconnected');
  }
}

// Run script
main(); 