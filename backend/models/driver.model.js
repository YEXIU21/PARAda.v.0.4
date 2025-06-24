/**
 * Driver Model
 * Represents a driver in the system
 */
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const DriverSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  routeId: {
    type: Schema.Types.ObjectId,
    ref: 'Route',
    default: null
  },
  vehicleType: {
    type: String,
    required: true,
    enum: ['latransco', 'calvo', 'corominas', 'ceres', 'gabe', 'jeep']
  },
  vehicleDetails: {
    licensePlate: {
      type: String,
      required: true,
      trim: true
    },
    model: {
      type: String,
      trim: true,
      default: ''
    },
    capacity: {
      type: Number,
      default: 4
    }
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'offline', 'busy'],
    default: 'inactive'
  },
  activeTrip: {
    type: Schema.Types.ObjectId,
    ref: 'Trip',
    default: null
  },
  verified: {
    type: Boolean,
    default: false
  },
  verificationDate: {
    type: Date,
    default: null
  },
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  totalRatings: {
    type: Number,
    default: 0
  },
  totalRides: {
    type: Number,
    default: 0
  },
  completedRides: {
    type: Number,
    default: 0
  },
  cancelledRides: {
    type: Number,
    default: 0
  },
  documents: [{
    type: {
      type: String,
      enum: ['license', 'registration', 'insurance', 'profile', 'other']
    },
    url: String,
    verified: {
      type: Boolean,
      default: false
    },
    uploadDate: {
      type: Date,
      default: Date.now
    }
  }],
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
  lastLocationUpdate: {
    type: Date,
    default: Date.now
  },
  lastStatusUpdate: {
    type: Date,
    default: Date.now
  },
  lastActive: {
    type: Date,
    default: Date.now
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Create geospatial index for location-based queries
DriverSchema.index({ location: '2dsphere' });

// Update the updatedAt field before saving
DriverSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Add a method to update driver rating
DriverSchema.methods.updateRating = function(newRating) {
  const totalRatingPoints = this.rating * this.totalRatings;
  this.totalRatings += 1;
  this.rating = (totalRatingPoints + newRating) / this.totalRatings;
  return this.save();
};

// Add a method to update ride statistics
DriverSchema.methods.updateRideStats = function(status) {
  this.totalRides += 1;
  
  if (status === 'completed') {
    this.completedRides += 1;
  } else if (status === 'cancelled') {
    this.cancelledRides += 1;
  }
  
  return this.save();
};

module.exports = mongoose.model('Driver', DriverSchema); 