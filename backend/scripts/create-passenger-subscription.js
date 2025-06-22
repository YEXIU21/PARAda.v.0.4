/**
 * Script to create a test subscription for the passenger user
 * Run with: node backend/scripts/create-passenger-subscription.js
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

// Create test subscription
async function createPassengerSubscription() {
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
    
    // Find passenger user
    const passengerUser = await User.findOne({ email: 'passenger@parada.com' });
    if (!passengerUser) {
      console.error('Passenger user not found');
      return null;
    }
    
    console.log('Found passenger user:', passengerUser._id);
    
    // Check if subscription already exists
    const existingSubscription = await Subscription.findOne({ userId: passengerUser._id });
    if (existingSubscription) {
      console.log('Subscription already exists for passenger user');
      return existingSubscription;
    }
    
    // Find admin user for verification
    const adminUser = await User.findOne({ email: 'admin@parada.com' });
    if (!adminUser) {
      console.error('Admin user not found for verification');
      return null;
    }
    
    // Calculate expiry date (30 days from now)
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 30);
    
    // Create subscription
    const subscription = new Subscription({
      userId: passengerUser._id,
      planId: 'basic',
      type: 'latransco',
      startDate: new Date(),
      expiryDate,
      isActive: true,
      autoRenew: false,
      paymentDetails: {
        amount: 99,
        referenceNumber: 'PASS-REF-' + Date.now(),
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
    console.log('Passenger subscription created:', savedSubscription._id);
    
    // Update user's subscription field
    await User.findByIdAndUpdate(passengerUser._id, {
      subscription: {
        type: 'latransco',
        plan: 'basic',
        verified: true,
        expiryDate: expiryDate,
        referenceNumber: subscription.paymentDetails.referenceNumber
      }
    });
    console.log('Passenger user subscription field updated');
    
    return savedSubscription;
  } catch (error) {
    console.error('Error creating passenger subscription:', error.message);
    throw error;
  }
}

// Main function
async function main() {
  try {
    await connectDB();
    await createPassengerSubscription();
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('MongoDB disconnected');
  }
}

// Run script
main(); 