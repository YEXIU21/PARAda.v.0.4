/**
 * Subscription Controller
 * Handles subscription-related operations
 */
const { validationResult } = require('express-validator');
const subscriptionService = require('../services/subscription.service');
const socketService = require('../services/socket.service');
const Subscription = require('../models/subscription.model');
const SubscriptionPlan = require('../models/subscription-plan.model');

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
    
    // First try to get plans directly from the database
    const dbPlans = await SubscriptionPlan.find().sort({ price: 1 });
    
    if (dbPlans && dbPlans.length > 0) {
      console.log(`Found ${dbPlans.length} subscription plans in database`);
      
      // Map plans to required format
      const formattedPlans = dbPlans.map(plan => ({
        id: plan._id.toString(),
        planId: plan.planId,
        _id: plan._id.toString(),
        name: plan.name,
        price: plan.price,
        duration: plan.duration,
        features: plan.features,
        recommended: plan.recommended
      }));
      
      return res.status(200).json(formattedPlans);
    }
    
    // If no plans found in database, use the service's default plans
    console.log('No subscription plans found in database, using default plans');
    const defaultPlans = subscriptionService.getSubscriptionPlans();
    
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
      return res.status(200).json({
        subscription: pendingSubscription,
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
 * Verify a subscription (admin only)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} - Response with verified subscription or error
 */
exports.verifySubscription = async (req, res) => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation error', 
        errors: errors.array() 
      });
    }

    const { subscriptionId, approved } = req.body;
    
    // Verify subscription using the service
    const subscription = await subscriptionService.verifySubscription(
      subscriptionId, 
      approved, 
      req.user._id
    );
    
    // Emit real-time event
    socketService.emitToAdmins('subscription:verified', subscription);
    socketService.emitToUser(subscription.userId, 'subscription:verified', subscription);
    
    return res.status(200).json({
      message: `Subscription ${approved ? 'approved' : 'rejected'} successfully`,
      subscription
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
 * Get all pending subscriptions (admin only)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} - Response with pending subscriptions or error
 */
exports.getPendingSubscriptions = async (req, res) => {
  try {
    console.log('Admin requesting pending subscriptions');
    
    // Get pending subscriptions using the service
    const pendingSubscriptions = await subscriptionService.getPendingSubscriptions();
    
    console.log(`Found ${pendingSubscriptions.length} pending subscriptions`);
    
    // Log the first subscription if available (for debugging)
    if (pendingSubscriptions.length > 0) {
      console.log('First pending subscription:', {
        id: pendingSubscriptions[0]._id,
        userId: pendingSubscriptions[0].userId,
        status: pendingSubscriptions[0].verification?.status,
        verified: pendingSubscriptions[0].verification?.verified,
        isActive: pendingSubscriptions[0].isActive
      });
    }
    
    return res.status(200).json({
      subscriptions: pendingSubscriptions
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
    
    return res.status(200).json({
      subscriptions
    });
  } catch (error) {
    console.error('Error getting all subscriptions:', error);
    return res.status(500).json({
      message: 'Error getting all subscriptions',
      error: error.message
    });
  }
};
