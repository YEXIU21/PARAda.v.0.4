/**
 * Subscription Plan Controller
 * Handles subscription plan management operations
 */
const { validationResult } = require('express-validator');
const SubscriptionPlan = require('../models/subscription-plan.model');
const subscriptionService = require('../services/subscription.service');

/**
 * Get all subscription plans
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} - Response with plans or error
 */
exports.getAllPlans = async (req, res) => {
  try {
    const plans = await SubscriptionPlan.find().sort({ price: 1 });
    
    return res.status(200).json({
      success: true,
      plans
    });
  } catch (error) {
    console.error('Error getting subscription plans:', error);
    return res.status(500).json({
      success: false,
      message: 'Error getting subscription plans',
      error: error.message
    });
  }
};

/**
 * Get subscription plan by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} - Response with plan or error
 */
exports.getPlanById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const plan = await SubscriptionPlan.findOne({ planId: id });
    
    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Subscription plan not found'
      });
    }
    
    return res.status(200).json({
      success: true,
      plan
    });
  } catch (error) {
    console.error('Error getting subscription plan:', error);
    return res.status(500).json({
      success: false,
      message: 'Error getting subscription plan',
      error: error.message
    });
  }
};

/**
 * Create a new subscription plan
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} - Response with created plan or error
 */
exports.createPlan = async (req, res) => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors.array()
      });
    }
    
    const { id, name, price, duration, features, recommended } = req.body;
    
    // Check if plan ID already exists
    const existingPlan = await SubscriptionPlan.findOne({ planId: id });
    if (existingPlan) {
      return res.status(400).json({
        success: false,
        message: 'Subscription plan with this ID already exists'
      });
    }
    
    // Create new plan
    const newPlan = new SubscriptionPlan({
      planId: id,
      name,
      price,
      duration,
      features,
      recommended: recommended || false,
      createdBy: req.user._id,
      updatedBy: req.user._id
    });
    
    const savedPlan = await newPlan.save();
    
    // Update plans in subscription service
    await subscriptionService.refreshSubscriptionPlans();
    
    return res.status(201).json({
      success: true,
      message: 'Subscription plan created successfully',
      plan: savedPlan
    });
  } catch (error) {
    console.error('Error creating subscription plan:', error);
    return res.status(500).json({
      success: false,
      message: 'Error creating subscription plan',
      error: error.message
    });
  }
};

/**
 * Update a subscription plan
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} - Response with updated plan or error
 */
exports.updatePlan = async (req, res) => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors.array()
      });
    }
    
    const { id } = req.params;
    const { name, price, duration, features, recommended } = req.body;
    
    // Find plan by ID
    const plan = await SubscriptionPlan.findOne({ planId: id });
    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Subscription plan not found'
      });
    }
    
    // Update plan
    plan.name = name;
    plan.price = price;
    plan.duration = duration;
    plan.features = features;
    plan.recommended = recommended || false;
    plan.updatedBy = req.user._id;
    plan.updatedAt = Date.now();
    
    const updatedPlan = await plan.save();
    
    // Update plans in subscription service
    await subscriptionService.refreshSubscriptionPlans();
    
    return res.status(200).json({
      success: true,
      message: 'Subscription plan updated successfully',
      plan: updatedPlan
    });
  } catch (error) {
    console.error('Error updating subscription plan:', error);
    return res.status(500).json({
      success: false,
      message: 'Error updating subscription plan',
      error: error.message
    });
  }
};

/**
 * Delete a subscription plan
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} - Response with success or error
 */
exports.deletePlan = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Find plan by ID
    const plan = await SubscriptionPlan.findOne({ planId: id });
    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Subscription plan not found'
      });
    }
    
    // Check if plan is in use
    const activeSubscriptions = await subscriptionService.getActiveSubscriptionsByPlanId(id);
    if (activeSubscriptions > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete plan. There are ${activeSubscriptions} active subscriptions using this plan.`
      });
    }
    
    // Delete plan
    await SubscriptionPlan.deleteOne({ planId: id });
    
    // Update plans in subscription service
    await subscriptionService.refreshSubscriptionPlans();
    
    return res.status(200).json({
      success: true,
      message: 'Subscription plan deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting subscription plan:', error);
    return res.status(500).json({
      success: false,
      message: 'Error deleting subscription plan',
      error: error.message
    });
  }
}; 