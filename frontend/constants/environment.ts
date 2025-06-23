/**
 * Environment Configuration
 * Contains environment-specific settings for the app
 */
import Constants from 'expo-constants';
import { Platform } from 'react-native';

const ENV = {
  dev: {
    // For Android emulator, use 10.0.2.2 instead of localhost
    // For iOS simulator, localhost works fine
    apiUrl: Platform.OS === 'android' 
      ? 'http://10.0.2.2:5000'
      : 'http://localhost:5000',
    googleMapsApiKey: 'AIzaSyA6DKdUg8JHPsMrDTC3waxqHkOT8GvKtIk',
    googleMapsId: '989855c5ea84a0d7', // For AdvancedMarkerElement
  },
  staging: {
    apiUrl: 'https://parada-backend.onrender.com',
    googleMapsApiKey: 'AIzaSyA6DKdUg8JHPsMrDTC3waxqHkOT8GvKtIk',
    googleMapsId: '989855c5ea84a0d7', // For AdvancedMarkerElement
  },
  prod: {
    apiUrl: 'https://parada-backend.onrender.com',
    googleMapsApiKey: 'AIzaSyA6DKdUg8JHPsMrDTC3waxqHkOT8GvKtIk',
    googleMapsId: '989855c5ea84a0d7', // For AdvancedMarkerElement
  },
};

const getEnvVars = () => {
  // For web deployed on Vercel, always use production environment
  if (typeof window !== 'undefined' && window.location) {
    // Check if we're on Vercel
    if (window.location.hostname.includes('vercel.app')) {
      console.log('Vercel deployment detected, using production environment');
      return ENV.prod;
    }
  }

  // Use manifest instead of deprecated releaseChannel
  const environment = Constants.manifest?.extra?.expoClient?.releaseChannel || 
                     process.env.APP_ENVIRONMENT || 
                     'development';
  
  // What is the environment?
  if (environment === 'development') {
    return ENV.dev;
  } else if (environment === 'production' || environment.includes('prod')) {
    return ENV.prod;
  } else if (environment === 'staging' || environment.includes('staging')) {
    return ENV.staging;
  } else {
    return ENV.dev;
  }
};

export default getEnvVars(); 