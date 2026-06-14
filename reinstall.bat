@echo off
setlocal
cd /d "%~dp0"

echo Building Weather Overlay with updated icons...
call npm run tauri build
if errorlevel 1 exit /b 1

set SETUP=src-tauri\target\release\bundle\nsis\Weather Overlay_0.1.0_x64-setup.exe
if not exist "%SETUP%" (
  echo Installer not found: %SETUP%
  exit /b 1
)

echo.
echo Launching installer. Choose to repair/reinstall so the desktop shortcut picks up the new icon.
echo If the shortcut still looks old after install, delete it and let the installer create a new one.
echo.
start "" "%SETUP%"
