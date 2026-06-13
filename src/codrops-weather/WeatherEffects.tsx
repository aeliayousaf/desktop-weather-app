import type { WeatherAnimationType } from "../types/weather";
import { scaleFloat } from "./intensity";
import { Clouds } from "./Clouds";
import { Rain } from "./Rain";
import { Snow } from "./Snow";
import { Sun } from "./Sun";
import { SunEnvironment } from "./SunEnvironment";
import { Thunderstorm } from "./Thunderstorm";
import { Wind } from "./Wind";
import { SunPostProcessing } from "./SunPostProcessing";

interface WeatherEffectsProps {
  type: WeatherAnimationType;
  intensity: number;
}

export function WeatherEffects({ type, intensity }: WeatherEffectsProps) {
  switch (type) {
    case "sun":
      return (
        <>
          <SunEnvironment />
          <Sun intensity={intensity} />
          <SunPostProcessing />
        </>
      );
    case "rain":
      return (
        <>
          <Clouds
            intensity={scaleFloat(0.55, 0.9, intensity)}
            speed={scaleFloat(0.1, 0.2, intensity)}
          />
          <Rain intensity={intensity} />
        </>
      );
    case "snow":
      return <Snow intensity={intensity} />;
    case "cloud":
      return (
        <Clouds
          intensity={scaleFloat(0.5, 0.95, intensity)}
          speed={scaleFloat(0.06, 0.14, intensity)}
        />
      );
    case "thunderstorm":
      return <Thunderstorm intensity={intensity} />;
    case "wind":
      return <Wind intensity={intensity} />;
  }
}
