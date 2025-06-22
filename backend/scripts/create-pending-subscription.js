/**
 * Script to create a pending subscription for testing
 * Run with: node backend/scripts/create-pending-subscription.js
 */
const mongoose = require('mongoose');
require('dotenv').config();

// MongoDB connection string - use the same as in your server.js
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://angelfreitzd:angelfreitzdparada2025@parada.5bz6m2a.mongodb.net/parada?retryWrites=true&w=majority&appName=PARAda';

async function main() {
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log(`MongoDB Connected: ${mongoose.connection.host}`);
    
    // Define schemas if they don't exist
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
    
    // Find or create a test admin user
    let adminUser = await User.findOne({ role: 'admin' });
    if (!adminUser) {
      console.log('Creating admin user...');
      adminUser = new User({
        username: 'admin',
        email: 'admin@parada.com',
        password: '$2a$10$adminpasswordhash',
        role: 'admin',
        isEmailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      await adminUser.save();
      console.log('Admin user created:', adminUser._id);
    } else {
      console.log('Found admin user:', adminUser._id);
    }
    
    // Find or create a test passenger user
    let passengerUser = await User.findOne({ role: 'passenger' });
    if (!passengerUser) {
      console.log('Creating passenger user...');
      passengerUser = new User({
        username: 'passenger',
        email: 'passenger@parada.com',
        password: '$2a$10$passengerpasswordhash',
        role: 'passenger',
        isEmailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      await passengerUser.save();
      console.log('Passenger user created:', passengerUser._id);
    } else {
      console.log('Found passenger user:', passengerUser._id);
    }
    
    // Create a pending subscription
    console.log('Creating pending subscription...');
    
    // Calculate expiry date (30 days from now)
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 30);
    
    const subscription = new Subscription({
      userId: passengerUser._id,
      planId: 'basic',
      type: 'latransco',
      startDate: new Date(),
      expiryDate,
      isActive: false,
      autoRenew: false,
      paymentDetails: {
        amount: 99,
        referenceNumber: 'PENDING-' + Date.now(),
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
    
    const savedSubscription = await subscription.save();
    console.log('Pending subscription created:', savedSubscription._id);
    console.log('Subscription details:', {
      userId: savedSubscription.userId,
      planId: savedSubscription.planId,
      verification: savedSubscription.verification,
      isActive: savedSubscription.isActive
    });
    
    // Update the user's subscription field
    await User.findByIdAndUpdate(passengerUser._id, {
      subscription: {
        type: 'latransco',
        plan: 'basic',
        verified: false,
        expiryDate: expiryDate,
        referenceNumber: subscription.paymentDetails.referenceNumber
      }
    });
    console.log('User subscription field updated');
    
    console.log('Script completed successfully');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('MongoDB disconnected');
  }
}

// Run the script
main(); 