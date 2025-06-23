/**
 * Environment Configuration
 * Contains environment-specific settings for the app
 */

// Define interfaces for environment variables
interface EnvConfig {
  apiUrl: string;
  googleMapsApiKey: string;
  googleMapsId: string;
}

// Define a safe way to access process.env
declare const process: {
  env: {
    NODE_ENV?: string;
    APP_ENVIRONMENT?: string;
    NEXT_PUBLIC_ENV?: string;
    NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?: string;
    NEXT_PUBLIC_GOOGLE_MAPS_ID?: string;
  }
};

// Try to import modules, but provide fallbacks if they're not available
let Platform = { OS: 'web' };
let Constants = { manifest: { extra: { expoClient: { releaseChannel: undefined } } } };

try {
  // Only import these if they're available
  const ReactNative = require('react-native');
  if (ReactNative && ReactNative.Platform) {
    Platform = ReactNative.Platform;
  }
} catch (e) {
  console.log('React Native Platform not available');
}

try {
  const ExpoConstants = require('expo-constants');
  if (ExpoConstants) {
    Constants = ExpoConstants;
  }
} catch (e) {
  console.log('Expo Constants not available');
}

const ENV: Record<string, EnvConfig> = {
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

const getEnvVars = (): EnvConfig => {
  // For web deployed on Vercel, always use production environment
  if (typeof window !== 'undefined' && window.location) {
    // Check if we're on Vercel
    if (window.location.hostname.includes('vercel.app')) {
      console.log('Vercel deployment detected, using production environment');
      return ENV.prod;
    }
  }

  // Use manifest instead of deprecated releaseChannel
  const environment = Constants?.manifest?.extra?.expoClient?.releaseChannel || 
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