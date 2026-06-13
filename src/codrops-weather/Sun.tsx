import { Sphere } from "@react-three/drei";
import { useFrame, useLoader } from "@react-three/fiber";
import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { SUN_POSITION, SUN_RADIUS } from "./sunConfig";

interface SunProps {
  intensity?: number;
}

function createHaloTexture(): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;

  const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  gradient.addColorStop(0, "rgba(255, 245, 210, 0.7)");
  gradient.addColorStop(0.28, "rgba(255, 215, 120, 0.28)");
  gradient.addColorStop(0.55, "rgba(255, 170, 60, 0.1)");
  gradient.addColorStop(1, "rgba(255, 140, 40, 0)");

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function Sun({ intensity: _intensity = 50 }: SunProps) {
  const sunRef = useRef<THREE.Mesh>(null!);
  const sunTexture = useLoader(THREE.TextureLoader, "/textures/sun_2k.jpg");
  const haloTexture = useMemo(() => createHaloTexture(), []);

  useLayoutEffect(() => {
    sunTexture.colorSpace = THREE.SRGBColorSpace;
  }, [sunTexture]);

  const sunMaterial = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        map: sunTexture,
        toneMapped: false,
      }),
    [sunTexture],
  );

  const haloMaterial = useMemo(
    () =>
      new THREE.SpriteMaterial({
        map: haloTexture,
        transparent: true,
        opacity: 0.55,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    [haloTexture],
  );

  useFrame((state) => {
    if (sunRef.current) {
      sunRef.current.rotation.y = state.clock.getElapsedTime() * 0.1;
    }
  });

  return (
    <group position={SUN_POSITION} userData={{ lensflare: "no-occlusion" }}>
      <sprite position={[0, 0, -0.5]} scale={[7.5, 7.5, 1]} material={haloMaterial} />
      <Sphere ref={sunRef} args={[SUN_RADIUS, 32, 32]} material={sunMaterial} />
      <pointLight position={[0, 0, 0]} intensity={2.5} color="#FFD700" distance={25} />
    </group>
  );
}
