import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '../context/ThemeContext';

export default function ThemedStatusBar() {
  const { isDarkMode } = useTheme();
  
  return <StatusBar style={isDarkMode ? 'light' : 'dark'} />;
} 