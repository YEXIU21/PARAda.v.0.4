const createExpoWebpackConfig = require('@expo/webpack-config');
const WorkboxWebpackPlugin = require('workbox-webpack-plugin');
const WebpackPwaManifest = require('webpack-pwa-manifest');
const path = require('path');
const fs = require('fs');

module.exports = async function(env, argv) {
  const config = await createExpoWebpackConfig(env, argv);
  
  // Add PWA manifest plugin
  config.plugins.push(
    new WebpackPwaManifest({
      name: 'PARAda Transport',
      short_name: 'PARAda',
      description: 'Real-Time Transportation Tracking for Smarter Travel',
      background_color: '#FFFFFF',
      theme_color: '#4B6BFE',
      display: 'standalone',
      orientation: 'portrait',
      scope: '/',
      start_url: '/',
      icons: [
        {
          src: path.resolve('assets/images/PARAdalogo.jpg'),
          sizes: [96, 128, 192, 256, 384, 512],
          destination: path.join('assets', 'icons'),
        },
      ],
    })
  );
  
  // Add service worker generation plugin
  config.plugins.push(
    new WorkboxWebpackPlugin.GenerateSW({
      clientsClaim: true,
      skipWaiting: true,
      maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5MB
    })
  );

  // Copy service worker to the output directory
  const serviceWorkerPath = path.resolve(__dirname, 'service-worker.js');
  if (fs.existsSync(serviceWorkerPath)) {
    config.plugins.push({
      apply: (compiler) => {
        compiler.hooks.afterEmit.tap('CopyServiceWorker', (compilation) => {
          fs.copyFileSync(
            serviceWorkerPath,
            path.join(compiler.outputPath, 'service-worker.js')
          );
        });
      },
    });
  }
  
  return config;
}; 