import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import { BackSide, Mesh } from "three";
import { CloudsRenderer } from "./index";

const BOX = { width: 5.2, height: 0.75, depth: 2.6 };
const BOX_Y = 0.3;

interface VolumetricCloudsProps {
  intensity: number;
}

export function VolumetricClouds({ intensity }: VolumetricCloudsProps) {
  const targetRef = useRef<Mesh>(null!);
  const intensityRef = useRef(intensity);
  intensityRef.current = intensity;

  const gl = useThree((state) => state.gl);
  const size = useThree((state) => state.size);
  const renderer = useMemo(() => new CloudsRenderer(gl, size), [gl]);

  useEffect(() => {
    renderer.resize(size);
  }, [renderer, size]);

  useFrame(({ camera, scene }, dt) => {
    camera.lookAt(0, BOX_Y, 0);
    renderer.render(dt, targetRef.current, camera, scene, intensityRef.current);
  }, 1);

  return (
    <group position={[0, BOX_Y, 0]}>
      <mesh ref={targetRef}>
        <boxGeometry args={[BOX.width, BOX.height, BOX.depth]} />
        <meshBasicMaterial side={BackSide} />
      </mesh>
    </group>
  );
}
