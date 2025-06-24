/**
 * This script ensures the PARAda-Logo.png is copied to all necessary locations
 * for proper deployment on Vercel.
 */
const fs = require('fs');
const path = require('path');

// Define source and destination paths
const sourcePath = path.join(__dirname, '../assets/images/PARAda-Logo.png');
const destinations = [
  path.join(__dirname, '../public/assets/images/PARAda-Logo.png'),
  path.join(__dirname, '../web/assets/images/PARAda-Logo.png'),
  path.join(__dirname, '../dist/assets/images/PARAda-Logo.png')
];

// Ensure directory exists before copying
function ensureDirectoryExists(filePath) {
  const dirname = path.dirname(filePath);
  if (!fs.existsSync(dirname)) {
    console.log(`Creating directory: ${dirname}`);
    fs.mkdirSync(dirname, { recursive: true });
  }
}

// Copy logo to all destinations
function copyLogoToAllLocations() {
  console.log('Ensuring PARAda-Logo.png is available in all necessary locations...');
  
  if (!fs.existsSync(sourcePath)) {
    console.error(`Error: Source file does not exist: ${sourcePath}`);
    return;
  }
  
  destinations.forEach(destPath => {
    try {
      ensureDirectoryExists(destPath);
      fs.copyFileSync(sourcePath, destPath);
      console.log(`Successfully copied PARAda-Logo.png to: ${destPath}`);
    } catch (error) {
      console.error(`Error copying to ${destPath}: ${error.message}`);
    }
  });
  
  console.log('Logo path verification complete!');
}

// Run the function
copyLogoToAllLocations(); 