/**
 * Admin Controller
 * Handles admin-specific operations and dashboard data
 */
const User = require('../models/user.model');
const Driver = require('../models/driver.model');
const Route = require('../models/route.model');
const Ride = require('../models/ride.model');
const Subscription = require('../models/subscription.model');
const driverService = require('../services/driver.service');

/**
 * Get admin dashboard data
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} - Response with dashboard data or error
 */
exports.getDashboardData = async (req, res) => {
  try {
    // Get counts
    const userCount = await User.countDocuments();
    const driverCount = await Driver.countDocuments();
    const activeDriverCount = await Driver.countDocuments({ status: 'active' });
    const routeCount = await Route.countDocuments();
    const activeRouteCount = await Route.countDocuments({ active: true });
    const pendingRideCount = await Ride.countDocuments({ status: 'waiting' });
    const activeRideCount = await Ride.countDocuments({ status: { $in: ['assigned', 'picked_up'] } });
    const completedRideCount = await Ride.countDocuments({ status: 'completed' });
    
    // Get active subscriptions
    const now = new Date();
    const activeSubscriptionCount = await Subscription.countDocuments({
      isActive: true,
      expiryDate: { $gt: now }
    });
    
    // Get pending subscription payments
    const pendingSubscriptionCount = await Subscription.countDocuments({
      isActive: false,
      cancelledAt: null
    });
    
    // Get recent rides
    const recentRides = await Ride.find()
      .sort({ requestTime: -1 })
      .limit(5)
      .populate({
        path: 'userId',
        select: 'username email profilePicture'
      })
      .populate({
        path: 'driverId',
        populate: {
          path: 'userId',
          select: 'username email profilePicture'
        }
      })
      .populate('routeId', 'name routeNumber');
    
    // Get recent subscriptions
    const recentSubscriptions = await Subscription.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate({
        path: 'userId',
        select: 'username email profilePicture'
      });
    
    // Get subscription distribution
    const subscriptions = await Subscription.find({
      isActive: true,
      expiryDate: { $gt: now }
    });
    
    // Count subscription types
    const basicCount = subscriptions.filter(sub => sub.planId === 'basic').length;
    const premiumCount = subscriptions.filter(sub => sub.planId === 'premium').length;
    const annualCount = subscriptions.filter(sub => sub.planId === 'annual').length;
    
    // If there are active subscriptions but no types assigned, assign at least one to basic
    const totalTypeCount = basicCount + premiumCount + annualCount;
    const adjustedBasicCount = (totalTypeCount === 0 && activeSubscriptionCount > 0) 
      ? activeSubscriptionCount 
      : basicCount;
    
    return res.status(200).json({
      counts: {
        users: userCount,
        drivers: driverCount,
        activeDrivers: activeDriverCount,
        routes: routeCount,
        activeRoutes: activeRouteCount,
        pendingRides: pendingRideCount,
        activeRides: activeRideCount,
        completedRides: completedRideCount,
        activeSubscriptions: activeSubscriptionCount,
        pendingSubscriptions: pendingSubscriptionCount
      },
      recentActivity: {
        rides: recentRides,
        subscriptions: recentSubscriptions
      },
      subscriptionStats: {
        basic: adjustedBasicCount,
        premium: premiumCount,
        annual: annualCount
      }
    });
  } catch (error) {
    console.error('Error getting dashboard data:', error);
    return res.status(500).json({
      message: 'Error retrieving dashboard data',
      error: error.message
    });
  }
};

/**
 * Get all users with pagination
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} - Response with users or error
 */
exports.getUsers = async (req, res) => {
  try {
    // Get pagination parameters
    const limit = parseInt(req.query.limit) || 10;
    const skip = parseInt(req.query.skip) || 0;
    const sort = req.query.sort || 'createdAt';
    const order = req.query.order === 'asc' ? 1 : -1;
    
    // Get filter parameters
    const filter = {};
    if (req.query.role) {
      filter.role = req.query.role;
    }
    if (req.query.accountType) {
      filter.accountType = req.query.accountType;
    }
    if (req.query.search) {
      filter.$or = [
        { username: { $regex: req.query.search, $options: 'i' } },
        { email: { $regex: req.query.search, $options: 'i' } }
      ];
    }
    
    // Get users with pagination
    const users = await User.find(filter)
      .select('-password')
      .sort({ [sort]: order })
      .skip(skip)
      .limit(limit);
    
    // Get total count for pagination
    const total = await User.countDocuments(filter);
    
    return res.status(200).json({
      users,
      pagination: {
        total,
        limit,
        skip,
        hasMore: skip + users.length < total
      }
    });
  } catch (error) {
    console.error('Error getting users:', error);
    return res.status(500).json({
      message: 'Error retrieving users',
      error: error.message
    });
  }
};

/**
 * Get all drivers with pagination
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} - Response with drivers or error
 */
exports.getDrivers = async (req, res) => {
  try {
    // Get pagination parameters
    const limit = parseInt(req.query.limit) || 10;
    const skip = parseInt(req.query.skip) || 0;
    const sort = req.query.sort || 'createdAt';
    const order = req.query.order === 'asc' ? 1 : -1;
    
    // Get filter parameters
    const filter = {};
    if (req.query.status) {
      filter.status = req.query.status;
    }
    if (req.query.vehicleType) {
      filter.vehicleType = req.query.vehicleType;
    }
    if (req.query.verified !== undefined) {
      filter.verified = req.query.verified === 'true';
    }
    if (req.query.routeId) {
      filter.routeId = req.query.routeId;
    }
    
    // Get drivers with pagination
    const drivers = await Driver.find(filter)
      .populate('userId', 'username email profilePicture')
      .populate('routeId', 'name')
      .sort({ [sort]: order })
      .skip(skip)
      .limit(limit);
    
    // Get total count for pagination
    const total = await Driver.countDocuments(filter);
    
    return res.status(200).json({
      drivers,
      pagination: {
        total,
        limit,
        skip,
        hasMore: skip + drivers.length < total
      }
    });
  } catch (error) {
    console.error('Error getting drivers:', error);
    return res.status(500).json({
      message: 'Error retrieving drivers',
      error: error.message
    });
  }
};

/**
 * Get all rides with pagination
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} - Response with rides or error
 */
exports.getRides = async (req, res) => {
  try {
    // Get pagination parameters
    const limit = parseInt(req.query.limit) || 10;
    const skip = parseInt(req.query.skip) || 0;
    const sort = req.query.sort || 'requestTime';
    const order = req.query.order === 'asc' ? 1 : -1;
    
    // Get filter parameters
    const filter = {};
    if (req.query.status) {
      filter.status = req.query.status;
    }
    if (req.query.userId) {
      filter.userId = req.query.userId;
    }
    if (req.query.driverId) {
      filter.driverId = req.query.driverId;
    }
    if (req.query.routeId) {
      filter.routeId = req.query.routeId;
    }
    
    // Get rides with pagination
    const rides = await Ride.find(filter)
      .populate('userId', 'username')
      .populate('driverId', 'userId')
      .populate('routeId', 'name')
      .sort({ [sort]: order })
      .skip(skip)
      .limit(limit);
    
    // Get total count for pagination
    const total = await Ride.countDocuments(filter);
    
    return res.status(200).json({
      rides,
      pagination: {
        total,
        limit,
        skip,
        hasMore: skip + rides.length < total
      }
    });
  } catch (error) {
    console.error('Error getting rides:', error);
    return res.status(500).json({
      message: 'Error retrieving rides',
      error: error.message
    });
  }
};

/**
 * Get all subscriptions with pagination
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} - Response with subscriptions or error
 */
exports.getSubscriptions = async (req, res) => {
  try {
    console.log('Request query params:', req.query);
    
    // Get pagination parameters
    const limit = parseInt(req.query.limit) || 10;
    const skip = parseInt(req.query.skip) || 0;
    const sort = req.query.sort || 'createdAt';
    const order = req.query.order === 'asc' ? 1 : -1;
    
    // Get filter parameters
    const filter = {};
    if (req.query.isActive !== undefined) {
      filter.isActive = req.query.isActive === 'true';
    }
    if (req.query.verified !== undefined) {
      filter['verification.verified'] = req.query.verified === 'true';
    }
    if (req.query.status) {
      filter['verification.status'] = req.query.status;
    }
    if (req.query.planId) {
      filter.planId = req.query.planId;
    }
    if (req.query.userId) {
      filter.userId = req.query.userId;
    }
    
    // Special filter for pending subscriptions (not verified and not cancelled)
    if (req.query.pending === 'true') {
      filter['verification.verified'] = false;
      filter['verification.status'] = 'pending';
      filter.cancelledAt = null;
    }
    
    console.log('Applied filter:', filter);
    
    // Get subscriptions with pagination
    const subscriptions = await Subscription.find(filter)
      .populate('userId', 'username email phoneNumber profilePicture accountType')
      .populate('verification.verifiedBy', 'username email')
      .sort({ [sort]: order })
      .skip(skip)
      .limit(limit);
    
    console.log(`Found ${subscriptions.length} subscriptions`);
    
    // Get total count for pagination
    const total = await Subscription.countDocuments(filter);
    
    // Add plan names to subscriptions
    const subscriptionService = require('../services/subscription.service');
    const subscriptionsWithPlanNames = await Promise.all(
      subscriptions.map(async (subscription) => {
        const subscriptionObj = subscription.toObject();
        subscriptionObj.planName = await subscriptionService.getPlanNameFromId(subscription.planId);
        return subscriptionObj;
      })
    );
    
    return res.status(200).json({
      subscriptions: subscriptionsWithPlanNames,
      pagination: {
        total,
        limit,
        skip,
        hasMore: skip + subscriptions.length < total
      }
    });
  } catch (error) {
    console.error('Error getting subscriptions:', error);
    return res.status(500).json({
      message: 'Error getting subscriptions',
      error: error.message
    });
  }
};

/**
 * Get reports data
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} - Response with reports data or error
 */
exports.getReports = async (req, res) => {
  try {
    const period = req.query.period || 'week';
    const now = new Date();
    let startDate;
    
    // Calculate start date based on period
    switch (period) {
      case 'day':
        startDate = new Date(now.setHours(0, 0, 0, 0));
        break;
      case 'week':
        startDate = new Date(now.setDate(now.getDate() - 7));
        break;
      case 'month':
        startDate = new Date(now.setMonth(now.getMonth() - 1));
        break;
      case 'year':
        startDate = new Date(now.setFullYear(now.getFullYear() - 1));
        break;
      default:
        startDate = new Date(now.setDate(now.getDate() - 7));
    }
    
    // Get ride statistics
    const completedRides = await Ride.countDocuments({
      status: 'completed',
      completionTime: { $gte: startDate }
    });
    
    const cancelledRides = await Ride.countDocuments({
      status: 'cancelled',
      cancellationTime: { $gte: startDate }
    });
    
    // Get subscription statistics
    const newSubscriptions = await Subscription.countDocuments({
      createdAt: { $gte: startDate }
    });
    
    const activeSubscriptions = await Subscription.countDocuments({
      isActive: true,
      expiryDate: { $gt: now }
    });
    
    // Get revenue (sum of subscription payments)
    const subscriptionRevenue = await Subscription.aggregate([
      {
        $match: {
          isActive: true,
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$paymentDetails.amount' }
        }
      }
    ]);
    
    const revenue = subscriptionRevenue.length > 0 ? subscriptionRevenue[0].total : 0;
    
    // Get monthly revenue for comparison
    const monthStartDate = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthlyRevenueAgg = await Subscription.aggregate([
      {
        $match: {
          isActive: true,
          createdAt: { $gte: monthStartDate }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$paymentDetails.amount' }
        }
      }
    ]);
    
    const monthlyRevenue = monthlyRevenueAgg.length > 0 ? monthlyRevenueAgg[0].total : 0;
    
    // Calculate average ride time
    const ridesWithDuration = await Ride.find({
      status: 'completed',
      completionTime: { $gte: startDate },
      duration: { $exists: true, $ne: null }
    });
    
    let averageRideTime = '0 min';
    if (ridesWithDuration.length > 0) {
      const totalDuration = ridesWithDuration.reduce((sum, ride) => sum + ride.duration, 0);
      const avgMinutes = Math.round(totalDuration / ridesWithDuration.length);
      averageRideTime = `${avgMinutes} min`;
    }
    
    // Get top routes
    const topRoutes = await Ride.aggregate([
      {
        $match: {
          status: 'completed',
          completionTime: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: '$routeId',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      },
      {
        $limit: 5
      }
    ]);
    
    // Populate route names
    const routeIds = topRoutes.map(route => route._id);
    const routes = await Route.find({ _id: { $in: routeIds } }, 'name');
    
    const topRoutesWithNames = topRoutes.map(route => {
      const routeData = routes.find(r => r._id.toString() === route._id.toString());
      return {
        routeId: route._id,
        name: routeData ? routeData.name : 'Unknown Route',
        count: route.count
      };
    });
    
    // Generate daily stats for the past week
    const dailyStats = [];
    if (period === 'week') {
      // Get data for each day of the week
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dayStart = new Date(date.setHours(0, 0, 0, 0));
        const dayEnd = new Date(date.setHours(23, 59, 59, 999));
        
        // Count completed rides for this day
        const dayCompletedRides = await Ride.countDocuments({
          status: 'completed',
          completionTime: { $gte: dayStart, $lte: dayEnd }
        });
        
        // Count cancelled rides for this day
        const dayCancelledRides = await Ride.countDocuments({
          status: 'cancelled',
          cancellationTime: { $gte: dayStart, $lte: dayEnd }
        });
        
        // Get revenue for this day
        const dayRevenueAgg = await Subscription.aggregate([
          {
            $match: {
              createdAt: { $gte: dayStart, $lte: dayEnd }
            }
          },
          {
            $group: {
              _id: null,
              total: { $sum: '$paymentDetails.amount' }
            }
          }
        ]);
        
        const dayRevenue = dayRevenueAgg.length > 0 ? dayRevenueAgg[0].total : 0;
        
        dailyStats.push({
          date: dayStart.toISOString().split('T')[0],
          completedRides: dayCompletedRides,
          cancelledRides: dayCancelledRides,
          revenue: dayRevenue
        });
      }
    }
    
    // Calculate revenue comparison
    // Get yesterday's revenue
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStart = new Date(yesterday.setHours(0, 0, 0, 0));
    const yesterdayEnd = new Date(yesterday.setHours(23, 59, 59, 999));
    
    const yesterdayRevenueAgg = await Subscription.aggregate([
      {
        $match: {
          createdAt: { $gte: yesterdayStart, $lte: yesterdayEnd }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$paymentDetails.amount' }
        }
      }
    ]);
    
    const yesterdayRevenue = yesterdayRevenueAgg.length > 0 ? yesterdayRevenueAgg[0].total : 0;
    
    // Get day before yesterday's revenue for comparison
    const dayBeforeYesterday = new Date();
    dayBeforeYesterday.setDate(dayBeforeYesterday.getDate() - 2);
    const dayBeforeStart = new Date(dayBeforeYesterday.setHours(0, 0, 0, 0));
    const dayBeforeEnd = new Date(dayBeforeYesterday.setHours(23, 59, 59, 999));
    
    const dayBeforeRevenueAgg = await Subscription.aggregate([
      {
        $match: {
          createdAt: { $gte: dayBeforeStart, $lte: dayBeforeEnd }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$paymentDetails.amount' }
        }
      }
    ]);
    
    const dayBeforeRevenue = dayBeforeRevenueAgg.length > 0 ? dayBeforeRevenueAgg[0].total : 0;
    
    // Calculate daily change percentage
    let dailyChange = 0;
    if (dayBeforeRevenue > 0) {
      dailyChange = Math.round(((yesterdayRevenue - dayBeforeRevenue) / dayBeforeRevenue) * 100);
    }
    
    // Get last month's revenue
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    const lastMonthStart = new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 1);
    const lastMonthEnd = new Date(lastMonth.getFullYear(), lastMonth.getMonth() + 1, 0, 23, 59, 59, 999);
    
    const lastMonthRevenueAgg = await Subscription.aggregate([
      {
        $match: {
          createdAt: { $gte: lastMonthStart, $lte: lastMonthEnd }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$paymentDetails.amount' }
        }
      }
    ]);
    
    const lastMonthRevenue = lastMonthRevenueAgg.length > 0 ? lastMonthRevenueAgg[0].total : 0;
    
    // Calculate monthly change percentage
    let monthlyChange = 0;
    if (lastMonthRevenue > 0) {
      monthlyChange = Math.round(((monthlyRevenue - lastMonthRevenue) / lastMonthRevenue) * 100);
    }
    
    return res.status(200).json({
      period,
      statistics: {
        completedRides,
        cancelledRides,
        newSubscriptions,
        activeSubscriptions,
        revenue,
        monthlyRevenue,
        averageRideTime
      },
      topRoutes: topRoutesWithNames,
      dailyStats,
      revenueComparison: {
        dailyChange,
        monthlyChange
      }
    });
  } catch (error) {
    console.error('Error getting reports data:', error);
    return res.status(500).json({
      message: 'Error retrieving reports data',
      error: error.message
    });
  }
};

/**
 * Remove a driver
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} - Response with success message or error
 */
exports.removeDriver = async (req, res) => {
  try {
    const { driverId } = req.params;
    const { deleteUser = false, disableReason } = req.body;
    
    // Find the driver
    const driver = await Driver.findById(driverId);
    if (!driver) {
      return res.status(404).json({
        message: 'Driver not found'
      });
    }
    
    // Get the user ID associated with this driver
    const userId = driver.userId;
    
    // Remove driver from any routes they might be assigned to
    if (driver.routeId) {
      const route = await Route.findById(driver.routeId);
      if (route) {
        route.drivers = route.drivers.filter(id => id.toString() !== driverId);
        await route.save();
      }
    }
    
    // Delete the driver
    await Driver.findByIdAndDelete(driverId);
    
    // Handle the user account based on the deleteUser parameter
    const user = await User.findById(userId);
    if (user) {
      if (deleteUser) {
        // Completely delete the user account
        await User.findByIdAndDelete(userId);
        return res.status(200).json({
          message: 'Driver and user account completely removed'
        });
      } else {
        // Disable the user account and change role to passenger
        user.role = 'passenger';
        user.isActive = false;
        user.disabledReason = disableReason || 'Account disabled by administrator';
        await user.save();
        
        return res.status(200).json({
          message: 'Driver removed and user account disabled',
          userId: userId
        });
      }
    }
    
    return res.status(200).json({
      message: 'Driver removed successfully'
    });
  } catch (error) {
    console.error('Error removing driver:', error);
    return res.status(500).json({
      message: 'Error removing driver',
      error: error.message
    });
  }
};

/**
 * Verify a driver
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} - Response with updated driver or error
 */
exports.verifyDriver = async (req, res) => {
  try {
    const { driverId } = req.params;
    
    // Call the driver service to verify the driver
    const driver = await driverService.verifyDriver(driverId, true);
    
    // Set verification date
    driver.verificationDate = new Date();
    await driver.save();
    
    return res.status(200).json({
      message: 'Driver verified successfully',
      driver
    });
  } catch (error) {
    console.error('Error verifying driver:', error);
    
    if (error.message === 'Driver not found') {
      return res.status(404).json({
        message: 'Driver not found'
      });
    }
    
    return res.status(500).json({
      message: 'Error verifying driver',
      error: error.message
    });
  }
}; 