import { Cloud, Clouds as DreiClouds } from "@react-three/drei";
import * as THREE from "three";
import { CelestialBody } from "./CelestialBody";
import { CelestialEnvironment } from "./CelestialEnvironment";
import { CelestialPostProcessing } from "./CelestialPostProcessing";
import { scaleFloat } from "./intensity";

interface PartlyCloudyProps {
  intensity: number;
}

export function PartlyCloudy({ intensity }: PartlyCloudyProps) {
  const cloudOpacity = scaleFloat(0.55, 0.9, intensity);
  const speed = scaleFloat(0.06, 0.12, intensity);

  return (
    <>
      <CelestialEnvironment />

      <DreiClouds material={THREE.MeshLambertMaterial}>
        <Cloud
          segments={60}
          bounds={[10, 3, 3]}
          volume={12}
          color="#F4F4F4"
          fade={55}
          speed={speed * 0.7}
          opacity={cloudOpacity * 0.75}
          position={[-5.5, 4.8, -4]}
        />
        <Cloud
          segments={55}
          bounds={[9, 2.5, 2.5]}
          volume={10}
          color="#ECECEC"
          fade={60}
          speed={speed * 0.65}
          opacity={cloudOpacity * 0.7}
          position={[5.5, 4.5, -4.5]}
        />
        <Cloud
          segments={45}
          bounds={[8, 2, 2]}
          volume={8}
          color="#FAFAFA"
          fade={70}
          speed={speed * 0.5}
          opacity={cloudOpacity * 0.55}
          position={[0, 5.8, -5]}
        />
      </DreiClouds>

      <CelestialBody intensity={intensity} />

      <DreiClouds material={THREE.MeshLambertMaterial}>
        <Cloud
          segments={70}
          bounds={[7, 3.5, 3]}
          volume={11}
          color="#FFFFFF"
          fade={45}
          speed={speed}
          opacity={cloudOpacity * 0.92}
          position={[-3.4, 2.85, 1.4]}
        />
        <Cloud
          segments={65}
          bounds={[7, 3.2, 3]}
          volume={10}
          color="#F8F8F8"
          fade={48}
          speed={speed * 0.85}
          opacity={cloudOpacity * 0.88}
          position={[3.5, 3.05, 1.35]}
        />
        <Cloud
          segments={50}
          bounds={[9, 2.2, 2.2]}
          volume={8}
          color="#F0F0F0"
          fade={55}
          speed={speed * 0.75}
          opacity={cloudOpacity * 0.62}
          position={[0, 4.35, 0.9]}
        />
      </DreiClouds>

      <CelestialPostProcessing />
    </>
  );
}
