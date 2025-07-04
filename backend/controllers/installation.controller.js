const Installation = require('../models/installation.model');

/**
 * Register a new installation or update an existing one
 */
exports.registerInstallation = async (req, res) => {
  try {
    const { deviceId, platform, version, userAgent } = req.body;

    if (!deviceId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Device ID is required' 
      });
    }

    // Try to find an existing installation with this device ID
    let installation = await Installation.findOne({ deviceId });

    if (installation) {
      // Update existing installation
      installation.lastActive = new Date();
      if (platform) installation.platform = platform;
      if (version) installation.version = version;
      if (userAgent) installation.userAgent = userAgent;
      
      await installation.save();
      
      return res.status(200).json({
        success: true,
        message: 'Installation updated',
        installation
      });
    } else {
      // Create new installation
      installation = new Installation({
        deviceId,
        platform: platform || 'unknown',
        version: version || '1.0.0',
        userAgent: userAgent || ''
      });
      
      await installation.save();
      
      return res.status(201).json({
        success: true,
        message: 'Installation registered',
        installation
      });
    }
  } catch (error) {
    console.error('Error registering installation:', error);
    return res.status(500).json({
      success: false,
      message: 'Error registering installation',
      error: error.message
    });
  }
};

/**
 * Get the total count of installations
 */
exports.getInstallationCount = async (req, res) => {
  try {
    const count = await Installation.getTotalCount();
    
    return res.status(200).json({
      success: true,
      count: count || 0
    });
  } catch (error) {
    console.error('Error getting installation count:', error);
    return res.status(500).json({
      success: false,
      message: 'Error getting installation count',
      error: error.message
    });
  }
};

/**
 * Get installation statistics
 */
exports.getInstallationStats = async (req, res) => {
  try {
    // Only allow admins to access this endpoint
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access'
      });
    }
    
    const totalCount = await Installation.getTotalCount();
    
    // Get platform distribution
    const platformStats = await Installation.aggregate([
      { $group: { _id: '$platform', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    // Get installations by date (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const dailyInstalls = await Installation.aggregate([
      { $match: { installedAt: { $gte: thirtyDaysAgo } } },
      {
        $group: {
          _id: { 
            $dateToString: { format: '%Y-%m-%d', date: '$installedAt' } 
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id': 1 } }
    ]);
    
    return res.status(200).json({
      success: true,
      totalCount,
      platformStats,
      dailyInstalls
    });
  } catch (error) {
    console.error('Error getting installation stats:', error);
    return res.status(500).json({
      success: false,
      message: 'Error getting installation statistics',
      error: error.message
    });
  }
}; 