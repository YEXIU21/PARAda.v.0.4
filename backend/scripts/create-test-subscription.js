/**
 * Script to create a test subscription for the admin user
 * Run with: node backend/scripts/create-test-subscription.js
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

// Remove subscription from admin user
async function removeAdminSubscription() {
  try {
    // Get User model
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
        subscription: Object,
        createdAt: Date,
        updatedAt: Date
      });
      User = mongoose.model('User', userSchema);
    }
    
    // Find admin user
    const adminUser = await User.findOne({ email: 'admin@parada.com' });
    if (!adminUser) {
      console.error('Admin user not found');
      return null;
    }
    
    console.log('Found admin user:', adminUser._id);
    
    // Check if admin has subscription data
    if (adminUser.subscription) {
      console.log('Admin user has subscription data, removing it...');
      
      // Remove subscription data
      await User.updateOne(
        { email: 'admin@parada.com' },
        { $unset: { subscription: "" } }
      );
      
      console.log('Subscription data removed from admin user');
    } else {
      console.log('Admin user has no subscription data');
    }
    
    // Get Subscription model
    let Subscription;
    try {
      Subscription = mongoose.model('Subscription');
    } catch (error) {
      // If model is not defined, define it
      const subscriptionSchema = new mongoose.Schema({
        userId: mongoose.Schema.Types.ObjectId,
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
    
    // Delete any subscriptions associated with admin
    const deleteResult = await Subscription.deleteMany({ userId: adminUser._id });
    console.log(`Deleted ${deleteResult.deletedCount} subscription(s) associated with admin user`);
    
    return adminUser;
  } catch (error) {
    console.error('Error removing admin subscription:', error.message);
    throw error;
  }
}

// Create test subscription
async function createTestSubscription() {
  try {
    // Get User model
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
        subscription: Object,
        createdAt: Date,
        updatedAt: Date
      });
      User = mongoose.model('User', userSchema);
    }
    
    // Get Subscription model
    let Subscription;
    try {
      Subscription = mongoose.model('Subscription');
    } catch (error) {
      // If model is not defined, define it
      const subscriptionSchema = new mongoose.Schema({
        userId: mongoose.Schema.Types.ObjectId,
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
    
    // Find admin user
    const adminUser = await User.findOne({ email: 'admin@parada.com' });
    if (!adminUser) {
      console.error('Admin user not found');
      return null;
    }
    
    console.log('Found admin user:', adminUser._id);
    
    // Check if subscription already exists
    const existingSubscription = await Subscription.findOne({ userId: adminUser._id });
    if (existingSubscription) {
      console.log('Subscription already exists for admin user');
      return existingSubscription;
    }
    
    // Calculate expiry date (30 days from now)
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 30);
    
    // Create subscription
    const subscription = new Subscription({
      userId: adminUser._id,
      planId: 'premium',
      type: 'latransco',
      startDate: new Date(),
      expiryDate,
      isActive: true,
      autoRenew: false,
      paymentDetails: {
        amount: 199,
        referenceNumber: 'TEST-REF-' + Date.now(),
        paymentDate: new Date(),
        paymentMethod: 'gcash'
      },
      verification: {
        verified: true,
        status: 'approved',
        verifiedBy: adminUser._id,
        verificationDate: new Date()
      },
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    // Save subscription
    const savedSubscription = await subscription.save();
    console.log('Test subscription created:', savedSubscription._id);
    
    // Update user's subscription field
    await User.findByIdAndUpdate(adminUser._id, {
      subscription: {
        type: 'latransco',
        plan: 'premium',
        verified: true,
        expiryDate: expiryDate,
        referenceNumber: subscription.paymentDetails.referenceNumber
      }
    });
    console.log('User subscription field updated');
    
    return savedSubscription;
  } catch (error) {
    console.error('Error creating test subscription:', error.message);
    throw error;
  }
}

// Main function
async function main() {
  try {
    await connectDB();
    
    // First remove any existing subscription from admin
    await removeAdminSubscription();
    
    // Now we can choose to create a new test subscription if needed
    // Uncomment the next line if you want to create a new subscription
    // await createTestSubscription();
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('MongoDB disconnected');
  }
}

// Run script
main(); 