/**
 * Push Notification Service
 * Handles sending push notifications via Firebase Cloud Messaging
 */
const admin = require('firebase-admin');
const fetch = require('node-fetch');
const User = require('../models/user.model');
const fs = require('fs');
const path = require('path');

/**
 * Push Notification Service
 * Handles sending push notifications to users
 */

// Initialize Firebase Admin SDK
let initialized = false;
const initializeFirebaseAdmin = () => {
  if (!initialized) {
    try {
      // First try to load service account from file path
      const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
      
      if (serviceAccountPath) {
        try {
          // Resolve path relative to current directory
          const resolvedPath = path.resolve(__dirname, '..', '..', serviceAccountPath.replace('../', ''));
          
          if (fs.existsSync(resolvedPath)) {
            const serviceAccount = require(resolvedPath);
            admin.initializeApp({
              credential: admin.credential.cert(serviceAccount)
            });
            initialized = true;
            console.log('Firebase Admin SDK initialized with service account from file:', resolvedPath);
            return;
          } else {
            console.warn(`Service account file not found at: ${resolvedPath}`);
          }
        } catch (error) {
          console.error('Error loading Firebase service account from file:', error);
        }
      }
      
      // Fallback to application default credentials
      try {
        admin.initializeApp({
          credential: admin.credential.applicationDefault()
        });
        initialized = true;
        console.log('Firebase Admin SDK initialized with application default credentials');
      } catch (error) {
        // Fallback to environment variable if available
        try {
          const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || '{}');
          if (serviceAccount.project_id) {
            admin.initializeApp({
              credential: admin.credential.cert(serviceAccount)
            });
            initialized = true;
            console.log('Firebase Admin SDK initialized with service account from environment variable');
          } else {
            console.error('No valid Firebase service account found in environment variables');
          }
        } catch (e) {
          console.error('Error initializing Firebase Admin SDK:', e);
        }
      }
    } catch (error) {
      console.error('Failed to initialize Firebase Admin SDK:', error);
    }
  }
  
  return initialized;
};

/**
 * Send notification to a specific user
 * @param {string} userId - User ID
 * @param {Object} notification - Notification object with title, body, etc.
 * @returns {Promise<Object>} - Response with success or error info
 */
async function sendToUser(userId, notification) {
  try {
    // Find user and get push tokens
    const user = await User.findById(userId);
    
    if (!user || !user.pushTokens || user.pushTokens.length === 0) {
      return {
        success: false,
        message: 'User has no registered push tokens'
      };
    }

    // Send to all user's tokens
    const results = await Promise.all(
      user.pushTokens.map(token => {
        // Determine if token is FCM or Expo
        if (token.startsWith('ExponentPushToken:') || token.startsWith('ExpoPushToken[')) {
          return sendToExpoToken(token, notification);
        } else {
          return sendToFCMToken(token, notification);
        }
      })
    );

    return {
      success: true,
      results
    };
  } catch (error) {
    console.error('Error sending push notification to user:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Send notification to multiple users
 * @param {string[]} userIds - Array of User IDs
 * @param {Object} notification - Notification object
 * @returns {Promise<Object>} - Response with success or error info
 */
async function sendToUsers(userIds, notification) {
  try {
    // Find users and get their tokens
    const users = await User.find({ _id: { $in: userIds } });
    
    if (!users || users.length === 0) {
      return {
        success: false,
        message: 'No users found'
      };
    }

    // Collect all tokens
    const results = [];
    
    for (const user of users) {
      if (user.pushTokens && user.pushTokens.length > 0) {
        const userResults = await Promise.all(
          user.pushTokens.map(token => {
            // Determine if token is FCM or Expo
            if (token.startsWith('ExponentPushToken:') || token.startsWith('ExpoPushToken[')) {
              return sendToExpoToken(token, notification);
            } else {
              return sendToFCMToken(token, notification);
            }
          })
        );
        
        results.push({
          userId: user._id,
          results: userResults
        });
      }
    }

    return {
      success: true,
      results
    };
  } catch (error) {
    console.error('Error sending push notifications to users:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Send notification to users with a specific role
 * @param {string} role - User role ('admin', 'driver', 'passenger')
 * @param {Object} notification - Notification object
 * @returns {Promise<Object>} - Response with success or error info
 */
async function sendToRole(role, notification) {
  try {
    // Find users with the specified role
    const users = await User.find({ role });
    
    if (!users || users.length === 0) {
      return {
        success: false,
        message: `No users found with role: ${role}`
      };
    }

    // Extract user IDs
    const userIds = users.map(user => user._id);
    
    // Send to all users with this role
    return sendToUsers(userIds, notification);
  } catch (error) {
    console.error(`Error sending push notifications to ${role} users:`, error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Send notification to a specific token
 * @param {string} token - Push notification token
 * @param {Object} notification - Notification object
 * @returns {Promise<Object>} - Response with success or error info
 */
async function sendToToken(token, notification) {
  try {
    // Determine if token is FCM or Expo
    if (token.startsWith('ExponentPushToken:') || token.startsWith('ExpoPushToken[')) {
      return sendToExpoToken(token, notification);
    } else {
      return sendToFCMToken(token, notification);
    }
  } catch (error) {
    console.error('Error sending push notification to token:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Send notification to FCM token using Firebase Admin SDK
 * @param {string} token - FCM token
 * @param {Object} notification - Notification object
 * @returns {Promise<Object>} - Response with success or error info
 */
async function sendToFCMToken(token, notification) {
  try {
    // Ensure Firebase Admin SDK is initialized
    initializeFirebaseAdmin();
    
    if (!initialized) {
      throw new Error('Firebase Admin SDK not initialized');
    }

    // Format the message for FCM
    const message = {
      token,
      notification: {
        title: notification.title || 'PARAda Notification',
        body: notification.body || notification.message || '',
      },
      data: notification.data || {},
      android: {
        priority: 'high',
        notification: {
          channelId: 'default',
        },
      },
      apns: {
        payload: {
          aps: {
            contentAvailable: true,
            sound: 'default',
          },
        },
      },
    };

    // Send the message
    const response = await admin.messaging().send(message);
    
    return {
      success: true,
      messageId: response
    };
  } catch (error) {
    console.error('Error sending FCM notification:', error);
    
    // Handle token not registered error
    if (error.code === 'messaging/registration-token-not-registered') {
      // You might want to remove the token from the user
      try {
        await User.updateMany(
          { pushTokens: token },
          { $pull: { pushTokens: token } }
        );
        console.log(`Removed invalid token: ${token}`);
      } catch (err) {
        console.error('Error removing invalid token:', err);
      }
    }
    
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Send notification to Expo token
 * @param {string} token - Expo token
 * @param {Object} notification - Notification object
 * @returns {Promise<Object>} - Response with success or error info
 */
async function sendToExpoToken(token, notification) {
  try {
    // Clean the token if it has format ExpoPushToken[xxx]
    const cleanToken = token.replace(/^ExpoPushToken\[|\]$/g, '');
    
    // Prepare the message
    const message = {
      to: cleanToken,
      sound: 'default',
      title: notification.title || 'PARAda Notification',
      body: notification.body || notification.message || '',
      data: notification.data || {},
    };

    // Send the notification
    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });

    const result = await response.json();
    
    if (result.errors && result.errors.length > 0) {
      throw new Error(result.errors[0]);
    }
    
    return {
      success: true,
      data: result.data
    };
  } catch (error) {
    console.error('Error sending Expo notification:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

module.exports = {
  initializeFirebaseAdmin,
  sendToUser,
  sendToUsers,
  sendToRole,
  sendToToken,
  sendToFCMToken,
  sendToExpoToken
}; 