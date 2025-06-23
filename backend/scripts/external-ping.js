/**
 * External ping script to keep the Render.com service alive
 * This can be run from a separate server or scheduled task
 */
const https = require('https');

// The URL of your Render.com service
const serviceUrl = process.argv[2] || 'https://paradabackend.onrender.com/health';

console.log(`Pinging ${serviceUrl}...`);

// Send the request
const req = https.get(serviceUrl, (res) => {
  let data = '';
  
  // A chunk of data has been received
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  // The whole response has been received
  res.on('end', () => {
    console.log(`Status code: ${res.statusCode}`);
    try {
      const parsedData = JSON.parse(data);
      console.log('Response:', JSON.stringify(parsedData, null, 2));
    } catch (e) {
      console.log('Response:', data);
    }
  });
});

// Handle errors
req.on('error', (error) => {
  console.error(`Error: ${error.message}`);
});

// End the request
req.end(); 