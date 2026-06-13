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
  windSpeedKmh: number;
  temperatureC: number;
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
