import { emitTo } from "@tauri-apps/api/event";
import type { WeatherAnimationType } from "../types/weather";
import type { Settings } from "../store/settingsStore";

export const OVERLAY_WINDOW_LABEL = "overlay";

export function syncSettingsToOverlay(settings: Settings) {
  return emitTo(OVERLAY_WINDOW_LABEL, "settings-sync", settings);
}

export function triggerOverlayTestAnimation(
  type: WeatherAnimationType,
  id = Date.now(),
) {
  return emitTo(OVERLAY_WINDOW_LABEL, "trigger-test-animation", { type, id });
}
