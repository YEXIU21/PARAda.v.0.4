/**
 * Subscription Controller
 * Handles subscription-related operations
 */
const { validationResult } = require('express-validator');
const subscriptionService = require('../services/subscription.service');
const socketService = require('../services/socket.service');
const Subscription = require('../models/subscription.model');
const SubscriptionPlan = require('../models/subscription-plan.model');
const User = require('../models/user.model');
const NotificationService = require('../services/notification.service');
const mongoose = require('mongoose');

/**
 * Get all subscription plans
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} - Response with plans or error
 */
exports.getPlans = async (req, res) => {
  try {
    const plans = subscriptionService.getSubscriptionPlans();
    
    return res.status(200).json({
      plans
    });
  } catch (error) {
    console.error('Error getting subscription plans:', error);
    return res.status(500).json({
      message: 'Error getting subscription plans',
      error: error.message
    });
  }
};

/**
 * Get all public subscription plans directly from the database
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} - Response with plans or error
 */
exports.getPublicPlans = async (req, res) => {
  try {
    console.log('Fetching public subscription plans from database');
    
    // Check if we need to apply student discount
    const isStudent = req.query.isStudent === 'true';
    console.log(`Request includes student status: ${isStudent}`);
    
    // Get user account type from headers or query params
    const userAccountType = req.query.accountType || 
                            req.headers['x-account-type'] || 
                            (isStudent ? 'student' : 'standard');
    
    console.log(`User account type for plans: ${userAccountType}`);
    
    // First try to get plans directly from the database
    const dbPlans = await SubscriptionPlan.find().sort({ price: 1 });
    
    if (dbPlans && dbPlans.length > 0) {
      console.log(`Found ${dbPlans.length} subscription plans in database`);
      
      // Get student discount info 
      const studentDiscountSettings = await subscriptionService.getStudentDiscountSettings();
      const shouldApplyDiscount = isStudent && 
                                 studentDiscountSettings && 
                                 studentDiscountSettings.isEnabled;
      
      // Map plans to required format with discounts applied if needed
      const formattedPlans = await Promise.all(dbPlans.map(async (plan) => {
        // Base plan format
        const formattedPlan = {
          id: plan._id.toString(),
          planId: plan.planId,
          _id: plan._id.toString(),
          name: plan.name,
          price: plan.price,
          duration: plan.duration,
          features: plan.features,
          recommended: plan.recommended
        };
        
        // Apply student discount if applicable
        if (shouldApplyDiscount) {
          const discountPercent = studentDiscountSettings.discountPercent;
          formattedPlan.originalPrice = formattedPlan.price;
          formattedPlan.price = Math.round(formattedPlan.price * (1 - discountPercent / 100));
          formattedPlan.discountPercent = discountPercent;
          console.log(`Applied student discount of ${discountPercent}% to plan ${plan.name}`);
        }
        
        return formattedPlan;
      }));
      
      return res.status(200).json(formattedPlans);
    }
    
    // If no plans found in database, use the service's default plans
    console.log('No subscription plans found in database, using default plans');
    const defaultPlans = await subscriptionService.getSubscriptionPlans();
    
    // Apply student discount to default plans if needed
    if (isStudent) {
      const studentDiscountSettings = await subscriptionService.getStudentDiscountSettings();
      if (studentDiscountSettings && studentDiscountSettings.isEnabled) {
        const discountPercent = studentDiscountSettings.discountPercent;
        defaultPlans.forEach(plan => {
          plan.originalPrice = plan.price;
          plan.price = Math.round(plan.price * (1 - discountPercent / 100));
          plan.discountPercent = discountPercent;
        });
        console.log(`Applied student discount to default plans`);
      }
    }
    
    return res.status(200).json(defaultPlans);
  } catch (error) {
    console.error('Error getting public subscription plans:', error);
    
    // Last resort - return hardcoded default plans
    const fallbackPlans = [
      {
        id: 'basic',
        planId: 'basic',
        name: 'Basic',
        price: 99,
        duration: 30,
        features: ['Real-time tracking', 'Schedule access', 'Traffic updates']
      },
      {
        id: 'premium',
        planId: 'premium',
        name: 'Premium',
        price: 199,
        duration: 30,
        features: ['All Basic features', 'Priority notifications', 'Offline maps', 'No advertisements'],
        recommended: true
      },
      {
        id: 'annual',
        planId: 'annual',
        name: 'Annual',
        price: 999,
        duration: 365,
        features: ['All Premium features', '24/7 support', 'Schedule alarms', 'Trip history']
      }
    ];
    
    return res.status(200).json(fallbackPlans);
  }
};

/**
 * Create a new subscription
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} - Response with subscription or error
 */
exports.createSubscription = async (req, res) => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation error', 
        errors: errors.array() 
      });
    }

    // Create subscription using the service
    const subscription = await subscriptionService.createSubscription(req.body, req.user);
    
    // Emit real-time event
    socketService.emitToAdmins('subscription:created', subscription);
    socketService.emitToUser(req.user._id, 'subscription:created', subscription);
    
    return res.status(201).json({
      message: 'Subscription created successfully, pending verification',
      subscription
    });
  } catch (error) {
    console.error('Error creating subscription:', error);
    return res.status(500).json({
      message: 'Error creating subscription',
      error: error.message
    });
  }
};

/**
 * Get user's own active subscription
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} - Response with user's active subscription or error
 */
exports.getUserSubscription = async (req, res) => {
  try {
    const userId = req.user._id;
    console.log(`Fetching subscription for user: ${userId}`);
    
    // First, try to get active subscription
    const activeSubscription = await subscriptionService.getUserActiveSubscription(userId);
    
    if (activeSubscription) {
      console.log(`Found active subscription for user ${userId}: ${activeSubscription._id}`);
      return res.status(200).json({
        subscription: activeSubscription
      });
    }
    
    // If no active subscription, check for pending subscriptions
    console.log(`No active subscription found for user ${userId}, checking for pending subscriptions...`);
    const pendingSubscriptions = await Subscription.find({
      userId,
      'verification.status': 'pending',
      'verification.verified': false,
      isActive: false
    }).sort({ createdAt: -1 });
    
    if (pendingSubscriptions.length > 0) {
      const pendingSubscription = pendingSubscriptions[0]; // Get the most recent pending subscription
      console.log(`Found pending subscription for user ${userId}: ${pendingSubscription._id}`);
      
      // Add plan name to subscription object
      const pendingSubscriptionObj = pendingSubscription.toObject();
      pendingSubscriptionObj.planName = await subscriptionService.getPlanNameFromId(pendingSubscription.planId);
      
      return res.status(200).json({
        subscription: pendingSubscriptionObj,
        pending: true
      });
    }
    
    // No active or pending subscriptions found
    console.log(`No subscriptions found for user ${userId}`);
    return res.status(200).json({
      subscription: null,
      message: 'No subscription found'
    });
  } catch (error) {
    console.error('Error getting user subscription:', error);
    return res.status(500).json({
      message: 'Error getting user subscription',
      error: error.message
    });
  }
};

/**
 * Get user's subscriptions
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} - Response with subscriptions or error
 */
exports.getUserSubscriptions = async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Get all user subscriptions using the service
    const subscriptions = await subscriptionService.getUserSubscriptions(userId);
    
    return res.status(200).json({
      subscriptions
    });
  } catch (error) {
    console.error('Error getting user subscriptions:', error);
    return res.status(500).json({
      message: 'Error getting user subscriptions',
      error: error.message
    });
  }
};

/**
 * Get subscription by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} - Response with subscription or error
 */
exports.getSubscriptionById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    
    // Get subscription by ID using the service
    const subscription = await subscriptionService.getSubscriptionById(id);
    
    if (!subscription) {
      return res.status(404).json({
        message: 'Subscription not found'
      });
    }
    
    // Ensure the user owns this subscription or is an admin
    if (subscription.userId.toString() !== userId.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        message: 'Unauthorized to access this subscription'
      });
    }
    
    return res.status(200).json({
      subscription
    });
  } catch (error) {
    console.error('Error getting subscription:', error);
    return res.status(500).json({
      message: 'Error getting subscription',
      error: error.message
    });
  }
};

/**
 * Verify a subscription
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} - Response with verified subscription or error
 */
exports.verifySubscription = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get subscription by ID
    const subscription = await Subscription.findById(id);
    
    if (!subscription) {
      return res.status(404).json({
        message: 'Subscription not found'
      });
    }
    
    // Check if subscription is already verified
    if (subscription.verification && subscription.verification.verified) {
      return res.status(400).json({
        message: 'Subscription is already verified'
      });
    }
    
    // Update subscription verification status
    subscription.verification.verified = true;
    subscription.verification.verifiedBy = req.user._id;
    subscription.verification.verificationDate = new Date();
    subscription.verification.status = 'approved';
    subscription.isActive = true;
    
    // Save subscription
    const verifiedSubscription = await subscription.save();
    
    // Get plan name if it exists in the subscription, otherwise get it from the service
    let planName = subscription.planName;
    if (!planName) {
      const subscriptionService = require('../services/subscription.service');
      planName = await subscriptionService.getPlanNameFromId(subscription.planId);
    }
    
    // Update user's subscription status
    await User.findByIdAndUpdate(subscription.userId, {
      'subscription.verified': true,
      'subscription.plan': subscription.planId,
      'subscription.planName': planName,
      'subscription.expiryDate': subscription.expiryDate
    });
    
    // Create notification for user
    try {
      await NotificationService.createUserNotification(
        subscription.userId,
        'Subscription Verified',
        `Your subscription has been verified and is now active.`,
        'subscription',
        {
          subscriptionId: subscription._id,
          planId: subscription.planId,
          planName: planName,
          expiryDate: subscription.expiryDate
        }
      );
    } catch (error) {
      console.error('Error creating user notification:', error);
      // Don't fail the verification if notification fails
    }
    
    // Emit real-time event
    socketService.emitToUser(subscription.userId, 'subscription:verified', {
      subscriptionId: subscription._id,
      planId: subscription.planId,
      planName: planName,
      expiryDate: subscription.expiryDate
    });
    
    return res.status(200).json({
      message: 'Subscription verified successfully',
      subscription: verifiedSubscription
    });
  } catch (error) {
    console.error('Error verifying subscription:', error);
    return res.status(500).json({
      message: 'Error verifying subscription',
      error: error.message
    });
  }
};

/**
 * Get pending subscriptions (admin only)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} - Response with pending subscriptions or error
 */
exports.getPendingSubscriptions = async (req, res) => {
  try {
    // Get pending subscriptions from the database
    const pendingSubscriptions = await Subscription.find({
      'verification.verified': false,
      'verification.status': 'pending',
      cancelledAt: null
    })
      .populate('userId', 'username email accountType')
      .sort({ createdAt: -1 });
    
    console.log(`Found ${pendingSubscriptions.length} pending subscriptions`);
    
    // Add plan names to subscriptions
    const pendingWithPlanNames = await Promise.all(
      pendingSubscriptions.map(async (subscription) => {
        const subscriptionObj = subscription.toObject();
        subscriptionObj.planName = await subscriptionService.getPlanNameFromId(subscription.planId);
        return subscriptionObj;
      })
    );
    
    return res.status(200).json({
      subscriptions: pendingWithPlanNames
    });
  } catch (error) {
    console.error('Error getting pending subscriptions:', error);
    return res.status(500).json({
      message: 'Error getting pending subscriptions',
      error: error.message
    });
  }
};

/**
 * Approve subscription by user ID and reference number (admin only)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} - Response with approved subscription or error
 */
exports.approveSubscriptionByReference = async (req, res) => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation error', 
        errors: errors.array() 
      });
    }

    const { userId, referenceNumber } = req.body;
    
    // Approve subscription using the service
    const subscription = await subscriptionService.approveSubscriptionByReference(
      userId,
      referenceNumber,
      req.user._id
    );
    
    // Emit real-time event
    socketService.emitToAdmins('subscription:verified', subscription);
    socketService.emitToUser(subscription.userId, 'subscription:verified', subscription);
    
    return res.status(200).json({
      message: 'Subscription approved successfully',
      subscription
    });
  } catch (error) {
    console.error('Error approving subscription:', error);
    return res.status(500).json({
      message: 'Error approving subscription',
      error: error.message
    });
  }
};

/**
 * Cancel a subscription
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} - Response with cancelled subscription or error
 */
exports.cancelSubscription = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    const isAdmin = req.user.role === 'admin';
    
    console.log(`Cancel subscription request: ID=${id}, User=${userId}, IsAdmin=${isAdmin}`);
    
    // Cancel subscription using the service
    const subscription = await subscriptionService.cancelSubscription(id, userId, isAdmin);
    
    console.log(`Subscription cancelled successfully: ${subscription._id}`);
    
    // Emit real-time event
    socketService.emitToAdmins('subscription:cancelled', subscription);
    socketService.emitToUser(subscription.userId, 'subscription:cancelled', subscription);
    
    return res.status(200).json({
      message: 'Subscription cancelled successfully',
      subscription
    });
  } catch (error) {
    console.error('Error cancelling subscription:', error);
    return res.status(500).json({
      message: 'Error cancelling subscription',
      error: error.message
    });
  }
};

/**
 * Get all subscriptions (admin only)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} - Response with all subscriptions or error
 */
exports.getAllSubscriptions = async (req, res) => {
  try {
    console.log('Admin requesting all subscriptions');
    
    // Check if the user is an admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        message: 'Unauthorized: Admin access required'
      });
    }
    
    // Get all subscriptions from the database
    const subscriptions = await Subscription.find({})
      .populate('userId', 'username email accountType')
      .sort({ createdAt: -1 });
    
    console.log(`Found ${subscriptions.length} total subscriptions`);
    
    // Add plan names to subscriptions
    const subscriptionsWithPlanNames = await Promise.all(
      subscriptions.map(async (subscription) => {
        const subscriptionObj = subscription.toObject();
        subscriptionObj.planName = await subscriptionService.getPlanNameFromId(subscription.planId);
        return subscriptionObj;
      })
    );
    
    return res.status(200).json({
      subscriptions: subscriptionsWithPlanNames
    });
  } catch (error) {
    console.error('Error getting all subscriptions:', error);
    return res.status(500).json({
      message: 'Error getting all subscriptions',
      error: error.message
    });
  }
};

/**
 * Create a new subscription from public (unauthenticated) users
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} - Response with subscription or error
 */
exports.createPublicSubscription = async (req, res) => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation error', 
        errors: errors.array() 
      });
    }

    console.log('Creating public subscription for:', req.body.username, req.body.email);
    console.log('Subscription data received:', JSON.stringify({
      planId: req.body.planId || req.body.plan || req.body.id || 'custom',
      email: req.body.email,
      username: req.body.username,
      amount: req.body.amount,
      price: req.body.price,
      duration: req.body.duration,
      name: req.body.name,
      referenceNumber: req.body.referenceNumber,
      paymentMethod: req.body.paymentMethod
    }));
    
    // Ensure we have the minimum required data
    if (!req.body.referenceNumber) {
      return res.status(400).json({
        message: 'Validation error',
        error: 'Reference number is required'
      });
    }
    
    // Find or create user
    let user;
    // Use any user ID field that might be provided (userId, id, _id)
    const userId = req.body.userId || req.body.id || req.body._id;
    
    if (userId) {
      try {
        // Try to find user by ID first - handle invalid ObjectId gracefully
        console.log('Searching for user by ID:', userId);
        user = await User.findById(userId);
        if (user) {
          console.log('Found user by ID:', user.username);
        }
      } catch (idError) {
        console.log('Error searching for user by ID:', idError.message);
        // Continue to email search
      }
    }
    
    if (!user && req.body.email) {
      // If no user found by ID, try to find by email
      console.log('Searching for user by email:', req.body.email);
      user = await User.findOne({ email: req.body.email });
      if (user) {
        console.log('Found user by email:', user.username);
      }
    }
    
    // If no user found, create a pending record
    if (!user) {
      console.log('No user found, creating a pending subscription record');
      
      // Create new subscription data in a special collection for admin review
      const pendingSubscription = new Subscription({
        // Use a temporary userId for now
        userId: new mongoose.Types.ObjectId(),
        // Allow any of id/planId/plan fields for maximum compatibility
        planId: req.body.planId || req.body.plan || req.body.id || 'custom',
        type: req.body.type || 'all',
        startDate: new Date(),
        expiryDate: new Date(Date.now() + (req.body.duration || 30) * 24 * 60 * 60 * 1000),
        paymentDetails: {
          // Use price if available, fall back to amount
          amount: req.body.price || req.body.amount || 0,
          referenceNumber: req.body.referenceNumber,
          paymentDate: new Date(),
          paymentMethod: req.body.paymentMethod || 'gcash'
        },
        isActive: false,
        autoRenew: req.body.autoRenew || false,
        verification: {
          verified: false,
          status: 'pending'
        },
        publicUserData: {
          username: req.body.username,
          email: req.body.email,
          isPublicSubmission: true,
          planName: req.body.name || 'Custom Plan',
          planDuration: req.body.duration || 30,
          // Always include both price fields for consistency
          planPrice: req.body.price || req.body.amount || 0,
          planAmount: req.body.amount || req.body.price || 0,
          // Include IDs for reference
          planId: req.body.planId || req.body.plan || req.body.id || 'custom'
        }
      });
      
      const savedSubscription = await pendingSubscription.save();
      
      // Create notification for admin
      try {
        await NotificationService.createSystemNotification(
          null, // Send to all admins
          'New Public Subscription Request',
          `New subscription request from ${req.body.username} (${req.body.email}) without authentication.`,
          'payment',
          {
            subscriptionId: savedSubscription._id,
            email: req.body.email,
            username: req.body.username,
            referenceNumber: req.body.referenceNumber
          }
        );
      } catch (notifyError) {
        console.error('Error creating admin notification:', notifyError);
        // Don't fail the subscription creation if notification fails
      }
      
      return res.status(201).json({
        message: 'Subscription request received and pending verification',
        subscription: savedSubscription,
        status: 'pending'
      });
    }
    
    // User found, use the regular subscription service with the found user
    // Ensure all required fields are present and properly formatted
    const subscriptionData = {
      ...req.body,
      planId: req.body.planId || req.body.plan || req.body.id || 'custom',
      // Include all possible ID fields for maximum compatibility
      plan: req.body.plan || req.body.planId || req.body.id || 'custom',
      id: req.body.id || req.body.planId || req.body.plan || 'custom',
      // Make sure price and amount are consistent
      price: req.body.price || req.body.amount || 0,
      amount: req.body.amount || req.body.price || 0,
      // Make sure duration is present
      duration: req.body.duration || 30,
      // Make sure name is present
      name: req.body.name || 'Custom Plan'
    };
    
    console.log('Creating subscription with processed data:', {
      planId: subscriptionData.planId,
      price: subscriptionData.price,
      amount: subscriptionData.amount,
      duration: subscriptionData.duration,
      name: subscriptionData.name,
      user: user ? { id: user._id, username: user.username } : 'No user'
    });
    
    // Create subscription using the service
    const subscription = await subscriptionService.createSubscription(subscriptionData, user);
    
    // Emit real-time event
    socketService.emitToAdmins('subscription:created', subscription);
    socketService.emitToUser(user._id, 'subscription:created', subscription);
    
    return res.status(201).json({
      message: 'Subscription created successfully, pending verification',
      subscription
    });
  } catch (error) {
    console.error('Error creating public subscription:', error);
    // Provide more detailed error information
    const errorDetails = {
      message: 'Error creating subscription',
      error: error.message,
      stack: process.env.NODE_ENV !== 'production' ? error.stack : undefined,
      details: {
        requestBody: {
          planId: req.body.planId || req.body.plan,
          email: req.body.email,
          username: req.body.username,
          amount: req.body.amount,
          referenceNumber: req.body.referenceNumber
        }
      }
    };
    
    console.error('Detailed error information:', JSON.stringify(errorDetails));
    
    return res.status(500).json({
      message: 'Error creating subscription',
      error: error.message,
      errorType: error.name || 'UnknownError'
    });
  }
};
