/**
 * Seed script to populate the database with initial data
 * Run with: node scripts/seed-data.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const Vehicle = require('../models/vehicle.model');
const Destination = require('../models/destination.model');
const Route = require('../models/route.model');
const chalk = require('chalk');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log(chalk.green('✓ Connected to MongoDB')))
  .catch(err => {
    console.error(chalk.red('✗ MongoDB connection error:'), err);
    process.exit(1);
  });

// Sample vehicle data
const vehicles = [
  {
    type: 'latransco',
    plateNumber: 'LAT-1234',
    capacity: 40,
    currentLocation: {
      latitude: 10.3156,
      longitude: 123.8854,
      updatedAt: new Date()
    },
    status: 'available',
    features: {
      hasAC: true,
      hasWifi: true,
      isAccessible: true,
      hasBaggageSpace: true
    }
  },
  {
    type: 'calvo',
    plateNumber: 'CAL-5678',
    capacity: 20,
    currentLocation: {
      latitude: 10.3157,
      longitude: 123.8855,
      updatedAt: new Date()
    },
    status: 'available',
    features: {
      hasAC: true,
      hasWifi: false,
      isAccessible: false,
      hasBaggageSpace: true
    }
  },
  {
    type: 'jeep',
    plateNumber: 'JEP-9012',
    capacity: 16,
    currentLocation: {
      latitude: 10.3158,
      longitude: 123.8856,
      updatedAt: new Date()
    },
    status: 'available',
    features: {
      hasAC: false,
      hasWifi: false,
      isAccessible: false,
      hasBaggageSpace: false
    }
  },
  {
    type: 'ceres',
    plateNumber: 'CER-3456',
    capacity: 50,
    currentLocation: {
      latitude: 10.3159,
      longitude: 123.8857,
      updatedAt: new Date()
    },
    status: 'available',
    features: {
      hasAC: true,
      hasWifi: true,
      isAccessible: true,
      hasBaggageSpace: true
    }
  },
  {
    type: 'gabe',
    plateNumber: 'GAB-7890',
    capacity: 12,
    currentLocation: {
      latitude: 10.3160,
      longitude: 123.8858,
      updatedAt: new Date()
    },
    status: 'available',
    features: {
      hasAC: false,
      hasWifi: false,
      isAccessible: false,
      hasBaggageSpace: false
    }
  }
];

// Sample destination data for Cebu City
const destinations = [
  {
    name: 'SM City Cebu',
    latitude: 10.3111,
    longitude: 123.9154,
    address: 'North Reclamation Area, Cebu City',
    description: 'Large shopping mall with various retail stores and restaurants',
    type: 'popular',
    rating: 4.5,
    visitCount: 1000,
    image: 'https://example.com/images/sm-city-cebu.jpg'
  },
  {
    name: 'Ayala Center Cebu',
    latitude: 10.3176,
    longitude: 123.9044,
    address: 'Cardinal Rosales Ave, Cebu City',
    description: 'Premier shopping mall with upscale stores and dining options',
    type: 'popular',
    rating: 4.7,
    visitCount: 950,
    image: 'https://example.com/images/ayala-center-cebu.jpg'
  },
  {
    name: 'Cebu IT Park',
    latitude: 10.3308,
    longitude: 123.9054,
    address: 'Lahug, Cebu City',
    description: 'Business district with BPO companies, restaurants, and cafes',
    type: 'business',
    rating: 4.4,
    visitCount: 800,
    image: 'https://example.com/images/cebu-it-park.jpg'
  },
  {
    name: 'Magellan\'s Cross',
    latitude: 10.2925,
    longitude: 123.9021,
    address: 'P. Burgos St, Cebu City',
    description: 'Historical landmark marking the arrival of Christianity in the Philippines',
    type: 'popular',
    rating: 4.3,
    visitCount: 700,
    image: 'https://example.com/images/magellans-cross.jpg'
  },
  {
    name: 'Cebu Provincial Capitol',
    latitude: 10.3142,
    longitude: 123.8914,
    address: 'Osmeña Boulevard, Cebu City',
    description: 'Government office and historical landmark',
    type: 'other',
    rating: 4.0,
    visitCount: 300,
    image: 'https://example.com/images/cebu-capitol.jpg'
  },
  {
    name: 'University of San Carlos - Main Campus',
    latitude: 10.3002,
    longitude: 123.8971,
    address: 'P. del Rosario St, Cebu City',
    description: 'One of the oldest educational institutions in the Philippines',
    type: 'education',
    rating: 4.5,
    visitCount: 500,
    image: 'https://example.com/images/usc-main.jpg'
  },
  {
    name: 'Carbon Market',
    latitude: 10.2939,
    longitude: 123.8971,
    address: 'M.C. Briones St, Cebu City',
    description: 'Largest public market in Cebu City',
    type: 'popular',
    rating: 4.0,
    visitCount: 650,
    image: 'https://example.com/images/carbon-market.jpg'
  },
  {
    name: 'Cebu South Bus Terminal',
    latitude: 10.2971,
    longitude: 123.8913,
    address: 'N. Bacalso Ave, Cebu City',
    description: 'Main bus terminal for southern routes',
    type: 'other',
    rating: 3.8,
    visitCount: 900,
    image: 'https://example.com/images/south-bus-terminal.jpg'
  },
  {
    name: 'Cebu Doctors\' University Hospital',
    latitude: 10.3138,
    longitude: 123.8913,
    address: 'Osmeña Boulevard, Cebu City',
    description: 'Major hospital and medical center',
    type: 'other',
    rating: 4.2,
    visitCount: 400,
    image: 'https://example.com/images/cebu-doctors.jpg'
  },
  {
    name: 'Fuente Osmeña Circle',
    latitude: 10.3097,
    longitude: 123.8917,
    address: 'Osmeña Boulevard, Cebu City',
    description: 'Iconic roundabout and public park',
    type: 'popular',
    rating: 4.1,
    visitCount: 750,
    image: 'https://example.com/images/fuente-osmena.jpg'
  }
];

// Sample route data
const routes = [
  {
    name: 'North Route',
    description: 'Route covering northern Cebu City',
    vehicleType: 'latransco',
    stops: [
      {
        name: 'SM City Cebu',
        coordinates: {
          latitude: 10.3111,
          longitude: 123.9154
        }
      },
      {
        name: 'Cebu IT Park',
        coordinates: {
          latitude: 10.3308,
          longitude: 123.9054
        }
      },
      {
        name: 'Ayala Center Cebu',
        coordinates: {
          latitude: 10.3176,
          longitude: 123.9044
        }
      }
    ],
    fare: 15
  },
  {
    name: 'Downtown Route',
    description: 'Route covering downtown Cebu City',
    vehicleType: 'jeep',
    stops: [
      {
        name: 'Fuente Osmeña Circle',
        coordinates: {
          latitude: 10.3097,
          longitude: 123.8917
        }
      },
      {
        name: 'Cebu Provincial Capitol',
        coordinates: {
          latitude: 10.3142,
          longitude: 123.8914
        }
      },
      {
        name: 'University of San Carlos - Main Campus',
        coordinates: {
          latitude: 10.3002,
          longitude: 123.8971
        }
      },
      {
        name: 'Magellan\'s Cross',
        coordinates: {
          latitude: 10.2925,
          longitude: 123.9021
        }
      }
    ],
    fare: 10
  }
];

// Seed the database
async function seedDatabase() {
  try {
    // Clear existing data
    await Vehicle.deleteMany({});
    await Destination.deleteMany({});
    await Route.deleteMany({});
    
    console.log(chalk.yellow('✓ Cleared existing data'));
    
    // Insert new data
    const createdVehicles = await Vehicle.insertMany(vehicles);
    console.log(chalk.green(`✓ Added ${createdVehicles.length} vehicles`));
    
    const createdDestinations = await Destination.insertMany(destinations);
    console.log(chalk.green(`✓ Added ${createdDestinations.length} destinations`));
    
    const createdRoutes = await Route.insertMany(routes);
    console.log(chalk.green(`✓ Added ${createdRoutes.length} routes`));
    
    console.log(chalk.green.bold('✓ Database seeded successfully!'));
    
    // Close connection
    await mongoose.connection.close();
    console.log(chalk.blue('✓ MongoDB connection closed'));
  } catch (error) {
    console.error(chalk.red('✗ Error seeding database:'), error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

// Run the seed function
seedDatabase(); 