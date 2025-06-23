/**
 * Environment Configuration
 * Exports API_URL and other environment variables
 */

// Check if we're running on Vercel (production)
const isVercel = typeof window !== 'undefined' && 
                window.location && 
                (window.location.hostname.includes('vercel.app') || 
                 window.location.hostname.includes('parada'));

const isProduction = process.env.NEXT_PUBLIC_ENV === 'production' || isVercel;

// Export the API URL with the correct port
export const API_URL = isProduction
  ? 'https://parada-backend.onrender.com'  // Use Render.com backend URL in production
  : 'http://localhost:5000';  // Use port 5000 to match backend configuration

// Create a proper env object with all environment variables
const env = {
  apiUrl: API_URL,
  googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
  googleMapsId: process.env.NEXT_PUBLIC_GOOGLE_MAPS_ID || '',
  isProduction,
  isVercel
};

console.log('Environment configured:', {
  apiUrl: env.apiUrl,
  isProduction: env.isProduction,
  hasGoogleMapsKey: !!env.googleMapsApiKey,
  isVercel
});

export default env; 