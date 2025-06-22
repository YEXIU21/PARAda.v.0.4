#!/usr/bin/env node
/**
 * Script to prepare the project for Vercel deployment
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  underscore: '\x1b[4m',
  blink: '\x1b[5m',
  reverse: '\x1b[7m',
  hidden: '\x1b[8m',
  
  fg: {
    black: '\x1b[30m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m',
    crimson: '\x1b[38m'
  },
  bg: {
    black: '\x1b[40m',
    red: '\x1b[41m',
    green: '\x1b[42m',
    yellow: '\x1b[43m',
    blue: '\x1b[44m',
    magenta: '\x1b[45m',
    cyan: '\x1b[46m',
    white: '\x1b[47m',
    crimson: '\x1b[48m'
  }
};

console.log(`${colors.fg.cyan}${colors.bright}=== PARAda Vercel Deployment Script ===${colors.reset}\n`);

// Step 1: Build the web version
console.log(`${colors.fg.yellow}Step 1: Building the web version...${colors.reset}`);

try {
  console.log('Running expo export --platform web...');
  execSync('npm run build', { stdio: 'inherit' });
  console.log(`${colors.fg.green}✓ Build completed successfully${colors.reset}\n`);
} catch (error) {
  console.error(`${colors.fg.red}✗ Build failed: ${error.message}${colors.reset}`);
  process.exit(1);
}

// Step 2: Copy service worker to dist folder
console.log(`${colors.fg.yellow}Step 2: Ensuring service worker is in the dist folder...${colors.reset}`);

try {
  const serviceWorkerSource = path.join(__dirname, '..', 'service-worker.js');
  const serviceWorkerDest = path.join(__dirname, '..', 'dist', 'service-worker.js');
  
  if (fs.existsSync(serviceWorkerSource)) {
    fs.copyFileSync(serviceWorkerSource, serviceWorkerDest);
    console.log(`${colors.fg.green}✓ Service worker copied to dist folder${colors.reset}\n`);
  } else {
    console.warn(`${colors.fg.yellow}⚠ Service worker not found at ${serviceWorkerSource}${colors.reset}\n`);
  }
} catch (error) {
  console.error(`${colors.fg.red}✗ Failed to copy service worker: ${error.message}${colors.reset}`);
}

// Step 3: Copy web manifest to dist folder
console.log(`${colors.fg.yellow}Step 3: Ensuring web manifest is in the dist folder...${colors.reset}`);

try {
  const manifestSource = path.join(__dirname, '..', 'web-manifest.json');
  const manifestDest = path.join(__dirname, '..', 'dist', 'manifest.json');
  
  if (fs.existsSync(manifestSource)) {
    fs.copyFileSync(manifestSource, manifestDest);
    console.log(`${colors.fg.green}✓ Web manifest copied to dist folder${colors.reset}\n`);
  } else {
    console.warn(`${colors.fg.yellow}⚠ Web manifest not found at ${manifestSource}${colors.reset}\n`);
  }
} catch (error) {
  console.error(`${colors.fg.red}✗ Failed to copy web manifest: ${error.message}${colors.reset}`);
}

// Step 4: Test the build
console.log(`${colors.fg.yellow}Step 4: Testing the build...${colors.reset}`);

try {
  console.log('Starting local server to test the build...');
  console.log(`You can test the build by running: ${colors.fg.cyan}npm run serve${colors.reset}`);
  console.log(`Then visit: ${colors.fg.cyan}http://localhost:3000${colors.reset}\n`);
} catch (error) {
  console.error(`${colors.fg.red}✗ Failed to start test server: ${error.message}${colors.reset}`);
}

// Step 5: Deployment instructions
console.log(`${colors.fg.yellow}Step 5: Deployment instructions${colors.reset}`);
console.log(`
${colors.bright}To deploy to Vercel:${colors.reset}

1. Push your code to GitHub
2. Go to ${colors.fg.cyan}https://vercel.com${colors.reset} and create a new project
3. Import your GitHub repository
4. Configure the project:
   - Root Directory: ${colors.fg.cyan}frontend${colors.reset}
   - Build Command: ${colors.fg.cyan}npm run build${colors.reset}
   - Output Directory: ${colors.fg.cyan}dist${colors.reset}
5. Add any required environment variables
6. Click "Deploy"

${colors.bright}For the backend:${colors.reset}

1. Create a separate Vercel project for the backend
2. Root Directory: ${colors.fg.cyan}backend${colors.reset}
3. Add all required environment variables
4. Deploy the backend

${colors.bright}After deployment:${colors.reset}

1. Update the frontend API URL to point to your deployed backend
2. Test the PWA installation by visiting your deployed site on a mobile device
`);

console.log(`${colors.fg.green}${colors.bright}Deployment preparation complete!${colors.reset}`); 