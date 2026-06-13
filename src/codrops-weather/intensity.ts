export function clampIntensity(intensity: number): number {
  return Math.max(0, Math.min(100, intensity));
}

export function scaleCount(base: number, max: number, intensity: number): number {
  const t = clampIntensity(intensity) / 100;
  return Math.round(base + t * (max - base));
}

export function scaleFloat(base: number, max: number, intensity: number): number {
  const t = clampIntensity(intensity) / 100;
  return base + t * (max - base);
}

export function snowFlakeCount(intensity: number): number {
  const t = clampIntensity(intensity) / 100;
  const storm = t * t * (3 - 2 * t);
  return Math.round(45 + storm * 820 + t * 95);
}
