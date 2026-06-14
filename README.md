# Weather Overlay

A desktop weather overlay app built with Tauri, React, and TypeScript. It runs in the background and plays short animated weather effects on top of your desktop when real weather conditions change.

## Features

- Transparent, frameless, always-on-top overlay
- Click-through overlay (does not block mouse or keyboard)
- System tray with Settings, Pause Animations, and Quit
- [WeatherAPI.com](https://www.weatherapi.com/docs/) weather data
- Animated effects: sun, rain, snow, cloud, lightning, wind
- Configurable duration, intensity, sound, and per-animation toggles
- Test buttons to preview each animation

## Requirements

- [Node.js](https://nodejs.org/) 18+
- [Rust](https://www.rust-lang.org/tools/install)
- **Windows:** Visual Studio Build Tools with **Desktop development with C++** and the **Windows 10/11 SDK**
- Platform-specific Tauri prerequisites: https://tauri.app/start/prerequisites/

### Windows setup notes

If `npm run tauri dev` fails with `link.exe not found` or `kernel32.lib` missing:

1. Install [Visual Studio Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/) with the C++ workload
2. Install the Windows SDK (e.g. `winget install Microsoft.WindowsSDK.10.0.22621`)
3. Run dev via the MSVC environment wrapper:

```bash
npm run tauri:dev
```

Or open **x64 Native Tools Command Prompt for VS** and run `npm run tauri dev` from there.

## Development

1. Copy `.env.example` to `.env` and set your [WeatherAPI.com](https://www.weatherapi.com/docs/) key:

```bash
cp .env.example .env
```

2. Start the app:

```bash
npm install
npm run tauri:dev
```

## Build

```bash
npm run tauri build
```

## Usage

1. Launch the app — a transparent overlay covers your screen (invisible until weather changes).
2. Right-click the system tray icon → **Settings**.
3. Enter your city and click **Save Location**.
4. When weather conditions change, an 8-second animation plays and fades out.
5. Use **Pause Animations** in the tray to temporarily disable new animations.

## Project Structure

```
src/
├── components/animations/   # Weather effect components
├── hooks/useWeatherWatcher.ts
├── overlay/                 # Transparent overlay window
├── settings/                # Settings window
├── services/weatherService.ts
├── store/settingsStore.ts
└── utils/weatherCodeMapper.ts
```
