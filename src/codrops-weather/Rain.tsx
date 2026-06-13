import { useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { scaleCount, scaleFloat } from "./intensity";

interface RainProps {
  count?: number;
  intensity?: number;
  windBias?: number;
}

interface RainDrop {
  x: number;
  y: number;
  z: number;
  speed: number;
}

function createStreakTexture(): THREE.CanvasTexture {
  const width = 8;
  const height = 64;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;

  const gradient = ctx.createLinearGradient(width / 2, 0, width / 2, height);
  gradient.addColorStop(0, "rgba(255, 255, 255, 0)");
  gradient.addColorStop(0.12, "rgba(255, 255, 255, 0.7)");
  gradient.addColorStop(0.5, "rgba(255, 255, 255, 1)");
  gradient.addColorStop(0.88, "rgba(255, 255, 255, 0.65)");
  gradient.addColorStop(1, "rgba(255, 255, 255, 0)");

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function Rain({ count = 800, intensity = 50, windBias = 0 }: RainProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null!);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const camera = useThree((state) => state.camera);

  const particleCount = scaleCount(Math.round(count * 0.5), count, intensity);
  const fallMultiplier = scaleFloat(0.85, 1.45, intensity);
  const opacityScale = scaleFloat(0.88, 1.05, intensity);

  const texture = useMemo(() => createStreakTexture(), []);
  const planeGeo = useMemo(() => new THREE.PlaneGeometry(0.035, 0.52), []);
  const dropScale = useMemo(() => new THREE.Vector3(0.42, 1.1, 1), []);

  const drops = useMemo(() => {
    const temp: RainDrop[] = [];
    for (let i = 0; i < particleCount; i++) {
      temp.push({
        x: (Math.random() - 0.5) * 20,
        y: Math.random() * 20 + 10,
        z: (Math.random() - 0.5) * 20,
        speed: (Math.random() * 0.1 + 0.05) * fallMultiplier,
      });
    }
    return temp;
  }, [particleCount, fallMultiplier]);

  useFrame((_, delta) => {
    const mesh = meshRef.current;
    if (!mesh) return;

    const dt = delta * 60;
    drops.forEach((drop, i) => {
      drop.y -= drop.speed * dt;
      drop.x += windBias * dt * 0.04;

      if (drop.y < -1) {
        drop.y = 20;
        drop.x = (Math.random() - 0.5) * 20;
        drop.z = (Math.random() - 0.5) * 20;
      }

      dummy.position.set(drop.x, drop.y, drop.z);
      dummy.lookAt(camera.position);
      dummy.scale.copy(dropScale);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh
      key={particleCount}
      ref={meshRef}
      args={[planeGeo, undefined, particleCount]}
      frustumCulled={false}
    >
      <meshBasicMaterial
        map={texture}
        transparent
        opacity={0.5 * opacityScale}
        depthWrite={false}
        blending={THREE.NormalBlending}
        toneMapped={false}
        side={THREE.DoubleSide}
      />
    </instancedMesh>
  );
}
