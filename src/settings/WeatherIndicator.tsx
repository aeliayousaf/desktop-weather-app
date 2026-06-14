import { useEffect, useState } from "react";
import type { WeatherSnapshot } from "../types/weather";
import {
  formatTemperature,
  formatUpdatedAt,
  temperatureUnitLabel,
  type TemperatureUnit,
} from "../types/weather";

interface WeatherIndicatorProps {
  city: string;
  weather: WeatherSnapshot | null;
  loading: boolean;
  error: string | null;
  temperatureUnit: TemperatureUnit;
  compact?: boolean;
}

export function WeatherIndicator({
  city,
  weather,
  loading,
  error,
  temperatureUnit,
  compact = false,
}: WeatherIndicatorProps) {
  const [, setTick] = useState(0);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setTick((value) => value + 1);
    }, 30_000);

    return () => window.clearInterval(interval);
  }, []);

  if (!city && !weather) {
    return null;
  }

  const unitLabel = temperatureUnitLabel(temperatureUnit);

  return (
    <div className={`weather-indicator${compact ? " weather-indicator-compact" : ""}`}>
      {loading && !weather ? (
        <p className="weather-indicator-loading">Loading current weather…</p>
      ) : error && !weather ? (
        <p className="weather-indicator-error">{error}</p>
      ) : weather ? (
        <>
          <div className="weather-indicator-main">
            <img
              className="weather-indicator-icon"
              src={weather.conditionIcon}
              alt=""
              width={64}
              height={64}
            />
            <div className="weather-indicator-temp-block">
              <span className="weather-indicator-temp">
                {formatTemperature(weather.temperatureC, temperatureUnit)}°
              </span>
              <span className="weather-indicator-unit">{unitLabel}</span>
            </div>
            <div className="weather-indicator-details">
              <p className="weather-indicator-condition">{weather.conditionText}</p>
              {city && <p className="weather-indicator-location">{city}</p>}
              <p className="weather-indicator-meta">
                Wind {Math.round(weather.windSpeedKmh)} km/h
                {weather.fetchedAt ? ` · Updated ${formatUpdatedAt(weather.fetchedAt)}` : ""}
              </p>
            </div>
          </div>
          {loading && <p className="weather-indicator-refreshing">Refreshing…</p>}
          {error && <p className="weather-indicator-error-inline">{error}</p>}
        </>
      ) : null}
    </div>
  );
}
