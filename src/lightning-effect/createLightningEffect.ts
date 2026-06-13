import * as THREE from "three";
import {
  buildScreenStrikeFromSpec,
  strikeOpacity,
  updateStrikeVisuals,
  type ActiveStrike,
} from "./boltMeshes";
import { createBoltSpec, createSpreadBurst, type BoltSpec } from "./generateBolt";

export interface LightningEffectHandle {
  setIntensity(intensity: number): void;
  resize(width: number, height: number): void;
  destroy(): void;
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

export function createLightningEffect(canvas: HTMLCanvasElement): LightningEffectHandle {
  const width = window.innerWidth;
  const height = window.innerHeight;
  const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);

  canvas.width = Math.floor(width * pixelRatio);
  canvas.height = Math.floor(height * pixelRatio);
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;

  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(0, width, height, 0, -20, 20);
  camera.position.z = 10;

  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true,
    premultipliedAlpha: false,
    preserveDrawingBuffer: false,
  });
  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(pixelRatio);
  renderer.setSize(width, height, false);
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  let intensity = 50;
  let frameId = 0;
  let destroyed = false;
  let lastFrame = performance.now();
  let spawnTimer = 1.4;
  const strikes: ActiveStrike[] = [];
  const pendingTimeouts: number[] = [];

  const addStrike = (spec: BoltSpec) => {
    const strike = buildScreenStrikeFromSpec(spec, width);
    scene.add(strike.root);
    strikes.push(strike);
  };

  const spawnSingle = () => {
    addStrike(createBoltSpec(width, height));
  };

  const spawnBurst = () => {
    const specs = createSpreadBurst(width, height, burstCount(intensity));
    specs.forEach((spec, index) => {
      if (index === 0) {
        addStrike(spec);
        return;
      }
      const timeout = window.setTimeout(() => {
        if (!destroyed) addStrike(spec);
      }, 30 + index * (45 + Math.random() * 55));
      pendingTimeouts.push(timeout);
    });
  };

  const spawnEvent = () => {
    if (Math.random() > 0.62) {
      spawnBurst();
    } else {
      spawnSingle();
      if (Math.random() > 0.65) {
        const timeout = window.setTimeout(() => {
          if (!destroyed) spawnSingle();
        }, 50 + Math.random() * 90);
        pendingTimeouts.push(timeout);
      }
    }
  };

  const updateStrikes = (dt: number) => {
    const brightness = brightnessScale(intensity);

    for (let i = strikes.length - 1; i >= 0; i -= 1) {
      const strike = strikes[i];
      strike.age += dt;
      const opacity = strikeOpacity(strike.age, strike.lifetime, strike.seed, strike.power) * brightness;
      updateStrikeVisuals(strike, opacity);

      if (strike.age >= strike.lifetime) {
        scene.remove(strike.root);
        strike.dispose();
        strikes.splice(i, 1);
      }
    }
  };

  const animate = (now: number) => {
    if (destroyed) return;

    const dt = Math.min(0.05, (now - lastFrame) / 1000);
    lastFrame = now;

    spawnTimer -= dt;
    if (spawnTimer <= 0) {
      spawnEvent();
      spawnTimer = strikeIntervalSeconds(intensity) * (0.8 + Math.random() * 0.55);
    }

    updateStrikes(dt);
    renderer.render(scene, camera);
    frameId = requestAnimationFrame(animate);
  };

  spawnBurst();
  frameId = requestAnimationFrame(animate);

  const clearStrikes = () => {
    pendingTimeouts.forEach((id) => window.clearTimeout(id));
    pendingTimeouts.length = 0;
    strikes.forEach((strike) => {
      scene.remove(strike.root);
      strike.dispose();
    });
    strikes.length = 0;
  };

  return {
    setIntensity(value: number) {
      intensity = value;
    },
    resize(nextWidth: number, nextHeight: number) {
      const nextPixelRatio = Math.min(window.devicePixelRatio || 1, 2);
      camera.right = nextWidth;
      camera.top = 0;
      camera.bottom = nextHeight;
      camera.left = 0;
      camera.updateProjectionMatrix();

      canvas.width = Math.floor(nextWidth * nextPixelRatio);
      canvas.height = Math.floor(nextHeight * nextPixelRatio);
      canvas.style.width = `${nextWidth}px`;
      canvas.style.height = `${nextHeight}px`;
      renderer.setPixelRatio(nextPixelRatio);
      renderer.setSize(nextWidth, nextHeight, false);

      clearStrikes();
      spawnBurst();
    },
    destroy() {
      destroyed = true;
      cancelAnimationFrame(frameId);
      clearStrikes();
      renderer.dispose();
    },
  };
}
