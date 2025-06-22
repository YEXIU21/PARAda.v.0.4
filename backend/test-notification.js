// Test sending a notification with Firebase Cloud Messaging
const admin = require('firebase-admin');
const path = require('path');

async function testSendNotification() {
  try {
    // Initialize Firebase Admin SDK if not already initialized
    if (admin.apps.length === 0) {
      const serviceAccountPath = '../parada-3a6ae-firebase-adminsdk-fbsvc-68b259ec87.json';
      const resolvedPath = path.resolve(__dirname, serviceAccountPath);
      
      console.log('Loading service account from:', resolvedPath);
      const serviceAccount = require(resolvedPath);
      
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
      
      console.log('Firebase Admin SDK initialized successfully!');
    }
    
    // Create a message to send
    // Note: To send a real notification, you would need a valid FCM token
    // This is just for testing the API connection
    const message = {
      notification: {
        title: 'Hello from PARAda',
        body: 'This is a test notification',
      },
      topic: 'test', // Send to devices subscribed to the 'test' topic
    };
    
    console.log('Attempting to send notification...');
    const response = await admin.messaging().send(message);
    console.log('Notification sent successfully:', response);
    
  } catch (error) {
    console.error('Error sending notification:', error);
    
    // Additional error debugging
    if (error.code) {
      console.error('Error code:', error.code);
    }
    if (error.message) {
      console.error('Error message:', error.message);
    }
  }
}

// Run the test
testSendNotification(); 