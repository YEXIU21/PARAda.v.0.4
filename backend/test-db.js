require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Get MongoDB URI from environment or use default
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://angelfreitzd:angelfreitzdparada2025@parada.5bz6m2a.mongodb.net/parada?retryWrites=true&w=majority&appName=PARAda';

console.log('Testing MongoDB connection...');
console.log('MongoDB URI:', MONGODB_URI);

// Connect to MongoDB
mongoose.connect(MONGODB_URI)
  .then(async () => {
    console.log('Connected to MongoDB successfully!');
    console.log('Current database:', mongoose.connection.db.databaseName);
    
    // Check if User model exists
    try {
      const User = require('./models/user.model');
      console.log('User model loaded successfully');
      
      // Check if admin user exists
      const admin = await User.findOne({ email: 'admin@parada.com' });
      console.log('Admin user exists:', !!admin);
      
      if (admin) {
        console.log('Admin user details:');
        console.log('- Username:', admin.username);
        console.log('- Email:', admin.email);
        console.log('- Role:', admin.role);
        
        // Test password validation
        const validPassword = await bcrypt.compare('admin123', admin.password);
        console.log('Password "admin123" is valid:', validPassword);
      } else {
        console.log('Admin user not found. Creating admin user...');
        
        // Create admin user
        const hashedPassword = await bcrypt.hash('admin123', 10);
        const newAdmin = new User({
          username: 'admin',
          email: 'admin@parada.com',
          password: hashedPassword,
          role: 'admin',
          accountType: 'regular',
          isEmailVerified: true,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        
        await newAdmin.save();
        console.log('Admin user created successfully!');
      }
    } catch (error) {
      console.error('Error working with User model:', error);
    }
    
    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  })
  .catch(err => {
    console.error('Failed to connect to MongoDB:', err);
  }); 