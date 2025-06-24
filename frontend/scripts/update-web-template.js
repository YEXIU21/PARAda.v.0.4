/**
 * Update Web Build Template Script
 * 
 * This script updates the web-build-template.html file with proper iOS icon references
 * 
 * Usage: node update-web-template.js
 */

const fs = require('fs');
const path = require('path');

// Define paths
const templatePath = path.join(__dirname, '../web-build-template.html');
const updatedTemplatePath = path.join(__dirname, '../web-build-template-updated.html');

// Read the template file
console.log(`Reading template from: ${templatePath}`);
let templateContent = fs.readFileSync(templatePath, 'utf8');

// Update apple-touch-icon references
console.log('Updating Apple Touch Icon references...');
const oldAppleTouchIconsRegex = /<link rel="apple-touch-icon"[^>]*>/g;
const appleTouchIconsReplacement = `  <link rel="apple-touch-icon" sizes="180x180" href="/assets/ios-icons/apple-touch-icon-180x180.png" />
  <link rel="apple-touch-icon" sizes="167x167" href="/assets/ios-icons/apple-touch-icon-167x167.png" />
  <link rel="apple-touch-icon" sizes="152x152" href="/assets/ios-icons/apple-touch-icon-152x152.png" />
  <link rel="apple-touch-icon" sizes="120x120" href="/assets/ios-icons/apple-touch-icon-120x120.png" />
  <link rel="apple-touch-icon" sizes="114x114" href="/assets/ios-icons/apple-touch-icon-114x114.png" />
  <link rel="apple-touch-icon" sizes="76x76" href="/assets/ios-icons/apple-touch-icon-76x76.png" />
  <link rel="apple-touch-icon" sizes="60x60" href="/assets/ios-icons/apple-touch-icon-60x60.png" />
  <!-- Default icon for older iOS devices -->
  <link rel="apple-touch-icon" href="/assets/ios-icons/apple-touch-icon.png" />
  <!-- Precomposed icon for older iOS versions -->
  <link rel="apple-touch-icon-precomposed" href="/assets/ios-icons/apple-touch-icon-precomposed.png" />`;

templateContent = templateContent.replace(oldAppleTouchIconsRegex, appleTouchIconsReplacement);

// Update preload links
console.log('Updating preload links...');
const oldPreloadRegex = /<link rel="preload"[^>]*>/g;
const preloadReplacement = `  <!-- Preload the icon images -->
  <link rel="preload" href="/assets/icons/icon-192x192.png" as="image" type="image/png">
  <link rel="preload" href="/assets/ios-icons/apple-touch-icon-180x180.png" as="image" type="image/png">`;

templateContent = templateContent.replace(oldPreloadRegex, preloadReplacement);

// Update initial loader image
console.log('Updating initial loader image...');
const oldLoaderImageRegex = /<img src="[^"]*" alt="PARAda Logo" class="initial-loader-logo" \/>/;
const loaderImageReplacement = `<img src="/assets/icons/icon-192x192.png" alt="PARAda Logo" class="initial-loader-logo" />`;

templateContent = templateContent.replace(oldLoaderImageRegex, loaderImageReplacement);

// Update preload script
console.log('Updating preload script...');
const oldPreloadScriptRegex = /\/\/ Preload the icon image[^<]*/;
const preloadScriptReplacement = `    // Preload all icon sizes for better performance
    const preloadIcons = [
      // Standard PWA icons
      [72, 96, 128, 144, 152, 192, 384, 512].forEach(size => {
        const img = new Image();
        img.src = \`/assets/icons/icon-\${size}x\${size}.png\`;
      }),
      
      // iOS specific icons
      [60, 76, 114, 120, 144, 152, 167, 180].forEach(size => {
        const img = new Image();
        img.src = \`/assets/ios-icons/apple-touch-icon-\${size}x\${size}.png\`;
      })
    ];`;

templateContent = templateContent.replace(oldPreloadScriptRegex, preloadScriptReplacement);

// Add meta tags for iOS
console.log('Adding iOS meta tags...');
const metaTagsRegex = /<meta name="apple-mobile-web-app-status-bar-style"[^>]*>/;
const additionalMetaTags = `  <meta name="apple-mobile-web-app-status-bar-style" content="default" />
  <meta name="apple-mobile-web-app-title" content="PARAda" />
  <meta name="application-name" content="PARAda" />
  <meta name="mobile-web-app-capable" content="yes" />`;

templateContent = templateContent.replace(metaTagsRegex, additionalMetaTags);

// Write the updated template
console.log(`Writing updated template to: ${updatedTemplatePath}`);
fs.writeFileSync(updatedTemplatePath, templateContent);

// Backup the original template
const backupPath = path.join(__dirname, '../web-build-template-backup.html');
console.log(`Backing up original template to: ${backupPath}`);
fs.copyFileSync(templatePath, backupPath);

// Replace the original template with the updated one
console.log(`Replacing original template with updated version`);
fs.copyFileSync(updatedTemplatePath, templatePath);
fs.unlinkSync(updatedTemplatePath);

console.log('Web build template updated successfully!'); 