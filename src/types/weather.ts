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

export const POLL_INTERVAL_MS = 5 * 60 * 1000;

export const ANIMATION_TYPES: WeatherAnimationType[] = [
  "sun",
  "rain",
  "snow",
  "cloud",
  "thunderstorm",
  "wind",
];
