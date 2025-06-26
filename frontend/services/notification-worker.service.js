/**
 * Notification Worker Service
 * Handles the registration and management of the service worker for notifications
 */

// Check if service workers are supported
export const isServiceWorkerSupported = () => {
  return 'serviceWorker' in navigator;
};

// Check if browser notifications are supported
export const isNotificationSupported = () => {
  return 'Notification' in window;
};

// Register the service worker
export const registerServiceWorker = async () => {
  if (!isServiceWorkerSupported()) {
    console.warn('Service workers are not supported in this browser');
    return false;
  }
  
  try {
    const registration = await navigator.serviceWorker.register('/notification-worker.js');
    console.log('Notification Service Worker registered with scope:', registration.scope);
    return true;
  } catch (error) {
    console.error('Service Worker registration failed:', error);
    return false;
  }
};

// Request notification permission
export const requestNotificationPermission = async () => {
  if (!isNotificationSupported()) {
    console.warn('Notifications are not supported in this browser');
    return false;
  }
  
  try {
    const result = await Notification.requestPermission();
    const granted = result === 'granted';
    
    // If permission was granted, register the service worker
    if (granted) {
      await registerServiceWorker();
    }
    
    return granted;
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return false;
  }
};

// Check if we have notification permission
export const checkNotificationPermission = () => {
  if (!isNotificationSupported()) {
    return false;
  }
  
  return Notification.permission === 'granted';
};

// Show a test notification
export const showTestNotification = () => {
  if (!checkNotificationPermission()) {
    console.warn('Notification permission not granted');
    return false;
  }
  
  try {
    const notification = new Notification('PARAda Test Notification', {
      body: 'This is a test notification from PARAda',
      icon: '/assets/images/PARAda-Logo.png',
      badge: '/assets/images/notification-badge.png',
    });
    
    notification.onclick = () => {
      console.log('Notification clicked');
      window.focus();
      notification.close();
    };
    
    return true;
  } catch (error) {
    console.error('Error showing notification:', error);
    return false;
  }
};

// Store notification data for offline use
export const storeNotificationForOffline = (notification) => {
  if (!isServiceWorkerSupported()) {
    return false;
  }
  
  return new Promise((resolve, reject) => {
    // Open or create the IndexedDB database
    const request = indexedDB.open('PARadaNotifications', 1);
    
    request.onerror = () => {
      console.error('Error opening IndexedDB');
      reject('Error opening IndexedDB');
    };
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      
      // Create an object store for pending notifications if it doesn't exist
      if (!db.objectStoreNames.contains('pendingNotifications')) {
        db.createObjectStore('pendingNotifications', { keyPath: 'id' });
      }
    };
    
    request.onsuccess = (event) => {
      const db = event.target.result;
      const transaction = db.transaction(['pendingNotifications'], 'readwrite');
      const store = transaction.objectStore('pendingNotifications');
      
      // Add the notification to the store
      const addRequest = store.add(notification);
      
      addRequest.onsuccess = () => {
        console.log('Notification stored for offline use');
        
        // Try to trigger a sync event if the sync manager is available
        if ('serviceWorker' in navigator && 'SyncManager' in window) {
          navigator.serviceWorker.ready
            .then(registration => registration.sync.register('sync-notifications'))
            .then(() => {
              console.log('Sync registered for offline notifications');
              resolve(true);
            })
            .catch(error => {
              console.error('Error registering sync:', error);
              resolve(true); // Still resolve as we've saved the notification
            });
        } else {
          resolve(true);
        }
      };
      
      addRequest.onerror = () => {
        console.error('Error storing notification');
        reject('Error storing notification');
      };
    };
  });
};

// Initialize notifications system
export const initializeNotifications = async () => {
  // Register service worker first
  if (isServiceWorkerSupported()) {
    await registerServiceWorker();
  }
  
  // Check notification permissions
  const hasPermission = checkNotificationPermission();
  
  return {
    serviceWorkerSupported: isServiceWorkerSupported(),
    notificationSupported: isNotificationSupported(),
    hasPermission: hasPermission
  };
};

export default {
  isServiceWorkerSupported,
  isNotificationSupported,
  registerServiceWorker,
  requestNotificationPermission,
  checkNotificationPermission,
  showTestNotification,
  storeNotificationForOffline,
  initializeNotifications
}; 