const mongoose = require('mongoose');

const LocationSchema = new mongoose.Schema({
  latitude: {
    type: Number,
    required: true
  },
  longitude: {
    type: Number,
    required: true
  },
  address: {
    type: String,
    default: null
  }
});

const RideSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  driverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Driver',
    default: null
  },
  routeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Route',
    required: true
  },
  startLocation: {
    type: LocationSchema,
    required: true
  },
  destination: {
    type: LocationSchema,
    required: true
  },
  status: {
    type: String,
    enum: ['waiting', 'assigned', 'picked_up', 'completed', 'cancelled'],
    default: 'waiting'
  },
  requestTime: {
    type: Date,
    default: Date.now
  },
  assignedTime: {
    type: Date,
    default: null
  },
  pickupTime: {
    type: Date,
    default: null
  },
  completionTime: {
    type: Date,
    default: null
  },
  cancellationTime: {
    type: Date,
    default: null
  },
  cancellationReason: {
    type: String,
    default: null
  },
  estimatedArrivalTime: {
    type: Date,
    default: null
  },
  fare: {
    type: Number,
    default: 0
  },
  distance: {
    type: Number, // in meters
    default: 0
  },
  duration: {
    type: Number, // in seconds
    default: 0
  },
  rating: {
    type: Number,
    min: 1,
    max: 5,
    default: null
  },
  feedback: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

// Add indexes for faster queries
RideSchema.index({ userId: 1 });
RideSchema.index({ driverId: 1 });
RideSchema.index({ status: 1 });
RideSchema.index({ requestTime: -1 });

const Ride = mongoose.model('Ride', RideSchema);

module.exports = Ride; 