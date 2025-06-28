/**
 * Script to create a support account in the database
 * 
 * This script should be run by an administrator to create a dedicated
 * support account that can handle customer inquiries.
 * 
 * Usage:
 * node backend/scripts/create-support-account.js
 */

// Load environment variables from backend/.env
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

// MongoDB connection string
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('Error: MONGODB_URI environment variable is not defined');
  console.error('Make sure you have a .env file in the backend directory with MONGODB_URI defined');
  process.exit(1);
}

// Support account details
const SUPPORT_ACCOUNT = {
  username: 'support',
  email: 'support@parada.com',
  password: process.env.SUPPORT_PASSWORD || 'Support@123!', // Use env var if available
  role: 'support',
  isEmailVerified: true,
  isActive: true
};

// Connect to MongoDB
mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => {
  console.log('Connected to MongoDB');
  createSupportAccount();
})
.catch(err => {
  console.error('Failed to connect to MongoDB:', err);
  process.exit(1);
});

// Define User schema (simplified version of the actual schema)
const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['admin', 'driver', 'passenger', 'support'],
    default: 'passenger'
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Create User model
const User = mongoose.model('User', UserSchema);

// Function to create support account
async function createSupportAccount() {
  try {
    // Check if support account already exists
    const existingUser = await User.findOne({ 
      $or: [
        { email: SUPPORT_ACCOUNT.email },
        { username: SUPPORT_ACCOUNT.username }
      ]
    });

    if (existingUser) {
      console.log('Support account already exists:');
      console.log(`ID: ${existingUser._id}`);
      console.log(`Username: ${existingUser.username}`);
      console.log(`Email: ${existingUser.email}`);
      console.log(`Role: ${existingUser.role}`);
      
      // Update the existing account if needed
      if (existingUser.role !== 'support') {
        console.log('Updating role to support...');
        existingUser.role = 'support';
        await existingUser.save();
        console.log('Role updated successfully');
      }
      
      mongoose.disconnect();
      return;
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(SUPPORT_ACCOUNT.password, salt);

    // Create new support user
    const newUser = new User({
      username: SUPPORT_ACCOUNT.username,
      email: SUPPORT_ACCOUNT.email,
      password: hashedPassword,
      role: SUPPORT_ACCOUNT.role,
      isEmailVerified: SUPPORT_ACCOUNT.isEmailVerified,
      isActive: SUPPORT_ACCOUNT.isActive
    });

    // Save user to database
    const savedUser = await newUser.save();

    console.log('Support account created successfully:');
    console.log(`ID: ${savedUser._id}`);
    console.log(`Username: ${savedUser.username}`);
    console.log(`Email: ${savedUser.email}`);
    console.log(`Role: ${savedUser.role}`);
    
    // Important: Update the ID in frontend/services/api/message.api.js with this ID
    console.log('\nIMPORTANT: Update the support account ID in frontend/services/api/message.api.js with this ID');

    mongoose.disconnect();
  } catch (error) {
    console.error('Error creating support account:', error);
    mongoose.disconnect();
    process.exit(1);
  }
} 