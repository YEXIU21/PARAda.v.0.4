/**
 * Generate iOS-Specific Splash Screens
 * 
 * This script creates properly sized splash screens for iOS devices
 * to be used as apple-touch-startup-image.
 * 
 * Usage: node generate-ios-splash-screens.js
 */

const fs = require('fs');
const path = require('path');
const { createCanvas, loadImage } = require('canvas');

// Source logo path
const SOURCE_LOGO = path.join(__dirname, '../assets/images/PARAda-Logo.png');

// Output directory for iOS splash screens
const IOS_SPLASH_DIR = path.join(__dirname, '../public/assets/ios-splash');

// iOS splash screen configurations
// Format: [width, height, device, orientation]
const IOS_SPLASH_SCREENS = [
  // iPhone SE, 5s, 5c, 5 (portrait)
  [640, 1136, 'iPhone SE', 'portrait'],
  // iPhone 6s, 6, 7, 8 (portrait)
  [750, 1334, 'iPhone 8', 'portrait'],
  // iPhone XR, 11 (portrait)
  [828, 1792, 'iPhone 11', 'portrait'],
  // iPhone X, XS, 12 Pro, 13 Pro (portrait)
  [1125, 2436, 'iPhone 13 Pro', 'portrait'],
  // iPhone XS Max, 11 Pro Max (portrait)
  [1242, 2688, 'iPhone 11 Pro Max', 'portrait'],
  // iPhone 12, 12 Pro Max, 13, 13 Pro Max (portrait)
  [1284, 2778, 'iPhone 13 Pro Max', 'portrait'],
  // iPad (portrait)
  [1536, 2048, 'iPad', 'portrait'],
  // iPad Pro 10.5" (portrait)
  [1668, 2224, 'iPad Pro 10.5', 'portrait'],
  // iPad Pro 11" (portrait)
  [1668, 2388, 'iPad Pro 11', 'portrait'],
  // iPad Pro 12.9" (portrait)
  [2048, 2732, 'iPad Pro 12.9', 'portrait'],
  
  // Landscape orientations
  // iPhone SE, 5s, 5c, 5 (landscape)
  [1136, 640, 'iPhone SE', 'landscape'],
  // iPhone 6s, 6, 7, 8 (landscape)
  [1334, 750, 'iPhone 8', 'landscape'],
  // iPhone XR, 11 (landscape)
  [1792, 828, 'iPhone 11', 'landscape'],
  // iPhone X, XS, 12 Pro, 13 Pro (landscape)
  [2436, 1125, 'iPhone 13 Pro', 'landscape'],
  // iPhone XS Max, 11 Pro Max (landscape)
  [2688, 1242, 'iPhone 11 Pro Max', 'landscape'],
  // iPhone 12, 12 Pro Max, 13, 13 Pro Max (landscape)
  [2778, 1284, 'iPhone 13 Pro Max', 'landscape'],
  // iPad (landscape)
  [2048, 1536, 'iPad', 'landscape'],
  // iPad Pro 10.5" (landscape)
  [2224, 1668, 'iPad Pro 10.5', 'landscape'],
  // iPad Pro 11" (landscape)
  [2388, 1668, 'iPad Pro 11', 'landscape'],
  // iPad Pro 12.9" (landscape)
  [2732, 2048, 'iPad Pro 12.9', 'landscape'],
];

// Ensure the output directory exists
if (!fs.existsSync(IOS_SPLASH_DIR)) {
  fs.mkdirSync(IOS_SPLASH_DIR, { recursive: true });
  console.log(`Created iOS splash screen directory: ${IOS_SPLASH_DIR}`);
}

// Function to generate a splash screen of the specified size
async function generateIOSSplashScreen(sourceImage, width, height, device, orientation, outputPath) {
  // Create a canvas with the target size
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');
  
  // Fill with white background
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, width, height);
  
  // Calculate logo size (30% of the smaller dimension)
  const logoSize = Math.min(width, height) * 0.3;
  
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
  
  console.log(`Generated iOS splash screen: ${outputPath}`);
}

// Main function to generate all iOS splash screens
async function generateIOSSplashScreens() {
  try {
    console.log(`Loading source image: ${SOURCE_LOGO}`);
    const sourceImage = await loadImage(SOURCE_LOGO);
    
    // Generate splash screens for all iOS device sizes
    for (const [width, height, device, orientation] of IOS_SPLASH_SCREENS) {
      const filename = `splash-${width}x${height}.png`;
      const outputPath = path.join(IOS_SPLASH_DIR, filename);
      await generateIOSSplashScreen(sourceImage, width, height, device, orientation, outputPath);
    }
    
    console.log('All iOS splash screens generated successfully!');
    
    // Create a README file with instructions
    const readmeContent = `# iOS Splash Screen Images

This directory contains splash screen images for various iOS devices.

## Available Sizes

${IOS_SPLASH_SCREENS.map(([width, height, device, orientation]) => 
  `- ${width}x${height} (${device}, ${orientation}): splash-${width}x${height}.png`
).join('\n')}

## Usage

These splash screen images should be referenced in the HTML using apple-touch-startup-image meta tags
with appropriate media queries to target specific device sizes.
`;
    
    fs.writeFileSync(path.join(IOS_SPLASH_DIR, 'README.md'), readmeContent);
    console.log('Created README with instructions');
    
  } catch (error) {
    console.error('Error generating iOS splash screens:', error);
  }
}

// Run the script
generateIOSSplashScreens(); 