/**
 * Installation Model
 * Tracks app installations across different platforms
 */
const mongoose = require('mongoose');

const InstallationSchema = new mongoose.Schema({
  platform: {
    type: String,
    enum: ['ios', 'android', 'web', 'pwa'],
    required: true
  },
  deviceId: {
    type: String,
    required: true
  },
  deviceInfo: {
    type: Object,
    default: {}
  },
  userAgent: {
    type: String,
    default: ''
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Create a compound index to prevent duplicate installations
InstallationSchema.index({ deviceId: 1, platform: 1 }, { unique: true });

const Installation = mongoose.model('Installation', InstallationSchema);

module.exports = Installation; 