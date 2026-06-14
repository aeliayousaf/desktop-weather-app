import { useEffect, type PointerEvent } from "react";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import { TemperatureUnitToggle } from "../components/TemperatureUnitToggle";
import {
  getSettingsSnapshot,
  useSettingsStore,
} from "../store/settingsStore";
import { syncSettingsToOverlay } from "../utils/overlayBridge";
import { applyMinimalMode, openFullSettings } from "../utils/minimalMode";
import { LiquidGlassCard, LiquidGlassProvider } from "../settings/LiquidGlassCard";
import { useCurrentWeather } from "../settings/useCurrentWeather";
import { WeatherIndicator } from "../settings/WeatherIndicator";
import "../styles/settings.css";
import "../styles/widget.css";
import "../settings/liquidGlass.css";

export function WidgetApp() {
  const { city, latitude, longitude, temperatureUnit, minimalMode, updateSettings } =
    useSettingsStore();
  const { weather, loading, error } = useCurrentWeather(latitude, longitude);

  useEffect(() => {
    void (async () => {
      await useSettingsStore.persist.rehydrate();
      const state = useSettingsStore.getState();
      await syncSettingsToOverlay(getSettingsSnapshot(state));
      await applyMinimalMode(state.minimalMode);
    })();
  }, []);

  useEffect(() => {
    const win = getCurrentWebviewWindow();

    const unlisten = win.listen<{ minimalMode?: boolean }>("settings-sync", (event) => {
      useSettingsStore.setState(event.payload);
      void applyMinimalMode(event.payload.minimalMode ?? false);
    });

    return () => {
      void unlisten.then((fn) => fn());
    };
  }, []);

  useEffect(() => {
    void applyMinimalMode(minimalMode);
  }, [minimalMode]);

  const handleDragStart = (event: PointerEvent<HTMLElement>) => {
    if (event.button !== 0) return;

    const target = event.target as HTMLElement;
    if (target.closest("button, input, a, .temp-unit-toggle, .widget-no-drag")) {
      return;
    }

    void getCurrentWebviewWindow().startDragging();
  };

  return (
    <LiquidGlassProvider>
      <div className="widget-root">
        <LiquidGlassCard className="widget-card">
          <div
            className="widget-drag-region"
            data-tauri-drag-region
            onPointerDown={handleDragStart}
          >
            <div className="widget-header">
              <h2 className="settings-section-title">Current Weather</h2>
              <button
                type="button"
                className="widget-settings-btn widget-no-drag"
                aria-label="Open settings"
                onClick={() => void openFullSettings()}
              >
                ⚙
              </button>
            </div>

            {city || weather ? (
              <WeatherIndicator
                city={city}
                weather={weather}
                loading={loading}
                error={error}
                temperatureUnit={temperatureUnit}
              />
            ) : (
              <p className="widget-empty">
                No location set.{" "}
                <button
                  type="button"
                  className="widget-no-drag"
                  onClick={() => void openFullSettings()}
                >
                  Open settings
                </button>
              </p>
            )}
          </div>

          {(city || weather) && (
            <div className="widget-no-drag">
              <TemperatureUnitToggle
                unit={temperatureUnit}
                onChange={(unit) => updateSettings({ temperatureUnit: unit })}
              />
            </div>
          )}
        </LiquidGlassCard>
      </div>
    </LiquidGlassProvider>
  );
}
