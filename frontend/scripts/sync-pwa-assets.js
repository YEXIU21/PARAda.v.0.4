/**
 * This script syncs PWA assets from assets directory to public directory
 * to ensure proper deployment on Vercel.
 */
const fs = require('fs');
const path = require('path');

// Define source and destination directories
const sourceImagesDir = path.join(__dirname, '../assets/images');
const destImagesDir = path.join(__dirname, '../public/assets/images');

const sourceIosIconsDir = path.join(__dirname, '../assets/ios-icons');
const destIosIconsDir = path.join(__dirname, '../public/assets/ios-icons');

const sourceIosSplashDir = path.join(__dirname, '../assets/ios-splash');
const destIosSplashDir = path.join(__dirname, '../public/assets/ios-splash');

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

// Copy all files from source directory to destination directory
function copyDirectoryContents(sourceDir, destDir, filePattern = null) {
  ensureDirectoryExists(destDir);
  
  if (!fs.existsSync(sourceDir)) {
    console.log(`Source directory ${sourceDir} does not exist. Skipping.`);
    return;
  }
  
  try {
    const files = fs.readdirSync(sourceDir);
    
    files.forEach(file => {
      // Skip README files
      if (file === 'README.md') return;
      
      // Skip files that don't match pattern if pattern is provided
      if (filePattern && !file.match(filePattern)) return;
      
      const sourcePath = path.join(sourceDir, file);
      const destPath = path.join(destDir, file);
      
      // Only copy files, not directories
      if (fs.statSync(sourcePath).isFile()) {
        fs.copyFileSync(sourcePath, destPath);
        console.log(`Copied ${file} to ${destDir}`);
      }
    });
    
    console.log(`Successfully copied files from ${sourceDir} to ${destDir}`);
  } catch (error) {
    console.error(`Error copying directory contents: ${error.message}`);
  }
}

// Main function to sync assets
function syncPWAAssets() {
  console.log('Syncing PWA assets to public directory...');
  
  // Sync PARAda-Logo.png
  copyLogoFile();
  
  // Sync iOS icons
  copyDirectoryContents(sourceIosIconsDir, destIosIconsDir, /\.png$/);
  
  // Sync iOS splash screens
  copyDirectoryContents(sourceIosSplashDir, destIosSplashDir, /\.png$/);
  
  console.log('PWA asset sync complete!');
}

// Run the sync
syncPWAAssets(); 