const mongoose = require('mongoose');

const installationSchema = new mongoose.Schema({
  deviceId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  platform: {
    type: String,
    enum: ['web', 'ios', 'android', 'unknown'],
    default: 'unknown'
  },
  version: {
    type: String,
    default: '1.0.0'
  },
  installedAt: {
    type: Date,
    default: Date.now
  },
  lastActive: {
    type: Date,
    default: Date.now
  },
  userAgent: {
    type: String,
    default: ''
  }
}, { timestamps: true });

// Virtual for total count
installationSchema.statics.getTotalCount = async function() {
  return this.countDocuments();
};

const Installation = mongoose.model('Installation', installationSchema);

module.exports = Installation; 