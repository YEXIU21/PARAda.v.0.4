/**
 * Script to verify a subscription
 * This script will:
 * 1. Find a subscription by ID
 * 2. Mark it as verified
 * 3. Update the user's subscription status
 * 
 * Run with: node scripts/verify-subscription.js <subscriptionId>
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/user.model');
const Subscription = require('../models/subscription.model');

async function main() {
  try {
    // Get subscription ID from command line arguments
    const subscriptionId = process.argv[2];
    if (!subscriptionId) {
      console.error('Error: Subscription ID is required');
      console.log('Usage: node scripts/verify-subscription.js <subscriptionId>');
      process.exit(1);
    }
    
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    // Find the subscription
    const subscription = await Subscription.findById(subscriptionId);
    if (!subscription) {
      console.error(`Error: Subscription not found with ID ${subscriptionId}`);
      process.exit(1);
    }
    
    console.log(`Found subscription: ${subscription._id}`);
    console.log(`User ID: ${subscription.userId}`);
    console.log(`Plan: ${subscription.planId}`);
    console.log(`Type: ${subscription.type}`);
    console.log(`Status: ${subscription.verification.status}`);
    console.log(`Verified: ${subscription.verification.verified}`);
    
    // Find the user
    const user = await User.findById(subscription.userId);
    if (!user) {
      console.error(`Error: User not found with ID ${subscription.userId}`);
      process.exit(1);
    }
    
    console.log(`\nUser: ${user.username} (${user.email})`);
    
    // Update subscription
    subscription.verification.verified = true;
    subscription.verification.status = 'approved';
    subscription.verification.verificationDate = new Date();
    subscription.isActive = true;
    
    await subscription.save();
    console.log('\nSubscription updated:');
    console.log(`Status: ${subscription.verification.status}`);
    console.log(`Verified: ${subscription.verification.verified}`);
    console.log(`Active: ${subscription.isActive}`);
    
    // Update user
    await User.findByIdAndUpdate(user._id, {
      'subscription.type': subscription.type,
      'subscription.plan': subscription.planId,
      'subscription.verified': true,
      'subscription.expiryDate': subscription.expiryDate,
      'subscription.referenceNumber': subscription.paymentDetails.referenceNumber
    });
    
    console.log('\nUser record updated with subscription data');
    
    // Disconnect from database
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
    console.log('\nSubscription successfully verified!');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main(); 