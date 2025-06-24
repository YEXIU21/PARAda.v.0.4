/**
 * Generate iOS-Specific Icons Script
 * 
 * This script creates properly sized PNG icons for iOS from the source logo.
 * 
 * Usage: node generate-ios-icons.js
 */

const fs = require('fs');
const path = require('path');
const { createCanvas, loadImage } = require('canvas');

// Source logo path
const SOURCE_LOGO = path.join(__dirname, '../assets/images/adaptive-icon.png');

// Output directory for icons
const ICONS_DIR = path.join(__dirname, '../assets/ios-icons');

// iOS specific icon sizes
const IOS_ICON_SIZES = [
  { size: 180, name: 'apple-touch-icon-180x180.png' }, // iPhone 6 Plus, 7 Plus, 8 Plus
  { size: 167, name: 'apple-touch-icon-167x167.png' }, // iPad Pro
  { size: 152, name: 'apple-touch-icon-152x152.png' }, // iPad, iPad mini
  { size: 120, name: 'apple-touch-icon-120x120.png' }, // iPhone
  { size: 76, name: 'apple-touch-icon-76x76.png' },    // Older iPads
  { size: 60, name: 'apple-touch-icon-60x60.png' },    // Non-retina iPhone pre iOS 7
  { size: 114, name: 'apple-touch-icon-114x114.png' }, // iOS 6 iPhone (retina)
  { size: 144, name: 'apple-touch-icon-144x144.png' }  // iOS 6 iPad (retina)
];

// Ensure the icons directory exists
if (!fs.existsSync(ICONS_DIR)) {
  fs.mkdirSync(ICONS_DIR, { recursive: true });
  console.log(`Created iOS icons directory: ${ICONS_DIR}`);
}

// Create README file to explain the purpose of the directory
const readmeContent = `# iOS Icons

This directory contains iOS-specific icons generated from the adaptive-icon.png file.

These icons are optimized for iOS devices and used for the Apple Touch Icon meta tags.

Generated on: ${new Date().toISOString()}

## Sizes included:
${IOS_ICON_SIZES.map(icon => `- ${icon.size}x${icon.size} (${icon.name})`).join('\n')}

## Do not edit these files directly
These files are generated automatically. To update them, run:

\`\`\`
npm run generate-ios-icons
\`\`\`
`;

fs.writeFileSync(path.join(ICONS_DIR, 'README.md'), readmeContent);

// Function to generate a PNG icon of the specified size
async function generateIcon(sourceImage, size, outputName) {
  // Create a canvas with the target size
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  
  // Draw a white background (iOS icons don't have transparency)
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
  
  // Apply iOS icon styling (rounded corners)
  ctx.globalCompositeOperation = 'destination-in';
  
  // Create rounded rectangle with specific iOS corner radius (about 22.5% of the icon size)
  const radius = size * 0.225;
  roundRect(ctx, 0, 0, size, size, radius);
  
  // Save the canvas as PNG
  const outputPath = path.join(ICONS_DIR, outputName);
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(outputPath, buffer);
  
  console.log(`Generated iOS icon: ${outputPath}`);
}

// Helper function to create rounded rectangle path
function roundRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
  ctx.fill();
}

// Main function to generate all icons
async function generateIOSIcons() {
  try {
    console.log(`Loading source image: ${SOURCE_LOGO}`);
    const sourceImage = await loadImage(SOURCE_LOGO);
    
    // Generate icons for all sizes
    for (const icon of IOS_ICON_SIZES) {
      await generateIcon(sourceImage, icon.size, icon.name);
    }
    
    // Create a default apple-touch-icon.png (180x180)
    await generateIcon(sourceImage, 180, 'apple-touch-icon.png');
    await generateIcon(sourceImage, 192, 'apple-touch-icon-precomposed.png');
    
    console.log('All iOS icons generated successfully!');
  } catch (error) {
    console.error('Error generating iOS icons:', error);
  }
}

// Run the script
generateIOSIcons(); 