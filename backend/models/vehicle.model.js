const mongoose = require('mongoose');

const VehicleSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['latransco', 'calvo', 'corominas', 'ceres', 'gabe', 'jeep'],
    required: true
  },
  plateNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  capacity: {
    type: Number,
    default: 4
  },
  currentLocation: {
    latitude: {
      type: Number,
      default: null
    },
    longitude: {
      type: Number,
      default: null
    },
    updatedAt: {
      type: Date,
      default: Date.now
    }
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      default: [0, 0]
    }
  },
  status: {
    type: String,
    enum: ['available', 'busy', 'offline', 'maintenance'],
    default: 'offline'
  },
  driverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Driver',
    default: null
  },
  currentRide: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ride',
    default: null
  },
  routeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Route',
    default: null
  },
  features: {
    hasAC: {
      type: Boolean,
      default: false
    },
    hasWifi: {
      type: Boolean,
      default: false
    },
    isAccessible: {
      type: Boolean,
      default: false
    },
    hasBaggageSpace: {
      type: Boolean,
      default: false
    }
  },
  lastMaintenance: {
    type: Date,
    default: null
  },
  registrationExpiry: {
    type: Date,
    default: null
  },
  active: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Add indexes for faster queries
VehicleSchema.index({ type: 1 });
VehicleSchema.index({ status: 1 });
VehicleSchema.index({ 'currentLocation.latitude': 1, 'currentLocation.longitude': 1 });
VehicleSchema.index({ driverId: 1 });

// Create geospatial index for location-based queries
VehicleSchema.index({ location: '2dsphere' });

// Pre-save middleware to sync currentLocation and location fields
VehicleSchema.pre('save', function(next) {
  // If currentLocation is updated, update location as well
  if (this.isModified('currentLocation') && 
      this.currentLocation && 
      this.currentLocation.latitude && 
      this.currentLocation.longitude) {
    this.location = {
      type: 'Point',
      coordinates: [this.currentLocation.longitude, this.currentLocation.latitude]
    };
  }
  
  // If location is updated, update currentLocation as well
  if (this.isModified('location') && 
      this.location && 
      this.location.coordinates && 
      this.location.coordinates.length === 2) {
    this.currentLocation = {
      longitude: this.location.coordinates[0],
      latitude: this.location.coordinates[1],
      updatedAt: new Date()
    };
  }
  
  next();
});

const Vehicle = mongoose.model('Vehicle', VehicleSchema);

module.exports = Vehicle; 