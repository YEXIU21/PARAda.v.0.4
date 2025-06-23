/**
 * Generate PWA Icons Script
 * 
 * This script creates properly sized PNG icons for the PWA from the source logo.
 * 
 * Usage: node generate-pwa-icons.js
 */

const fs = require('fs');
const path = require('path');
const { createCanvas, loadImage } = require('canvas');

// Source logo path
const SOURCE_LOGO = path.join(__dirname, '../assets/images/adaptive-icon.png');

// Output directory for icons
const ICONS_DIR = path.join(__dirname, '../assets/icons');

// Icon sizes to generate
const ICON_SIZES = [72, 96, 128, 144, 152, 192, 384, 512];

// Ensure the icons directory exists
if (!fs.existsSync(ICONS_DIR)) {
  fs.mkdirSync(ICONS_DIR, { recursive: true });
  console.log(`Created icons directory: ${ICONS_DIR}`);
}

// Function to generate a PNG icon of the specified size
async function generateIcon(sourceImage, size) {
  // Create a canvas with the target size
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  
  // Draw a white background (optional, for icons with transparency)
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, size, size);
  
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
  const outputPath = path.join(ICONS_DIR, `icon-${size}x${size}.png`);
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(outputPath, buffer);
  
  console.log(`Generated icon: ${outputPath}`);
}

// Main function to generate all icons
async function generateIcons() {
  try {
    console.log(`Loading source image: ${SOURCE_LOGO}`);
    const sourceImage = await loadImage(SOURCE_LOGO);
    
    // Generate icons for all sizes
    for (const size of ICON_SIZES) {
      await generateIcon(sourceImage, size);
    }
    
    console.log('All icons generated successfully!');
  } catch (error) {
    console.error('Error generating icons:', error);
  }
}

// Run the script
generateIcons(); 