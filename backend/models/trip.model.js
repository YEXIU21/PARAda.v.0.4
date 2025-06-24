/**
 * Trip Model
 * Represents a trip made by a driver on a specific route
 */
const mongoose = require('mongoose');

const LocationSchema = new mongoose.Schema({
  location: {
    latitude: {
      type: Number,
      required: true
    },
    longitude: {
      type: Number,
      required: true
    }
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

const TripSchema = new mongoose.Schema({
  driverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Driver',
    required: true
  },
  routeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Route',
    required: true
  },
  status: {
    type: String,
    enum: ['waiting', 'in_progress', 'completed', 'cancelled'],
    default: 'waiting'
  },
  startTime: {
    type: Date,
    default: Date.now
  },
  endTime: {
    type: Date,
    default: null
  },
  passengers: {
    type: Number,
    default: 0
  },
  locations: [LocationSchema],
  notes: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

// Add indexes for faster queries
TripSchema.index({ driverId: 1, status: 1 });
TripSchema.index({ routeId: 1 });
TripSchema.index({ startTime: -1 });
TripSchema.index({ status: 1 });

const Trip = mongoose.model('Trip', TripSchema);

module.exports = Trip; 