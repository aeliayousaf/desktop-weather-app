import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { Clouds } from "./Clouds";
import { scaleCount, scaleFloat } from "./intensity";

interface WindProps {
  intensity?: number;
}

export function Wind({ intensity = 50 }: WindProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null!);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const streakCount = scaleCount(30, 90, intensity);
  const speedMultiplier = scaleFloat(0.9, 1.8, intensity);
  const cloudSpeed = scaleFloat(0.18, 0.42, intensity);

  const streaks = useMemo(() => {
    const temp = [];
    for (let i = 0; i < streakCount; i++) {
      temp.push({
        x: (Math.random() - 0.5) * 22,
        y: Math.random() * 14 - 2,
        z: (Math.random() - 0.5) * 12,
        speed: (Math.random() * 0.12 + 0.06) * speedMultiplier,
        length: 0.4 + Math.random() * 1.2,
      });
    }
    return temp;
  }, [streakCount, speedMultiplier]);

  useFrame((_, delta) => {
    const mesh = meshRef.current;
    if (!mesh) return;

    const dt = delta * 60;
    streaks.forEach((streak, i) => {
      streak.x += streak.speed * dt;
      if (streak.x > 12) {
        streak.x = -12;
        streak.y = Math.random() * 14 - 2;
        streak.z = (Math.random() - 0.5) * 12;
      }

      dummy.position.set(streak.x, streak.y, streak.z);
      dummy.scale.set(streak.length, 0.02, 0.02);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <group>
      <Clouds
        intensity={scaleFloat(0.3, 0.55, intensity)}
        speed={cloudSpeed}
        compact
      />
      <instancedMesh ref={meshRef} args={[undefined, undefined, streakCount]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial color="#D8E4F0" transparent opacity={0.35} />
      </instancedMesh>
    </group>
  );
}
