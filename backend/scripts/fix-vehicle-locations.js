/**
 * Script to fix vehicle locations in the database
 * This ensures all vehicles have proper GeoJSON location data
 * Run with: node scripts/fix-vehicle-locations.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const Vehicle = require('../models/vehicle.model');
const chalk = require('chalk');

// Get MongoDB URI from environment or use the one from .env file
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://angelfreitzd:angelfreitzdparada2025@parada.5bz6m2a.mongodb.net/parada?retryWrites=true&w=majority&appName=PARAda';

console.log(chalk.blue(`Using MongoDB URI: ${MONGODB_URI.substring(0, 20)}...`));

// Connect to MongoDB
mongoose.connect(MONGODB_URI)
  .then(() => console.log(chalk.green('✓ Connected to MongoDB')))
  .catch(err => {
    console.error(chalk.red('✗ MongoDB connection error:'), err);
    process.exit(1);
  });

async function fixVehicleLocations() {
  try {
    console.log(chalk.yellow('Fixing vehicle locations...'));
    
    // Get all vehicles
    const vehicles = await Vehicle.find({});
    console.log(chalk.blue(`Found ${vehicles.length} vehicles`));
    
    let fixedCount = 0;
    
    // Update each vehicle to ensure it has proper location data
    for (const vehicle of vehicles) {
      let needsUpdate = false;
      
      // Check if currentLocation exists but location is missing or incorrect
      if (vehicle.currentLocation && 
          vehicle.currentLocation.latitude && 
          vehicle.currentLocation.longitude) {
        
        // Check if location is missing or has incorrect format
        if (!vehicle.location || 
            !vehicle.location.coordinates || 
            vehicle.location.coordinates.length !== 2 ||
            vehicle.location.coordinates[0] !== vehicle.currentLocation.longitude ||
            vehicle.location.coordinates[1] !== vehicle.currentLocation.latitude) {
          
          // Update location field with GeoJSON format
          vehicle.location = {
            type: 'Point',
            coordinates: [vehicle.currentLocation.longitude, vehicle.currentLocation.latitude]
          };
          needsUpdate = true;
        }
      }
      // Check if location exists but currentLocation is missing or incorrect
      else if (vehicle.location && 
               vehicle.location.coordinates && 
               vehicle.location.coordinates.length === 2) {
        
        // Update currentLocation
        vehicle.currentLocation = {
          longitude: vehicle.location.coordinates[0],
          latitude: vehicle.location.coordinates[1],
          updatedAt: new Date()
        };
        needsUpdate = true;
      }
      
      // Save if updates were made
      if (needsUpdate) {
        await vehicle.save();
        fixedCount++;
      }
    }
    
    console.log(chalk.green(`✓ Fixed ${fixedCount} vehicles`));
    console.log(chalk.green.bold('✓ Vehicle locations fixed successfully!'));
    
    // Close connection
    await mongoose.connection.close();
    console.log(chalk.blue('✓ MongoDB connection closed'));
  } catch (error) {
    console.error(chalk.red('✗ Error fixing vehicle locations:'), error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

// Run the fix function
fixVehicleLocations(); 