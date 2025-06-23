// Register service worker for PWA functionality
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    try {
      // Use the correct path for service worker
      const swPath = '/service-worker.js';
      
      // Check if service worker is already registered
      navigator.serviceWorker.getRegistration()
        .then(registration => {
          if (registration && registration.scope.includes(window.location.origin)) {
            console.log('Service Worker already registered with scope:', registration.scope);
            return registration;
          } else {
            // Register new service worker
            return navigator.serviceWorker.register(swPath);
          }
        })
        .then(registration => {
          console.log('Service Worker registered with scope:', registration.scope);
          
          // Update service worker if needed
          registration.update();
        })
        .catch(error => {
          console.error('Service Worker registration failed:', error);
        });
    } catch (error) {
      console.error('Error during service worker registration:', error);
    }
  });
}

// Add a custom event to trigger PWA installation
let deferredPrompt;
const pwaInstallEvent = new Event('pwaInstallAvailable');

try {
  window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent Chrome 67 and earlier from automatically showing the prompt
    e.preventDefault();
    // Stash the event so it can be triggered later
    deferredPrompt = e;
    // Notify the app that installation is available
    window.dispatchEvent(pwaInstallEvent);
    console.log('PWA installation is available');
  });
} catch (error) {
  console.error('Error setting up beforeinstallprompt listener:', error);
}

// Function to programmatically trigger the PWA install prompt
window.triggerPWAInstall = async () => {
  try {
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
  } catch (error) {
    console.error('Error during PWA installation:', error);
    return false;
  }
};

// Add this to the window object so it can be accessed from anywhere
window.isPWAInstalled = () => {
  try {
    return window.matchMedia('(display-mode: standalone)').matches ||
           (window.navigator.standalone === true);
  } catch (error) {
    console.error('Error checking if PWA is installed:', error);
    return false;
  }
}; 