/**
 * Environment Configuration
 * Exports API_URL and other environment variables
 */

// Instead of checking NODE_ENV, we'll explicitly use development mode always
// unless overridden by an environment variable.
const isProduction = process.env.NEXT_PUBLIC_ENV === 'production';

// Export the API URL with the correct port
export const API_URL = isProduction
  ? process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'  // Default to localhost even in prod for now
  : 'http://localhost:5000';  // Use port 5000 to match backend configuration

// Create a proper env object with all environment variables
const env = {
  apiUrl: API_URL,
  googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
  googleMapsId: process.env.NEXT_PUBLIC_GOOGLE_MAPS_ID || '',
  isProduction
};

console.log('Environment configured:', {
  apiUrl: env.apiUrl,
  isProduction: env.isProduction,
  hasGoogleMapsKey: !!env.googleMapsApiKey
});

export default env; 