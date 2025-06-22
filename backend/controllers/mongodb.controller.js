/**
 * MongoDB Controller
 * Provides direct MongoDB operations for the frontend
 * Note: This approach should be used carefully in production with proper validation
 */
const mongoose = require('mongoose');
const { validationResult } = require('express-validator');

/**
 * Execute a MongoDB query
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} - Response with query results or error
 */
exports.query = async (req, res) => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation error', 
        errors: errors.array() 
      });
    }

    const { collection, query } = req.body;
    
    // Security check: only allow certain collections to be queried
    const allowedCollections = ['routes', 'drivers', 'rides', 'subscriptions'];
    if (!allowedCollections.includes(collection)) {
      return res.status(403).json({
        message: 'Collection access denied'
      });
    }
    
    // Get the collection model
    const model = mongoose.model(collection.charAt(0).toUpperCase() + collection.slice(1, -1));
    
    // Execute query
    const results = await model.find(query);
    
    return res.status(200).json({
      data: results
    });
  } catch (error) {
    console.error('MongoDB query error:', error);
    return res.status(500).json({
      message: 'Error executing MongoDB query',
      error: error.message
    });
  }
};

/**
 * Insert a document into MongoDB
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} - Response with inserted document or error
 */
exports.insert = async (req, res) => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation error', 
        errors: errors.array() 
      });
    }

    const { collection, document } = req.body;
    
    // Security check: only allow certain collections for insertion
    const allowedCollections = ['routes', 'rides', 'subscriptions'];
    if (!allowedCollections.includes(collection)) {
      return res.status(403).json({
        message: 'Collection access denied'
      });
    }
    
    // Get the collection model
    const model = mongoose.model(collection.charAt(0).toUpperCase() + collection.slice(1, -1));
    
    // Create and save document
    const newDocument = new model(document);
    const savedDocument = await newDocument.save();
    
    return res.status(201).json({
      data: savedDocument
    });
  } catch (error) {
    console.error('MongoDB insert error:', error);
    return res.status(500).json({
      message: 'Error inserting document into MongoDB',
      error: error.message
    });
  }
};

/**
 * Update a document in MongoDB
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} - Response with update result or error
 */
exports.update = async (req, res) => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation error', 
        errors: errors.array() 
      });
    }

    const { collection, query, update } = req.body;
    
    // Security check: only allow certain collections for updates
    const allowedCollections = ['routes', 'rides', 'subscriptions'];
    if (!allowedCollections.includes(collection)) {
      return res.status(403).json({
        message: 'Collection access denied'
      });
    }
    
    // Get the collection model
    const model = mongoose.model(collection.charAt(0).toUpperCase() + collection.slice(1, -1));
    
    // Execute update
    const result = await model.updateOne(query, update);
    
    return res.status(200).json({
      data: result
    });
  } catch (error) {
    console.error('MongoDB update error:', error);
    return res.status(500).json({
      message: 'Error updating document in MongoDB',
      error: error.message
    });
  }
};

/**
 * Delete a document from MongoDB
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} - Response with delete result or error
 */
exports.delete = async (req, res) => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation error', 
        errors: errors.array() 
      });
    }

    const { collection, query } = req.body;
    
    // Security check: only allow certain collections for deletion
    const allowedCollections = ['routes', 'rides', 'subscriptions'];
    if (!allowedCollections.includes(collection)) {
      return res.status(403).json({
        message: 'Collection access denied'
      });
    }
    
    // Get the collection model
    const model = mongoose.model(collection.charAt(0).toUpperCase() + collection.slice(1, -1));
    
    // Execute delete
    const result = await model.deleteOne(query);
    
    return res.status(200).json({
      data: result
    });
  } catch (error) {
    console.error('MongoDB delete error:', error);
    return res.status(500).json({
      message: 'Error deleting document from MongoDB',
      error: error.message
    });
  }
}; 