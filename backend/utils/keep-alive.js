/**
 * Keep-alive utility to prevent Render.com free tier from spinning down
 */
const https = require('https');
const http = require('http');

/**
 * Pings the server at regular intervals to keep it alive
 * @param {string} url - The URL to ping (default: the server's own health endpoint)
 * @param {number} interval - The interval in milliseconds (default: 14 minutes)
 */
const setupKeepAlive = (url, interval = 14 * 60 * 1000) => {
  // Default to the server's own health endpoint if no URL is provided
  const pingUrl = url || (process.env.RENDER_EXTERNAL_URL ? 
    `${process.env.RENDER_EXTERNAL_URL}/health` : 
    `http://localhost:${process.env.PORT || 5000}/health`);
  
  const minutes = interval / 60000;
  console.log(`Setting up keep-alive ping to ${pingUrl} every ${minutes} minutes (${interval}ms)`);
  
  // Set up the interval
  setInterval(() => {
    try {
      const timestamp = new Date().toISOString();
      console.log(`[${timestamp}] Pinging ${pingUrl} to keep the server alive...`);
      
      // Determine if we need to use http or https
      const requester = pingUrl.startsWith('https') ? https : http;
      
      // Send the request
      const req = requester.get(pingUrl, (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          console.log(`[${timestamp}] Keep-alive ping successful: ${res.statusCode}`);
        });
      });
      
      // Handle errors
      req.on('error', (err) => {
        console.error(`[${timestamp}] Keep-alive ping failed: ${err.message}`);
      });
      
      // End the request
      req.end();
    } catch (error) {
      const timestamp = new Date().toISOString();
      console.error(`[${timestamp}] Error in keep-alive ping: ${error.message}`);
    }
  }, interval);
  
  console.log(`Keep-alive mechanism initialized at ${new Date().toISOString()}`);
  console.log(`Next ping will occur in ${minutes} minutes`);
};

module.exports = { setupKeepAlive };