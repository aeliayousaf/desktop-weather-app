import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { scaleFloat, snowFlakeCount } from "./intensity";

interface SnowProps {
  intensity?: number;
}

type FlakeKind = "sharp" | "soft" | "hazy";

interface SnowParticle {
  x: number;
  y: number;
  z: number;
  speed: number;
  drift: number;
  phase: number;
  kind: FlakeKind;
}

function createFlakeTexture(kind: FlakeKind): THREE.CanvasTexture {
  const size = 64;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const center = size / 2;
  const gradient = ctx.createRadialGradient(center, center, 0, center, center, center);

  if (kind === "sharp") {
    gradient.addColorStop(0, "rgba(255, 255, 255, 1)");
    gradient.addColorStop(0.45, "rgba(255, 255, 255, 0.9)");
    gradient.addColorStop(0.75, "rgba(255, 255, 255, 0.25)");
    gradient.addColorStop(1, "rgba(255, 255, 255, 0)");
  } else if (kind === "soft") {
    gradient.addColorStop(0, "rgba(255, 255, 255, 0.75)");
    gradient.addColorStop(0.3, "rgba(255, 255, 255, 0.45)");
    gradient.addColorStop(0.65, "rgba(255, 255, 255, 0.12)");
    gradient.addColorStop(1, "rgba(255, 255, 255, 0)");
  } else {
    gradient.addColorStop(0, "rgba(255, 255, 255, 0.35)");
    gradient.addColorStop(0.25, "rgba(255, 255, 255, 0.2)");
    gradient.addColorStop(0.55, "rgba(255, 255, 255, 0.08)");
    gradient.addColorStop(1, "rgba(255, 255, 255, 0)");
  }

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function pickFlakeKind(): FlakeKind {
  const roll = Math.random();
  if (roll < 0.15) return "hazy";
  if (roll < 0.42) return "soft";
  return "sharp";
}

function syncPositions(particles: SnowParticle[], attr: THREE.BufferAttribute) {
  particles.forEach((particle, i) => {
    attr.setXYZ(i, particle.x, particle.y, particle.z);
  });
  attr.needsUpdate = true;
}

export function Snow({ intensity = 50 }: SnowProps) {
  const sharpRef = useRef<THREE.Points>(null!);
  const softRef = useRef<THREE.Points>(null!);
  const hazyRef = useRef<THREE.Points>(null!);

  const particleCount = snowFlakeCount(intensity);
  const fallMultiplier = scaleFloat(0.85, 1.65, intensity);
  const sizeScale = scaleFloat(0.88, 1.35, intensity);
  const opacityScale = scaleFloat(0.82, 1.08, intensity);

  const textures = useMemo(
    () => ({
      sharp: createFlakeTexture("sharp"),
      soft: createFlakeTexture("soft"),
      hazy: createFlakeTexture("hazy"),
    }),
    [],
  );

  const layers = useMemo(() => {
    const all: SnowParticle[] = [];
    for (let i = 0; i < particleCount; i++) {
      all.push({
        x: (Math.random() - 0.5) * 20,
        y: Math.random() * 20 + 10,
        z: (Math.random() - 0.5) * 20,
        speed: (Math.random() * 0.02 + 0.01) * fallMultiplier,
        drift: Math.random() * 0.02 - 0.01,
        phase: Math.random() * Math.PI * 2,
        kind: pickFlakeKind(),
      });
    }

    const sharp = all.filter((p) => p.kind === "sharp");
    const soft = all.filter((p) => p.kind === "soft");
    const hazy = all.filter((p) => p.kind === "hazy");

    const makeGeometry = (flakes: SnowParticle[]) => {
      const positions = new Float32Array(flakes.length * 3);
      flakes.forEach((flake, i) => {
        positions[i * 3] = flake.x;
        positions[i * 3 + 1] = flake.y;
        positions[i * 3 + 2] = flake.z;
      });
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
      return geometry;
    };

    return {
      sharp: { flakes: sharp, geometry: makeGeometry(sharp) },
      soft: { flakes: soft, geometry: makeGeometry(soft) },
      hazy: { flakes: hazy, geometry: makeGeometry(hazy) },
    };
  }, [particleCount, fallMultiplier]);

  useFrame((state, delta) => {
    const dt = delta * 60;
    const elapsed = state.clock.elapsedTime;

    const updateLayer = (flakes: SnowParticle[]) => {
      flakes.forEach((flake) => {
        flake.y -= flake.speed * dt;
        flake.x += Math.sin(elapsed * 0.8 + flake.phase) * flake.drift * dt;
        if (flake.y < -1) {
          flake.y = 20;
          flake.x = (Math.random() - 0.5) * 20;
          flake.z = (Math.random() - 0.5) * 20;
        }
      });
    };

    updateLayer(layers.sharp.flakes);
    updateLayer(layers.soft.flakes);
    updateLayer(layers.hazy.flakes);

    const sharpAttr = sharpRef.current?.geometry.getAttribute("position") as THREE.BufferAttribute;
    const softAttr = softRef.current?.geometry.getAttribute("position") as THREE.BufferAttribute;
    const hazyAttr = hazyRef.current?.geometry.getAttribute("position") as THREE.BufferAttribute;

    if (sharpAttr) syncPositions(layers.sharp.flakes, sharpAttr);
    if (softAttr) syncPositions(layers.soft.flakes, softAttr);
    if (hazyAttr) syncPositions(layers.hazy.flakes, hazyAttr);
  });

  return (
    <group>
      {layers.sharp.flakes.length > 0 && (
        <points ref={sharpRef} geometry={layers.sharp.geometry}>
          <pointsMaterial
            map={textures.sharp}
            transparent
            opacity={0.92 * opacityScale}
            size={0.11 * sizeScale}
            sizeAttenuation
            depthWrite={false}
            blending={THREE.AdditiveBlending}
            toneMapped={false}
          />
        </points>
      )}
      {layers.soft.flakes.length > 0 && (
        <points ref={softRef} geometry={layers.soft.geometry}>
          <pointsMaterial
            map={textures.soft}
            transparent
            opacity={0.55 * opacityScale}
            size={0.2 * sizeScale}
            sizeAttenuation
            depthWrite={false}
            blending={THREE.AdditiveBlending}
            toneMapped={false}
          />
        </points>
      )}
      {layers.hazy.flakes.length > 0 && (
        <points ref={hazyRef} geometry={layers.hazy.geometry}>
          <pointsMaterial
            map={textures.hazy}
            transparent
            opacity={0.38 * opacityScale}
            size={0.34 * sizeScale}
            sizeAttenuation
            depthWrite={false}
            blending={THREE.AdditiveBlending}
            toneMapped={false}
          />
        </points>
      )}
    </group>
  );
}
