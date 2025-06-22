/**
 * Fix Admin Password Script
 * 
 * This script directly sets the admin password in the database,
 * bypassing the model's password hashing middleware which might be causing issues.
 */
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Get database URI from environment variables
const dbURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/parada';

// Connect to the database
mongoose.connect(dbURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => {
  console.log('MongoDB Connected:', mongoose.connection.host);
  console.log('Database name:', mongoose.connection.name);
  fixAdminPassword();
})
.catch(err => {
  console.error('Database connection error:', err);
  process.exit(1);
});

// Function to fix admin password
async function fixAdminPassword() {
  try {
    // Hash the password directly with bcrypt
    const password = 'admin123';
    const hashedPassword = await bcrypt.hash(password, 10);
    
    console.log('Generated hashed password:', hashedPassword);
    
    // Update admin user directly in the database, bypassing mongoose middleware
    const result = await mongoose.connection.db.collection('users').updateOne(
      { email: 'admin@parada.com' },
      { $set: { password: hashedPassword } }
    );
    
    if (result.matchedCount === 0) {
      console.log('Admin user not found. Creating admin user...');
      
      // Create admin user directly in the database
      const admin = {
        username: 'admin',
        email: 'admin@parada.com',
        password: hashedPassword,
        role: 'admin',
        active: true,
        isEmailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      const insertResult = await mongoose.connection.db.collection('users').insertOne(admin);
      console.log('Admin user created with ID:', insertResult.insertedId);
    } else {
      console.log('Admin password updated directly in the database');
      console.log('Modified count:', result.modifiedCount);
    }
    
    // Verify the password hash works
    const adminUser = await mongoose.connection.db.collection('users').findOne({ email: 'admin@parada.com' });
    const isPasswordValid = await bcrypt.compare(password, adminUser.password);
    console.log('Password verification test:', isPasswordValid);
    
    // Close connection
    mongoose.connection.close();
    console.log('Database connection closed');
    process.exit(0);
  } catch (error) {
    console.error('Error fixing admin password:', error);
    mongoose.connection.close();
    process.exit(1);
  }
} 