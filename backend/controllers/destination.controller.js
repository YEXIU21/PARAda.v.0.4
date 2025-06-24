/**
 * Destination Controller
 * Handles all destination-related operations
 */
const { validationResult } = require('express-validator');
const Destination = require('../models/destination.model');
const mongoose = require('mongoose');

/**
 * Get all destinations
 * @route GET /api/destinations
 * @access Public
 */
exports.getAllDestinations = async (req, res) => {
  try {
    const destinations = await Destination.find({ active: true });
    res.status(200).json(destinations);
  } catch (error) {
    console.error('Error getting destinations:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Get popular destinations
 * @route GET /api/destinations/popular
 * @access Public
 */
exports.getPopularDestinations = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    
    const destinations = await Destination.find({ active: true })
      .sort({ visitCount: -1, rating: -1 })
      .limit(limit);
    
    res.status(200).json(destinations);
  } catch (error) {
    console.error('Error getting popular destinations:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Get nearby destinations
 * @route POST /api/destinations/nearby
 * @access Public
 */
exports.getNearbyDestinations = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { latitude, longitude, radius = 5000 } = req.body; // radius in meters
    
    // Use MongoDB's geospatial query to find nearby destinations
    const destinations = await Destination.find({
      active: true,
      latitude: { $gte: latitude - 0.05, $lte: latitude + 0.05 },
      longitude: { $gte: longitude - 0.05, $lte: longitude + 0.05 }
    }).limit(20);

    // Calculate actual distance and filter by radius
    const nearbyDestinations = destinations
      .map(dest => {
        const distance = calculateDistance(
          latitude, longitude,
          dest.latitude, dest.longitude
        );
        return { ...dest.toObject(), distance };
      })
      .filter(dest => dest.distance <= radius)
      .sort((a, b) => a.distance - b.distance);

    res.status(200).json(nearbyDestinations);
  } catch (error) {
    console.error('Error getting nearby destinations:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Search destinations
 * @route GET /api/destinations/search
 * @access Public
 */
exports.searchDestinations = async (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query) {
      return res.status(400).json({ message: 'Search query is required' });
    }
    
    const destinations = await Destination.find({
      active: true,
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { address: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } }
      ]
    }).limit(20);
    
    res.status(200).json(destinations);
  } catch (error) {
    console.error('Error searching destinations:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Get destination by ID
 * @route GET /api/destinations/:id
 * @access Public
 */
exports.getDestinationById = async (req, res) => {
  try {
    const destination = await Destination.findById(req.params.id);
    
    if (!destination) {
      return res.status(404).json({ message: 'Destination not found' });
    }
    
    res.status(200).json(destination);
  } catch (error) {
    console.error('Error getting destination by ID:', error);
    
    if (error instanceof mongoose.Error.CastError) {
      return res.status(400).json({ message: 'Invalid destination ID' });
    }
    
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Create a new destination
 * @route POST /api/destinations
 * @access Private/Admin
 */
exports.createDestination = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const {
      name,
      latitude,
      longitude,
      address,
      description,
      type,
      image
    } = req.body;
    
    // Check if destination with same name already exists
    const existingDestination = await Destination.findOne({ name });
    if (existingDestination) {
      return res.status(400).json({ message: 'Destination with this name already exists' });
    }
    
    const newDestination = new Destination({
      name,
      latitude,
      longitude,
      address,
      description,
      type,
      image,
      createdBy: req.user.id
    });
    
    await newDestination.save();
    
    res.status(201).json(newDestination);
  } catch (error) {
    console.error('Error creating destination:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Update a destination
 * @route PUT /api/destinations/:id
 * @access Private/Admin
 */
exports.updateDestination = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const updates = req.body;
    
    const destination = await Destination.findById(req.params.id);
    
    if (!destination) {
      return res.status(404).json({ message: 'Destination not found' });
    }
    
    // Check if name is being updated and if it already exists
    if (updates.name && updates.name !== destination.name) {
      const existingDestination = await Destination.findOne({ name: updates.name });
      if (existingDestination) {
        return res.status(400).json({ message: 'Destination with this name already exists' });
      }
    }
    
    const updatedDestination = await Destination.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true }
    );
    
    res.status(200).json(updatedDestination);
  } catch (error) {
    console.error('Error updating destination:', error);
    
    if (error instanceof mongoose.Error.CastError) {
      return res.status(400).json({ message: 'Invalid destination ID' });
    }
    
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Delete a destination
 * @route DELETE /api/destinations/:id
 * @access Private/Admin
 */
exports.deleteDestination = async (req, res) => {
  try {
    const destination = await Destination.findById(req.params.id);
    
    if (!destination) {
      return res.status(404).json({ message: 'Destination not found' });
    }
    
    // Soft delete by marking as inactive
    destination.active = false;
    await destination.save();
    
    res.status(200).json({ message: 'Destination deleted successfully' });
  } catch (error) {
    console.error('Error deleting destination:', error);
    
    if (error instanceof mongoose.Error.CastError) {
      return res.status(400).json({ message: 'Invalid destination ID' });
    }
    
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Increment visit count for a destination
 * @route PUT /api/destinations/:id/visit
 * @access Private
 */
exports.incrementVisitCount = async (req, res) => {
  try {
    const destination = await Destination.findById(req.params.id);
    
    if (!destination) {
      return res.status(404).json({ message: 'Destination not found' });
    }
    
    destination.visitCount += 1;
    await destination.save();
    
    res.status(200).json({ message: 'Visit count incremented', visitCount: destination.visitCount });
  } catch (error) {
    console.error('Error incrementing visit count:', error);
    
    if (error instanceof mongoose.Error.CastError) {
      return res.status(400).json({ message: 'Invalid destination ID' });
    }
    
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param {Number} lat1 - Latitude of first point
 * @param {Number} lon1 - Longitude of first point
 * @param {Number} lat2 - Latitude of second point
 * @param {Number} lon2 - Longitude of second point
 * @returns {Number} - Distance in meters
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c; // Distance in meters
} 