/**
 * Script to recreate notifications and messages collections in MongoDB
 * Run this script when collections have been accidentally deleted
 */
const mongoose = require('mongoose');

// Get the MongoDB URI from the config
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://angelfreitzd:angelfreitzdparada2025@parada.5bz6m2a.mongodb.net/parada?retryWrites=true&w=majority&appName=PARAda';

// Import models to ensure they're registered with Mongoose
require('../models/notification.model');
require('../models/message.model');

// Connect to MongoDB
mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => {
  console.log('Connected to MongoDB');
  recreateCollections();
})
.catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});

/**
 * Recreate collections by accessing the models
 * This will ensure the collections exist with the proper schema
 */
async function recreateCollections() {
  try {
    // Get the Mongoose models
    const Notification = mongoose.model('Notification');
    const Message = mongoose.model('Message');
    
    // Create collections if they don't exist
    // This is done by performing a simple operation on each collection
    
    console.log('Recreating notifications collection...');
    await Notification.findOne({}).exec();
    console.log('Notifications collection recreated');
    
    console.log('Recreating messages collection...');
    await Message.findOne({}).exec();
    console.log('Messages collection recreated');
    
    // Create TTL index for notifications if it doesn't exist
    console.log('Creating TTL index for notifications...');
    await mongoose.connection.collection('notifications').createIndex(
      { expiresAt: 1 },
      { expireAfterSeconds: 0 }
    );
    console.log('TTL index created for notifications');
    
    // Create indexes for messages if they don't exist
    console.log('Creating indexes for messages...');
    await mongoose.connection.collection('messages').createIndex(
      { senderId: 1, recipientId: 1, createdAt: -1 }
    );
    await mongoose.connection.collection('messages').createIndex(
      { recipientId: 1, read: 1 }
    );
    console.log('Indexes created for messages');
    
    console.log('Collections recreated successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error recreating collections:', error);
    process.exit(1);
  }
} 