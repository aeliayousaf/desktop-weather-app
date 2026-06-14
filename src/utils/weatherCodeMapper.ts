import type { WeatherAnimationType } from "../types/weather";

// WeatherAPI.com condition codes — https://www.weatherapi.com/docs/weather_conditions.json
const SUN_CODES = new Set([1000]);
const PARTLY_CLOUDY_CODES = new Set([1003]);
const CLOUD_CODES = new Set([
  1006, 1009, 1012, 1015, 1018, 1021, 1024, 1027, 1030, 1033, 1036, 1039,
  1042, 1045, 1048, 1135, 1147,
]);
const RAIN_CODES = new Set([
  1063, 1072, 1150, 1153, 1168, 1171, 1180, 1183, 1186, 1189, 1192, 1195, 1198,
  1201, 1204, 1207, 1240, 1243, 1246, 1249, 1252,
]);
const SNOW_CODES = new Set([
  1066, 1069, 1114, 1117, 1210, 1213, 1216, 1219, 1222, 1225, 1237, 1255, 1258,
  1261, 1264,
]);
const LIGHTNING_CODES = new Set([1087, 1273, 1276, 1279, 1282]);

const SEVERITY: WeatherAnimationType[] = [
  "thunderstorm",
  "snow",
  "rain",
  "wind",
  "partlyCloudy",
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
  if (PARTLY_CLOUDY_CODES.has(code)) types.push("partlyCloudy");
  else if (CLOUD_CODES.has(code)) types.push("cloud");
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
