/**
 * Fix Support Password Script
 * 
 * This script fixes the support account password issue by directly setting
 * a new password with proper bcrypt hashing
 */
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Get database URI from environment variables
const dbURI = process.env.MONGODB_URI || 'mongodb+srv://angelfreitzd:angelfreitzdparada2025@parada.5bz6m2a.mongodb.net/parada?retryWrites=true&w=majority&appName=PARAda';

// The new password
const NEW_PASSWORD = 'parada@support123';
const SALT_ROUNDS = 10; // Using a fixed value to ensure consistency

// Connect to the database
mongoose.connect(dbURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => {
  console.log('MongoDB Connected:', mongoose.connection.host);
  console.log('Database name:', mongoose.connection.name);
  fixSupportPassword();
})
.catch(err => {
  console.error('Database connection error:', err);
  process.exit(1);
});

// Function to fix support password
async function fixSupportPassword() {
  try {
    // Find the support user
    const supportUser = await mongoose.connection.db.collection('users').findOne({ email: 'support@parada.com' });
    
    if (!supportUser) {
      console.log('Support user not found. Please run create-support-account.js first.');
      mongoose.connection.close();
      process.exit(1);
      return;
    }
    
    console.log('Found support user:', supportUser._id);
    
    // Generate a new hash with fixed salt rounds
    const salt = await bcrypt.genSalt(SALT_ROUNDS);
    const hashedPassword = await bcrypt.hash(NEW_PASSWORD, salt);
    
    console.log('Generated new hash for password');
    
    // Update support user with new password hash
    const result = await mongoose.connection.db.collection('users').updateOne(
      { email: 'support@parada.com' },
      { $set: { password: hashedPassword, updatedAt: new Date() } }
    );
    
    console.log('Support password fixed successfully');
    console.log('Modified count:', result.modifiedCount);
    console.log(`Username: support`);
    console.log(`Email: support@parada.com`);
    console.log(`New password: ${NEW_PASSWORD}`);
    
    // Test the password
    const updatedUser = await mongoose.connection.db.collection('users').findOne({ email: 'support@parada.com' });
    const isPasswordValid = await bcrypt.compare(NEW_PASSWORD, updatedUser.password);
    console.log('Password verification test:', isPasswordValid);
    
    // Close connection
    mongoose.connection.close();
    console.log('Database connection closed');
    process.exit(0);
  } catch (error) {
    console.error('Error fixing support password:', error);
    mongoose.connection.close();
    process.exit(1);
  }
} 