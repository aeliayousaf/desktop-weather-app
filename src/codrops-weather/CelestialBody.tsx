import { useSettingsStore } from "../store/settingsStore";
import { Moon } from "./Moon";
import { Sun } from "./Sun";

interface CelestialBodyProps {
  intensity?: number;
}

export function CelestialBody({ intensity }: CelestialBodyProps) {
  const isDay = useSettingsStore((state) => state.isDay);
  return isDay ? <Sun intensity={intensity} /> : <Moon intensity={intensity} />;
}
