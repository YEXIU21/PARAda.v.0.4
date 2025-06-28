import React, { useEffect, useState } from 'react';
import { Tabs, Link } from 'expo-router';
import { View, StyleSheet, Pressable } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import RoleBasedNavBar from '../../components/RoleBasedNavBar';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { useTheme } from '../../context/ThemeContext';

/**
 * You can explore the built-in icon families and icons on the web at https://icons.expo.fyi/
 */
function TabBarIcon(props: {
  name: React.ComponentProps<typeof FontAwesome5>['name'];
  color: string;
}) {
  return <FontAwesome5 size={22} style={{ marginBottom: -3 }} {...props} />;
}

export default function TabLayout() {
  const { user, isLoading } = useAuth();
  const [isCheckingStorage, setIsCheckingStorage] = useState(true);
  const { colors } = useTheme();

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

  // Check if user has support role
  const isSupport = user?.role === 'support' || user?.role === 'admin';

  // Common tab options for styling
  const tabScreenOptions = {
    headerShown: false,
    tabBarStyle: { display: 'none' as const }, // Fix the type error by explicitly setting the type
  };

  return (
    <View style={styles.container}>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.textSecondary,
          tabBarStyle: {
            backgroundColor: colors.card,
            borderTopColor: colors.border,
          },
          headerStyle: {
            backgroundColor: colors.card,
          },
          headerTintColor: colors.text,
          headerShadowVisible: false,
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            tabBarIcon: ({ color }) => <TabBarIcon name="home" color={color} />,
            headerRight: () => (
              <Link href="/modal" asChild>
                <Pressable>
                  {({ pressed }) => (
                    <FontAwesome5
                      name="info-circle"
                      size={25}
                      color={colors.text}
                      style={{ marginRight: 15, opacity: pressed ? 0.5 : 1 }}
                    />
                  )}
                </Pressable>
              </Link>
            ),
          }}
        />
        <Tabs.Screen
          name="routes"
          options={{
            title: 'Routes',
            tabBarIcon: ({ color }) => <TabBarIcon name="route" color={color} />,
          }}
        />
        <Tabs.Screen
          name="messages"
          options={{
            title: 'Messages',
            tabBarIcon: ({ color }) => <TabBarIcon name="envelope" color={color} />,
            tabBarBadge: 3, // Example badge
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            tabBarIcon: ({ color }) => <TabBarIcon name="user" color={color} />,
          }}
        />
        
        {/* Support Dashboard Tab - Only visible to support users */}
        {isSupport && (
          <Tabs.Screen
            name="support"
            options={{
              title: 'Support',
              tabBarIcon: ({ color }) => <TabBarIcon name="headset" color={color} />,
              href: '/support/dashboard',
            }}
          />
        )}
      </Tabs>
      {/* Only show RoleBasedNavBar for non-support users */}
      {user?.role !== 'support' && <RoleBasedNavBar />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
