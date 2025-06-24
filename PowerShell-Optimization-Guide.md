# PowerShell Optimization Guide

This guide explains how to remove various limitations in PowerShell to ensure a smoother development experience.

## 1. Increase Buffer Size Limits

### Problem
PowerShell has default buffer size limitations that can cause errors with long commands or large outputs.

### Solution
Add the following to your PowerShell profile:

```powershell
# Increase buffer size
$bufferSize = $Host.UI.RawUI.BufferSize
$bufferSize.Width = 150
$bufferSize.Height = 5000
$Host.UI.RawUI.BufferSize = $bufferSize
```

## 2. Execution Policy Restrictions

### Problem
By default, PowerShell restricts script execution with the "Restricted" policy.

### Solution
Change the execution policy (requires admin rights):

```powershell
# Set for current user only (safer)
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# OR set for all users (requires admin)
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope LocalMachine
```

## 3. Memory Limitations

### Problem
PowerShell has default memory constraints that can limit performance with large datasets.

### Solution
Increase memory limits in your PowerShell profile:

```powershell
# Increase PowerShell memory limits
$memoryLimit = 2GB  # Adjust as needed
$MemoryPressureProtection = "Enabled"  # Memory optimization
```

## 4. Command History Limits

### Problem
PowerShell only keeps a limited command history by default.

### Solution
Increase history size in your profile:

```powershell
# Increase history size
$MaximumHistoryCount = 10000
```

## 5. Module Auto-Loading Limitations

### Problem
PowerShell doesn't automatically load all modules.

### Solution
Enable module auto-loading in your profile:

```powershell
# Enable module auto-loading
$PSModuleAutoLoadingPreference = "All"
```

## 6. Long Path Limitations

### Problem
Windows has a 260-character path limit that can affect PowerShell.

### Solution
Enable long path support in Windows registry:

1. Run Registry Editor (regedit.exe)
2. Navigate to `HKLM\SYSTEM\CurrentControlSet\Control\FileSystem`
3. Set `LongPathsEnabled` to `1`
4. Restart your computer

## 7. Performance Optimization

### Problem
PowerShell can be slow with certain operations.

### Solution
Add these performance tweaks to your profile:

```powershell
# Disable progress bar for faster downloads
$ProgressPreference = 'SilentlyContinue'

# Speed up ForEach-Object cmdlet
$ForEachObjectPreference = [System.Management.Automation.ForEachObjectPreference]::Parallel

# Increase job thread limit for parallel processing
$PSJobThreadOptions = [System.Management.Automation.PSJobThreadOptions]::UseNewThread
$PSJobMaxThreads = 16  # Adjust based on your CPU cores
```

## 8. Output Formatting Limitations

### Problem
PowerShell truncates output by default.

### Solution
Adjust formatting in your profile:

```powershell
# Prevent truncation in tables
$FormatEnumerationLimit = -1

# Increase displayed properties
$default_properties = 10
```

## 9. Console Window Limitations

### Problem
The PowerShell console window can be too small.

### Solution
Adjust window size in your profile:

```powershell
# Set window size
$windowSize = $Host.UI.RawUI.WindowSize
$windowSize.Width = 120
$windowSize.Height = 40
$Host.UI.RawUI.WindowSize = $windowSize
```

## 10. Finding Your PowerShell Profile

To edit your profile, you need to know where it's located:

```powershell
# Display the path to your profile
$PROFILE

# Create the profile if it doesn't exist
if (!(Test-Path -Path $PROFILE)) {
    New-Item -ItemType File -Path $PROFILE -Force
}

# Edit your profile
notepad $PROFILE
```

## 11. Apply All Optimizations at Once

Create a new PowerShell script named `optimize-powershell.ps1` with all these settings:

```powershell
# Create/update PowerShell profile with all optimizations
$profileContent = @'
# Increase buffer size
$bufferSize = $Host.UI.RawUI.BufferSize
$bufferSize.Width = 150
$bufferSize.Height = 5000
$Host.UI.RawUI.BufferSize = $bufferSize

# Set window size
$windowSize = $Host.UI.RawUI.WindowSize
$windowSize.Width = 120
$windowSize.Height = 40
$Host.UI.RawUI.WindowSize = $windowSize

# Increase PowerShell memory limits
$memoryLimit = 2GB
$MemoryPressureProtection = "Enabled"

# Increase history size
$MaximumHistoryCount = 10000

# Enable module auto-loading
$PSModuleAutoLoadingPreference = "All"

# Performance optimizations
$ProgressPreference = 'SilentlyContinue'
$ForEachObjectPreference = [System.Management.Automation.ForEachObjectPreference]::Parallel

# Prevent truncation in tables
$FormatEnumerationLimit = -1

# Other optimizations
$PSJobThreadOptions = [System.Management.Automation.PSJobThreadOptions]::UseNewThread
$PSJobMaxThreads = 16
'@

# Create profile if it doesn't exist
if (!(Test-Path -Path $PROFILE)) {
    New-Item -ItemType File -Path $PROFILE -Force
}

# Update profile with optimizations
Set-Content -Path $PROFILE -Value $profileContent

# Set execution policy for current user
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser -Force

Write-Host "PowerShell has been optimized! Please restart PowerShell to apply changes." -ForegroundColor Green
```

Run this script to apply all optimizations at once. 