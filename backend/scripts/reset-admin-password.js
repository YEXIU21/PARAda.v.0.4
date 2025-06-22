/**
 * Reset Admin Password Script
 * 
 * This script resets the admin account password to "admin123"
 */
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

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
  resetAdminPassword();
})
.catch(err => {
  console.error('Database connection error:', err);
  process.exit(1);
});

// Load the User model
const User = require('../models/user.model');

// Function to reset admin password
async function resetAdminPassword() {
  try {
    // Find admin user(s)
    const adminUsers = await User.find({ role: 'admin' });
    
    if (adminUsers.length === 0) {
      console.log('No admin users found. Creating admin user...');
      
      // Create admin user if none exists
      const hashedPassword = await bcrypt.hash('admin123', 10);
      const newAdmin = new User({
        username: 'admin',
        email: 'admin@parada.com',
        password: hashedPassword,
        role: 'admin',
        active: true
      });
      
      await newAdmin.save();
      console.log('Admin user created with username: admin@parada.com and password: admin123');
    } else {
      console.log(`Found ${adminUsers.length} admin users. Updating passwords...`);
      
      // Update each admin password
      const hashedPassword = await bcrypt.hash('admin123', 10);
      
      for (const admin of adminUsers) {
        admin.password = hashedPassword;
        await admin.save();
        console.log(`Updated password for admin: ${admin.email || admin.username}`);
      }
      
      console.log('All admin passwords have been reset to: admin123');
    }
    
    // Close connection
    mongoose.connection.close();
    console.log('Database connection closed');
    process.exit(0);
  } catch (error) {
    console.error('Error resetting admin password:', error);
    mongoose.connection.close();
    process.exit(1);
  }
} 