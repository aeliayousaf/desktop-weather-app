@echo off
setlocal
cd /d "%~dp0"

set "INSTALL_DIR=%LOCALAPPDATA%\Weather Overlay"
set "EXE=%INSTALL_DIR%\weather-overlay.exe"
set "BUILT=src-tauri\target\release\weather-overlay.exe"

if not exist "%BUILT%" (
  echo Building release...
  call npm run tauri build
  if errorlevel 1 exit /b 1
)

if not exist "%INSTALL_DIR%" mkdir "%INSTALL_DIR%"
copy /Y "%BUILT%" "%EXE%" >nul
echo Updated: %EXE%

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0fix-shortcut-icon.ps1"

echo.
echo Done. If the desktop icon still looks old, sign out and back in once.
pause
