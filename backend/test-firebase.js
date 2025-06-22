// Test Firebase service account credentials
const admin = require('firebase-admin');
const path = require('path');

try {
  // Load service account from file
  const serviceAccountPath = '../parada-3a6ae-firebase-adminsdk-fbsvc-68b259ec87.json';
  const resolvedPath = path.resolve(__dirname, serviceAccountPath);
  
  console.log('Loading service account from:', resolvedPath);
  const serviceAccount = require(resolvedPath);
  
  // Initialize Firebase Admin SDK
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
  
  console.log('Firebase Admin SDK initialized successfully!');
  console.log('Project ID:', serviceAccount.project_id);
  
  // Try to access Firebase Messaging
  const messaging = admin.messaging();
  console.log('Firebase Messaging is available');
  
} catch (error) {
  console.error('Error initializing Firebase Admin SDK:', error);
} 