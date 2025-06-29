import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet, Platform } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import NotificationService from '../components/NotificationService';
import { AuthProvider } from '../context/AuthContext';
import { ThemeProvider } from '../context/ThemeContext';
import ThemedStatusBar from '../components/ThemedStatusBar';
import PWAInstallPrompt from '../components/PWAInstallPrompt';
import { initializeSocket } from '../services/socket/socket.service';
import * as WebBrowser from 'expo-web-browser';
import ErrorBoundary from '../components/ErrorBoundary';
import { trackInstallation, getPlatformType } from '../services/api/installation.api';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useEffect(() => {
    // Check authentication status
    const checkAuth = async () => {
      try {
        // Check if we're on the landing page
        const isLandingPage = Platform.OS === 'web' && 
          window.location.pathname === '/' || 
          window.location.pathname === '/index.html';
        
        // If on landing page, don't redirect to login
        if (isLandingPage) {
          // Just hide the splash screen after a delay
          setTimeout(() => {
            SplashScreen.hideAsync().catch(err => {
              console.warn('Error hiding splash screen:', err);
            });
          }, 500);
          return;
        }
        
        // For other pages, check authentication
        const token = await AsyncStorage.getItem('token');
        const userDataString = await AsyncStorage.getItem('userData');
        
        if (!token || !userDataString) {
          // No token or user data, redirect to login after a delay
          setTimeout(() => {
            router.replace('/auth/login');
          }, 1000);
          return;
        }
        
        // Parse user data
        const userData = JSON.parse(userDataString);
        
        if (!userData || !userData.id) {
          // Invalid user data, redirect to login
          setTimeout(() => {
            router.replace('/auth/login');
          }, 1000);
          return;
        }
        
        // User is authenticated, initialize socket connection
        try {
          await initializeSocket();
          console.log('Socket connection initialized');
        } catch (error) {
          console.error('Failed to initialize socket:', error);
          // Continue even if socket initialization fails
        }
        
        // Hide the splash screen
        setTimeout(() => {
          SplashScreen.hideAsync().catch(err => {
            console.warn('Error hiding splash screen:', err);
          });
        }, 500);
      } catch (error) {
        console.error('Error checking auth:', error);
        // On error, redirect to login only if not on landing page
        const isLandingPage = Platform.OS === 'web' && 
          window.location.pathname === '/' || 
          window.location.pathname === '/index.html';
        
        if (!isLandingPage) {
          setTimeout(() => {
            router.replace('/auth/login');
          }, 1000);
        }
      }
    };
    
    // Track app installation with improved logic
    const trackAppInstallation = async () => {
      try {
        // Check if installation was tracked recently (within last 7 days)
        const lastTracked = await AsyncStorage.getItem('installationTrackedDate');
        const now = new Date().getTime();
        
        // If tracked within the last 7 days, don't track again
        if (lastTracked) {
          const lastTrackedTime = parseInt(lastTracked, 10);
          const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
          
          if (now - lastTrackedTime < sevenDaysMs) {
            console.log('Installation tracked recently, skipping');
            return;
          }
        }
        
        // Get platform type for better analytics
        const platformType = getPlatformType();
        
        // Track installation
        console.log(`Tracking app installation for platform: ${platformType}`);
        const result = await trackInstallation();
        
        // Store tracking date
        await AsyncStorage.setItem('installationTrackedDate', now.toString());
        
        console.log('Installation tracking result:', result);
        
        // For PWA installations, show a thank you message
        if (platformType === 'pwa' && Platform.OS === 'web') {
          // Check if this is a first-time PWA launch
          const isPwaFirstLaunch = await AsyncStorage.getItem('pwaFirstLaunch');
          
          if (!isPwaFirstLaunch && window.matchMedia('(display-mode: standalone)').matches) {
            // Mark as launched
            await AsyncStorage.setItem('pwaFirstLaunch', 'true');
            
            // Show welcome message (could be implemented as a modal or toast)
            console.log('First PWA launch detected!');
            
            // You could trigger a welcome modal here
          }
        }
      } catch (error) {
        console.error('Error tracking installation:', error);
      }
    };
    
    // Track installation after a short delay to ensure everything is loaded
    setTimeout(() => {
      trackAppInstallation();
    }, 2000);
    
    // Check auth status
    checkAuth();
    
  }, []);

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <ThemedStatusBar />
          <NotificationService>
            {Platform.OS === 'web' && <PWAInstallPrompt />}
            <Stack screenOptions={{ headerShown: false }} />
          </NotificationService>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
