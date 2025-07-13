import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { useTheme, getThemeColors } from '../context/ThemeContext';
import { useRouter, usePathname } from 'expo-router';
import { useAuth } from '../context/AuthContext';

interface NavItem {
  name: string;
  icon: string;
  route: string;
  badge?: number;
}

export default function SupportNavBar() {
  const { isDarkMode } = useTheme();
  const theme = getThemeColors(isDarkMode);
  const router = useRouter();
  const currentPath = usePathname();
  const { user } = useAuth();

  // Only show for support users
  if (!user || user.role !== 'support') {
    return null;
  }

  // Define navigation items for support role
  const navItems: NavItem[] = [
    { name: 'Dashboard', icon: 'chart-bar', route: '/support' },
    { name: 'Tickets', icon: 'ticket-alt', route: '/support-tickets', badge: 5 },
    { name: 'My Tickets', icon: 'tasks', route: '/support/my-tickets' },
    { name: 'Knowledge Base', icon: 'book', route: '/support/knowledge-base' },
    { name: 'Reports', icon: 'chart-bar', route: '/support/reports' },
    { name: 'Settings', icon: 'cog', route: '/support/settings' },
  ];

  const handleNavItemPress = (route: string) => {
    if (Platform.OS === 'web') {
      window.location.href = route;
    } else {
      router.push(route);
    }
  };

  return (
    <View style={[
      styles.container,
      { backgroundColor: isDarkMode ? '#1E1E1E' : '#FFFFFF' }
    ]}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: theme.text }]}>
          Support Portal
        </Text>
      </View>
      
      <View style={styles.navItems}>
        {navItems.map((item) => {
          const isActive = currentPath === item.route;
          
          return (
            <TouchableOpacity
              key={item.name}
              style={[
                styles.navItem,
                isActive && { backgroundColor: isDarkMode ? '#333333' : '#F0F0F0' }
              ]}
              onPress={() => handleNavItemPress(item.route)}
            >
              <View style={styles.navItemContent}>
                <FontAwesome5
                  name={item.icon}
                  size={16}
                  color={isActive ? theme.primary : theme.textSecondary}
                  style={styles.navIcon}
                />
                <Text
                  style={[
                    styles.navLabel,
                    { color: isActive ? theme.primary : theme.textSecondary }
                  ]}
                >
                  {item.name}
                </Text>
              </View>
              
              {item.badge && (
                <View style={[styles.badge, { backgroundColor: theme.primary }]}>
                  <Text style={styles.badgeText}>{item.badge}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
      
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.profileButton}
          onPress={() => handleNavItemPress('/profile')}
        >
          <FontAwesome5
            name="user-circle"
            size={18}
            color={theme.textSecondary}
            style={styles.profileIcon}
          />
          <Text style={[styles.profileName, { color: theme.text }]}>
            {user?.username || 'Support Agent'}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={() => {
            // Handle logout
            if (Platform.OS === 'web') {
              window.location.href = '/auth/login';
            } else {
              router.push('/auth/login');
            }
          }}
        >
          <FontAwesome5
            name="sign-out-alt"
            size={16}
            color={theme.textSecondary}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 250,
    height: '100%',
    borderRightWidth: 1,
    borderRightColor: '#E0E0E0',
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  navItems: {
    flex: 1,
    padding: 10,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 8,
    marginBottom: 5,
  },
  navItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  navIcon: {
    marginRight: 12,
    width: 16,
  },
  navLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  badge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  footer: {
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  profileButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileIcon: {
    marginRight: 8,
  },
  profileName: {
    fontSize: 14,
    fontWeight: '500',
  },
  logoutButton: {
    padding: 8,
  },
}); 