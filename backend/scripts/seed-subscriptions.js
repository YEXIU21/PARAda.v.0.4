/**
 * Seed script for creating test subscriptions in MongoDB
 * 
 * Usage:
 * node scripts/seed-subscriptions.js
 */
require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const User = require('../models/user.model');
const Subscription = require('../models/subscription.model');
const connectDB = require('../config/db.config');

// Sample subscription plans (matching what's in the controller)
const subscriptionPlans = [
  {
    id: 'basic',
    name: 'Basic',
    price: 99,
    duration: 30 // days
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 199,
    duration: 30 // days
  },
  {
    id: 'annual',
    name: 'Annual',
    price: 999,
    duration: 365 // days
  },
  {
    id: 'student',
    name: 'Student',
    price: 49,
    duration: 30 // days
  }
];

// Helper function to get random date in the past (1-30 days ago)
const getRandomPastDate = (maxDays = 30) => {
  const date = new Date();
  const daysAgo = Math.floor(Math.random() * maxDays) + 1;
  date.setDate(date.getDate() - daysAgo);
  return date;
};

// Helper function to get random date in the future (1-30 days from now)
const getRandomFutureDate = (minDays = 1, maxDays = 60) => {
  const date = new Date();
  const daysAhead = Math.floor(Math.random() * (maxDays - minDays + 1)) + minDays;
  date.setDate(date.getDate() + daysAhead);
  return date;
};

// Generate a random GCash reference number
const generateReferenceNumber = () => {
  const prefix = 'GCASH';
  const timestamp = Date.now().toString().substr(-6);
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `${prefix}${timestamp}${random}`;
};

/**
 * Seed subscriptions in the database
 */
async function seedSubscriptions() {
  console.log('Starting subscription seeding process...');
  
  try {
    // Connect to database directly
    console.log('Connecting to MongoDB...');
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://angelfreitzd:angelfreitzdparada2025@parada.5bz6m2a.mongodb.net/parada?retryWrites=true&w=majority&appName=PARAda';
    console.log('Using MongoDB URI:', MONGODB_URI);
    
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log('Connected to MongoDB successfully!');
    console.log('Database:', mongoose.connection.db.databaseName);
    
    // Clear existing data
    console.log('Clearing existing subscriptions...');
    const deletedSubscriptions = await Subscription.deleteMany({});
    console.log(`Cleared ${deletedSubscriptions.deletedCount} existing subscriptions`);
    
    // Get users from database
    const users = await User.find({});
    
    if (users.length === 0) {
      console.error('No users found in the database. Run seed-users.js first.');
      process.exit(1);
    }
    
    console.log(`Found ${users.length} users for creating subscriptions`);
    
    // Create subscriptions for each user
    const subscriptions = [];
    
    for (const user of users) {
      // Pick a random plan for this user
      const randomPlanIndex = Math.floor(Math.random() * subscriptionPlans.length);
      const plan = subscriptionPlans[randomPlanIndex];
      
      // Active subscription for admin (always verified)
      if (user.role === 'admin') {
        const startDate = getRandomPastDate(15);
        const expiryDate = new Date(startDate);
        expiryDate.setDate(startDate.getDate() + plan.duration);
        
        subscriptions.push({
          userId: user._id,
          planId: plan.id,
          type: plan.name,
          startDate: startDate,
          expiryDate: expiryDate,
          paymentDetails: {
            amount: plan.price,
            referenceNumber: generateReferenceNumber(),
            paymentDate: startDate,
            paymentMethod: 'gcash',
            studentDiscount: {
              applied: user.accountType === 'student',
              percentage: user.accountType === 'student' ? 20 : 0
            }
          },
          isActive: true,
          autoRenew: false,
          verification: {
            verified: true,
            status: 'approved',
            verificationDate: new Date(startDate.getTime() + 1000 * 60 * 60), // 1 hour after start
            verifiedBy: user._id // Self-verified as admin
          }
        });
      }
      
      // Active subscription for regular users (50% chance)
      else if (Math.random() > 0.5) {
        const startDate = getRandomPastDate(15);
        const expiryDate = new Date(startDate);
        expiryDate.setDate(startDate.getDate() + plan.duration);
        
        subscriptions.push({
          userId: user._id,
          planId: plan.id,
          type: plan.name,
          startDate: startDate,
          expiryDate: expiryDate,
          paymentDetails: {
            amount: plan.price,
            referenceNumber: generateReferenceNumber(),
            paymentDate: startDate,
            paymentMethod: 'gcash',
            studentDiscount: {
              applied: user.accountType === 'student',
              percentage: user.accountType === 'student' ? 20 : 0
            }
          },
          isActive: true,
          autoRenew: Math.random() > 0.7, // 30% chance of auto-renew
          verification: {
            verified: true,
            status: 'approved',
            verificationDate: new Date(startDate.getTime() + 1000 * 60 * 60 * 2), // 2 hours after start
            verifiedBy: users.find(u => u.role === 'admin')._id // Verified by admin
          }
        });
      }
      
      // Add a pending subscription (25% chance)
      if (Math.random() > 0.75 && user.role !== 'admin') {
        const startDate = new Date();
        const expiryDate = new Date(startDate);
        expiryDate.setDate(startDate.getDate() + plan.duration);
        
        subscriptions.push({
          userId: user._id,
          planId: plan.id,
          type: plan.name,
          startDate: startDate,
          expiryDate: expiryDate,
          paymentDetails: {
            amount: plan.price,
            referenceNumber: generateReferenceNumber(),
            paymentDate: startDate,
            paymentMethod: 'gcash',
            studentDiscount: {
              applied: user.accountType === 'student',
              percentage: user.accountType === 'student' ? 20 : 0
            }
          },
          isActive: false,
          autoRenew: Math.random() > 0.7, // 30% chance of auto-renew
          verification: {
            verified: false,
            status: 'pending',
            verificationDate: null,
            verifiedBy: null
          }
        });
      }
      
      // Add an expired subscription (25% chance)
      if (Math.random() > 0.75 && user.role !== 'admin') {
        const startDate = getRandomPastDate(60);
        const expiryDate = new Date(startDate);
        expiryDate.setDate(startDate.getDate() + plan.duration);
        // Make sure it's expired
        if (expiryDate > new Date()) {
          expiryDate.setDate(new Date().getDate() - Math.floor(Math.random() * 10) - 1);
        }
        
        subscriptions.push({
          userId: user._id,
          planId: plan.id,
          type: plan.name,
          startDate: startDate,
          expiryDate: expiryDate,
          paymentDetails: {
            amount: plan.price,
            referenceNumber: generateReferenceNumber(),
            paymentDate: startDate,
            paymentMethod: 'gcash',
            studentDiscount: {
              applied: user.accountType === 'student',
              percentage: user.accountType === 'student' ? 20 : 0
            }
          },
          isActive: false,
          autoRenew: false,
          verification: {
            verified: true,
            status: 'approved',
            verificationDate: new Date(startDate.getTime() + 1000 * 60 * 60 * 2),
            verifiedBy: users.find(u => u.role === 'admin')._id
          }
        });
      }
    }
    
    // Save all subscriptions
    console.log(`Creating ${subscriptions.length} subscriptions...`);
    await Subscription.insertMany(subscriptions);
    
    // Update user subscription fields for active subscriptions
    console.log('Updating user subscription fields...');
    const activeSubscriptions = subscriptions.filter(sub => 
      sub.isActive && sub.verification.verified && new Date(sub.expiryDate) > new Date()
    );
    
    for (const subscription of activeSubscriptions) {
      await User.findByIdAndUpdate(subscription.userId, {
        'subscription.type': subscription.type,
        'subscription.plan': subscription.planId,
        'subscription.verified': true,
        'subscription.expiryDate': subscription.expiryDate,
        'subscription.referenceNumber': subscription.paymentDetails.referenceNumber
      });
      console.log(`Updated subscription for user ${subscription.userId}`);
    }
    
    console.log('\n✅✅✅ Subscription seeding completed successfully! ✅✅✅');
    
    // Close the connection
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
    
    process.exit(0);
  } catch (error) {
    console.error('❌❌❌ Error seeding subscriptions:', error);
    
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
console.log('=== PARAda Subscription Database Seeder ===');
seedSubscriptions(); 