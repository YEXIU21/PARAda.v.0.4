/**
 * Script to create multiple support accounts in the database
 * 
 * This script creates three separate support accounts with different emails
 * but the same password for handling customer inquiries.
 * 
 * Usage:
 * node backend/scripts/create-multiple-support-accounts.js
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

// Support accounts details - all with the same password
const SUPPORT_ACCOUNTS = [
  {
    username: 'support',
    email: 'support@parada.com',
    password: 'Support@123!', // Same password for all support accounts
    role: 'support',
    isEmailVerified: true,
    isActive: true
  },
  {
    username: 'help',
    email: 'help@parada.com',
    password: 'Support@123!', // Same password for all support accounts
    role: 'support',
    isEmailVerified: true,
    isActive: true
  },
  {
    username: 'customerservice',
    email: 'customerservice@parada.com',
    password: 'Support@123!', // Same password for all support accounts
    role: 'support',
    isEmailVerified: true,
    isActive: true
  }
];

// Connect to MongoDB
mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => {
  console.log('Connected to MongoDB');
  createSupportAccounts();
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

// Function to create support accounts
async function createSupportAccounts() {
  try {
    const createdAccounts = [];
    
    for (const account of SUPPORT_ACCOUNTS) {
      // Check if account already exists
      const existingUser = await User.findOne({ 
        $or: [
          { email: account.email },
          { username: account.username }
        ]
      });

      if (existingUser) {
        console.log(`Support account already exists for ${account.email}:`);
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
        
        createdAccounts.push({
          id: existingUser._id,
          username: existingUser.username,
          email: existingUser.email
        });
        
        console.log('-----------------------------------');
        continue;
      }

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(account.password, salt);

      // Create new support user
      const newUser = new User({
        username: account.username,
        email: account.email,
        password: hashedPassword,
        role: account.role,
        isEmailVerified: account.isEmailVerified,
        isActive: account.isActive
      });

      // Save user to database
      const savedUser = await newUser.save();

      console.log(`Support account created successfully for ${account.email}:`);
      console.log(`ID: ${savedUser._id}`);
      console.log(`Username: ${savedUser.username}`);
      console.log(`Email: ${savedUser.email}`);
      console.log(`Role: ${savedUser.role}`);
      console.log('-----------------------------------');
      
      createdAccounts.push({
        id: savedUser._id,
        username: savedUser.username,
        email: savedUser.email
      });
    }
    
    console.log('\nSummary of Support Accounts:');
    createdAccounts.forEach(account => {
      console.log(`${account.email} (${account.username}): ${account.id}`);
    });
    
    console.log('\nIMPORTANT: You need to update the frontend/services/api/message.api.js file');
    console.log('with the IDs of these support accounts.');
    console.log('\nUpdate the SYSTEM_USERS object in message.api.js to map these email addresses');
    console.log('to their respective IDs instead of using a single SUPPORT_ID for all of them.');

    mongoose.disconnect();
  } catch (error) {
    console.error('Error creating support accounts:', error);
    mongoose.disconnect();
    process.exit(1);
  }
} 