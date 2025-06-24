import React, { useEffect, useRef, useState, createContext, useContext } from 'react';
import * as Notifications from 'expo-notifications';
import { Platform, Alert, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FontAwesome5 } from '@expo/vector-icons';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Create a context for notification state
interface NotificationContextType {
  hasPermission: boolean;
  requestPermission: () => Promise<boolean>;
  isWebNotificationSupported: boolean;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

// Custom hook to use notification context
export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

interface NotificationServiceProps {
  children: React.ReactNode;
}

export default function NotificationService({ children }: NotificationServiceProps) {
  const notificationListener = useRef<any>();
  const responseListener = useRef<any>();
  const [hasPermission, setHasPermission] = useState<boolean>(false);
  const [isWebNotificationSupported, setIsWebNotificationSupported] = useState<boolean>(false);

  // Check for web notification support
  useEffect(() => {
    if (Platform.OS === 'web') {
      const isSupported = 'Notification' in window;
      setIsWebNotificationSupported(isSupported);
      
      if (isSupported) {
        // Check if permission is already granted
        const permission = (window as any).Notification.permission;
        setHasPermission(permission === 'granted');
        
        // Store permission status
        AsyncStorage.setItem('webNotificationPermission', permission);
      }
    }
  }, []);

  useEffect(() => {
    registerForPushNotifications();

    // This listener is fired whenever a notification is received while the app is foregrounded
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received:', notification);
    });

    // This listener is fired whenever a user taps on or interacts with a notification
    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification response received:', response);
      // Handle notification interaction here
    });

    // Check for pending web notifications on startup (for web only)
    if (Platform.OS === 'web') {
      checkPendingWebNotifications();
    }

    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, []);

  // Check for any pending notifications stored in localStorage
  const checkPendingWebNotifications = () => {
    if (Platform.OS === 'web' && 'localStorage' in window) {
      const now = Date.now();
      
      // Scan localStorage for notification entries
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('notification_')) {
          try {
            const timeStr = localStorage.getItem(key);
            if (timeStr) {
              const time = parseInt(timeStr);
              
              // If the notification time has passed, show it now
              if (time <= now) {
                const vehicleName = key.replace('notification_', '');
                
                // Show the notification if permission is granted
                if ((window as any).Notification.permission === 'granted') {
                  new (window as any).Notification('Vehicle Approaching', {
                    body: `${vehicleName} is arriving now`,
                    icon: '/assets/images/PARAda-Logo.png'
                  });
                }
                
                // Remove the entry
                localStorage.removeItem(key);
              } else {
                // Schedule the notification for the future
                const vehicleName = key.replace('notification_', '');
                const delay = time - now;
                
                setTimeout(() => {
                  if ((window as any).Notification.permission === 'granted') {
                    new (window as any).Notification('Vehicle Approaching', {
                      body: `${vehicleName} is arriving now`,
                      icon: '/assets/images/PARAda-Logo.png'
                    });
                    localStorage.removeItem(key);
                  }
                }, delay);
              }
            }
          } catch (error) {
            console.error('Error processing stored notification:', error);
            localStorage.removeItem(key);
          }
        }
      }
    }
  };

  const registerForPushNotifications = async () => {
    try {
      // Skip for web platform - we handle web notifications separately
      if (Platform.OS === 'web') {
        console.log('Using web notification system instead of Expo push notifications');
        return;
      }

      // Request permission for native platforms
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus === 'granted') {
        setHasPermission(true);
      }

      if (Platform.OS === 'android') {
        Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF9900',
        });
      }
    } catch (error) {
      console.log('Error getting push notification permissions', error);
    }
  };

  // Function to request web notification permission
  const requestWebNotificationPermission = async (): Promise<boolean> => {
    if (Platform.OS !== 'web' || !('Notification' in window)) {
      return false;
    }
    
    try {
      const permission = await (window as any).Notification.requestPermission();
      const granted = permission === 'granted';
      setHasPermission(granted);
      
      // Store permission status
      AsyncStorage.setItem('webNotificationPermission', permission);
      
      return granted;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  };

  // Unified function to request permission across platforms
  const requestPermission = async (): Promise<boolean> => {
    if (Platform.OS === 'web') {
      return requestWebNotificationPermission();
    } else {
      try {
        const { status } = await Notifications.requestPermissionsAsync();
        const granted = status === 'granted';
        setHasPermission(granted);
        return granted;
      } catch (error) {
        console.error('Error requesting notification permission:', error);
        return false;
      }
    }
  };

  // Provide notification context
  const contextValue: NotificationContextType = {
    hasPermission,
    requestPermission,
    isWebNotificationSupported
  };

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
    </NotificationContext.Provider>
  );
}

// Helper function to schedule notifications with UI fallback
export const scheduleVehicleArrivalNotification = async (vehicleName: string, eta: string) => {
  try {
    // For web platform, use browser notifications if available
    if (Platform.OS === 'web') {
      // Check if browser notifications are supported
      if ('Notification' in window) {
        // Check if permission is already granted
        if ((window as any).Notification.permission === 'granted') {
          // Schedule a timeout to simulate the notification
          const seconds = estimateSecondsFromETA(eta);
          
          // Store the timeout ID in localStorage to persist across refreshes
          const timeoutId = setTimeout(() => {
            new (window as any).Notification('Vehicle Approaching', {
              body: `${vehicleName} will arrive in ${eta}`,
              icon: '/assets/images/PARAda-Logo.png'
            });
          }, seconds * 1000);
          
          // We can't actually store the timeout ID in localStorage, but we can store the time
          // when the notification should fire
          const notificationTime = Date.now() + (seconds * 1000);
          localStorage.setItem(`notification_${vehicleName}`, notificationTime.toString());
          
          // Store that we've successfully scheduled a notification
          AsyncStorage.setItem('lastNotificationScheduled', JSON.stringify({
            vehicleName,
            eta,
            scheduledAt: new Date().toISOString()
          }));
          
          return true;
        } else if ((window as any).Notification.permission !== 'denied') {
          // Request permission
          try {
            const permission = await (window as any).Notification.requestPermission();
            if (permission === 'granted') {
              // Call the function again now that we have permission
              return scheduleVehicleArrivalNotification(vehicleName, eta);
            } else {
              // Show UI fallback notification
              showUIFallbackNotification(vehicleName, eta);
              return false;
            }
          } catch (error) {
            console.error('Error requesting notification permission:', error);
            // Show UI fallback notification
            showUIFallbackNotification(vehicleName, eta);
            return false;
          }
        } else {
          // Permission denied, show UI fallback
          showUIFallbackNotification(vehicleName, eta);
          return false;
        }
      } else {
        // Browser doesn't support notifications, show UI fallback
        showUIFallbackNotification(vehicleName, eta);
        return false;
      }
    }
    
    // For native platforms, use Expo Notifications
    const seconds = estimateSecondsFromETA(eta);
    
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Vehicle Approaching',
        body: `${vehicleName} will arrive in ${eta}`,
        data: { vehicleName, eta },
      },
      trigger: {
        seconds: seconds,
        channelId: 'default',
      },
    });
    
    return true;
  } catch (error) {
    console.error('Error scheduling notification:', error);
    // Show UI fallback notification on error
    if (Platform.OS === 'web') {
      showUIFallbackNotification(vehicleName, eta);
    }
    return false;
  }
};

// UI fallback for web platforms when notifications aren't available
const showUIFallbackNotification = (vehicleName: string, eta: string) => {
  console.log('Using UI fallback for notification');
  
  // Store the notification info for the UI components to use
  AsyncStorage.setItem('uiFallbackNotification', JSON.stringify({
    vehicleName,
    eta,
    timestamp: Date.now()
  }));
  
  // Alert is a simple fallback that works across platforms
  Alert.alert(
    'Notification Scheduled',
    `You'll be alerted when ${vehicleName} is approaching (in ${eta}).`,
    [{ text: 'OK' }]
  );
};

// Helper function to convert ETA string to seconds
const estimateSecondsFromETA = (eta: string): number => {
  // Simple parser for ETA strings like "5 min"
  const match = eta.match(/(\d+)\s*min/);
  if (match && match[1]) {
    return parseInt(match[1]) * 60; // Convert minutes to seconds
  }
  return 60; // Default to 1 minute if parsing fails
};

// Component to request notification permissions with better UI
export const NotificationPermissionRequest = () => {
  const { hasPermission, requestPermission, isWebNotificationSupported } = useNotifications();
  
  // Only show if web platform, notifications are supported, and permission not granted
  if (Platform.OS !== 'web' || !isWebNotificationSupported || hasPermission) {
    return null;
  }
  
  return (
    <View style={styles.permissionContainer}>
      <View style={styles.permissionContent}>
        <FontAwesome5 name="bell" size={24} color="#4B6BFE" style={styles.permissionIcon} />
        <Text style={styles.permissionText}>
          Enable notifications to receive alerts when vehicles are approaching
        </Text>
        <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
          <Text style={styles.permissionButtonText}>Enable Notifications</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  permissionContainer: {
    padding: 16,
    marginBottom: 16,
    borderRadius: 8,
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  permissionContent: {
    flexDirection: 'column',
    alignItems: 'center',
  },
  permissionIcon: {
    marginBottom: 12,
  },
  permissionText: {
    fontSize: 14,
    color: '#212529',
    textAlign: 'center',
    marginBottom: 16,
  },
  permissionButton: {
    backgroundColor: '#4B6BFE',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 4,
  },
  permissionButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
}); 