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

    // Register service worker for PWA support (web only)
    if (Platform.OS === 'web' && 'serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/service-worker.js')
          .then(registration => {
            console.log('Service Worker registered with scope:', registration.scope);
          })
          .catch(error => {
            console.error('Service Worker registration failed:', error);
          });
      });
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
