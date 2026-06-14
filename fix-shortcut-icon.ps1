$exe = Join-Path $env:LOCALAPPDATA "Weather Overlay\weather-overlay.exe"

if (-not (Test-Path $exe)) {
    Write-Error "Installed exe not found: $exe"
    exit 1
}

$iconLocation = "$exe,0"
$shortcutPaths = @(
    (Join-Path $env:USERPROFILE "Desktop\Weather Overlay.lnk"),
    (Join-Path $env:APPDATA "Microsoft\Windows\Start Menu\Programs\Weather Overlay.lnk")
)

$shell = New-Object -ComObject WScript.Shell

foreach ($path in $shortcutPaths) {
    if (-not (Test-Path $path)) { continue }

    $shortcut = $shell.CreateShortcut($path)
    $shortcut.TargetPath = $exe
    $shortcut.WorkingDirectory = Split-Path $exe -Parent
    $shortcut.IconLocation = $iconLocation
    $shortcut.Save()
    Write-Host "Refreshed shortcut: $path"
}

# Bust Windows icon cache for shell shortcuts
$ie4uinit = Join-Path $env:SystemRoot "System32\ie4uinit.exe"
if (Test-Path $ie4uinit) {
    & $ie4uinit -show | Out-Null
}

# Restart Explorer to force icon redraw (optional but effective)
$explorer = Get-Process explorer -ErrorAction SilentlyContinue
if ($explorer) {
    Stop-Process -Name explorer -Force
    Start-Process explorer
}

Write-Host "Icon location set to $iconLocation"
