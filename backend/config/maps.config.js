/**
 * Google Maps API configuration
 */
const { Client } = require('@googlemaps/google-maps-services-js');

// Initialize Google Maps client
const mapsClient = new Client({});

/**
 * Google Maps API key from environment variables
 */
const API_KEY = process.env.GOOGLE_MAPS_API_KEY || 'AIzaSyA6DKdUg8JHPsMrDTC3waxqHkOT8GvKtIk';

/**
 * Default maps options
 */
const defaultOptions = {
  language: 'en',
  region: 'ph'
};

module.exports = {
  mapsClient,
  API_KEY,
  defaultOptions
}; 