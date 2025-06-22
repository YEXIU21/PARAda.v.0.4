/**
 * Seed script for creating test users in MongoDB
 * 
 * Usage:
 * node scripts/seed-users.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/user.model');
const Driver = require('../models/driver.model');
const { saltRounds } = require('../config/auth.config');
const connectDB = require('../config/db.config');

// Test users data
const testUsers = [
  {
    username: 'admin',
    email: 'admin@parada.com',
    password: 'admin123',
    role: 'admin',
    accountType: 'regular',
    isEmailVerified: true
  },
  {
    username: 'driver',
    email: 'driver@parada.com',
    password: 'driver123',
    role: 'driver',
    accountType: 'regular',
    isEmailVerified: true,
    driverDetails: {
      routeNumber: 'R1',
      status: 'inactive',
      vehicleType: 'jeep',
      licensePlate: 'ABC-123',
      vehicleModel: 'Toyota Wigo',
      vehicleCapacity: 12
    }
  },
  {
    username: 'passenger',
    email: 'passenger@example.com',
    password: 'passenger123',
    role: 'passenger',
    accountType: 'regular',
    isEmailVerified: true
  },
  {
    username: 'student',
    email: 'student@school.edu',
    password: 'student123',
    role: 'passenger',
    accountType: 'student',
    studentId: 'ST123456',
    isEmailVerified: true
  }
];

/**
 * Seed users in the database
 */
async function seedUsers() {
  console.log('Starting user seeding process...');
  
  try {
    // Connect to database
    console.log('Connecting to MongoDB...');
    await connectDB();
    console.log('Connected to MongoDB successfully!');
    
    // Clear existing data
    console.log('Clearing existing users...');
    const deletedUsers = await User.deleteMany({});
    console.log(`Cleared ${deletedUsers.deletedCount} existing users`);
    
    console.log('Clearing existing drivers...');
    const deletedDrivers = await Driver.deleteMany({});
    console.log(`Cleared ${deletedDrivers.deletedCount} existing drivers`);
    
    // Create new users
    console.log('\nCreating test users:');
    for (const userData of testUsers) {
      console.log(`\nProcessing user: ${userData.username} (${userData.role})`);
      
      // Extract driver details if present
      const driverDetails = userData.driverDetails;
      delete userData.driverDetails;
      
      // Hash the password
      console.log('Hashing password...');
      const salt = await bcrypt.genSalt(saltRounds);
      const hashedPassword = await bcrypt.hash(userData.password, salt);
      
      // Create user
      console.log('Saving user to database...');
      const user = new User({
        ...userData,
        password: hashedPassword,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      const savedUser = await user.save();
      console.log(`✅ Created user: ${savedUser.username} (${savedUser.role}) with ID: ${savedUser._id}`);
      
      // Create driver profile if needed
      if (driverDetails) {
        console.log('Creating driver profile...');
        const driver = new Driver({
          userId: savedUser._id,
          vehicleType: driverDetails.vehicleType,
          licensePlate: driverDetails.licensePlate,
          vehicleModel: driverDetails.vehicleModel || '',
          vehicleCapacity: driverDetails.vehicleCapacity || 4,
          status: driverDetails.status || 'inactive',
          location: {
            type: 'Point',
            coordinates: [120.9842, 14.5995] // Manila coordinates as default
          },
          createdAt: new Date(),
          updatedAt: new Date()
        });
        
        const savedDriver = await driver.save();
        console.log(`✅ Created driver profile with ID: ${savedDriver._id}`);
      }
    }
    
    console.log('\n✅✅✅ Seeding completed successfully! ✅✅✅');
    
    // Close the connection
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
    
    process.exit(0);
  } catch (error) {
    console.error('❌❌❌ Error seeding users:', error);
    
    // Try to close the connection if it exists
    try {
      if (mongoose.connection) {
        await mongoose.connection.close();
        console.log('MongoDB connection closed after error');
      }
    } catch (err) {
      console.error('Error closing MongoDB connection:', err);
    }
    
    process.exit(1);
  }
}

// Run the seeding function
console.log('=== PARAda User Database Seeder ===');
seedUsers(); 