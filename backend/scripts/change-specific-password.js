/**
 * Script to change the password for a specific user
 * This script will change the password for kris@gmail.com to bbkris1216
 */

// Import required modules
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Load environment variables
require('dotenv').config();

// Configuration
const EMAIL = 'kris@gmail.com';
const NEW_PASSWORD = 'bbkris1216';
// Use the correct MongoDB URI from the project
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://angelfreitzd:angelfreitzdparada2025@parada.5bz6m2a.mongodb.net/parada?retryWrites=true&w=majority&appName=PARAda';
const SALT_ROUNDS = 10;

// Connect to MongoDB
console.log('Connecting to MongoDB...');
mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => {
  console.log('Connected to MongoDB');
  changePassword();
})
.catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});

// Define User model schema based on the existing model
const UserSchema = new mongoose.Schema({
  username: String,
  email: String,
  password: String,
  role: String,
  isActive: Boolean,
  // Other fields omitted for brevity
}, { timestamps: true });

// Try to use the existing model or create a new one
let User;
try {
  User = mongoose.model('User');
} catch (e) {
  User = mongoose.model('User', UserSchema);
}

// Function to change the password
async function changePassword() {
  try {
    console.log(`Searching for user with email: ${EMAIL}`);
    
    // Find the user
    const user = await User.findOne({ email: EMAIL.toLowerCase() });
    
    if (!user) {
      console.error(`User with email ${EMAIL} not found.`);
      mongoose.connection.close();
      process.exit(1);
    }
    
    console.log('User found:');
    console.log(`Username: ${user.username}`);
    console.log(`Email: ${user.email}`);
    console.log(`Role: ${user.role}`);
    
    // Hash the new password
    console.log('Hashing new password...');
    const hashedPassword = await bcrypt.hash(NEW_PASSWORD, SALT_ROUNDS);
    
    // Update the user's password
    console.log('Updating password...');
    const result = await User.updateOne(
      { _id: user._id },
      { 
        $set: { 
          password: hashedPassword,
          updatedAt: new Date()
        } 
      }
    );
    
    if (result.modifiedCount === 1) {
      console.log('Password updated successfully.');
      
      // Verify the new password
      const updatedUser = await User.findById(user._id);
      const verifyNewPassword = await bcrypt.compare(NEW_PASSWORD, updatedUser.password);
      
      if (verifyNewPassword) {
        console.log('Password verification successful.');
      } else {
        console.error('Warning: Password verification failed. The password may not work correctly.');
      }
    } else {
      console.error('Failed to update password.');
    }
    
    // Close connection and exit
    mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('Error changing password:', error);
    mongoose.connection.close();
    process.exit(1);
  }
} 