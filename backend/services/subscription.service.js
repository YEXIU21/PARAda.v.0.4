/**
 * Subscription Service
 * Provides business logic for subscription-related operations
 */
const Subscription = require('../models/subscription.model');
const User = require('../models/user.model');
const NotificationService = require('./notification.service');
const SubscriptionPlan = require('../models/subscription-plan.model');
const StudentDiscount = require('../models/student-discount.model');

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

// Student discount settings - will be replaced by database settings
let studentDiscountSettings = {
  isEnabled: true,
  discountPercent: 20
};

/**
 * Refresh student discount settings from database
 * @returns {Promise<Object>} - Updated student discount settings
 */
exports.refreshStudentDiscountSettings = async () => {
  try {
    // Get settings from database (creates default if none exist)
    const settings = await StudentDiscount.getSettings();
    
    // Update local settings
    studentDiscountSettings = {
      isEnabled: settings.isEnabled,
      discountPercent: settings.discountPercent
    };
    
    console.log('Refreshed student discount settings:', studentDiscountSettings);
    return studentDiscountSettings;
  } catch (error) {
    console.error('Error refreshing student discount settings:', error);
    return studentDiscountSettings; // Return current settings if refresh fails
  }
};

/**
 * Get current student discount settings
 * @returns {Promise<Object>} - Student discount settings
 */
exports.getStudentDiscountSettings = async () => {
  // Try to refresh settings first
  try {
    await this.refreshStudentDiscountSettings();
  } catch (error) {
    console.error('Error refreshing student discount settings:', error);
  }
  
  return studentDiscountSettings;
};

/**
 * Update student discount settings
 * @param {Object} settings - New settings
 * @param {string} adminId - Admin user ID
 * @returns {Promise<Object>} - Updated settings
 */
exports.updateStudentDiscountSettings = async (settings, adminId) => {
  try {
    const currentSettings = await StudentDiscount.getSettings();
    
    // Update settings
    currentSettings.isEnabled = settings.isEnabled;
    currentSettings.discountPercent = settings.discountPercent;
    currentSettings.updatedBy = adminId;
    currentSettings.updatedAt = new Date();
    
    // Save to database
    const updatedSettings = await currentSettings.save();
    
    // Update local settings
    studentDiscountSettings = {
      isEnabled: updatedSettings.isEnabled,
      discountPercent: updatedSettings.discountPercent
    };
    
    return updatedSettings;
  } catch (error) {
    console.error('Error updating student discount settings:', error);
    throw error;
  }
};

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
  
  // Get current student discount settings
  const discountSettings = await this.getStudentDiscountSettings();
  
  // Apply student discount if applicable and enabled
  if (isStudent && discountSettings.isEnabled) {
    planWithDiscount.originalPrice = planWithDiscount.price;
    planWithDiscount.price = Math.round(planWithDiscount.price * (1 - discountSettings.discountPercent / 100));
    planWithDiscount.discountPercent = discountSettings.discountPercent;
  }
  
  return planWithDiscount;
};

/**
 * Create a new subscription
 * @param {Object} subscriptionData - Subscription data
 * @param {Object} user - User data
 * @returns {Promise<Object>} - Created subscription
 */
exports.createSubscription = async (subscriptionData, user) => {
  try {
    console.log('Creating subscription for user:', user._id);
    console.log('Subscription data:', JSON.stringify(subscriptionData, null, 2));
    
    // Check if user already has an active subscription
    const existingSubscription = await this.getUserActiveSubscription(user._id);
    
    if (existingSubscription) {
      console.log('User already has an active subscription:', existingSubscription._id);
      throw new Error('User already has an active subscription');
    }
    
    // Check if reference number already exists
    const referenceNumber = subscriptionData.referenceNumber;
    
    if (!referenceNumber) {
      console.error('Missing reference number');
      throw new Error('Reference number is required');
    }
    
    const existingReference = await Subscription.findOne({
      'paymentDetails.referenceNumber': referenceNumber
    });
    
    if (existingReference) {
      console.log('Reference number already exists:', referenceNumber);
      throw new Error('Reference number already exists');
    }
    
    // Get plan ID from subscription data
    const planId = subscriptionData.planId || subscriptionData.plan || subscriptionData.id;
    
    if (!planId) {
      console.error('Missing plan ID');
      throw new Error('Plan ID is required');
    }
    
    // Get subscription plan
    let selectedPlan;
    
    // First try to find the plan in the database
    try {
      // Try to find by planId field
      const dbPlan = await SubscriptionPlan.findOne({ planId });
      
      if (dbPlan) {
        console.log('Found plan in database by planId:', dbPlan);
        selectedPlan = {
          id: dbPlan.planId,
          name: dbPlan.name,
          price: dbPlan.price,
          duration: dbPlan.duration,
          features: dbPlan.features
        };
      } else {
        // Try to find by _id
        const dbPlanById = await SubscriptionPlan.findById(planId);
        
        if (dbPlanById) {
          console.log('Found plan in database by _id:', dbPlanById);
          selectedPlan = {
            id: dbPlanById.planId,
            name: dbPlanById.name,
            price: dbPlanById.price,
            duration: dbPlanById.duration,
            features: dbPlanById.features
          };
        } else {
          // If not found in database, try to find in memory plans
          selectedPlan = subscriptionPlans.find(plan => plan.id === planId);
          console.log('Memory plan lookup result:', selectedPlan);
        }
      }
    } catch (error) {
      console.error('Error finding plan in database:', error);
      // Continue with in-memory plans
      selectedPlan = subscriptionPlans.find(plan => plan.id === planId);
      console.log('Memory plan lookup result after DB error:', selectedPlan);
    }
    
    // If no plan found but we have subscription data with price and duration, create a custom plan
    if (!selectedPlan && (subscriptionData.price !== undefined || subscriptionData.amount !== undefined) && 
        (subscriptionData.duration !== undefined)) {
      console.log('Creating custom plan from subscription data:', {
        id: planId || 'custom',
        price: subscriptionData.price || subscriptionData.amount,
        duration: subscriptionData.duration,
        name: subscriptionData.name || 'Custom Plan'
      });
      
      selectedPlan = {
        id: planId || 'custom',
        name: subscriptionData.name || 'Custom Plan',
        price: parseFloat(subscriptionData.price || subscriptionData.amount) || 0,
        duration: parseInt(subscriptionData.duration) || 30,
        features: subscriptionData.features || ['Custom subscription plan']
      };
    } else if (!selectedPlan) {
      console.error('Invalid subscription plan and insufficient data to create custom plan:', planId);
      throw new Error('Invalid subscription plan');
    }

    // Check if user is a student
    const isStudent = user && user.accountType === 'student';
  
    // Calculate expiry date
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + selectedPlan.duration);

    // Get vehicle type from subscription data (ensure backward compatibility)
    // Use 'all' to allow access to all vehicle types
    const vehicleType = subscriptionData.type || 'all';

    // Get student discount settings if needed
    let studentDiscountPercentage = 0;
    if (isStudent) {
      const discountSettings = await this.getStudentDiscountSettings();
      studentDiscountPercentage = discountSettings.isEnabled ? discountSettings.discountPercent : 0;
    }

    // Calculate payment amount
    const paymentAmount = subscriptionData.amount || subscriptionData.price || selectedPlan.price;
    const discountedAmount = isStudent ? paymentAmount * (1 - studentDiscountPercentage / 100) : paymentAmount;

    // Create new subscription
    const newSubscription = new Subscription({
      userId: user._id,
      planId: selectedPlan.id,
      planName: selectedPlan.name, // Store plan name in the subscription
      type: vehicleType,
      startDate: new Date(),
      expiryDate: expiryDate,
      paymentDetails: {
        amount: discountedAmount,
        referenceNumber: referenceNumber,
        paymentDate: subscriptionData.paymentDate || new Date(),
        paymentMethod: subscriptionData.paymentMethod || 'gcash',
        studentDiscount: {
          applied: isStudent,
          percentage: isStudent ? studentDiscountPercentage : 0
        }
      },
      isActive: false, // Set to false until verified
      autoRenew: subscriptionData.autoRenew || false,
      verification: {
        verified: false,
        verifiedBy: null,
        verificationDate: null,
        status: 'pending'
      }
    });

    // Save subscription
    const savedSubscription = await newSubscription.save();
    console.log('Subscription created:', savedSubscription._id);

    // Create notification for admin
    try {
      await NotificationService.createSystemNotification(
        null, // Send to all admins
        'New Subscription Request',
        `New subscription request from ${user.username} (${user.email})`,
        'payment',
        {
          subscriptionId: savedSubscription._id,
          userId: user._id,
          username: user.username,
          email: user.email,
          referenceNumber: referenceNumber
        }
      );
    } catch (notifyError) {
      console.error('Error creating admin notification:', notifyError);
      // Don't fail the subscription creation if notification fails
    }

    // Update user document with subscription info
    try {
      await User.findByIdAndUpdate(user._id, {
        subscription: {
          type: vehicleType,
          plan: selectedPlan.id,
          planName: selectedPlan.name, // Include plan name in user document
          verified: false,
          expiryDate: expiryDate,
          referenceNumber: referenceNumber
        }
      });
    } catch (userUpdateError) {
      console.error('Error updating user with subscription info:', userUpdateError);
      // Don't fail if user update fails
    }

    return savedSubscription;
  } catch (error) {
    console.error('Error creating subscription:', error);
    throw error;
  }
};

/**
 * Get plan name from planId
 * @param {String} planId - Plan ID
 * @returns {String} - Plan name or default name if not found
 */
exports.getPlanNameFromId = async (planId) => {
  try {
    // Check if it's a MongoDB ObjectId (24 characters, hex)
    if (planId && planId.length === 24 && /^[0-9a-f]{24}$/i.test(planId)) {
      // Try to find the plan in the database
      const plan = await SubscriptionPlan.findById(planId);
      if (plan && plan.name) {
        return plan.name;
      }
      
      // If not found by _id, try by planId field
      const planByPlanId = await SubscriptionPlan.findOne({ planId: planId });
      if (planByPlanId && planByPlanId.name) {
        return planByPlanId.name;
      }
    }
    
    // Check in-memory subscription plans
    const memoryPlan = subscriptionPlans.find(p => p.id === planId);
    if (memoryPlan && memoryPlan.name) {
      return memoryPlan.name;
    }
    
    // Standard plan names as fallback
    switch (planId.toLowerCase()) {
      case 'basic':
        return 'Basic Plan';
      case 'premium':
        return 'Premium Plan';
      case 'annual':
        return 'Annual Plan';
      default:
        // Capitalize first letter as a last resort
        return planId.charAt(0).toUpperCase() + planId.slice(1);
    }
  } catch (error) {
    console.error('Error getting plan name from ID:', error);
    // Return capitalized plan ID as fallback
    return planId.charAt(0).toUpperCase() + planId.slice(1);
  }
};

/**
 * Get user's active subscription
 * @param {String} userId - User ID
 * @returns {Object|null} - Active subscription or null
 */
exports.getUserActiveSubscription = async (userId) => {
  try {
    // Find active subscription for user
    const subscription = await Subscription.findOne({
      userId,
      isActive: true,
      expiryDate: { $gt: new Date() }
    }).populate('userId', 'username email accountType');
    
    if (!subscription) {
      return null;
    }
    
    // Add plan name to subscription object
    const planName = await exports.getPlanNameFromId(subscription.planId);
    const subscriptionObj = subscription.toObject();
    subscriptionObj.planName = planName;
    
    return subscriptionObj;
  } catch (error) {
    console.error('Error getting user active subscription:', error);
    return null;
  }
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