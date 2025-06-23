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

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useEffect(() => {
    // Hide the splash screen when the app is ready
    setTimeout(() => {
      SplashScreen.hideAsync();
    }, 1000);

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
      // Add meta tags
      const metaViewport = document.createElement('meta');
      metaViewport.name = 'viewport';
      metaViewport.content = 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no';
      document.head.appendChild(metaViewport);
      
      const metaThemeColor = document.createElement('meta');
      metaThemeColor.name = 'theme-color';
      metaThemeColor.content = '#4B6BFE';
      document.head.appendChild(metaThemeColor);
      
      const metaAppleMobileWebAppCapable = document.createElement('meta');
      metaAppleMobileWebAppCapable.name = 'apple-mobile-web-app-capable';
      metaAppleMobileWebAppCapable.content = 'yes';
      document.head.appendChild(metaAppleMobileWebAppCapable);
      
      const metaAppleMobileWebAppStatusBarStyle = document.createElement('meta');
      metaAppleMobileWebAppStatusBarStyle.name = 'apple-mobile-web-app-status-bar-style';
      metaAppleMobileWebAppStatusBarStyle.content = 'black-translucent';
      document.head.appendChild(metaAppleMobileWebAppStatusBarStyle);
      
      // Add manifest link
      const linkManifest = document.createElement('link');
      linkManifest.rel = 'manifest';
      linkManifest.href = '/manifest.json';
      document.head.appendChild(linkManifest);
      
      // Add apple touch icon
      const linkAppleTouchIcon = document.createElement('link');
      linkAppleTouchIcon.rel = 'apple-touch-icon';
      linkAppleTouchIcon.href = '/assets/images/PARAdalogo.jpg';
      document.head.appendChild(linkAppleTouchIcon);
      
      // Add service worker registration script
      const script = document.createElement('script');
      script.src = '/register-service-worker.js';
      script.defer = true;
      document.body.appendChild(script);
    }
  }, []);

  return (
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
  );
}
