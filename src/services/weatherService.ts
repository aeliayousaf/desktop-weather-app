import type { GeoResult, WeatherData } from "../types/weather";

const WEATHER_API_BASE = "https://api.weatherapi.com/v1";

interface WeatherApiError {
  error?: {
    code?: number;
    message?: string;
  };
}

interface SearchLocation {
  id: number;
  name: string;
  region: string;
  country: string;
  lat: number;
  lon: number;
}

interface ForecastResponse extends WeatherApiError {
  location?: {
    name: string;
    region: string;
    country: string;
    lat: number;
    lon: number;
  };
  current?: {
    last_updated: string;
    temp_c: number;
    wind_kph: number;
    condition: {
      code: number;
      text: string;
      icon: string;
    };
  };
  forecast?: {
    forecastday: Array<{
      hour: Array<{
        time: string;
        wind_kph: number;
        condition: {
          code: number;
        };
      }>;
    }>;
  };
}

function getApiKey(): string {
  const key = import.meta.env.VITE_WEATHERAPI_KEY?.trim();
  if (!key) {
    throw new Error(
      "WeatherAPI key is missing. Add VITE_WEATHERAPI_KEY to a .env file in the project root.",
    );
  }
  return key;
}

async function parseWeatherApiResponse<T>(response: Response): Promise<T> {
  const data = (await response.json()) as T & WeatherApiError;

  if (!response.ok || data.error) {
    throw new Error(
      data.error?.message ?? `WeatherAPI request failed (${response.status})`,
    );
  }

  return data;
}

function normalizeIconUrl(icon: string): string {
  return icon.startsWith("//") ? `https:${icon}` : icon;
}

export async function geocodeCity(city: string): Promise<GeoResult> {
  const trimmed = city.trim();
  if (!trimmed) {
    throw new Error("Please enter a city name.");
  }

  const url = new URL(`${WEATHER_API_BASE}/search.json`);
  url.searchParams.set("key", getApiKey());
  url.searchParams.set("q", trimmed);

  const response = await fetch(url.toString());
  const data = await parseWeatherApiResponse<SearchLocation[]>(response);
  const result = data[0];

  if (!result) {
    throw new Error(`No results found for "${trimmed}".`);
  }

  return {
    name: result.name,
    country: result.country,
    latitude: result.lat,
    longitude: result.lon,
  };
}

export async function fetchWeather(
  latitude: number,
  longitude: number,
): Promise<WeatherData> {
  const url = new URL(`${WEATHER_API_BASE}/forecast.json`);
  url.searchParams.set("key", getApiKey());
  url.searchParams.set("q", `${latitude},${longitude}`);
  url.searchParams.set("days", "1");
  url.searchParams.set("aqi", "no");
  url.searchParams.set("alerts", "no");

  const response = await fetch(url.toString());
  const data = await parseWeatherApiResponse<ForecastResponse>(response);

  const current = data.current;
  if (!current) {
    throw new Error("WeatherAPI response did not include current conditions.");
  }

  const hours = data.forecast?.forecastday?.[0]?.hour ?? [];

  return {
    weatherCode: current.condition.code,
    conditionText: current.condition.text,
    conditionIcon: normalizeIconUrl(current.condition.icon),
    windSpeedKmh: current.wind_kph,
    temperatureC: current.temp_c,
    lastUpdated: current.last_updated,
    hourly: {
      time: hours.map((hour) => hour.time),
      weatherCode: hours.map((hour) => hour.condition.code),
      windSpeedKmh: hours.map((hour) => hour.wind_kph),
    },
  };
}
