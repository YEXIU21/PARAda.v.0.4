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
        const storedUser = await AsyncStorage.getItem('user');
        
        // If no user in context but we have one in storage, we shouldn't redirect yet
        if (!user && !storedUser) {
          router.replace('/auth/login');
    }
        
        setIsCheckingStorage(false);
      } catch (error) {
        console.error('Error checking user session:', error);
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
    tabBarStyle: { display: 'none' as const }, // Fix the type error by explicitly setting the type
  };

  return (
    <View style={styles.container}>
      <Tabs screenOptions={tabScreenOptions}>
        <Tabs.Screen name="index" />
        <Tabs.Screen name="admin" />
        <Tabs.Screen name="driver" />
        <Tabs.Screen name="profile" />
        <Tabs.Screen name="explore" />
        <Tabs.Screen name="admin-subscribers" />
        <Tabs.Screen name="manage-drivers" />
        <Tabs.Screen name="manage-routes" />
        <Tabs.Screen name="user-management" />
        <Tabs.Screen name="system-settings" />
        <Tabs.Screen name="reports" />
        <Tabs.Screen name="notifications" />
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
