import { useCallback, useEffect, useState } from "react";
import { fetchWeather } from "../services/weatherService";
import type { WeatherData } from "../types/weather";
import { POLL_INTERVAL_MS } from "../types/weather";

export function useCurrentWeather(latitude: number | null, longitude: number | null) {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (latitude == null || longitude == null) {
      setWeather(null);
      setError(null);
      return;
    }

    setLoading(true);
    try {
      const data = await fetchWeather(latitude, longitude);
      setWeather(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load weather");
    } finally {
      setLoading(false);
    }
  }, [latitude, longitude]);

  useEffect(() => {
    void refresh();

    if (latitude == null || longitude == null) return;

    const interval = window.setInterval(() => {
      void refresh();
    }, POLL_INTERVAL_MS);

    return () => window.clearInterval(interval);
  }, [latitude, longitude, refresh]);

  return { weather, loading, error, refresh, setWeather };
}
