/**
 * Create Placeholder Icons Script
 * 
 * This script creates simple text-based placeholder icons for demonstration.
 * These should be replaced with proper icons for production.
 */
const fs = require('fs');
const path = require('path');

// Output directory for icons
const ICONS_DIR = path.join(__dirname, '../assets/icons');

// Ensure the icons directory exists
if (!fs.existsSync(ICONS_DIR)) {
  fs.mkdirSync(ICONS_DIR, { recursive: true });
  console.log(`Created icons directory: ${ICONS_DIR}`);
}

// Create a simple SVG icon with text
function createSvgIcon(size, text) {
  return `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="#4B6BFE"/>
  <text x="50%" y="50%" font-family="Arial" font-size="${size/4}px" 
    fill="white" text-anchor="middle" dominant-baseline="middle">${text}</text>
</svg>`;
}

// Create a simple HTML file that can be converted to PNG manually
function createHtmlIcon(size, text) {
  return `<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      margin: 0;
      padding: 0;
      width: ${size}px;
      height: ${size}px;
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: #4B6BFE;
      color: white;
      font-family: Arial, sans-serif;
      font-size: ${size/4}px;
      font-weight: bold;
    }
  </style>
</head>
<body>
  ${text}
</body>
</html>`;
}

// Icon sizes to generate
const iconSizes = [72, 96, 128, 144, 152, 192, 384, 512];

// Generate placeholder SVG icons
iconSizes.forEach(size => {
  const text = 'PARAda';
  const svgContent = createSvgIcon(size, text);
  const htmlContent = createHtmlIcon(size, text);
  
  fs.writeFileSync(path.join(ICONS_DIR, `icon-${size}x${size}.svg`), svgContent);
  fs.writeFileSync(path.join(ICONS_DIR, `icon-${size}x${size}.html`), htmlContent);
  
  console.log(`Created placeholder SVG and HTML for icon-${size}x${size}`);
});

console.log('\nDone! Placeholder SVG and HTML files have been created.');
console.log('You can convert these to PNG files using a browser or image editor.');
console.log('For production, replace these with properly designed icons.'); 