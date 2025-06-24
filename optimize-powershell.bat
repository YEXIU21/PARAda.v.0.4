@echo off
echo =======================================
echo  PowerShell Optimization Tool
echo =======================================
echo.
echo This will optimize your PowerShell environment by:
echo  - Increasing buffer size limits
echo  - Setting appropriate execution policies
echo  - Optimizing performance settings
echo  - Enabling long path support
echo  - Creating a custom PowerShell profile
echo.
echo Some optimizations require administrative privileges.
echo.
echo =======================================
echo.
echo Running with administrative privileges...
echo.

:: Run the PowerShell script with elevated privileges
powershell -ExecutionPolicy Bypass -Command "Start-Process powershell -ArgumentList '-ExecutionPolicy Bypass -File \"%~dp0optimize-powershell.ps1\"' -Verb RunAs"

echo.
echo If you approved the UAC prompt, PowerShell optimizations have been applied.
echo.
echo Please restart PowerShell to see all the changes.
echo.
pause 