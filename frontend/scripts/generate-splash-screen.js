/**
 * Generate Splash Screen Script
 * 
 * This script creates a high-quality splash screen image for Android devices.
 * 
 * Usage: node generate-splash-screen.js
 */

const fs = require('fs');
const path = require('path');
const { createCanvas, loadImage } = require('canvas');

// Source logo path
const SOURCE_LOGO = path.join(__dirname, '../assets/images/adaptive-icon.png');

// Output directory for splash screen
const SPLASH_DIR = path.join(__dirname, '../assets/splash');

// Splash screen sizes for different devices
const SPLASH_SIZES = [
  { width: 320, height: 480 },   // HVGA
  { width: 480, height: 800 },   // WVGA
  { width: 720, height: 1280 },  // HD
  { width: 1080, height: 1920 }, // FHD
  { width: 1440, height: 2560 }, // QHD
  { width: 2160, height: 3840 }  // UHD
];

// Ensure the output directory exists
if (!fs.existsSync(SPLASH_DIR)) {
  fs.mkdirSync(SPLASH_DIR, { recursive: true });
  console.log(`Created splash screen directory: ${SPLASH_DIR}`);
}

// Function to generate a splash screen of the specified size
async function generateSplashScreen(sourceImage, width, height, outputPath) {
  // Create a canvas with the target size
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');
  
  // Fill with white background
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, width, height);
  
  // Calculate logo size (40% of the smaller dimension)
  const logoSize = Math.min(width, height) * 0.4;
  
  // Calculate logo position (centered)
  const logoX = (width - logoSize) / 2;
  const logoY = (height - logoSize) / 2;
  
  // Draw the logo
  ctx.drawImage(sourceImage, logoX, logoY, logoSize, logoSize);
  
  // Add text "PARAda" below the logo
  const fontSize = Math.max(20, Math.floor(logoSize / 4));
  ctx.font = `bold ${fontSize}px Arial`;
  ctx.fillStyle = '#4B6BFE';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  
  const text = 'PARAda';
  const textY = logoY + logoSize + (fontSize * 0.5);
  ctx.fillText(text, width / 2, textY);
  
  // Add subtitle
  const subtitleFontSize = Math.max(14, Math.floor(fontSize * 0.6));
  ctx.font = `${subtitleFontSize}px Arial`;
  ctx.fillStyle = '#666666';
  
  const subtitle = 'Real-Time Transportation Tracking';
  const subtitleY = textY + fontSize + (subtitleFontSize * 0.5);
  ctx.fillText(subtitle, width / 2, subtitleY);
  
  // Save the canvas as PNG
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(outputPath, buffer);
  
  console.log(`Generated splash screen: ${outputPath}`);
}

// Main function to generate all splash screens
async function generateSplashScreens() {
  try {
    console.log(`Loading source image: ${SOURCE_LOGO}`);
    const sourceImage = await loadImage(SOURCE_LOGO);
    
    // Generate splash screens for all sizes
    for (const size of SPLASH_SIZES) {
      const outputPath = path.join(SPLASH_DIR, `splash_${size.width}x${size.height}.png`);
      await generateSplashScreen(sourceImage, size.width, size.height, outputPath);
      
      // Also generate landscape version
      const landscapeOutputPath = path.join(SPLASH_DIR, `splash_${size.height}x${size.width}.png`);
      await generateSplashScreen(sourceImage, size.height, size.width, landscapeOutputPath);
    }
    
    // Generate a default splash screen
    const defaultOutputPath = path.join(SPLASH_DIR, 'splash.png');
    await generateSplashScreen(sourceImage, 1080, 1920, defaultOutputPath);
    
    console.log('All splash screens generated successfully!');
    
    // Create a README file with instructions
    const readmeContent = `# Splash Screen Images

This directory contains splash screen images for various device sizes.

## Available Sizes

- Portrait:
  ${SPLASH_SIZES.map(size => `- splash_${size.width}x${size.height}.png`).join('\n  ')}

- Landscape:
  ${SPLASH_SIZES.map(size => `- splash_${size.height}x${size.width}.png`).join('\n  ')}

- Default:
  - splash.png (1080x1920)

## Usage

These splash screen images should be used in the app configuration to provide a smooth loading experience.
`;
    
    fs.writeFileSync(path.join(SPLASH_DIR, 'README.md'), readmeContent);
    console.log('Created README with instructions');
    
  } catch (error) {
    console.error('Error generating splash screens:', error);
  }
}

// Run the script
generateSplashScreens(); 