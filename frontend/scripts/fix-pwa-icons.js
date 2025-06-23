/**
 * Fix PWA Icons Script
 * 
 * This script copies the logo to the icons directory and creates a README
 * with instructions for manual resizing.
 */
const fs = require('fs');
const path = require('path');

// Source logo path
const SOURCE_LOGO = path.join(__dirname, '../assets/images/PARAdalogo.jpg');

// Output directory for icons
const ICONS_DIR = path.join(__dirname, '../assets/icons');

// Ensure the icons directory exists
if (!fs.existsSync(ICONS_DIR)) {
  fs.mkdirSync(ICONS_DIR, { recursive: true });
  console.log(`Created icons directory: ${ICONS_DIR}`);
}

// Copy the source logo to the icons directory
fs.copyFileSync(SOURCE_LOGO, path.join(ICONS_DIR, 'original-logo.jpg'));
console.log('Copied original logo to icons directory');

// Create a README file with instructions
const readmeContent = `# PWA Icons

The PWA manifest is configured to use properly sized PNG icons, but they need to be created manually.

## Required Icon Sizes

Please create the following PNG icons from the original-logo.jpg:

- icon-72x72.png
- icon-96x96.png
- icon-128x128.png
- icon-144x144.png
- icon-152x152.png
- icon-192x192.png
- icon-384x384.png
- icon-512x512.png

You can use an online tool like:
- https://www.iloveimg.com/resize-image
- https://squoosh.app/
- https://imageresizer.com/

## Important Tips for Sharp Icons

1. Use PNG format (not JPEG) for better quality with transparency
2. Make sure each icon is exactly the specified size (e.g., 72x72 pixels)
3. Use high-quality resizing algorithms to avoid blurriness
4. Ensure the icon has good contrast against both light and dark backgrounds
5. Consider adding a small padding around the logo within the icon
`;

fs.writeFileSync(path.join(ICONS_DIR, 'README.md'), readmeContent);
console.log('Created README with instructions for manual icon creation');

// Create a placeholder for each required icon
const iconSizes = [72, 96, 128, 144, 152, 192, 384, 512];
const placeholderContent = `This is a placeholder file. Please replace with a properly sized PNG icon.`;

iconSizes.forEach(size => {
  fs.writeFileSync(
    path.join(ICONS_DIR, `icon-${size}x${size}.png.placeholder`), 
    placeholderContent
  );
  console.log(`Created placeholder for icon-${size}x${size}.png`);
});

console.log('\nDone! Please manually create the PNG icons as described in the README.');
console.log('After creating the icons, the PWA will display properly on the homescreen.'); 