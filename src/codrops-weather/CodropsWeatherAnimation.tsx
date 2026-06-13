import { lazy, Suspense } from "react";
import type { WeatherAnimationType } from "../types/weather";
import "../components/animations/animations.css";

interface CodropsWeatherAnimationProps {
  type: WeatherAnimationType;
  intensity: number;
}

const CodropsWeatherScene = lazy(() =>
  import("./CodropsWeatherScene").then((module) => ({
    default: module.CodropsWeatherScene,
  })),
);

export function CodropsWeatherAnimation({ type, intensity }: CodropsWeatherAnimationProps) {
  return (
    <Suspense fallback={null}>
      <CodropsWeatherScene type={type} intensity={intensity} />
    </Suspense>
  );
}
