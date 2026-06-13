import { Cloud, Clouds as DreiClouds } from "@react-three/drei";
import { useRef } from "react";
import * as THREE from "three";
import { LightningBolts } from "./LightningBolts";
import { LightningFlash, type LightningFlashHandle } from "./LightningFlash";
import { Rain } from "./Rain";
import { scaleCount, scaleFloat } from "./intensity";

interface ThunderstormProps {
  intensity?: number;
}

export function Thunderstorm({ intensity = 50 }: ThunderstormProps) {
  const rainCount = scaleCount(900, 1500, intensity);
  const cloudOpacity = scaleFloat(0.65, 0.95, intensity);
  const flashRef = useRef<LightningFlashHandle>(null);

  return (
    <group>
      <DreiClouds material={THREE.MeshLambertMaterial}>
        <Cloud
          segments={60}
          bounds={[12, 3, 3]}
          volume={10}
          color="#8A8A8A"
          fade={100}
          speed={0.2}
          opacity={0.8 * cloudOpacity}
          position={[-3, 4, -2]}
        />
        <Cloud
          segments={60}
          bounds={[12, 3, 3]}
          volume={10}
          color="#9A9A9A"
          fade={100}
          speed={0.15}
          opacity={0.7 * cloudOpacity}
          position={[3, 3, -1]}
        />
        <Cloud
          segments={60}
          bounds={[10, 3, 3]}
          volume={10}
          color="#7A7A7A"
          fade={100}
          speed={0.25}
          opacity={0.9 * cloudOpacity}
          position={[0, 5, -3]}
        />
        <Cloud
          segments={60}
          bounds={[8, 2, 2]}
          volume={10}
          color="#8A8A8A"
          fade={80}
          speed={0.18}
          opacity={0.6 * cloudOpacity}
          position={[-4, 3, -4]}
        />
        <Cloud
          segments={60}
          bounds={[9, 2, 2]}
          volume={10}
          color="#9A9A9A"
          fade={80}
          speed={0.22}
          opacity={0.7 * cloudOpacity}
          position={[4, 4, -2]}
        />
        <Cloud
          segments={60}
          bounds={[6, 2, 2]}
          volume={10}
          color="#858585"
          fade={60}
          speed={0.16}
          opacity={0.5 * cloudOpacity}
          position={[2, 6, -5]}
        />
        <Cloud
          segments={60}
          bounds={[10, 3, 3]}
          volume={10}
          color="#777777"
          fade={70}
          speed={0.14}
          opacity={0.6 * cloudOpacity}
          position={[-5, 7, -3]}
        />
        <Cloud
          segments={60}
          bounds={[9, 2.5, 2.5]}
          volume={10}
          color="#888888"
          fade={75}
          speed={0.19}
          opacity={0.7 * cloudOpacity}
          position={[5, 7.5, -4]}
        />
        <Cloud
          segments={60}
          bounds={[8, 2.5, 2.5]}
          volume={10}
          color="#7A7A7A"
          fade={65}
          speed={0.17}
          opacity={0.65 * cloudOpacity}
          position={[0, 7, -3.5]}
        />
      </DreiClouds>

      <Rain count={rainCount} intensity={intensity} />
      <LightningBolts
        intensity={intensity}
        onStrike={(x, power) => flashRef.current?.flashAt(x, power)}
      />
      <LightningFlash ref={flashRef} intensity={intensity} />
    </group>
  );
}
