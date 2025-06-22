import React, { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

interface NotificationServiceProps {
  children: React.ReactNode;
}

export default function NotificationService({ children }: NotificationServiceProps) {
  const notificationListener = useRef<any>();
  const responseListener = useRef<any>();

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

    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, []);

  const registerForPushNotifications = async () => {
    try {
      // Request permission
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        // User denied permissions - this is okay, just don't register for notifications
        // Don't log an error as this is an expected user choice
        return;
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

  return <>{children}</>;
}

// Helper function to schedule notifications
export const scheduleVehicleArrivalNotification = async (vehicleName: string, eta: string) => {
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