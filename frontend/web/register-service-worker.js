// Register service worker for PWA functionality
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then(registration => {
        console.log('Service Worker registered with scope:', registration.scope);
      })
      .catch(error => {
        console.error('Service Worker registration failed:', error);
      });
  });
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