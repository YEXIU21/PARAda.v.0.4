/**
 * Script to check all pending subscriptions
 * This script will:
 * 1. Find all subscriptions with "pending" status
 * 2. Check if the users have the subscription data in their user records
 * 3. Report any inconsistencies
 * 
 * Run with: node scripts/check-pending-subscriptions.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/user.model');
const Subscription = require('../models/subscription.model');

async function main() {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    // Find all pending subscriptions
    const pendingSubscriptions = await Subscription.find({
      'verification.status': 'pending',
      'verification.verified': false,
      cancelledAt: null
    });
    
    console.log(`Found ${pendingSubscriptions.length} pending subscriptions`);
    
    // Check each subscription and its associated user
    for (const subscription of pendingSubscriptions) {
      const user = await User.findById(subscription.userId);
      
      if (!user) {
        console.log(`ERROR: User not found for subscription ${subscription._id}`);
        continue;
      }
      
      console.log(`\nSubscription ID: ${subscription._id}`);
      console.log(`User: ${user.username} (${user.email})`);
      console.log(`Plan: ${subscription.planId}`);
      console.log(`Type: ${subscription.type}`);
      console.log(`Created: ${subscription.createdAt}`);
      console.log(`Reference: ${subscription.paymentDetails.referenceNumber}`);
      
      // Check if user has the subscription data
      if (!user.subscription || !user.subscription.plan) {
        console.log(`ISSUE: User record does not have subscription data`);
        
        // Ask if user record should be updated
        const readline = require('readline').createInterface({
          input: process.stdin,
          output: process.stdout
        });
        
        const answer = await new Promise(resolve => {
          readline.question('Update user record with subscription data? (y/n): ', resolve);
        });
        
        readline.close();
        
        if (answer.toLowerCase() === 'y') {
          // Update user record
          await User.findByIdAndUpdate(user._id, {
            'subscription.type': subscription.type,
            'subscription.plan': subscription.planId,
            'subscription.verified': false,
            'subscription.expiryDate': subscription.expiryDate,
            'subscription.referenceNumber': subscription.paymentDetails.referenceNumber
          });
          
          console.log('User record updated');
        }
      } else {
        console.log(`User record has subscription data:`);
        console.log(`- Type: ${user.subscription.type}`);
        console.log(`- Plan: ${user.subscription.plan}`);
        console.log(`- Verified: ${user.subscription.verified}`);
        console.log(`- Reference: ${user.subscription.referenceNumber}`);
      }
    }
    
    // Disconnect from database
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main(); 