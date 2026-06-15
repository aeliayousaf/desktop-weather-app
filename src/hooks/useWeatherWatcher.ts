import { useCallback, useEffect, useRef, useState } from "react";
import { listen } from "@tauri-apps/api/event";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import { fetchWeather } from "../services/weatherService";
import { useSettingsStore, type Settings } from "../store/settingsStore";
import { mapWeatherToAnimation } from "../utils/weatherCodeMapper";
import type { TestAnimationEvent } from "../utils/overlayBridge";
import { emitWeatherUpdate } from "../utils/overlayBridge";
import type { WeatherAnimationType, WeatherSnapshot } from "../types/weather";
import { POLL_INTERVAL_MS } from "../types/weather";

export function useWeatherWatcher() {
  const { latitude, longitude } = useSettingsStore();
  const [activeAnimation, setActiveAnimation] = useState<WeatherAnimationType | null>(null);
  const [testAnimation, setTestAnimation] = useState<TestAnimationEvent | null>(null);
  const lastConditionRef = useRef<WeatherAnimationType | null>(null);
  const isFirstFetchRef = useRef(true);

  useEffect(() => {
    isFirstFetchRef.current = true;
    lastConditionRef.current = null;
  }, [latitude, longitude]);

  const checkWeather = useCallback(async () => {
    const { latitude: lat, longitude: lon, windThresholdKmh, paused } =
      useSettingsStore.getState();

    if (lat == null || lon == null) return;

    try {
      const weather = await fetchWeather(lat, lon);
      const snapshot = {
        ...weather,
        fetchedAt: new Date().toISOString(),
      };
      useSettingsStore.getState().setIsDay(weather.isDay);
      void emitWeatherUpdate(snapshot);

      const condition = mapWeatherToAnimation(
        weather.weatherCode,
        weather.windSpeedKmh,
        windThresholdKmh,
      );

      if (isFirstFetchRef.current) {
        isFirstFetchRef.current = false;
        lastConditionRef.current = condition;
        const { paused: isPaused, enabledAnimations } = useSettingsStore.getState();
        if (condition && !isPaused && enabledAnimations[condition]) {
          setActiveAnimation(condition);
        }
        return;
      }

      if (condition && condition !== lastConditionRef.current && !paused) {
        lastConditionRef.current = condition;
        setActiveAnimation(condition);
      } else if (condition) {
        lastConditionRef.current = condition;
      }
    } catch (error) {
      console.error("Weather check failed:", error);
    }
  }, []);

  useEffect(() => {
    if (latitude == null || longitude == null) return;

    void checkWeather();
    const interval = window.setInterval(() => {
      void checkWeather();
    }, POLL_INTERVAL_MS);

    return () => window.clearInterval(interval);
  }, [checkWeather, latitude, longitude]);

  useEffect(() => {
    const overlay = getCurrentWebviewWindow();

    const unlistenSync = overlay.listen<Settings>("settings-sync", (event) => {
      useSettingsStore.setState(event.payload);
    });

    const unlistenTest = overlay.listen<TestAnimationEvent>(
      "trigger-test-animation",
      (event) => {
        setTestAnimation(event.payload);
      },
    );

    const unlistenPause = listen<boolean>("pause-toggled", (event) => {
      useSettingsStore.setState({ paused: event.payload });
    });

    const unlistenWeather = overlay.listen<WeatherSnapshot>("weather-updated", (event) => {
      useSettingsStore.getState().setIsDay(event.payload.isDay);
    });

    return () => {
      void unlistenSync.then((fn) => fn());
      void unlistenTest.then((fn) => fn());
      void unlistenPause.then((fn) => fn());
      void unlistenWeather.then((fn) => fn());
    };
  }, []);

  const clearActiveAnimation = useCallback(() => setActiveAnimation(null), []);
  const clearTestAnimation = useCallback(() => setTestAnimation(null), []);

  return {
    activeAnimation,
    testAnimation,
    clearActiveAnimation,
    clearTestAnimation,
  };
}
