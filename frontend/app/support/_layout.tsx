import React from 'react';
import { Stack } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { Redirect } from 'expo-router';

export default function SupportLayout() {
  const { user } = useAuth();
  
  // Check if user is logged in and has support role
  if (!user) {
    return <Redirect href="/auth/login" />;
  }
  
  if (user.role !== 'support' && user.role !== 'admin') {
    return <Redirect href="/(tabs)" />;
  }
  
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" options={{ title: 'Support Dashboard' }} />
      <Stack.Screen name="settings" options={{ title: 'Support Settings' }} />
      <Stack.Screen name="ticket/[id]" options={{ title: 'Ticket Details' }} />
    </Stack>
  );
} 