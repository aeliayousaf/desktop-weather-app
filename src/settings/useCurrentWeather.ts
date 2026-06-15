import { useCallback, useEffect, useState } from "react";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import { fetchWeather } from "../services/weatherService";
import type { WeatherSnapshot } from "../types/weather";
import { POLL_INTERVAL_MS } from "../types/weather";
import { emitWeatherUpdate } from "../utils/overlayBridge";
import { useSettingsStore } from "../store/settingsStore";

export function useCurrentWeather(latitude: number | null, longitude: number | null) {
  const [weather, setWeather] = useState<WeatherSnapshot | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const applySnapshot = useCallback((snapshot: WeatherSnapshot) => {
    setWeather(snapshot);
    setError(null);
  }, []);

  const refresh = useCallback(async () => {
    if (latitude == null || longitude == null) {
      setWeather(null);
      setError(null);
      return;
    }

    setLoading(true);
    try {
      const data = await fetchWeather(latitude, longitude);
      const snapshot = {
        ...data,
        fetchedAt: new Date().toISOString(),
      };
      useSettingsStore.getState().setIsDay(data.isDay);
      void emitWeatherUpdate(snapshot);
      applySnapshot(snapshot);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load weather");
    } finally {
      setLoading(false);
    }
  }, [applySnapshot, latitude, longitude]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    const win = getCurrentWebviewWindow();

    const unlistenWeather = win.listen<WeatherSnapshot>("weather-updated", (event) => {
      applySnapshot(event.payload);
      setLoading(false);
    });

    let unlistenFocus: (() => void) | undefined;
    void win.onFocusChanged(({ payload: focused }) => {
      if (focused) {
        void refresh();
      }
    }).then((unlisten) => {
      unlistenFocus = unlisten;
    });

    const interval =
      latitude == null || longitude == null
        ? undefined
        : window.setInterval(() => {
            void refresh();
          }, POLL_INTERVAL_MS);

    return () => {
      void unlistenWeather.then((fn) => fn());
      unlistenFocus?.();
      if (interval != null) {
        window.clearInterval(interval);
      }
    };
  }, [applySnapshot, latitude, longitude, refresh]);

  const setWeatherSnapshot = useCallback(
    (data: WeatherSnapshot) => {
      applySnapshot(data);
    },
    [applySnapshot],
  );

  return { weather, loading, error, refresh, setWeather: setWeatherSnapshot };
}
