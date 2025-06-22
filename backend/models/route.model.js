const mongoose = require('mongoose');

const RouteStopSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  coordinates: {
    latitude: {
      type: Number,
      required: true
    },
    longitude: {
      type: Number,
      required: true
    }
  },
  arrivalTime: {
    type: String,
    default: null
  }
});

const RoutePointSchema = new mongoose.Schema({
  latitude: {
    type: Number,
    required: true
  },
  longitude: {
    type: Number,
    required: true
  }
});

const RouteSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    unique: true
  },
  description: {
    type: String,
    trim: true
  },
  vehicleType: {
    type: String,
    enum: ['latransco', 'calvo', 'corominas', 'ceres', 'gabe', 'jeep'],
    required: true
  },
  stops: [RouteStopSchema],
  path: [RoutePointSchema],
  active: {
    type: Boolean,
    default: true
  },
  drivers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Driver'
  }],
  schedule: {
    weekdays: {
      start: String,
      end: String,
      frequency: Number // in minutes
    },
    weekends: {
      start: String,
      end: String,
      frequency: Number // in minutes
    }
  },
  fare: {
    type: Number,
    default: 0
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

const Route = mongoose.model('Route', RouteSchema);

module.exports = Route; 