import React, { useEffect, useState } from 'react';
import { Tabs } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import RoleBasedNavBar from '../../components/RoleBasedNavBar';

export default function TabLayout() {
  const { user, isLoading } = useAuth();
  const [isCheckingStorage, setIsCheckingStorage] = useState(true);

  useEffect(() => {
    const checkUserSession = async () => {
      try {
        // First check if the user is already in the AuthContext
        if (user) {
          setIsCheckingStorage(false);
          return;
        }
        
        // If not, check AsyncStorage
        const storedUser = await AsyncStorage.getItem('user');
        const token = await AsyncStorage.getItem('token');
        
        // If we have both user data and token in storage, don't redirect yet
        // The AuthContext will handle loading the user and validating the token
        if (!storedUser || !token) {
          console.log('No user data or token in storage, redirecting to login');
          router.replace('/auth/login');
        }
      } catch (error) {
        console.error('Error checking user session:', error);
        // On error, don't redirect - let the AuthContext handle it
      } finally {
        setIsCheckingStorage(false);
      }
    };

    checkUserSession();
  }, [user]);

  if (isLoading || isCheckingStorage) {
    return null;
  }

  // Common tab options for styling
  const tabScreenOptions = {
    headerShown: false,
    tabBarStyle: { display: 'none' as const },
  };

  return (
    <View style={styles.container}>
      <Tabs screenOptions={tabScreenOptions}>
        <Tabs.Screen name="index" />
        <Tabs.Screen name="admin" />
        <Tabs.Screen name="driver" />
        <Tabs.Screen name="profile" />
        <Tabs.Screen name="explore" />
        <Tabs.Screen name="subscribers-management" />
        <Tabs.Screen name="manage-drivers" />
        <Tabs.Screen name="manage-routes" />
        <Tabs.Screen name="user-management" />
        <Tabs.Screen name="system-settings" />
        <Tabs.Screen name="reports" />
        <Tabs.Screen name="notifications" />
        <Tabs.Screen name="messages" />
      </Tabs>
      <RoleBasedNavBar />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
