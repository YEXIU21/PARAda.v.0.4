import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeColors, ThemeContextType } from '../types/ThemeTypes';

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Generate current theme colors
  const colors: ThemeColors = {
    background: isDarkMode ? '#121212' : '#FFFFFF',
    card: isDarkMode ? '#1E1E1E' : '#FFFFFF',
    primary: '#4B6BFE',
    secondary: '#3451E1',
    text: isDarkMode ? '#FFFFFF' : '#333333',
    textSecondary: isDarkMode ? '#BBBBBB' : '#666666',
    border: isDarkMode ? '#333333' : '#EEEEEE',
    marker: isDarkMode ? '#272727' : '#FFFFFF',
    error: '#FF3B30',
    success: '#34C759',
    warning: '#FF9500',
    gradientColors: isDarkMode 
      ? ['#3451E1', '#2A3451'] as const
      : ['#4B6BFE', '#3451E1'] as const,
    cardShadow: isDarkMode ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0.1)',
    inputBackground: isDarkMode ? '#333333' : '#F5F5F5',
    modalOverlay: isDarkMode ? 'rgba(0,0,0,0.8)' : 'rgba(0,0,0,0.5)',
    divider: isDarkMode ? '#333333' : '#EEEEEE',
    activeItem: isDarkMode ? '#2A3451' : '#F5F8FF',
    inactiveItem: isDarkMode ? '#272727' : '#F9F9F9'
  };

  // Load saved theme preference from storage on app start
  useEffect(() => {
    const loadThemePreference = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem('theme_preference');
        
        if (savedTheme) {
          // Use saved preference if available
          setIsDarkMode(savedTheme === 'dark');
        } else {
          // Otherwise use system preference
          setIsDarkMode(systemColorScheme === 'dark');
        }
      } catch (error) {
        console.error('Failed to load theme preference:', error);
        // Default to system preference if there's an error
        setIsDarkMode(systemColorScheme === 'dark');
      } finally {
        setIsLoading(false);
      }
    };

    loadThemePreference();
  }, [systemColorScheme]);

  // Update theme when system color scheme changes, but only if no manual preference is set
  useEffect(() => {
    const checkSystemPreference = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem('theme_preference');
        
        // Only update based on system if user hasn't set their own preference
        if (!savedTheme) {
          setIsDarkMode(systemColorScheme === 'dark');
        }
      } catch (error) {
        console.error('Failed to check theme preference:', error);
      }
    };

    checkSystemPreference();
  }, [systemColorScheme]);

  const toggleDarkMode = async () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    
    try {
      // Save user preference
      await AsyncStorage.setItem('theme_preference', newMode ? 'dark' : 'light');
    } catch (error) {
      console.error('Failed to save theme preference:', error);
    }
  };

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleDarkMode, colors }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  
  return context;
};

// For backward compatibility - this function will be deprecated in favor of 
// directly using the colors from the ThemeContext
export const getThemeColors = (isDark: boolean): ThemeColors => ({
  background: isDark ? '#121212' : '#FFFFFF',
  card: isDark ? '#1E1E1E' : '#FFFFFF',
  primary: '#4B6BFE',
  secondary: '#3451E1',
  text: isDark ? '#FFFFFF' : '#333333',
  textSecondary: isDark ? '#BBBBBB' : '#666666',
  border: isDark ? '#333333' : '#EEEEEE',
  marker: isDark ? '#272727' : '#FFFFFF',
  error: '#FF3B30',
  success: '#34C759',
  warning: '#FF9500',
  gradientColors: isDark 
    ? ['#3451E1', '#2A3451'] as const
    : ['#4B6BFE', '#3451E1'] as const,
  cardShadow: isDark ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0.1)',
  inputBackground: isDark ? '#333333' : '#F5F5F5',
  modalOverlay: isDark ? 'rgba(0,0,0,0.8)' : 'rgba(0,0,0,0.5)',
  divider: isDark ? '#333333' : '#EEEEEE',
  activeItem: isDark ? '#2A3451' : '#F5F8FF',
  inactiveItem: isDark ? '#272727' : '#F9F9F9'
}); 