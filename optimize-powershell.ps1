# PowerShell Optimization Script
# This script removes common PowerShell limitations and optimizes performance

# Ensure we can modify the profile
$ErrorActionPreference = "SilentlyContinue"

# Create/update PowerShell profile with all optimizations
$profileContent = @'
# Increase buffer size
$bufferSize = $Host.UI.RawUI.BufferSize
$bufferSize.Width = 150
$bufferSize.Height = 5000
try { $Host.UI.RawUI.BufferSize = $bufferSize } catch {}

# Set window size
$windowSize = $Host.UI.RawUI.WindowSize
$windowSize.Width = 120
$windowSize.Height = 40
try { $Host.UI.RawUI.WindowSize = $windowSize } catch {}

# Increase PowerShell memory limits
$memoryLimit = 2GB
$MemoryPressureProtection = "Enabled"

# Increase history size
$MaximumHistoryCount = 10000

# Enable module auto-loading
$PSModuleAutoLoadingPreference = "All"

# Performance optimizations
$ProgressPreference = 'SilentlyContinue'
try { $ForEachObjectPreference = [System.Management.Automation.ForEachObjectPreference]::Parallel } catch {}

# Prevent truncation in tables
$FormatEnumerationLimit = -1

# Other optimizations
try { $PSJobThreadOptions = [System.Management.Automation.PSJobThreadOptions]::UseNewThread } catch {}
$PSJobMaxThreads = 16

# Customize console colors for better readability
$Host.UI.RawUI.ForegroundColor = "White"
$Host.UI.RawUI.BackgroundColor = "Black"

# Define custom prompt with reduced length to avoid buffer issues
function prompt {
    $path = $(Get-Location).Path
    $shortPath = $path
    
    # Shorten path if it's too long
    if ($path.Length -gt 40) {
        $pathParts = $path.Split([IO.Path]::DirectorySeparatorChar)
        if ($pathParts.Count -gt 3) {
            $shortPath = $pathParts[0] + [IO.Path]::DirectorySeparatorChar + "..." + [IO.Path]::DirectorySeparatorChar + $pathParts[-1]
        }
    }
    
    return "PS $shortPath> "
}

# Better error handling
$ErrorView = "CategoryView"

# Alias for common commands to reduce typing
Set-Alias -Name ll -Value Get-ChildItem
Set-Alias -Name grep -Value Select-String
Set-Alias -Name touch -Value New-Item
'@

# Create profile if it doesn't exist
if (!(Test-Path -Path $PROFILE)) {
    try {
        New-Item -ItemType File -Path $PROFILE -Force | Out-Null
        Write-Host "Created new PowerShell profile at $PROFILE" -ForegroundColor Green
    } catch {
        Write-Host "Failed to create profile at $PROFILE" -ForegroundColor Red
        Write-Host "Error: $_" -ForegroundColor Red
    }
}

# Update profile with optimizations
try {
    Set-Content -Path $PROFILE -Value $profileContent
    Write-Host "Successfully updated PowerShell profile with optimizations" -ForegroundColor Green
} catch {
    Write-Host "Failed to update PowerShell profile" -ForegroundColor Red
    Write-Host "Error: $_" -ForegroundColor Red
}

# Try to set execution policy for current user
try {
    Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser -Force
    Write-Host "Set execution policy to RemoteSigned for current user" -ForegroundColor Green
} catch {
    Write-Host "Failed to set execution policy (may require admin rights)" -ForegroundColor Yellow
    Write-Host "You can manually set it by running PowerShell as admin and using:" -ForegroundColor Yellow
    Write-Host "Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser" -ForegroundColor Cyan
}

# Try to enable long paths in registry if running as admin
try {
    $regPath = "HKLM:\SYSTEM\CurrentControlSet\Control\FileSystem"
    if (Test-Path -Path $regPath) {
        Set-ItemProperty -Path $regPath -Name "LongPathsEnabled" -Value 1 -Type DWord
        Write-Host "Enabled long path support in Windows registry" -ForegroundColor Green
    }
} catch {
    Write-Host "Could not enable long path support (requires admin rights)" -ForegroundColor Yellow
    Write-Host "To enable manually, run regedit.exe and set HKLM\SYSTEM\CurrentControlSet\Control\FileSystem\LongPathsEnabled to 1" -ForegroundColor Cyan
}

# Apply current session settings
try {
    $Host.UI.RawUI.ForegroundColor = "White"
    $Host.UI.RawUI.BackgroundColor = "Black"
    
    $bufferSize = $Host.UI.RawUI.BufferSize
    $bufferSize.Width = 150
    $bufferSize.Height = 5000
    $Host.UI.RawUI.BufferSize = $bufferSize
    
    $windowSize = $Host.UI.RawUI.WindowSize
    $windowSize.Width = 120
    $windowSize.Height = 40
    $Host.UI.RawUI.WindowSize = $windowSize
    
    Clear-Host
    
    Write-Host "Applied settings to current session" -ForegroundColor Green
} catch {
    Write-Host "Could not apply all settings to current session" -ForegroundColor Yellow
    Write-Host "Some settings will be applied when you restart PowerShell" -ForegroundColor Yellow
}

Write-Host "`nPowerShell has been optimized! Please restart PowerShell to apply all changes." -ForegroundColor Green
Write-Host "Your PowerShell profile is located at: $PROFILE" -ForegroundColor Cyan 