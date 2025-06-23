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
        if (storedUser && Platform.OS === 'web') {
          const pathname = typeof window !== 'undefined' ? window.location.pathname : '';
          if (pathname === '/' || pathname === '/auth/login') {
            router.replace('/(tabs)');
            
            // Initialize socket connection for logged-in users
            try {
              await initializeSocket();
              console.log('Socket connection initialized');
            } catch (socketError) {
              console.error('Failed to initialize socket:', socketError);
            }
          }
        }
      } catch (error) {
        console.error('Error checking auth status:', error);
      }
    };

    checkAuthStatus();

    // Add PWA meta tags and script for web platform
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      try {
        // Add meta tags
        const addMetaTag = (name: string, content: string) => {
          // Check if meta tag already exists
          let metaTag = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement | null;
          if (!metaTag) {
            metaTag = document.createElement('meta');
            metaTag.name = name;
            metaTag.content = content;
            document.head.appendChild(metaTag);
          } else {
            metaTag.content = content;
          }
        };
        
        addMetaTag('viewport', 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no');
        addMetaTag('theme-color', '#4B6BFE');
        addMetaTag('apple-mobile-web-app-capable', 'yes');
        addMetaTag('apple-mobile-web-app-status-bar-style', 'black-translucent');
        
        // Add manifest link if it doesn't exist
        if (!document.querySelector('link[rel="manifest"]')) {
          const linkManifest = document.createElement('link');
          linkManifest.rel = 'manifest';
          linkManifest.href = '/manifest.json';
          document.head.appendChild(linkManifest);
        }
        
        // Add apple touch icon if it doesn't exist
        if (!document.querySelector('link[rel="apple-touch-icon"]')) {
          const linkAppleTouchIcon = document.createElement('link');
          linkAppleTouchIcon.rel = 'apple-touch-icon';
          linkAppleTouchIcon.href = '/assets/images/PARAdalogo.jpg';
          document.head.appendChild(linkAppleTouchIcon);
        }
        
        // Add service worker registration script if it doesn't exist
        if (!document.querySelector('script[src="/register-service-worker.js"]')) {
          const script = document.createElement('script');
          script.src = '/register-service-worker.js';
          script.defer = true;
          document.body.appendChild(script);
        }
      } catch (error) {
        console.error('Error setting up PWA elements:', error);
      }
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
          {Platform.OS === 'web' && typeof window !== 'undefined' && window.location.pathname !== '/' && <PWAInstallPrompt />}
        </NotificationService>
      </ThemeProvider>
    </AuthProvider>
  );
}
