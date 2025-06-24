# PowerShell Console Fix

This package contains scripts to fix common PowerShell console issues, such as buffer size limitations that can cause errors with long command lines.

## Problem

The PowerShell console can encounter buffer size issues with:
- Long command lines
- Complex Git commands with long paths or messages
- Output that exceeds the default buffer size

## Solution

This package provides two scripts:

1. `fix-powershell.ps1` - PowerShell script that:
   - Increases the console buffer size
   - Adjusts window dimensions
   - Updates your PowerShell profile to maintain these settings

2. `fix-powershell.bat` - Batch file that:
   - Runs the PowerShell script with administrative privileges
   - Bypasses execution policy restrictions

## How to Use

### Option 1: Run the Batch File (Recommended)

1. Double-click `fix-powershell.bat`
2. Approve the UAC prompt if it appears
3. The script will apply the changes and update your PowerShell profile

### Option 2: Run the PowerShell Script Directly

1. Right-click on `fix-powershell.ps1` and select "Run with PowerShell"
2. If you encounter execution policy errors, use this command:
   ```
   powershell -ExecutionPolicy Bypass -File fix-powershell.ps1
   ```

## After Running the Fix

- Open a new PowerShell window to apply the changes
- The console should now handle longer command lines without buffer errors
- Your PowerShell profile has been updated to maintain these settings

## Troubleshooting

If you encounter issues after running the fix:

1. Ensure you ran the script with administrative privileges
2. Try restarting your computer
3. Check if your PowerShell profile exists at the location specified by `$PROFILE` 