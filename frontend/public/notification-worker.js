// Service Worker for Notification Handling
self.addEventListener('install', function(event) {
  console.log('Notification Service Worker installed');
});

self.addEventListener('activate', function(event) {
  console.log('Notification Service Worker activated');
});

// Handle push notifications
self.addEventListener('push', function(event) {
  if (!event.data) return;
  
  try {
    const data = event.data.json();
    
    // Show notification with the provided data
    const title = data.title || 'PARAda Notification';
    const options = {
      body: data.message || 'You have a new notification',
      icon: '/assets/images/PARAda-Logo.png',
      badge: '/assets/images/notification-badge.png',
      data: data.data || {},
      tag: data.tag || 'default',
      vibrate: [100, 50, 100]
    };
    
    event.waitUntil(self.registration.showNotification(title, options));
  } catch (error) {
    console.error('Error processing push notification:', error);
  }
});

// Handle notification clicks
self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  
  // Get custom data from the notification
  const data = event.notification.data || {};
  
  // Create URL to navigate to based on notification data
  let navigateUrl = '/admin/notifications';
  
  if (data.type === 'subscription') {
    navigateUrl = '/admin/subscriptions';
  } else if (data.type === 'payment') {
    navigateUrl = '/admin/payments';
  } else if (data.type === 'user') {
    navigateUrl = '/admin/users';
  } else if (data.type === 'system') {
    navigateUrl = '/admin/dashboard';
  }
  
  // Add notification ID as a query parameter if available
  if (data.notificationId) {
    navigateUrl += `?highlight=${data.notificationId}`;
  }
  
  // Navigate to the URL when the notification is clicked
  const openPage = function() {
    const urlToOpen = new URL(navigateUrl, self.location.origin).href;
    
    // Try to focus on an existing window first
    return clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    }).then((windowClients) => {
      // Check if there's already a window/tab open with our URL
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        // If we found our URL, just focus it
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      
      // If not, open a new one
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    });
  };
  
  event.waitUntil(openPage());
});

// Background sync for offline notifications
self.addEventListener('sync', function(event) {
  if (event.tag === 'sync-notifications') {
    event.waitUntil(syncNotifications());
  }
});

// Function to sync notifications with the server when online
async function syncNotifications() {
  try {
    const pendingNotifications = await getPendingNotifications();
    
    if (pendingNotifications.length > 0) {
      const baseUrl = self.location.origin;
      
      for (const notification of pendingNotifications) {
        try {
          // Mark notification as read on the server
          await fetch(`${baseUrl}/api/notifications/${notification.id}/read`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'x-access-token': notification.token
            }
          });
          
          // Remove from pending notifications
          await removePendingNotification(notification.id);
        } catch (error) {
          console.error(`Error syncing notification ${notification.id}:`, error);
        }
      }
    }
  } catch (error) {
    console.error('Error in syncNotifications:', error);
  }
}

// Helper function to get pending notifications from IndexedDB
async function getPendingNotifications() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('PARadaNotifications', 1);
    
    request.onerror = event => {
      reject('Error opening database');
    };
    
    request.onupgradeneeded = event => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('pendingNotifications')) {
        db.createObjectStore('pendingNotifications', { keyPath: 'id' });
      }
    };
    
    request.onsuccess = event => {
      const db = event.target.result;
      const transaction = db.transaction(['pendingNotifications'], 'readonly');
      const store = transaction.objectStore('pendingNotifications');
      const getAllRequest = store.getAll();
      
      getAllRequest.onsuccess = () => {
        resolve(getAllRequest.result);
      };
      
      getAllRequest.onerror = () => {
        reject('Error getting pending notifications');
      };
    };
  });
}

// Helper function to remove a pending notification from IndexedDB
async function removePendingNotification(id) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('PARadaNotifications', 1);
    
    request.onerror = event => {
      reject('Error opening database');
    };
    
    request.onsuccess = event => {
      const db = event.target.result;
      const transaction = db.transaction(['pendingNotifications'], 'readwrite');
      const store = transaction.objectStore('pendingNotifications');
      const deleteRequest = store.delete(id);
      
      deleteRequest.onsuccess = () => {
        resolve();
      };
      
      deleteRequest.onerror = () => {
        reject('Error removing pending notification');
      };
    };
  });
} 