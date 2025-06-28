/**
 * User Model
 * Defines the schema for user data
 */
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { saltRounds } = require('../config/auth.config');

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    trim: true,
    minlength: 3,
    maxlength: 30
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email address']
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  role: {
    type: String,
    enum: ['admin', 'driver', 'passenger', 'support'],
    default: 'passenger'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  disabledReason: {
    type: String,
    default: null
  },
  accountType: {
    type: String,
    enum: ['regular', 'student'],
    default: 'regular'
  },
  studentId: {
    type: String,
    default: null
  },
  profilePicture: {
    type: String,
    default: null
  },
  phoneNumber: {
    type: String,
    default: null
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  verificationToken: {
    type: String,
    default: null
  },
  resetPasswordToken: {
    type: String,
    default: null
  },
  resetPasswordExpires: {
    type: Date,
    default: null
  },
  subscription: {
    type: {
      type: String,
      default: null
    },
    plan: {
      type: String,
      default: null
    },
    verified: {
      type: Boolean,
      default: false
    },
    expiryDate: {
      type: Date,
      default: null
    },
    referenceNumber: {
      type: String,
      default: null
    }
  },
  lastLogin: {
    type: Date,
    default: null
  },
  pushTokens: [{
    token: {
      type: String,
      required: true
    },
    device: {
      type: String,
      default: 'unknown'
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  settings: {
    notifications: {
      type: Boolean,
      default: true
    },
    darkMode: {
      type: Boolean,
      default: false
    },
    language: {
      type: String,
      default: 'en'
    }
  }
}, {
  timestamps: true
});

// Hash password before saving
UserSchema.pre('save', async function(next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) return next();
  
  try {
    // Generate a salt
    const salt = await bcrypt.genSalt(saltRounds);
    
    // Hash the password using the salt
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
UserSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Check if user has active subscription
UserSchema.methods.hasActiveSubscription = function() {
  if (!this.subscription || !this.subscription.expiryDate) {
    return false;
  }
  
  const now = new Date();
  return this.subscription.verified && now <= new Date(this.subscription.expiryDate);
};

// Generate verification token
UserSchema.methods.generateVerificationToken = function() {
  this.verificationToken = Math.random().toString(36).substring(2, 15) + 
                         Math.random().toString(36).substring(2, 15);
  return this.verificationToken;
};

const User = mongoose.model('User', UserSchema);

module.exports = User;
