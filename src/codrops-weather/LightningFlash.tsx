import { useFrame } from "@react-three/fiber";
import { forwardRef, useImperativeHandle, useRef } from "react";
import * as THREE from "three";
import { scaleFloat } from "./intensity";

export interface LightningFlashHandle {
  flashAt: (x: number, power?: number) => void;
}

interface LightningFlashProps {
  intensity?: number;
}

export const LightningFlash = forwardRef<LightningFlashHandle, LightningFlashProps>(
  function LightningFlash({ intensity = 50 }, ref) {
    const lightningLightRef = useRef<THREE.PointLight>(null!);
    const lightningActive = useRef(false);
    const intensityRef = useRef(intensity);
    const flashChance = scaleFloat(0.002, 0.006, intensity);

    intensityRef.current = intensity;

    const triggerFlash = (x: number, power = 1) => {
      if (lightningActive.current) return;

      const light = lightningLightRef.current;
      if (!light) return;

      lightningActive.current = true;
      light.position.x = x;
      light.position.y = 6 + Math.random() * 0.8;
      light.intensity = scaleFloat(70, 110, intensityRef.current) * Math.min(1.4, 0.75 + power * 0.35);

      window.setTimeout(() => {
        if (lightningLightRef.current) lightningLightRef.current.intensity = 0;
        lightningActive.current = false;
      }, 350 + Math.random() * 120);
    };

    useImperativeHandle(ref, () => ({
      flashAt: triggerFlash,
    }));

    useFrame(() => {
      if (Math.random() < flashChance && !lightningActive.current) {
        triggerFlash((Math.random() - 0.5) * 10);
      }
    });

    return (
      <pointLight
        ref={lightningLightRef}
        position={[0, 6, -5.5]}
        intensity={0}
        color="#e6d8b3"
        distance={30}
        decay={0.8}
      />
    );
  },
);
