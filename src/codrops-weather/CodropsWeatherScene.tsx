import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";
import * as THREE from "three";
import type { WeatherAnimationType } from "../types/weather";
import { WeatherEffects } from "./WeatherEffects";
import { SunCameraRig } from "./SunCameraRig";
import { clampIntensity, scaleFloat } from "./intensity";

interface CodropsWeatherSceneProps {
  type: WeatherAnimationType;
  intensity: number;
}

export function CodropsWeatherScene({ type, intensity }: CodropsWeatherSceneProps) {
  const t = clampIntensity(intensity);
  const opacity = scaleFloat(0.72, 1, t);

  return (
    <div
      className={`animation-layer codrops-weather-layer${type === "sun" ? " codrops-weather-layer--sun" : ""}`}
      style={{ opacity }}
    >
      <Canvas
        frameloop="always"
        dpr={[1, 1.5]}
        camera={
          type === "sun"
            ? { position: [0, 0.15, 10.5], fov: 52 }
            : { position: [0, 1, 10], fov: 60 }
        }
        gl={{
          alpha: true,
          antialias: true,
          powerPreference: "high-performance",
        }}
        style={{ background: "transparent" }}
        onCreated={({ gl }) => {
          gl.setClearColor(0x000000, 0);
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1;
        }}
      >
        <Suspense fallback={null}>
          {type === "sun" && <SunCameraRig />}
          {type !== "sun" && (
            <>
              <ambientLight intensity={0.45} />
              <directionalLight position={[10, 10, 5]} intensity={0.85} color="#ffffff" />
            </>
          )}
          <WeatherEffects type={type} intensity={t} />
        </Suspense>
      </Canvas>
    </div>
  );
}
