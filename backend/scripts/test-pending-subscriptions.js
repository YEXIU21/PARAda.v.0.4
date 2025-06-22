/**
 * Script to test and fix pending subscriptions
 * Run with: node backend/scripts/test-pending-subscriptions.js
 */
const mongoose = require('mongoose');
require('dotenv').config();

// MongoDB connection string
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://angelfreitzd:angelfreitzdparada2025@parada.5bz6m2a.mongodb.net/parada?retryWrites=true&w=majority&appName=PARAda';

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

// Define schemas
function defineModels() {
  // User model
  let User;
  try {
    User = mongoose.model('User');
  } catch (error) {
    const userSchema = new mongoose.Schema({
      username: String,
      email: String,
      password: String,
      role: String,
      isEmailVerified: Boolean,
      subscription: Object,
      createdAt: Date,
      updatedAt: Date
    });
    User = mongoose.model('User', userSchema);
  }

  // Subscription model
  let Subscription;
  try {
    Subscription = mongoose.model('Subscription');
  } catch (error) {
    const subscriptionSchema = new mongoose.Schema({
      userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      planId: String,
      type: String,
      startDate: Date,
      expiryDate: Date,
      isActive: Boolean,
      autoRenew: Boolean,
      paymentDetails: Object,
      verification: Object,
      createdAt: Date,
      updatedAt: Date
    });
    Subscription = mongoose.model('Subscription', subscriptionSchema);
  }

  return { User, Subscription };
}

// Check existing subscriptions
async function checkSubscriptions() {
  const { User, Subscription } = defineModels();
  
  console.log('\n=== Checking Existing Subscriptions ===');
  
  // Get all subscriptions
  const subscriptions = await Subscription.find({});
  console.log(`Found ${subscriptions.length} total subscriptions`);
  
  // Get pending subscriptions
  const pendingSubscriptions = await Subscription.find({
    'verification.status': 'pending',
    'verification.verified': false,
    isActive: false
  });
  console.log(`Found ${pendingSubscriptions.length} pending subscriptions`);
  
  // Log details of each pending subscription
  for (const sub of pendingSubscriptions) {
    console.log(`\nSubscription ID: ${sub._id}`);
    console.log(`User ID: ${sub.userId}`);
    console.log(`Plan: ${sub.planId}`);
    console.log(`Verification Status: ${sub.verification?.status}`);
    console.log(`Verified: ${sub.verification?.verified}`);
    console.log(`Active: ${sub.isActive}`);
    
    // Check if user exists
    const user = await User.findById(sub.userId);
    if (user) {
      console.log(`User exists: ${user.username} (${user.email})`);
    } else {
      console.log('User not found!');
    }
  }
  
  return { pendingCount: pendingSubscriptions.length };
}

// Create a test pending subscription
async function createTestPendingSubscription() {
  const { User, Subscription } = defineModels();
  
  console.log('\n=== Creating Test Pending Subscription ===');
  
  // Find or create a test user
  let testUser = await User.findOne({ email: 'test-passenger@parada.com' });
  if (!testUser) {
    testUser = new User({
      username: 'TestPassenger',
      email: 'test-passenger@parada.com',
      password: '$2a$10$testpasswordhashvalue',
      role: 'passenger',
      isEmailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    await testUser.save();
    console.log('Created test user:', testUser._id);
  } else {
    console.log('Found existing test user:', testUser._id);
  }
  
  // Calculate expiry date (30 days from now)
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + 30);
  
  // Create a new pending subscription
  const subscription = new Subscription({
    userId: testUser._id,
    planId: 'basic',
    type: 'latransco',
    startDate: new Date(),
    expiryDate,
    isActive: false,
    autoRenew: false,
    paymentDetails: {
      amount: 99,
      referenceNumber: 'TEST-PENDING-' + Date.now(),
      paymentDate: new Date(),
      paymentMethod: 'gcash'
    },
    verification: {
      verified: false,
      status: 'pending',
      verificationDate: null
    },
    createdAt: new Date(),
    updatedAt: new Date()
  });
  
  // Save the subscription
  const savedSubscription = await subscription.save();
  console.log('Created test pending subscription:', savedSubscription._id);
  
  // Update the user's subscription field
  await User.findByIdAndUpdate(testUser._id, {
    subscription: {
      type: 'latransco',
      plan: 'basic',
      verified: false,
      expiryDate: expiryDate,
      referenceNumber: subscription.paymentDetails.referenceNumber
    }
  });
  console.log('Updated user subscription field');
  
  return savedSubscription;
}

// Fix any issues with pending subscriptions
async function fixPendingSubscriptions() {
  const { User, Subscription } = defineModels();
  
  console.log('\n=== Fixing Pending Subscriptions ===');
  
  // Get all pending subscriptions
  const pendingSubscriptions = await Subscription.find({
    'verification.status': 'pending'
  });
  
  console.log(`Found ${pendingSubscriptions.length} subscriptions with pending status`);
  
  // Ensure all pending subscriptions have the correct fields set
  let fixedCount = 0;
  for (const sub of pendingSubscriptions) {
    let needsUpdate = false;
    const updates = {};
    
    // Check verification.verified field
    if (sub.verification?.verified !== false) {
      updates['verification.verified'] = false;
      needsUpdate = true;
    }
    
    // Check isActive field
    if (sub.isActive !== false) {
      updates.isActive = false;
      needsUpdate = true;
    }
    
    // Apply updates if needed
    if (needsUpdate) {
      await Subscription.updateOne({ _id: sub._id }, { $set: updates });
      console.log(`Fixed subscription ${sub._id}`);
      fixedCount++;
    }
  }
  
  console.log(`Fixed ${fixedCount} subscriptions`);
  
  return { fixedCount };
}

// Main function
async function main() {
  try {
    await connectDB();
    
    // Check current state of subscriptions
    const { pendingCount } = await checkSubscriptions();
    
    // Create a test pending subscription if none exist
    if (pendingCount === 0) {
      await createTestPendingSubscription();
    }
    
    // Fix any issues with existing subscriptions
    await fixPendingSubscriptions();
    
    // Check subscriptions again after fixes
    await checkSubscriptions();
    
    console.log('\n=== Tests Completed ===');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('MongoDB disconnected');
  }
}

// Run the script
main(); 