/**
 * This script syncs PARAda-Logo.png from assets/images to public/assets/images
 * to ensure proper deployment on Vercel.
 */
const fs = require('fs');
const path = require('path');

// Define source and destination directories
const sourceImagesDir = path.join(__dirname, '../assets/images');
const destImagesDir = path.join(__dirname, '../public/assets/images');

// Create destination directories if they don't exist
function ensureDirectoryExists(dir) {
  if (!fs.existsSync(dir)) {
    console.log(`Creating directory: ${dir}`);
    fs.mkdirSync(dir, { recursive: true });
  }
}

// Copy PARAda-Logo.png from source to destination
function copyLogoFile() {
  ensureDirectoryExists(destImagesDir);
  
  try {
    const logoFileName = 'PARAda-Logo.png';
    const sourcePath = path.join(sourceImagesDir, logoFileName);
    const destPath = path.join(destImagesDir, logoFileName);
    
    if (fs.existsSync(sourcePath)) {
      fs.copyFileSync(sourcePath, destPath);
      console.log(`Successfully copied ${logoFileName} to ${destImagesDir}`);
    } else {
      console.error(`Error: ${logoFileName} not found in ${sourceImagesDir}`);
    }
  } catch (error) {
    console.error(`Error copying logo file: ${error.message}`);
  }
}

// Main function to sync assets
function syncPWAAssets() {
  console.log('Syncing PWA assets to public directory...');
  
  // Sync PARAda-Logo.png
  copyLogoFile();
  
  console.log('PWA asset sync complete!');
}

// Run the sync
syncPWAAssets(); 