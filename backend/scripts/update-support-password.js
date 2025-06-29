/**
 * Update Support Password Script
 * 
 * This script updates the support account password to a new secure password
 */
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Get database URI from environment variables
const dbURI = process.env.MONGODB_URI || 'mongodb+srv://angelfreitzd:angelfreitzdparada2025@parada.5bz6m2a.mongodb.net/parada?retryWrites=true&w=majority&appName=PARAda';

// The new password
const NEW_PASSWORD = 'parada@support123';

// Connect to the database
mongoose.connect(dbURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => {
  console.log('MongoDB Connected:', mongoose.connection.host);
  console.log('Database name:', mongoose.connection.name);
  updateSupportPassword();
})
.catch(err => {
  console.error('Database connection error:', err);
  process.exit(1);
});

// Function to update support password
async function updateSupportPassword() {
  try {
    // Hash the new password with bcrypt
    const hashedPassword = await bcrypt.hash(NEW_PASSWORD, 10);
    
    console.log('Generated hashed password for new password');
    
    // Update support user directly in the database
    const result = await mongoose.connection.db.collection('users').updateOne(
      { email: 'support@parada.com' },
      { $set: { password: hashedPassword, updatedAt: new Date() } }
    );
    
    if (result.matchedCount === 0) {
      console.log('Support user not found. Please run create-support-account.js first.');
      mongoose.connection.close();
      process.exit(1);
    } else {
      console.log('Support password updated successfully');
      console.log('Modified count:', result.modifiedCount);
      console.log(`Username: support`);
      console.log(`Email: support@parada.com`);
      console.log(`New password: ${NEW_PASSWORD}`);
    }
    
    // Verify the password hash works
    const supportUser = await mongoose.connection.db.collection('users').findOne({ email: 'support@parada.com' });
    const isPasswordValid = await bcrypt.compare(NEW_PASSWORD, supportUser.password);
    console.log('Password verification test:', isPasswordValid);
    
    // Close connection
    mongoose.connection.close();
    console.log('Database connection closed');
    process.exit(0);
  } catch (error) {
    console.error('Error updating support password:', error);
    mongoose.connection.close();
    process.exit(1);
  }
} 