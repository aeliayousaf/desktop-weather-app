import type { WeatherAnimationType } from "../types/weather";
import { PartlyCloudy } from "./PartlyCloudy";
import { scaleFloat } from "./intensity";
import { Clouds } from "./Clouds";
import { Rain } from "./Rain";
import { Snow } from "./Snow";
import { CelestialBody } from "./CelestialBody";
import { CelestialEnvironment } from "./CelestialEnvironment";
import { Thunderstorm } from "./Thunderstorm";
import { Wind } from "./Wind";
import { CelestialPostProcessing } from "./CelestialPostProcessing";

interface WeatherEffectsProps {
  type: WeatherAnimationType;
  intensity: number;
}

export function WeatherEffects({ type, intensity }: WeatherEffectsProps) {
  switch (type) {
    case "sun":
      return (
        <>
          <CelestialEnvironment />
          <CelestialBody intensity={intensity} />
          <CelestialPostProcessing />
        </>
      );
    case "partlyCloudy":
      return <PartlyCloudy intensity={intensity} />;
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
