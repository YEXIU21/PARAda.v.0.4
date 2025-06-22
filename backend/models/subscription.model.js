const mongoose = require('mongoose');

const SubscriptionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  planId: {
    type: String,
    enum: ['basic', 'premium', 'annual', 'student'],
    required: true
  },
  type: {
    type: String,
    required: true
  },
  startDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  expiryDate: {
    type: Date,
    required: true
  },
  paymentDetails: {
    amount: {
      type: Number,
      required: true
    },
    referenceNumber: {
      type: String,
      required: true,
      unique: true
    },
    paymentDate: {
      type: Date,
      default: Date.now
    },
    paymentMethod: {
      type: String,
      default: 'gcash'
    },
    studentDiscount: {
      applied: {
        type: Boolean,
        default: false
      },
      percentage: {
        type: Number,
        default: 0
      }
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  autoRenew: {
    type: Boolean,
    default: false
  },
  cancelledAt: {
    type: Date,
    default: null
  },
  verification: {
    verified: {
      type: Boolean,
      default: false
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    verificationDate: {
      type: Date,
      default: null
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    }
  }
}, {
  timestamps: true
});

// Check if subscription is active
SubscriptionSchema.methods.isSubscriptionActive = function() {
  const now = new Date();
  return this.isActive && now <= this.expiryDate;
};

// Check if subscription is verified
SubscriptionSchema.methods.isVerified = function() {
  return this.verification && this.verification.verified;
};

// Cancel subscription
SubscriptionSchema.methods.cancelSubscription = function() {
  this.isActive = false;
  this.autoRenew = false;
  this.cancelledAt = new Date();
  return this.save();
};

// Verify subscription
SubscriptionSchema.methods.verifySubscription = function(adminId) {
  this.verification.verified = true;
  this.verification.verifiedBy = adminId;
  this.verification.verificationDate = new Date();
  this.verification.status = 'approved';
  this.isActive = true;
  return this.save();
};

// Reject subscription
SubscriptionSchema.methods.rejectSubscription = function(adminId) {
  this.verification.verified = false;
  this.verification.verifiedBy = adminId;
  this.verification.verificationDate = new Date();
  this.verification.status = 'rejected';
  this.isActive = false;
  return this.save();
};

const Subscription = mongoose.model('Subscription', SubscriptionSchema);

module.exports = Subscription; 