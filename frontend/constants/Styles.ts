import { StyleSheet, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

export const COLORS = {
  primary: '#4B6BFE',
  primaryDark: '#3451E1',
  secondary: '#E8EDFF',
  success: '#4CD964',
  danger: '#FF3B30',
  warning: '#FFCC00',
  white: '#FFFFFF',
  black: '#000000',
  text: '#333333',
  textSecondary: '#666666',
  border: '#DDDDDD',
  background: '#F5F5F5',
  cardBackground: '#FFFFFF',
  modalOverlay: 'rgba(0, 0, 0, 0.5)',
};

export const SIZES = {
  radius: {
    small: 5,
    medium: 10,
    large: 15,
    extraLarge: 20,
    circle: 25,
  },
  padding: {
    small: 5,
    medium: 10,
    large: 15,
    extraLarge: 20,
  },
  margin: {
    small: 5,
    medium: 10,
    large: 15,
    extraLarge: 20,
  },
  font: {
    small: 12,
    medium: 14,
    large: 16,
    extraLarge: 18,
    title: 20,
  },
  icon: {
    small: 16,
    medium: 20,
    large: 24,
    extraLarge: 30,
  },
  screen: {
    width,
    height,
  },
};

export const SHADOWS = {
  small: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  large: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
}; 