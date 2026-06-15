import { useSettingsStore } from "../store/settingsStore";
import { MoonEnvironment } from "./MoonEnvironment";
import { SunEnvironment } from "./SunEnvironment";

export function CelestialEnvironment() {
  const isDay = useSettingsStore((state) => state.isDay);
  return isDay ? <SunEnvironment /> : <MoonEnvironment />;
}
