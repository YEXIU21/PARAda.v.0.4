# PWA Icons for PARAda

This directory contains the Progressive Web App (PWA) icons for PARAda.

## Icon Files

- `icon-72x72.png` - 72×72 pixel icon
- `icon-96x96.png` - 96×96 pixel icon
- `icon-128x128.png` - 128×128 pixel icon
- `icon-144x144.png` - 144×144 pixel icon
- `icon-152x152.png` - 152×152 pixel icon
- `icon-192x192.png` - 192×192 pixel icon
- `icon-384x384.png` - 384×384 pixel icon
- `icon-512x512.png` - 512×512 pixel icon
- `maskable_icon.png` - Special icon with padding for Android adaptive icons

## About Maskable Icons

Maskable icons are a new icon format for Android that ensures your PWA icon looks great on all Android devices. When a PWA is installed on Android, the icon can be displayed in various shapes depending on the device theme (circle, square, rounded square, etc.).

A maskable icon has extra padding around it (in the "safe zone") to ensure that important content isn't cut off when the icon is displayed in different shapes.

### Safe Zone Guidelines

The important content of your icon should be within the inner 80% of the image (the "safe zone"). The outer 20% may be cropped depending on the device's icon shape.

Example:
- For a 192×192 icon, keep important content within the inner ~154×154 pixels
- For a 512×512 icon, keep important content within the inner ~410×410 pixels

### Testing Maskable Icons

You can test your maskable icons using:
1. Chrome DevTools > Application > Manifest > Icons
2. [Maskable.app Editor](https://maskable.app/editor)

## Troubleshooting Blurry Icons

If icons appear blurry on devices:

1. **Ensure proper icon sizes** - Use the correct sizes for each platform
2. **Check image quality** - Start with high-resolution source images
3. **Use the purpose attribute** - Make sure icons have the correct purpose in the manifest
4. **Test on actual devices** - Emulators may not always show accurate results
5. **Check meta tags** - For iOS, ensure apple-touch-icon tags are properly set

## References

- [Web App Manifest - MDN](https://developer.mozilla.org/en-US/docs/Web/Manifest)
- [Maskable Icons - web.dev](https://web.dev/maskable-icon/)
- [PWA Icon Generator - PWABuilder](https://www.pwabuilder.com/imageGenerator) 