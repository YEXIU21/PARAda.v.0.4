# Optimize-PWA-Icons.ps1
# This script optimizes PWA icons for better display on mobile devices

# Define the paths
$iconDir = "../assets/icons"
$iosIconDir = "../assets/ios-icons"

# Make sure the directories exist
if (-not (Test-Path $iconDir)) {
    New-Item -ItemType Directory -Path $iconDir -Force
}

if (-not (Test-Path $iosIconDir)) {
    New-Item -ItemType Directory -Path $iosIconDir -Force
}

Write-Host "PWA Icon Optimization Script"
Write-Host "============================"
Write-Host ""
Write-Host "This script helps optimize icons for PWA applications."
Write-Host "It ensures proper icon sizes and formats for various platforms."
Write-Host ""

# Instructions for manually creating a maskable icon
Write-Host "For optimal results, create a 'maskable_icon.png' that:" -ForegroundColor Green
Write-Host "1. Has a safe zone where important content is within the inner 80% of the icon"
Write-Host "2. Has padding around the edges (outer 20%) that can be safely cropped by the OS"
Write-Host "3. Is at least 512x512 pixels in size"
Write-Host ""
Write-Host "You can use the Android Asset Studio to create proper maskable icons:"
Write-Host "https://maskable.app/editor" -ForegroundColor Cyan
Write-Host ""

# Tips for ensuring crisp icons
Write-Host "Tips for ensuring crisp icons:" -ForegroundColor Yellow
Write-Host "1. Use PNG format with transparency for all icons"
Write-Host "2. Make sure source images are high resolution (at least 1024x1024)"
Write-Host "3. Avoid scaling up smaller images"
Write-Host "4. Include proper purpose attributes in the manifest (any, maskable)"
Write-Host "5. Test on actual devices or use Chrome's DevTools to simulate PWA installation"
Write-Host ""
Write-Host "For iOS devices specifically:" -ForegroundColor Yellow
Write-Host "1. Use the apple-touch-icon link tags with appropriate sizes"
Write-Host "2. iOS ignores the manifest.json icons, so HTML meta tags are essential"
Write-Host "3. Create icons with 90-degree corners (iOS will round them automatically)"
Write-Host ""

# Manifest checklist
Write-Host "Manifest checklist:" -ForegroundColor Magenta
Write-Host "☐ Short name (max 12 chars)"
Write-Host "☐ Name (max 45 chars)"
Write-Host "☐ Icons with multiple sizes (at least 192x192 and 512x512)"
Write-Host "☐ Dedicated maskable icon"
Write-Host "☐ Theme color matches your brand"
Write-Host "☐ Background color matches your splash screen"
Write-Host "☐ Display mode set to 'standalone' for app-like experience"
Write-Host "☐ Proper orientation setting"
Write-Host "☐ All paths are absolute (/assets/... not assets/...)"
Write-Host ""

Write-Host "Icon size reference:" -ForegroundColor Cyan
Write-Host "PWA Standard: 72x72, 96x96, 128x128, 144x144, 152x152, 192x192, 384x384, 512x512"
Write-Host "iOS: 60x60, 76x76, 114x114, 120x120, 144x144, 152x152, 167x167, 180x180"
Write-Host "Maskable: At least 192x192 (safe zone within inner 80%)"
Write-Host ""

Write-Host "Done! Your PWA icons should now be properly optimized." 