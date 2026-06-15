import { Sphere } from "@react-three/drei";
import { useFrame, useLoader } from "@react-three/fiber";
import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { SUN_POSITION, SUN_RADIUS } from "./sunConfig";
import { scaleFloat } from "./intensity";

interface MoonProps {
  intensity?: number;
}

function createMoonHaloTexture(): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;

  const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  gradient.addColorStop(0, "rgba(230, 238, 255, 0.45)");
  gradient.addColorStop(0.3, "rgba(190, 205, 235, 0.18)");
  gradient.addColorStop(0.6, "rgba(140, 160, 200, 0.06)");
  gradient.addColorStop(1, "rgba(100, 120, 170, 0)");

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function Moon({ intensity = 50 }: MoonProps) {
  const moonRef = useRef<THREE.Mesh>(null!);
  const moonTexture = useLoader(THREE.TextureLoader, "/textures/moon.png");
  const haloTexture = useMemo(() => createMoonHaloTexture(), []);
  const haloOpacity = scaleFloat(0.22, 0.5, intensity);
  const lightIntensity = scaleFloat(0.7, 1.5, intensity);

  useLayoutEffect(() => {
    moonTexture.colorSpace = THREE.SRGBColorSpace;
  }, [moonTexture]);

  const moonMaterial = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        map: moonTexture,
        toneMapped: false,
      }),
    [moonTexture],
  );

  const haloMaterial = useMemo(
    () =>
      new THREE.SpriteMaterial({
        map: haloTexture,
        transparent: true,
        opacity: haloOpacity,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    [haloTexture, haloOpacity],
  );

  useFrame((state) => {
    if (moonRef.current) {
      moonRef.current.rotation.y = state.clock.getElapsedTime() * 0.04;
    }
  });

  return (
    <group position={SUN_POSITION}>
      <sprite position={[0, 0, -0.5]} scale={[6.5, 6.5, 1]} material={haloMaterial} />
      <Sphere ref={moonRef} args={[SUN_RADIUS, 32, 32]} material={moonMaterial} />
      <pointLight position={[0, 0, 0]} intensity={lightIntensity} color="#d8e4ff" distance={20} />
    </group>
  );
}
