import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'expo-router';
import { Alert } from 'react-native';

export default function SupportLayout() {
  const { user } = useAuth();
  const router = useRouter();

  // Check if user has support or admin role
  useEffect(() => {
    if (!user) {
      // User not logged in
      Alert.alert('Authentication Required', 'Please log in to access this page.');
      router.replace('/auth/login');
    } else if (user.role !== 'support' && user.role !== 'admin') {
      // User doesn't have support or admin role
      Alert.alert('Access Denied', 'You do not have permission to access this page.');
      router.replace('/(tabs)');
    }
  }, [user, router]);

  return (
    <Stack>
      <Stack.Screen name="dashboard" options={{ headerShown: false }} />
      <Stack.Screen name="tickets" options={{ title: 'Support Tickets' }} />
      <Stack.Screen name="audit-logs" options={{ title: 'Audit Logs' }} />
      <Stack.Screen name="messages" options={{ title: 'Support Messages' }} />
      <Stack.Screen name="users" options={{ title: 'User Management' }} />
      <Stack.Screen name="ticket/[id]" options={{ title: 'Ticket Details' }} />
    </Stack>
  );
} 