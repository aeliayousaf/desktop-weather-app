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
  const blizzard = Math.pow(t, 1.75);
  return Math.round(50 + blizzard * 3000 + t * 350);
}
