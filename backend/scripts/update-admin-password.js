/**
 * Update Admin Password Script
 * 
 * This script updates the admin password to parada@admin123
 */
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Get database URI from environment variables
const dbURI = process.env.MONGODB_URI || 'mongodb+srv://angelfreitzd:angelfreitzdparada2025@parada.5bz6m2a.mongodb.net/parada?retryWrites=true&w=majority&appName=PARAda';

// The new password
const NEW_PASSWORD = 'parada@admin123';

// Connect to the database
mongoose.connect(dbURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => {
  console.log('MongoDB Connected:', mongoose.connection.host);
  console.log('Database name:', mongoose.connection.name);
  updateAdminPassword();
})
.catch(err => {
  console.error('Database connection error:', err);
  process.exit(1);
});

// Function to update admin password
async function updateAdminPassword() {
  try {
    // Hash the new password with bcrypt
    const hashedPassword = await bcrypt.hash(NEW_PASSWORD, 10);
    
    console.log('Generated hashed password for new password');
    
    // Update admin user directly in the database
    const result = await mongoose.connection.db.collection('users').updateOne(
      { email: 'admin@parada.com' },
      { $set: { password: hashedPassword, updatedAt: new Date() } }
    );
    
    if (result.matchedCount === 0) {
      console.log('Admin user not found. Creating admin user...');
      
      // Create admin user with the new password
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
      console.log(`Username: admin`);
      console.log(`Email: admin@parada.com`);
      console.log(`Password: ${NEW_PASSWORD}`);
    } else {
      console.log('Admin password updated successfully');
      console.log('Modified count:', result.modifiedCount);
      console.log(`Username: admin`);
      console.log(`Email: admin@parada.com`);
      console.log(`New password: ${NEW_PASSWORD}`);
    }
    
    // Verify the password hash works
    const adminUser = await mongoose.connection.db.collection('users').findOne({ email: 'admin@parada.com' });
    const isPasswordValid = await bcrypt.compare(NEW_PASSWORD, adminUser.password);
    console.log('Password verification test:', isPasswordValid);
    
    // Close connection
    mongoose.connection.close();
    console.log('Database connection closed');
    process.exit(0);
  } catch (error) {
    console.error('Error updating admin password:', error);
    mongoose.connection.close();
    process.exit(1);
  }
} 