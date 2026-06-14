import { emitTo } from "@tauri-apps/api/event";
import type { WeatherAnimationType, WeatherSnapshot } from "../types/weather";
import type { Settings } from "../store/settingsStore";

export const OVERLAY_WINDOW_LABEL = "overlay";
export const SETTINGS_WINDOW_LABEL = "settings";
export const WIDGET_WINDOW_LABEL = "widget";

export function syncSettingsToOverlay(settings: Settings) {
  void emitTo(OVERLAY_WINDOW_LABEL, "settings-sync", settings);
  void emitTo(WIDGET_WINDOW_LABEL, "settings-sync", settings);
}

export interface TestAnimationEvent {
  type: WeatherAnimationType;
  id: number;
  intensity: number;
}

export function triggerOverlayTestAnimation(
  type: WeatherAnimationType,
  intensity: number,
  id = Date.now(),
) {
  return emitTo(OVERLAY_WINDOW_LABEL, "trigger-test-animation", { type, id, intensity });
}

export function requestWeatherSound(type: WeatherAnimationType) {
  return emitTo(SETTINGS_WINDOW_LABEL, "play-weather-sound", { type });
}

export function requestStopWeatherSound() {
  return emitTo(SETTINGS_WINDOW_LABEL, "stop-weather-sound", null);
}

export function emitWeatherUpdate(weather: WeatherSnapshot) {
  void emitTo(SETTINGS_WINDOW_LABEL, "weather-updated", weather);
  void emitTo(WIDGET_WINDOW_LABEL, "weather-updated", weather);
}
