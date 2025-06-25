/**
 * Student Discount Model
 * Defines the schema for student discount settings
 */
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const StudentDiscountSchema = new Schema({
  isEnabled: {
    type: Boolean,
    default: true
  },
  discountPercent: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
    default: 20
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  updatedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Ensure there's only one document in this collection
StudentDiscountSchema.statics.getSettings = async function() {
  const settings = await this.findOne();
  if (settings) {
    return settings;
  }
  
  // Create default settings if none exist
  const defaultSettings = new this({
    isEnabled: true,
    discountPercent: 20
  });
  
  return defaultSettings.save();
};

module.exports = mongoose.model('StudentDiscount', StudentDiscountSchema); 