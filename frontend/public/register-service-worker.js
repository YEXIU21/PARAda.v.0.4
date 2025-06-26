// register-service-worker.js
// This script registers both the PWA service worker and the notification service worker

// Add a custom event to trigger PWA installation
let deferredPrompt;
const pwaInstallEvent = new Event('pwaInstallAvailable');

window.addEventListener('beforeinstallprompt', (e) => {
  // Prevent Chrome 67 and earlier from automatically showing the prompt
  e.preventDefault();
  // Stash the event so it can be triggered later
  deferredPrompt = e;
  // Notify the app that installation is available
  window.dispatchEvent(pwaInstallEvent);
  console.log('PWA installation is available');
});

// Function to programmatically trigger the PWA install prompt
window.triggerPWAInstall = async () => {
  if (deferredPrompt) {
    // Show the install prompt
    deferredPrompt.prompt();
    
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User ${outcome} the installation`);
    
    // We've used the prompt, and can't use it again, discard it
    deferredPrompt = null;
    
    return outcome === 'accepted';
  }
  return false;
};

// Add this to the window object so it can be accessed from anywhere
window.isPWAInstalled = () => {
  return window.matchMedia('(display-mode: standalone)').matches ||
         window.navigator.standalone === true;
};

// Check if service workers are supported
if ('serviceWorker' in navigator) {
  window.addEventListener('load', function() {
    // Register the main service worker for PWA functionality
    navigator.serviceWorker.register('/service-worker.js')
      .then(function(registration) {
        console.log('PWA Service Worker registered with scope:', registration.scope);
      })
      .catch(function(error) {
        console.error('PWA Service Worker registration failed:', error);
      });
      
    // Register the notification worker for browser notifications
    navigator.serviceWorker.register('/notification-worker.js')
      .then(function(registration) {
        console.log('Notification Service Worker registered with scope:', registration.scope);
        
        // Request notification permission if we haven't asked yet
        if ('Notification' in window && Notification.permission !== 'granted' && Notification.permission !== 'denied') {
          setTimeout(function() {
            Notification.requestPermission().then(function(permission) {
              if (permission === 'granted') {
                console.log('Notification permission granted!');
                
                // Store permission in localStorage
                localStorage.setItem('notificationPermission', 'granted');
                
                // Send a welcome notification
                if (registration.active) {
                  registration.showNotification('Welcome to PARAda', {
                    body: 'You will now receive notifications for important updates.',
                    icon: '/assets/images/PARAda-Logo.png',
                    badge: '/assets/images/notification-badge.png'
                  });
                }
              } else {
                console.log('Notification permission denied');
                localStorage.setItem('notificationPermission', 'denied');
              }
            });
          }, 5000); // Ask after 5 seconds to allow the app to load first
        }
      })
      .catch(function(error) {
        console.error('Notification Service Worker registration failed:', error);
      });
  });
}

// Add a badge counter updater
if ('serviceWorker' in navigator) {
  // Poll for notification counts every 30 seconds
  setInterval(function() {
    // Get auth token from localStorage
    const token = localStorage.getItem('token');
    if (!token) return;

    // Make API request to get unread count
    fetch('/api/notifications/unread-count', {
      headers: {
        'x-access-token': token
      }
    })
    .then(response => {
      // Check if response is OK before parsing JSON
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      // Ensure data.count is a valid number
      const count = data && typeof data.count === 'number' ? data.count : 0;
      
      // Update document title
      const originalTitle = 'PARAda Admin Dashboard';
      document.title = count > 0 ? `(${count}) ${originalTitle}` : originalTitle;
      
      // Store count in localStorage
      localStorage.setItem('notification_unread_count', count.toString());
      
      // Trigger custom event that components can listen for
      window.dispatchEvent(new CustomEvent('notificationCountUpdated', { 
        detail: { count } 
      }));
      
      // Update favicon badge with a data attribute
      const favicon = document.querySelector('link[rel="icon"]');
      if (favicon) {
        favicon.setAttribute('data-badge', count.toString());
      }
    })
    .catch(error => {
      console.error('Error fetching notification count:', error);
      
      // Try to get count from localStorage as fallback
      const storedCount = localStorage.getItem('notification_unread_count');
      if (storedCount) {
        const count = parseInt(storedCount);
        // Update document title with stored count
        const originalTitle = 'PARAda Admin Dashboard';
        document.title = count > 0 ? `(${count}) ${originalTitle}` : originalTitle;
      }
    });
  }, 30000); // 30 seconds
} 