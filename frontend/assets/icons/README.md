# PWA Icons

This project uses a single high-resolution icon file for all PWA icon sizes.

## Icon Source

The main icon file is located at:
- `frontend/assets/images/adaptive-icon.png`

This file is referenced directly in the PWA manifest (`frontend/web/manifest.json`) for all icon sizes.

## Why a Single Icon?

Using a single high-resolution icon file (512x512px or larger) allows modern browsers to automatically resize the icon as needed for different contexts, which:
- Simplifies icon management
- Ensures consistent appearance across devices
- Reduces the number of files to maintain

## Icon Requirements

For optimal display, the icon should:
- Be at least 512x512 pixels
- Use PNG format with transparency
- Have good contrast against both light and dark backgrounds
- Include a small padding around the logo within the icon 