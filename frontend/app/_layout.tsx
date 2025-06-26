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

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useEffect(() => {
    // Preload the PARAda-Logo.png image to ensure it's ready when needed
    if (Platform.OS === 'web') {
      // Preload the logo image
      const logoImg = new window.Image();
      logoImg.src = '/assets/images/PARAda-Logo.png';
      logoImg.onload = () => {
        console.log('Logo image preloaded');
      };
      
      // Also preload the splash screen image
      const splashImg = new window.Image();
      splashImg.src = '/assets/images/adaptive-icon.png';
      splashImg.onload = () => {
        console.log('Splash screen image preloaded');
      };
    }
    
    // Hide the splash screen when the app is ready
    setTimeout(() => {
      SplashScreen.hideAsync().catch(err => {
        console.warn('Error hiding splash screen:', err);
      });
    }, 1500); // Increased timeout to ensure resources are loaded

    // Check if user is logged in and redirect if necessary
    const checkAuthStatus = async () => {
      try {
        const storedUser = await AsyncStorage.getItem('user');
        
        // If we have a user in storage and we're on the landing page, redirect to the app
        if (storedUser && (window.location.pathname === '/' || window.location.pathname === '/auth/login')) {
          router.replace('/(tabs)');
          
          // Initialize socket connection for logged-in users
          try {
            await initializeSocket();
            console.log('Socket connection initialized');
          } catch (socketError) {
            console.error('Failed to initialize socket:', socketError);
          }
        }
      } catch (error) {
        console.error('Error checking auth status:', error);
      }
    };

    checkAuthStatus();

    // Add PWA meta tags and script for web platform
    if (Platform.OS === 'web') {
      // Check if meta tags already exist
      const existingViewport = document.querySelector('meta[name="viewport"]');
      const existingThemeColor = document.querySelector('meta[name="theme-color"]');
      const existingAppleMobile = document.querySelector('meta[name="apple-mobile-web-app-capable"]');
      const existingStatusBar = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]');
      const existingMobileWeb = document.querySelector('meta[name="mobile-web-app-capable"]');
      
      // Only add viewport meta if it doesn't exist
      if (!existingViewport) {
        const metaViewport = document.createElement('meta');
        metaViewport.name = 'viewport';
        metaViewport.content = 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no';
        document.head.appendChild(metaViewport);
      }
      
      // Only add theme-color meta if it doesn't exist
      if (!existingThemeColor) {
        const metaThemeColor = document.createElement('meta');
        metaThemeColor.name = 'theme-color';
        metaThemeColor.content = '#4B6BFE';
        document.head.appendChild(metaThemeColor);
      }
      
      // Only add apple-mobile-web-app-capable meta if it doesn't exist
      if (!existingAppleMobile) {
        const metaAppleMobileWebAppCapable = document.createElement('meta');
        metaAppleMobileWebAppCapable.name = 'apple-mobile-web-app-capable';
        metaAppleMobileWebAppCapable.content = 'yes';
        document.head.appendChild(metaAppleMobileWebAppCapable);
      }
      
      // Only add apple-mobile-web-app-status-bar-style meta if it doesn't exist
      if (!existingStatusBar) {
        const metaAppleMobileWebAppStatusBarStyle = document.createElement('meta');
        metaAppleMobileWebAppStatusBarStyle.name = 'apple-mobile-web-app-status-bar-style';
        metaAppleMobileWebAppStatusBarStyle.content = 'black-translucent';
        document.head.appendChild(metaAppleMobileWebAppStatusBarStyle);
      }
      
      // Add mobile-web-app-capable meta if it doesn't exist (to fix the warning)
      if (!existingMobileWeb) {
        const metaMobileWebAppCapable = document.createElement('meta');
        metaMobileWebAppCapable.name = 'mobile-web-app-capable';
        metaMobileWebAppCapable.content = 'yes';
        document.head.appendChild(metaMobileWebAppCapable);
      }
      
      // Check if manifest link already exists
      const existingManifest = document.querySelector('link[rel="manifest"]');
      if (!existingManifest) {
        // Add manifest link
        const linkManifest = document.createElement('link');
        linkManifest.rel = 'manifest';
        linkManifest.href = '/manifest.json';
        document.head.appendChild(linkManifest);
      }
      
      // Add favicon link if it doesn't exist
      const existingFavicon = document.querySelector('link[rel="icon"]');
      if (!existingFavicon) {
        const linkFavicon = document.createElement('link');
        linkFavicon.rel = 'icon';
        linkFavicon.href = '/assets/images/favicon.ico';
        document.head.appendChild(linkFavicon);
      }
      
      // Add service worker registration script if it doesn't exist
      const existingServiceWorkerScript = document.querySelector('script[src="/register-service-worker.js"]');
      if (!existingServiceWorkerScript) {
        const script = document.createElement('script');
        script.src = '/register-service-worker.js';
        script.defer = true;
        document.body.appendChild(script);
      }
    }
  }, []);

  return (
    <ErrorBoundary>
      <AuthProvider>
        <ThemeProvider>
          <NotificationService>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="index" options={{ headerShown: false }} />
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="+not-found" options={{ title: 'Not Found', headerShown: true }} />
              <Stack.Screen name="auth/login" options={{ title: 'Login' }} />
              <Stack.Screen name="auth/register" options={{ title: 'Register' }} />
            </Stack>
            <ThemedStatusBar />
            {/* Only show PWA install prompt on pages other than landing page */}
            {Platform.OS === 'web' && window.location.pathname !== '/' && <PWAInstallPrompt />}
          </NotificationService>
        </ThemeProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
