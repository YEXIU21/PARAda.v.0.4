# Fix PowerShell Console Settings
# This script adjusts PowerShell console settings to avoid buffer size issues

# Save current error action preference
$ErrorActionPreference = "SilentlyContinue"

# Get the current console window
$console = $Host.UI.RawUI

# Set larger buffer size
$bufferSize = $console.BufferSize
$bufferSize.Width = 120
$bufferSize.Height = 3000
$console.BufferSize = $bufferSize

# Set window size
$windowSize = $console.WindowSize
$windowSize.Width = 120
$windowSize.Height = 30
$console.WindowSize = $windowSize

# Apply color scheme
$console.BackgroundColor = "Black"
$console.ForegroundColor = "White"

# Create a PowerShell profile if it doesn't exist
$profilePath = $PROFILE.CurrentUserCurrentHost
if (-not (Test-Path -Path $profilePath)) {
    New-Item -ItemType File -Path $profilePath -Force | Out-Null
    Write-Host "Created PowerShell profile at $profilePath"
}

# Add buffer size settings to profile
$profileContent = @"
# Increase buffer size to avoid console errors
`$bufferSize = `$Host.UI.RawUI.BufferSize
`$bufferSize.Width = 120
`$bufferSize.Height = 3000
`$Host.UI.RawUI.BufferSize = `$bufferSize
"@

# Check if settings are already in profile
$currentProfile = Get-Content -Path $profilePath -Raw -ErrorAction SilentlyContinue
if ($currentProfile -notlike "*BufferSize*") {
    Add-Content -Path $profilePath -Value $profileContent
    Write-Host "Updated PowerShell profile with buffer size settings"
} else {
    Write-Host "PowerShell profile already contains buffer size settings"
}

# Clear console
Clear-Host

Write-Host "PowerShell console settings have been fixed!" -ForegroundColor Green
Write-Host "Buffer size increased to avoid console errors with long commands." -ForegroundColor Cyan
Write-Host "These settings will apply to new PowerShell sessions." -ForegroundColor Yellow 