@echo off
echo Running PowerShell fix script with administrative privileges...
powershell -ExecutionPolicy Bypass -Command "Start-Process powershell -ArgumentList '-ExecutionPolicy Bypass -File \"%~dp0fix-powershell.ps1\"' -Verb RunAs"
echo.
echo If you saw a UAC prompt and clicked Yes, the PowerShell settings have been fixed.
echo.
pause 