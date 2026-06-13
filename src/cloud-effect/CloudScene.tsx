import { Canvas } from "@react-three/fiber";
import { PerspectiveCamera } from "@react-three/drei";
import { VolumetricClouds } from "./VolumetricClouds";

interface CloudSceneProps {
  intensity: number;
}

export function CloudScene({ intensity }: CloudSceneProps) {
  const opacity = 0.38 + (intensity / 100) * 0.42;

  return (
    <div className="animation-layer cloud-volumetric-layer" style={{ opacity }}>
      <Canvas
        dpr={[1, 1.5]}
        gl={{
          alpha: true,
          antialias: true,
          powerPreference: "high-performance",
        }}
        style={{ background: "transparent" }}
        onCreated={({ gl }) => {
          gl.setClearColor(0x000000, 0);
        }}
      >
        <PerspectiveCamera makeDefault position={[0.55, 0.14, -1.75]} fov={54} near={0.1} far={50} />
        <VolumetricClouds intensity={intensity} />
      </Canvas>
    </div>
  );
}
