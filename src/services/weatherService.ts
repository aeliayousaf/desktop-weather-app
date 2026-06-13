import type { GeoResult, WeatherData } from "../types/weather";

interface GeocodingResponse {
  results?: Array<{
    name: string;
    country: string;
    latitude: number;
    longitude: number;
  }>;
}

interface ForecastResponse {
  current: {
    weather_code: number;
    wind_speed_10m: number;
    temperature_2m: number;
  };
  hourly: {
    time: string[];
    weather_code: number[];
    wind_speed_10m: number[];
  };
}

export async function geocodeCity(city: string): Promise<GeoResult> {
  const trimmed = city.trim();
  if (!trimmed) {
    throw new Error("Please enter a city name.");
  }

  const url = new URL("https://geocoding-api.open-meteo.com/v1/search");
  url.searchParams.set("name", trimmed);
  url.searchParams.set("count", "1");
  url.searchParams.set("language", "en");
  url.searchParams.set("format", "json");

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`Geocoding failed (${response.status})`);
  }

  const data = (await response.json()) as GeocodingResponse;
  const result = data.results?.[0];
  if (!result) {
    throw new Error(`No results found for "${trimmed}".`);
  }

  return {
    name: result.name,
    country: result.country,
    latitude: result.latitude,
    longitude: result.longitude,
  };
}

export async function fetchWeather(
  latitude: number,
  longitude: number,
): Promise<WeatherData> {
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude", String(latitude));
  url.searchParams.set("longitude", String(longitude));
  url.searchParams.set(
    "current",
    "weather_code,wind_speed_10m,temperature_2m",
  );
  url.searchParams.set("hourly", "weather_code,wind_speed_10m");
  url.searchParams.set("forecast_days", "1");
  url.searchParams.set("timezone", "auto");

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`Weather fetch failed (${response.status})`);
  }

  const data = (await response.json()) as ForecastResponse;

  return {
    weatherCode: data.current.weather_code,
    windSpeedKmh: data.current.wind_speed_10m,
    temperatureC: data.current.temperature_2m,
    hourly: {
      time: data.hourly.time,
      weatherCode: data.hourly.weather_code,
      windSpeedKmh: data.hourly.wind_speed_10m,
    },
  };
}
