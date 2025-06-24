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
  status: {
    type: String,
    enum: ['available', 'busy', 'offline', 'maintenance'],
    default: 'offline'
  },
  driver: {
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
VehicleSchema.index({ driver: 1 });

const Vehicle = mongoose.model('Vehicle', VehicleSchema);

module.exports = Vehicle; 