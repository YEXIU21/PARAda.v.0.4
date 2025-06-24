/**
 * This script syncs PWA icon assets from the source directories to the public directory
 * to ensure proper deployment on Vercel.
 */
const fs = require('fs');
const path = require('path');

// Define source and destination directories
const sourceIconsDir = path.join(__dirname, '../assets/icons');
const destIconsDir = path.join(__dirname, '../public/assets/icons');
const sourceIOSIconsDir = path.join(__dirname, '../assets/ios-icons');
const destIOSIconsDir = path.join(__dirname, '../public/assets/ios-icons');

// Create destination directories if they don't exist
function ensureDirectoryExists(dir) {
  if (!fs.existsSync(dir)) {
    console.log(`Creating directory: ${dir}`);
    fs.mkdirSync(dir, { recursive: true });
  }
}

// Copy all files from source to destination
function copyFiles(sourceDir, destDir, fileType = '.png') {
  ensureDirectoryExists(destDir);
  
  try {
    const files = fs.readdirSync(sourceDir);
    
    files.forEach(file => {
      if (file.endsWith(fileType)) {
        const sourcePath = path.join(sourceDir, file);
        const destPath = path.join(destDir, file);
        
        fs.copyFileSync(sourcePath, destPath);
        console.log(`Copied: ${file}`);
      }
    });
    
    console.log(`Successfully copied ${fileType} files from ${sourceDir} to ${destDir}`);
  } catch (error) {
    console.error(`Error copying files: ${error.message}`);
  }
}

// Main function to sync all assets
function syncPWAAssets() {
  console.log('Syncing PWA assets to public directory...');
  
  // Sync PWA icons
  copyFiles(sourceIconsDir, destIconsDir);
  
  // Sync iOS icons
  copyFiles(sourceIOSIconsDir, destIOSIconsDir);
  
  console.log('PWA asset sync complete!');
}

// Run the sync
syncPWAAssets(); 