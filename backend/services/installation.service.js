/**
 * Installation Service
 * Handles tracking app installations
 */
const Installation = require('../models/installation.model');
const { v4: uuidv4 } = require('uuid');

/**
 * Track a new installation
 * @param {Object} installationData - Installation data
 * @returns {Promise<Object>} - Created installation
 */
exports.trackInstallation = async (installationData) => {
  try {
    // Generate a device ID if not provided
    if (!installationData.deviceId) {
      installationData.deviceId = uuidv4();
    }
    
    // Check if installation already exists
    const existingInstallation = await Installation.findOne({
      deviceId: installationData.deviceId,
      platform: installationData.platform
    });
    
    if (existingInstallation) {
      // Update the existing installation
      existingInstallation.userAgent = installationData.userAgent || existingInstallation.userAgent;
      existingInstallation.deviceInfo = installationData.deviceInfo || existingInstallation.deviceInfo;
      existingInstallation.userId = installationData.userId || existingInstallation.userId;
      existingInstallation.isActive = true;
      
      await existingInstallation.save();
      return existingInstallation;
    }
    
    // Create a new installation record
    const installation = new Installation({
      platform: installationData.platform,
      deviceId: installationData.deviceId,
      deviceInfo: installationData.deviceInfo || {},
      userAgent: installationData.userAgent || '',
      userId: installationData.userId || null
    });
    
    const savedInstallation = await installation.save();
    return savedInstallation;
  } catch (error) {
    console.error('Error tracking installation:', error);
    throw error;
  }
};

/**
 * Get installation statistics
 * @returns {Promise<Object>} - Installation statistics
 */
exports.getInstallationStats = async () => {
  try {
    // Get total installations by platform
    const stats = await Installation.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$platform', count: { $sum: 1 } } }
    ]);
    
    // Format the results
    const result = {
      total: 0,
      platforms: {}
    };
    
    stats.forEach(stat => {
      result.platforms[stat._id] = stat.count;
      result.total += stat.count;
    });
    
    // Get installations over time (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const dailyStats = await Installation.aggregate([
      { 
        $match: { 
          createdAt: { $gte: thirtyDaysAgo },
          isActive: true
        } 
      },
      {
        $group: {
          _id: { 
            date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            platform: '$platform'
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.date': 1 } }
    ]);
    
    // Format daily stats
    result.daily = {};
    dailyStats.forEach(stat => {
      const date = stat._id.date;
      const platform = stat._id.platform;
      
      if (!result.daily[date]) {
        result.daily[date] = {};
      }
      
      result.daily[date][platform] = stat.count;
    });
    
    return result;
  } catch (error) {
    console.error('Error getting installation stats:', error);
    throw error;
  }
}; 