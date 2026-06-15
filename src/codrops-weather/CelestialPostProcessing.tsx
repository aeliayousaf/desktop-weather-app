import { EffectComposer, Bloom } from "@react-three/postprocessing";
import { useSettingsStore } from "../store/settingsStore";
import { SunPostProcessing } from "./SunPostProcessing";

function MoonPostProcessing() {
  return (
    <EffectComposer>
      <Bloom
        intensity={0.18}
        threshold={0.94}
        luminanceSmoothing={0.9}
        mipmapBlur
      />
    </EffectComposer>
  );
}

export function CelestialPostProcessing() {
  const isDay = useSettingsStore((state) => state.isDay);
  return isDay ? <SunPostProcessing /> : <MoonPostProcessing />;
}
