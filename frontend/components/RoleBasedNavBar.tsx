import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { router, usePathname } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { useTheme, getThemeColors } from '../context/ThemeContext';
import MessagingInterface from './MessagingInterface';

interface NavItem {
  name: string;
  icon: string;
  route: string;
  isMessage?: boolean;
}

export default function RoleBasedNavBar() {
  const { user } = useAuth();
  const { isDarkMode } = useTheme();
  const theme = getThemeColors(isDarkMode);
  const currentPath = usePathname();
  const [showMessages, setShowMessages] = useState(false);

  if (!user) return null;

  // Define navigation items based on role
  let navItems: NavItem[] = [];

  if (user.role === 'admin') {
    navItems = [
      { name: 'Home', icon: 'home', route: '/' },
      { name: 'Admin', icon: 'cog', route: '/admin' },
      { name: 'Messages', icon: 'comments', route: '/messages', isMessage: true },
      { name: 'Profile', icon: 'user', route: '/profile' },
    ];
  } else if (user.role === 'driver') {
    navItems = [
      { name: 'Home', icon: 'home', route: '/' },
      { name: 'My Routes', icon: 'bus', route: '/driver' },
      { name: 'Messages', icon: 'comments', route: '/messages', isMessage: true },
      { name: 'Profile', icon: 'user', route: '/profile' },
    ];
  } else { // passenger
    navItems = [
      { name: 'Home', icon: 'home', route: '/' },
      { name: 'Routes', icon: 'route', route: '/explore' },
      { name: 'Messages', icon: 'comments', route: '/messages', isMessage: true },
      { name: 'Profile', icon: 'user', route: '/profile' },
    ];
  }

  const handleNavItemPress = (item: NavItem) => {
    if (item.isMessage) {
      setShowMessages(true);
    } else {
      router.push(item.route);
    }
  };

  const renderNavItem = (item: NavItem) => {
    const isActive = item.isMessage ? showMessages : currentPath === item.route;
    
    return (
      <TouchableOpacity
        key={item.name}
        style={styles.navItem}
        onPress={() => handleNavItemPress(item)}
      >
        <FontAwesome5
          name={item.icon}
          size={20}
          color={isActive ? theme.primary : theme.textSecondary}
        />
        <Text
          style={[
            styles.navLabel,
            { color: isActive ? theme.primary : theme.textSecondary }
          ]}
        >
          {item.name}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <>
      <View style={[
        styles.container, 
        { 
          backgroundColor: theme.background,
          borderTopColor: theme.border,
        }
      ]}>
        {navItems.map(renderNavItem)}
      </View>
      
      {/* Add MessagingInterface */}
      <MessagingInterface 
        isVisible={showMessages} 
        onClose={() => setShowMessages(false)} 
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 10,
    borderTopWidth: 1,
    paddingBottom: 20, // Add extra padding for devices with home indicator
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  navLabel: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: '500',
  },
}); 