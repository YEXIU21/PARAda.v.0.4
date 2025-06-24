const mongoose = require('mongoose');

const DestinationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
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
  },
  description: {
    type: String,
    default: null
  },
  type: {
    type: String,
    enum: ['popular', 'recent', 'business', 'residential', 'entertainment', 'education', 'other'],
    default: 'other'
  },
  rating: {
    type: Number,
    min: 0,
    max: 5,
    default: 0
  },
  visitCount: {
    type: Number,
    default: 0
  },
  image: {
    type: String,
    default: null
  },
  active: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  }
}, {
  timestamps: true
});

// Add indexes for faster queries
DestinationSchema.index({ name: 1 });
DestinationSchema.index({ type: 1 });
DestinationSchema.index({ latitude: 1, longitude: 1 });
DestinationSchema.index({ visitCount: -1 });

const Destination = mongoose.model('Destination', DestinationSchema);

module.exports = Destination; 