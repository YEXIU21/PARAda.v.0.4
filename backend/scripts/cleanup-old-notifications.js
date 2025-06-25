/**
 * Cleanup Old Notifications Script
 * Deletes notifications older than 2 days that don't have an expiration date set
 * 
 * Usage: node cleanup-old-notifications.js
 */

// Load environment variables
require('dotenv').config();

// Import dependencies
const mongoose = require('mongoose');
const Notification = require('../models/notification.model');

// Connect to MongoDB
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    process.exit(1);
  }
};

// Main cleanup function
const cleanupOldNotifications = async () => {
  try {
    console.log('Starting cleanup of old notifications...');
    
    // Calculate date 2 days ago
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    
    console.log(`Deleting notifications older than ${twoDaysAgo.toISOString()}`);
    
    // Find and delete old notifications without expiration date
    const result = await Notification.deleteMany({
      expiresAt: null,
      createdAt: { $lt: twoDaysAgo }
    });
    
    console.log(`Deleted ${result.deletedCount} old notifications`);
    
    // Find notifications without expiration date and set it
    const notificationsToUpdate = await Notification.find({
      expiresAt: null
    });
    
    console.log(`Found ${notificationsToUpdate.length} notifications without expiration date`);
    
    let updatedCount = 0;
    for (const notification of notificationsToUpdate) {
      notification.setExpiration(2); // Set to expire in 2 days
      await notification.save();
      updatedCount++;
    }
    
    console.log(`Updated ${updatedCount} notifications with 2-day expiration`);
    
    return {
      deleted: result.deletedCount,
      updated: updatedCount
    };
  } catch (error) {
    console.error('Error cleaning up old notifications:', error);
    throw error;
  }
};

// Run the script
(async () => {
  let connection;
  try {
    // Connect to database
    connection = await connectDB();
    
    // Run cleanup
    const result = await cleanupOldNotifications();
    
    console.log('Cleanup completed successfully');
    console.log(`Summary: ${result.deleted} deleted, ${result.updated} updated`);
    
    process.exit(0);
  } catch (error) {
    console.error('Script failed:', error);
    process.exit(1);
  } finally {
    // Close database connection
    if (connection) {
      await mongoose.disconnect();
      console.log('Database connection closed');
    }
  }
})(); 