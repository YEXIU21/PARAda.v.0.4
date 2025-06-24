// Register service worker for PWA functionality
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // Use a relative path that works in any deployment environment
    const swPath = '/service-worker.js';
    
    // Check if the service worker file exists before trying to register it
    fetch(swPath)
      .then(response => {
        if (!response.ok) {
          throw new Error(`Service worker file not found: ${response.status}`);
        }
        
        // File exists, proceed with registration
        return navigator.serviceWorker.register(swPath);
      })
      .then(registration => {
        console.log('Service Worker registered with scope:', registration.scope);
      })
      .catch(error => {
        console.warn('Service Worker registration failed:', error.message);
        // Don't throw an error that would break the app
      });
  });
} else {
  console.log('Service Worker is not supported in this browser');
}

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