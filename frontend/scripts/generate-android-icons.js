/**
 * Generate Android Icons Script
 * 
 * This script creates properly sized PNG icons for Android devices from the source logo.
 * It creates both regular and adaptive icons for different screen densities.
 * 
 * Usage: node generate-android-icons.js
 */

const fs = require('fs');
const path = require('path');
const { createCanvas, loadImage } = require('canvas');

// Source logo path
const SOURCE_LOGO = path.join(__dirname, '../assets/images/adaptive-icon.png');

// Output directory for Android icons
const ANDROID_ICONS_DIR = path.join(__dirname, '../assets/android-icons');

// Android icon densities and sizes
const ANDROID_DENSITIES = [
  { name: 'mdpi', multiplier: 1, size: 48 },
  { name: 'hdpi', multiplier: 1.5, size: 72 },
  { name: 'xhdpi', multiplier: 2, size: 96 },
  { name: 'xxhdpi', multiplier: 3, size: 144 },
  { name: 'xxxhdpi', multiplier: 4, size: 192 }
];

// Ensure the output directory exists
if (!fs.existsSync(ANDROID_ICONS_DIR)) {
  fs.mkdirSync(ANDROID_ICONS_DIR, { recursive: true });
  console.log(`Created Android icons directory: ${ANDROID_ICONS_DIR}`);
}

// Function to generate a PNG icon of the specified size
async function generateIcon(sourceImage, size, outputPath) {
  // Create a canvas with the target size
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  
  // Fill with transparent background
  ctx.clearRect(0, 0, size, size);
  
  // Calculate dimensions to maintain aspect ratio
  const aspectRatio = sourceImage.width / sourceImage.height;
  let drawWidth, drawHeight, offsetX, offsetY;
  
  if (aspectRatio > 1) {
    // Image is wider than tall
    drawHeight = size;
    drawWidth = size * aspectRatio;
    offsetX = (size - drawWidth) / 2;
    offsetY = 0;
  } else {
    // Image is taller than wide or square
    drawWidth = size;
    drawHeight = size / aspectRatio;
    offsetX = 0;
    offsetY = (size - drawHeight) / 2;
  }
  
  // Draw the image centered on the canvas
  ctx.drawImage(sourceImage, offsetX, offsetY, drawWidth, drawHeight);
  
  // Save the canvas as PNG
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(outputPath, buffer);
  
  console.log(`Generated icon: ${outputPath}`);
}

// Function to generate adaptive icon (foreground and background)
async function generateAdaptiveIcon(sourceImage, size, outputPath) {
  // Create a canvas with the target size
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  
  // Fill with white background for the background layer
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, size, size);
  
  // Save the background
  const bgBuffer = canvas.toBuffer('image/png');
  fs.writeFileSync(outputPath.replace('foreground', 'background'), bgBuffer);
  console.log(`Generated adaptive background: ${outputPath.replace('foreground', 'background')}`);
  
  // Clear canvas for foreground
  ctx.clearRect(0, 0, size, size);
  
  // For foreground, make the image slightly smaller to account for padding
  const padding = size * 0.2; // 20% padding
  const foregroundSize = size - (padding * 2);
  
  // Calculate dimensions to maintain aspect ratio
  const aspectRatio = sourceImage.width / sourceImage.height;
  let drawWidth, drawHeight, offsetX, offsetY;
  
  if (aspectRatio > 1) {
    // Image is wider than tall
    drawHeight = foregroundSize;
    drawWidth = foregroundSize * aspectRatio;
    offsetX = (size - drawWidth) / 2;
    offsetY = padding;
  } else {
    // Image is taller than wide or square
    drawWidth = foregroundSize;
    drawHeight = foregroundSize / aspectRatio;
    offsetX = padding;
    offsetY = (size - drawHeight) / 2;
  }
  
  // Draw the image centered on the canvas
  ctx.drawImage(sourceImage, offsetX, offsetY, drawWidth, drawHeight);
  
  // Save the foreground
  const fgBuffer = canvas.toBuffer('image/png');
  fs.writeFileSync(outputPath, fgBuffer);
  
  console.log(`Generated adaptive foreground: ${outputPath}`);
}

// Main function to generate all Android icons
async function generateAndroidIcons() {
  try {
    console.log(`Loading source image: ${SOURCE_LOGO}`);
    const sourceImage = await loadImage(SOURCE_LOGO);
    
    // Generate regular icons for all densities
    for (const density of ANDROID_DENSITIES) {
      const size = density.size;
      const outputPath = path.join(ANDROID_ICONS_DIR, `ic_launcher_${density.name}.png`);
      await generateIcon(sourceImage, size, outputPath);
      
      // Also generate round icons
      const roundOutputPath = path.join(ANDROID_ICONS_DIR, `ic_launcher_round_${density.name}.png`);
      await generateIcon(sourceImage, size, roundOutputPath);
      
      // Generate adaptive icons
      const adaptiveFgOutputPath = path.join(ANDROID_ICONS_DIR, `ic_launcher_foreground_${density.name}.png`);
      await generateAdaptiveIcon(sourceImage, size, adaptiveFgOutputPath);
    }
    
    // Generate play store icon (512x512)
    const playStoreOutputPath = path.join(ANDROID_ICONS_DIR, 'ic_launcher_play_store.png');
    await generateIcon(sourceImage, 512, playStoreOutputPath);
    
    console.log('All Android icons generated successfully!');
    
    // Create a README file with instructions
    const readmeContent = `# Android Icons

This directory contains Android-specific icons generated from the adaptive-icon.png file.

## Icon Types

1. **Regular Icons** - Used for app icon on older Android versions
   - ic_launcher_mdpi.png (48x48)
   - ic_launcher_hdpi.png (72x72)
   - ic_launcher_xhdpi.png (96x96)
   - ic_launcher_xxhdpi.png (144x144)
   - ic_launcher_xxxhdpi.png (192x192)

2. **Round Icons** - Used for round icon masks on some Android devices
   - ic_launcher_round_mdpi.png (48x48)
   - ic_launcher_round_hdpi.png (72x72)
   - ic_launcher_round_xhdpi.png (96x96)
   - ic_launcher_round_xxhdpi.png (144x144)
   - ic_launcher_round_xxxhdpi.png (192x192)

3. **Adaptive Icons** - Used for Android 8.0+ adaptive icons
   - ic_launcher_foreground_*.png - Foreground layer
   - ic_launcher_background_*.png - Background layer (white)

4. **Play Store Icon**
   - ic_launcher_play_store.png (512x512)

## Usage

These icons should be copied to the appropriate Android resource directories when building the app.
`;
    
    fs.writeFileSync(path.join(ANDROID_ICONS_DIR, 'README.md'), readmeContent);
    console.log('Created README with instructions');
    
  } catch (error) {
    console.error('Error generating Android icons:', error);
  }
}

// Run the script
generateAndroidIcons(); 