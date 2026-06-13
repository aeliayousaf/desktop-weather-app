import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import {
  buildSceneStrikeFromSpec,
  setBoltLineResolution,
  strikeOpacity,
  updateStrikeVisuals,
  type ActiveStrike,
} from "../lightning-effect/boltMeshes";
import {
  createSceneBoltSpec,
  createSceneSpreadBurst,
  type BoltSpec,
} from "../lightning-effect/generateBolt";

interface LightningBoltsProps {
  intensity?: number;
  onStrike?: (x: number, power: number) => void;
}

function strikeIntervalSeconds(intensity: number): number {
  const t = Math.max(0, Math.min(100, intensity)) / 100;
  return 5.2 - t * 3.4;
}

function brightnessScale(intensity: number): number {
  const t = Math.max(0, Math.min(100, intensity)) / 100;
  return 0.7 + t * 0.85;
}

function burstCount(intensity: number): number {
  const t = Math.max(0, Math.min(100, intensity)) / 100;
  return Math.round(1 + t * 1.5);
}

export function LightningBolts({ intensity = 50, onStrike }: LightningBoltsProps) {
  const groupRef = useRef<THREE.Group>(null);
  const strikesRef = useRef<ActiveStrike[]>([]);
  const spawnTimerRef = useRef(1.4);
  const pendingTimeoutsRef = useRef<number[]>([]);
  const intensityRef = useRef(intensity);
  const size = useThree((state) => state.size);
  const dpr = useThree((state) => state.viewport.dpr);

  intensityRef.current = intensity;

  const addStrike = (spec: BoltSpec) => {
    const group = groupRef.current;
    if (!group) return;

    const strike = buildSceneStrikeFromSpec(spec);
    group.add(strike.root);
    strikesRef.current.push(strike);
    onStrike?.(spec.origin.x, spec.power);
  };

  const spawnSingle = () => {
    addStrike(createSceneBoltSpec());
  };

  const spawnBurst = () => {
    const specs = createSceneSpreadBurst(burstCount(intensityRef.current));
    specs.forEach((spec, index) => {
      if (index === 0) {
        addStrike(spec);
        return;
      }
      const timeout = window.setTimeout(() => {
        addStrike(spec);
      }, 30 + index * (45 + Math.random() * 55));
      pendingTimeoutsRef.current.push(timeout);
    });
  };

  const spawnEvent = () => {
    if (Math.random() > 0.62) {
      spawnBurst();
    } else {
      spawnSingle();
      if (Math.random() > 0.65) {
        const timeout = window.setTimeout(() => {
          spawnSingle();
        }, 50 + Math.random() * 90);
        pendingTimeoutsRef.current.push(timeout);
      }
    }
  };

  const clearStrikes = () => {
    pendingTimeoutsRef.current.forEach((id) => window.clearTimeout(id));
    pendingTimeoutsRef.current.length = 0;

    const group = groupRef.current;
    for (const strike of strikesRef.current) {
      group?.remove(strike.root);
      strike.dispose();
    }
    strikesRef.current.length = 0;
  };

  useEffect(() => {
    spawnBurst();
    return clearStrikes;
  }, []);

  useFrame((_, delta) => {
    const dt = Math.min(0.05, delta);
    const currentIntensity = intensityRef.current;
    const brightness = brightnessScale(currentIntensity);

    setBoltLineResolution(size.width * dpr, size.height * dpr);

    spawnTimerRef.current -= dt;
    if (spawnTimerRef.current <= 0) {
      spawnEvent();
      spawnTimerRef.current =
        strikeIntervalSeconds(currentIntensity) * (0.8 + Math.random() * 0.55);
    }

    const strikes = strikesRef.current;
    for (let i = strikes.length - 1; i >= 0; i -= 1) {
      const strike = strikes[i];
      strike.age += dt;
      const opacity =
        strikeOpacity(strike.age, strike.lifetime, strike.seed, strike.power) * brightness;
      updateStrikeVisuals(strike, opacity);

      if (strike.age >= strike.lifetime) {
        groupRef.current?.remove(strike.root);
        strike.dispose();
        strikes.splice(i, 1);
      }
    }
  });

  return <group ref={groupRef} />;
}
