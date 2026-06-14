export type TemperatureUnit = "celsius" | "fahrenheit";

export function formatTemperature(celsius: number, unit: TemperatureUnit): number {
  if (unit === "fahrenheit") {
    return Math.round((celsius * 9) / 5 + 32);
  }
  return Math.round(celsius);
}

export function temperatureUnitLabel(unit: TemperatureUnit): string {
  return unit === "fahrenheit" ? "F" : "C";
}

export type WeatherAnimationType =
  | "sun"
  | "rain"
  | "snow"
  | "cloud"
  | "thunderstorm"
  | "wind";

export interface GeoResult {
  name: string;
  country: string;
  latitude: number;
  longitude: number;
}

export interface WeatherData {
  weatherCode: number;
  conditionText: string;
  conditionIcon: string;
  windSpeedKmh: number;
  temperatureC: number;
  lastUpdated: string;
  hourly: {
    time: string[];
    weatherCode: number[];
    windSpeedKmh: number[];
  };
}

/** Weather data plus when this app last fetched it successfully. */
export interface WeatherSnapshot extends WeatherData {
  fetchedAt: string;
}

export function formatUpdatedAt(fetchedAt: string): string {
  const date = new Date(fetchedAt);
  const ageMs = Date.now() - date.getTime();

  if (ageMs < 60_000) {
    return "just now";
  }

  const pad = (value: number) => String(value).padStart(2, "0");

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export const POLL_INTERVAL_MS = 2 * 60 * 1000;

export const ANIMATION_TYPES: WeatherAnimationType[] = [
  "sun",
  "rain",
  "snow",
  "cloud",
  "thunderstorm",
  "wind",
];
