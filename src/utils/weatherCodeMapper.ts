import type { WeatherAnimationType } from "../types/weather";

const SUN_CODES = new Set([0, 1]);
const CLOUD_CODES = new Set([2, 3, 45, 48]);
const RAIN_CODES = new Set([51, 52, 53, 54, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82]);
const SNOW_CODES = new Set([71, 73, 75, 77, 85, 86]);
const LIGHTNING_CODES = new Set([95, 96, 99]);

const SEVERITY: WeatherAnimationType[] = [
  "thunderstorm",
  "snow",
  "rain",
  "wind",
  "cloud",
  "sun",
];

function getTypesForCode(
  code: number,
  windSpeedKmh: number,
  windThresholdKmh: number,
): WeatherAnimationType[] {
  const types: WeatherAnimationType[] = [];

  if (LIGHTNING_CODES.has(code)) types.push("thunderstorm");
  if (SNOW_CODES.has(code)) types.push("snow");
  if (RAIN_CODES.has(code)) types.push("rain");
  if (windSpeedKmh >= windThresholdKmh) types.push("wind");
  if (CLOUD_CODES.has(code)) types.push("cloud");
  if (SUN_CODES.has(code)) types.push("sun");

  return types;
}

export function mapWeatherToAnimation(
  code: number,
  windSpeedKmh: number,
  windThresholdKmh = 35,
): WeatherAnimationType | null {
  const types = getTypesForCode(code, windSpeedKmh, windThresholdKmh);
  if (types.length === 0) return null;

  for (const type of SEVERITY) {
    if (types.includes(type)) return type;
  }

  return types[0] ?? null;
}
