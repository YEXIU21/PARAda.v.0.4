/**
 * Subscription Service
 * Provides business logic for subscription-related operations
 */
const Subscription = require('../models/subscription.model');
const User = require('../models/user.model');
const NotificationService = require('./notification.service');
const SubscriptionPlan = require('../models/subscription-plan.model');

// Initial subscription plans - will be replaced by database plans
let subscriptionPlans = [
  { 
    id: 'basic', 
    name: 'Basic', 
    price: 99,
    duration: 30, // days
    features: [
      'Real-time tracking',
      'Route planning',
      'Ride history'
    ]
  },
  { 
    id: 'premium', 
    name: 'Premium', 
    price: 199,
    duration: 30, // days
    features: [
      'Real-time tracking',
      'Route planning',
      'Ride history',
      'Priority support',
      'Ad-free experience'
    ],
    recommended: true
  },
  { 
    id: 'annual', 
    name: 'Annual', 
    price: 999,
    duration: 365, // days
    features: [
      'All Premium features',
      '24/7 support',
      'Schedule alarms',
      'Trip history'
    ]
  }
];

// Student discount percentage
const STUDENT_DISCOUNT_PERCENT = 20;

/**
 * Refresh subscription plans from database
 * @returns {Promise<Array>} - Updated subscription plans
 */
exports.refreshSubscriptionPlans = async () => {
  try {
    // Fetch plans from database
    const dbPlans = await SubscriptionPlan.find().sort({ price: 1 });
    
    if (dbPlans && dbPlans.length > 0) {
      // Convert database plans to service format
      subscriptionPlans = dbPlans.map(plan => ({
        id: plan.planId,
        name: plan.name,
        price: plan.price,
        duration: plan.duration,
        features: plan.features,
        recommended: plan.recommended
      }));
      
      console.log(`Refreshed ${subscriptionPlans.length} subscription plans from database`);
    } else {
      // If no plans in database, initialize database with default plans
      console.log('No subscription plans found in database, initializing with defaults...');
      
      // Create default plans in database
      const defaultPlans = [
        {
          planId: 'basic',
          name: 'Basic',
          price: 99,
          duration: 30,
          features: [
            'Real-time tracking',
            'Route planning',
            'Ride history'
          ]
        },
        {
          planId: 'premium',
          name: 'Premium',
          price: 199,
          duration: 30,
          features: [
            'Real-time tracking',
            'Route planning',
            'Ride history',
            'Priority support',
            'Ad-free experience'
          ],
          recommended: true
        },
        {
          planId: 'annual',
          name: 'Annual',
          price: 999,
          duration: 365,
          features: [
            'All Premium features',
            '24/7 support',
            'Schedule alarms',
            'Trip history'
          ]
        }
      ];
      
      // Save default plans to database
      await Promise.all(defaultPlans.map(async (plan) => {
        const newPlan = new SubscriptionPlan(plan);
        await newPlan.save();
      }));
      
      console.log('Default subscription plans created in database');
    }
    
    return subscriptionPlans;
  } catch (error) {
    console.error('Error refreshing subscription plans:', error);
    return subscriptionPlans; // Return current plans if refresh fails
  }
};

/**
 * Get count of active subscriptions by plan ID
 * @param {string} planId - Plan ID
 * @returns {Promise<number>} - Count of active subscriptions
 */
exports.getActiveSubscriptionsByPlanId = async (planId) => {
  try {
    const now = new Date();
    const count = await Subscription.countDocuments({
      planId,
      isActive: true,
      'verification.verified': true,
      expiryDate: { $gt: now }
    });
    
    return count;
  } catch (error) {
    console.error('Error counting active subscriptions by plan ID:', error);
    throw error;
  }
};

/**
 * Get all subscription plans
 * @returns {Array} - List of subscription plans
 */
exports.getSubscriptionPlans = async () => {
  // Try to refresh plans first
  try {
    await this.refreshSubscriptionPlans();
  } catch (error) {
    console.error('Error refreshing subscription plans:', error);
  }
  
  return subscriptionPlans;
};

/**
 * Get subscription plan by ID
 * @param {string} planId - Plan ID
 * @returns {Object|null} - Subscription plan or null if not found
 */
exports.getSubscriptionPlanById = async (planId) => {
  // Try to refresh plans first
  try {
    await this.refreshSubscriptionPlans();
  } catch (error) {
    console.error('Error refreshing subscription plans:', error);
  }
  
  return subscriptionPlans.find(plan => plan.id === planId) || null;
};

/**
 * Get subscription plan with student discount applied
 * @param {string} planId - Plan ID
 * @param {boolean} isStudent - Whether the user is a student
 * @returns {Object|null} - Subscription plan with discount or null if not found
 */
exports.getSubscriptionPlanWithDiscount = async (planId, isStudent) => {
  const plan = await this.getSubscriptionPlanById(planId);
  
  if (!plan) {
    return null;
  }
  
  // Clone the plan to avoid modifying the original
  const planWithDiscount = { ...plan };
  
  // Apply student discount if applicable
  if (isStudent) {
    planWithDiscount.originalPrice = planWithDiscount.price;
    planWithDiscount.price = Math.round(planWithDiscount.price * (1 - STUDENT_DISCOUNT_PERCENT / 100));
    planWithDiscount.discountPercent = STUDENT_DISCOUNT_PERCENT;
  }
  
  return planWithDiscount;
};

/**
 * Create a new subscription
 * @param {Object} subscriptionData - Subscription data
 * @param {Object} user - User object
 * @returns {Promise<Object>} - Created subscription
 */
exports.createSubscription = async (subscriptionData, user) => {
  // Allow both 'plan' and 'planId' parameters for backward compatibility
  const planId = subscriptionData.planId || subscriptionData.plan;
  
  // Check if user is a student
  const isStudent = user.accountType === 'student';
  
  // Find the plan with discount applied if student
  const selectedPlan = await this.getSubscriptionPlanWithDiscount(planId, isStudent);
  if (!selectedPlan) {
    throw new Error('Invalid subscription plan');
  }

  // Calculate expiry date
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + selectedPlan.duration);

  // Get vehicle type from subscription data (ensure backward compatibility)
  // Use 'all' to allow access to all vehicle types
  const vehicleType = subscriptionData.type || 'all';

  // Calculate final price based on student status
  const finalPrice = isStudent ? selectedPlan.price : selectedPlan.price;

  // Create subscription
  const subscription = new Subscription({
    userId: user._id,
    planId: selectedPlan.id,
    type: vehicleType,
    startDate: new Date(),
    expiryDate,
    paymentDetails: {
      amount: finalPrice,
      referenceNumber: subscriptionData.referenceNumber,
      paymentDate: new Date(),
      paymentMethod: subscriptionData.paymentMethod || 'gcash',
      studentDiscount: {
        applied: isStudent,
        percentage: isStudent ? STUDENT_DISCOUNT_PERCENT : 0
      }
    },
    isActive: false, // Will be set to true after verification
    autoRenew: subscriptionData.autoRenew || false,
    verification: {
      verified: false,
      status: 'pending'
    }
  });

  const savedSubscription = await subscription.save();

  // Also update the user's subscription field so it persists across sessions
  // This way we can show the "pending" status even after logout/login
  await User.findByIdAndUpdate(user._id, {
    'subscription.type': vehicleType,
    'subscription.plan': selectedPlan.id,
    'subscription.verified': false, // Not verified yet
    'subscription.expiryDate': expiryDate,
    'subscription.referenceNumber': subscriptionData.referenceNumber
  });
  
  // Create notification for admin about new subscription
  try {
    await NotificationService.createSystemNotification(
      null, // Send to all admins
      'New Subscription Request',
      `New subscription request from ${user.username} (${user.email}) for ${selectedPlan.name} plan.`,
      'payment',
      {
        subscriptionId: savedSubscription._id,
        userId: user._id,
        planId: selectedPlan.id,
        referenceNumber: subscriptionData.referenceNumber
      }
    );
  } catch (error) {
    console.error('Error creating admin notification:', error);
    // Don't fail the subscription creation if notification fails
  }

  // Create notification for user
  try {
    await NotificationService.createUserNotification(
      user._id,
      'Subscription Payment Received',
      `Your payment for the ${selectedPlan.name} plan has been received and is pending verification.`,
      'payment',
      {
        subscriptionId: savedSubscription._id,
        planId: selectedPlan.id,
        referenceNumber: subscriptionData.referenceNumber
      }
    );
  } catch (error) {
    console.error('Error creating user notification:', error);
    // Don't fail the subscription creation if notification fails
  }
  
  return savedSubscription;
};

/**
 * Get user's active subscription
 * @param {string} userId - User ID
 * @returns {Promise<Object|null>} - Active subscription or null
 */
exports.getUserActiveSubscription = async (userId) => {
  const now = new Date();
  
  return Subscription.findOne({
    userId,
    isActive: true,
    expiryDate: { $gt: now }
  }).sort({ createdAt: -1 });
};

/**
 * Get all user's subscriptions
 * @param {string} userId - User ID
 * @returns {Promise<Array>} - List of subscriptions
 */
exports.getUserSubscriptions = async (userId) => {
  return Subscription.find({ userId }).sort({ createdAt: -1 });
};

/**
 * Get subscription by ID
 * @param {string} subscriptionId - Subscription ID
 * @returns {Promise<Object|null>} - Subscription or null
 */
exports.getSubscriptionById = async (subscriptionId) => {
  return Subscription.findById(subscriptionId);
};

/**
 * Verify a subscription
 * @param {string} subscriptionId - Subscription ID
 * @param {boolean} approved - Whether the subscription is approved
 * @param {string} adminId - Admin user ID
 * @returns {Promise<Object>} - Updated subscription
 */
exports.verifySubscription = async (subscriptionId, approved, adminId) => {
  // Find the subscription
    const subscription = await Subscription.findById(subscriptionId);
    
    if (!subscription) {
      throw new Error('Subscription not found');
    }

  // Update subscription status
    if (approved) {
    subscription.verification.verified = true;
    subscription.verification.status = 'approved';
    subscription.verification.verifiedBy = adminId;
    subscription.verification.verificationDate = new Date();
    subscription.isActive = true;
    } else {
    subscription.verification.verified = false;
    subscription.verification.status = 'rejected';
    subscription.verification.verifiedBy = adminId;
    subscription.verification.verificationDate = new Date();
    subscription.isActive = false;
  }
  
  const savedSubscription = await subscription.save();
  
  // If approved, update user's subscription status
  if (approved) {
    await User.findByIdAndUpdate(subscription.userId, {
      'subscription.type': subscription.type,
      'subscription.plan': subscription.planId,
      'subscription.verified': true,
      'subscription.expiryDate': subscription.expiryDate,
      'subscription.referenceNumber': subscription.paymentDetails.referenceNumber
    });

    // Create notification for user
    try {
      await NotificationService.createUserNotification(
        subscription.userId,
        'Subscription Approved',
        `Your subscription has been approved and is now active.`,
        'payment',
        {
        subscriptionId: subscription._id,
        planId: subscription.planId,
          expiryDate: subscription.expiryDate
        }
      );
    } catch (error) {
      console.error('Error creating approval notification:', error);
      // Don't fail the verification if notification fails
    }
  } else {
    // Create notification for user about rejection
    try {
      await NotificationService.createUserNotification(
        subscription.userId,
        'Subscription Rejected',
        `Your ${subscription.type} subscription payment has been rejected. Please check your payment details or contact support.`,
        'payment',
        {
          subscriptionId: subscription._id,
          planId: subscription.planId,
          referenceNumber: subscription.paymentDetails.referenceNumber
        }
      );
    } catch (error) {
      console.error('Error creating rejection notification:', error);
      // Don't fail the verification if notification fails
    }
  }
  
  return savedSubscription;
};

/**
 * Get all pending subscriptions
 * @returns {Promise<Array>} - List of pending subscriptions
 */
exports.getPendingSubscriptions = async () => {
  try {
    // Find all subscriptions with pending status
    const pendingSubscriptions = await Subscription.find({
      'verification.status': 'pending',
      'verification.verified': false,
      isActive: false
    }).populate({
      path: 'userId', 
      select: 'username email accountType'
    });
    
    console.log(`Found ${pendingSubscriptions.length} pending subscriptions`);
    return pendingSubscriptions;
  } catch (error) {
    console.error('Error fetching pending subscriptions:', error);
    throw error;
  }
};

/**
 * Approve subscription by user ID and reference number
 * @param {string} userId - User ID
 * @param {string} referenceNumber - Payment reference number
 * @param {string} adminId - Admin user ID
 * @returns {Promise<Object>} - Approved subscription
 */
exports.approveSubscriptionByReference = async (userId, referenceNumber, adminId) => {
  // Find the subscription by user ID and reference number
    const subscription = await Subscription.findOne({
      userId,
      'paymentDetails.referenceNumber': referenceNumber
    });
    
  if (!subscription) {
    throw new Error('Subscription not found');
  }
  
  // Update subscription status
  subscription.verification.verified = true;
  subscription.verification.status = 'approved';
  subscription.verification.verifiedBy = adminId;
  subscription.verification.verificationDate = new Date();
  subscription.isActive = true;
  
  const savedSubscription = await subscription.save();
  
  // Update user's subscription status
  await User.findByIdAndUpdate(subscription.userId, {
    'subscription.type': subscription.type,
    'subscription.plan': subscription.planId,
    'subscription.verified': true,
    'subscription.expiryDate': subscription.expiryDate,
    'subscription.referenceNumber': subscription.paymentDetails.referenceNumber
  });
  
  // Create notification for user
  try {
    await NotificationService.createUserNotification(
      subscription.userId,
      'Subscription Approved',
      `Your subscription has been approved and is now active.`,
      'payment',
      {
        subscriptionId: subscription._id,
        planId: subscription.planId,
        expiryDate: subscription.expiryDate
      }
    );
  } catch (error) {
    console.error('Error creating approval notification:', error);
    // Don't fail the approval if notification fails
  }
  
  return savedSubscription;
};

/**
 * Cancel a subscription
 * @param {string} subscriptionId - Subscription ID
 * @param {string} userId - User ID
 * @param {boolean} isAdmin - Whether the user is an admin
 * @returns {Promise<Object>} - Cancelled subscription
 */
exports.cancelSubscription = async (subscriptionId, userId, isAdmin = false) => {
  // Find the subscription - if admin, don't filter by userId
  const query = { _id: subscriptionId };
  if (!isAdmin) {
    query.userId = userId;
  }
  
  console.log(`Searching for subscription with query:`, query);
  const subscription = await Subscription.findOne(query);
  
  if (!subscription) {
    console.log(`Subscription not found with ID: ${subscriptionId}`);
    throw new Error('Subscription not found');
  }

  console.log(`Found subscription: ${subscription._id}, updating status`);
  
  // Update subscription status
  subscription.isActive = false;
  subscription.autoRenew = false;
  subscription.cancelledAt = new Date();
  
  const savedSubscription = await subscription.save();
  console.log(`Subscription updated successfully: ${savedSubscription._id}`);

  // Create notification for the subscription owner (not necessarily the canceller)
  try {
    await NotificationService.createUserNotification(
      subscription.userId,
      'Subscription Cancelled',
      `Your ${subscription.type} subscription has been cancelled.`,
      'payment',
      {
        subscriptionId: subscription._id,
        planId: subscription.planId
      }
    );
  } catch (error) {
    console.error('Error creating cancellation notification:', error);
    // Don't fail the cancellation if notification fails
  }
  
  return savedSubscription;
};

/**
 * Check if user has active subscription
 * @param {string} userId - User ID
 * @returns {Promise<boolean>} - Whether user has active subscription
 */
exports.hasActiveSubscription = async (userId) => {
  const now = new Date();
  
  const count = await Subscription.countDocuments({
    userId,
    isActive: true,
    'verification.verified': true,
    expiryDate: { $gt: now }
  });
  
  return count > 0;
}; 