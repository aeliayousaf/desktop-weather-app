import * as THREE from "three";
import { Line2, LineGeometry, LineMaterial } from "three-stdlib";
import type { BoltSpec, BoltTier } from "./generateBolt";

interface BoltMeshes {
  group: THREE.Group;
  layers: THREE.Mesh[];
  cloudHalo: THREE.Sprite;
  impactGlow: THREE.Sprite;
  dispose: () => void;
}

export interface ActiveStrike {
  root: THREE.Group;
  layers: THREE.Mesh[];
  cloudHalo: THREE.Sprite;
  impactGlow: THREE.Sprite;
  dispose: () => void;
  age: number;
  lifetime: number;
  seed: number;
  power: number;
  thinLines?: boolean;
}

const lineResolution = new THREE.Vector2(1920, 1080);

const SCENE_LINE_WIDTH: Record<BoltTier, { core: number; glow: number }> = {
  major: { core: 1.2, glow: 2.4 },
  minor: { core: 0.9, glow: 1.8 },
  distant: { core: 0.7, glow: 1.4 },
};

const SCENE_SPRITE_SCALE: Record<
  BoltTier,
  { haloW: number; haloH: number; impactW: number; impactH: number }
> = {
  major: { haloW: 2.6, haloH: 1.95, impactW: 1.1, impactH: 0.82 },
  minor: { haloW: 1.8, haloH: 1.35, impactW: 0.75, impactH: 0.56 },
  distant: { haloW: 1.2, haloH: 0.9, impactW: 0.5, impactH: 0.38 },
};

const GLOW_LAYERS = [
  { radius: 0.45, opacity: 1.0, color: 0xffffff },
  { radius: 1.1, opacity: 0.55, color: 0xe8f4ff },
  { radius: 2.4, opacity: 0.26, color: 0xa8ccff },
  { radius: 4.5, opacity: 0.11, color: 0x6a9eff },
  { radius: 7.5, opacity: 0.04, color: 0x3a62c8 },
];

const TIER_SCALE: Record<BoltTier, number> = {
  major: 0.82,
  minor: 0.55,
  distant: 0.38,
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

let sharedHaloTextureBright: THREE.CanvasTexture | null = null;
let sharedHaloTextureSoft: THREE.CanvasTexture | null = null;
let sharedImpactTexture: THREE.CanvasTexture | null = null;

function configureSpriteTexture(texture: THREE.CanvasTexture): THREE.CanvasTexture {
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = false;
  return texture;
}

function getHaloTexture(bright: boolean): THREE.CanvasTexture {
  if (bright && sharedHaloTextureBright) return sharedHaloTextureBright;
  if (!bright && sharedHaloTextureSoft) return sharedHaloTextureSoft;

  const size = 512;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;

  const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  if (bright) {
    gradient.addColorStop(0, "rgba(255, 255, 255, 1)");
    gradient.addColorStop(0.1, "rgba(235, 245, 255, 0.9)");
    gradient.addColorStop(0.24, "rgba(180, 215, 255, 0.45)");
    gradient.addColorStop(0.48, "rgba(100, 155, 235, 0.16)");
    gradient.addColorStop(0.72, "rgba(50, 90, 180, 0.05)");
    gradient.addColorStop(1, "rgba(20, 40, 90, 0)");
  } else {
    gradient.addColorStop(0, "rgba(230, 242, 255, 0.92)");
    gradient.addColorStop(0.22, "rgba(170, 205, 255, 0.34)");
    gradient.addColorStop(0.5, "rgba(95, 145, 225, 0.11)");
    gradient.addColorStop(1, "rgba(40, 70, 140, 0)");
  }

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  const texture = configureSpriteTexture(new THREE.CanvasTexture(canvas));
  if (bright) sharedHaloTextureBright = texture;
  else sharedHaloTextureSoft = texture;
  return texture;
}

function getImpactTexture(): THREE.CanvasTexture {
  if (sharedImpactTexture) return sharedImpactTexture;

  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;

  const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  gradient.addColorStop(0, "rgba(210, 232, 255, 0.8)");
  gradient.addColorStop(0.28, "rgba(130, 178, 255, 0.24)");
  gradient.addColorStop(0.62, "rgba(70, 120, 210, 0.08)");
  gradient.addColorStop(1, "rgba(40, 70, 140, 0)");

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  sharedImpactTexture = configureSpriteTexture(new THREE.CanvasTexture(canvas));
  return sharedImpactTexture;
}

function createSceneSprites(spec: BoltSpec): {
  cloudHalo: THREE.Sprite;
  impactGlow: THREE.Sprite;
  dispose: () => void;
} {
  const scale = SCENE_SPRITE_SCALE[spec.tier];
  const cloudMaterial = new THREE.SpriteMaterial({
    map: getHaloTexture(spec.tier === "major"),
    transparent: true,
    opacity: 0,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    depthTest: false,
  });
  const cloudHalo = new THREE.Sprite(cloudMaterial);
  cloudHalo.position.copy(spec.main[0]);
  cloudHalo.scale.set(scale.haloW, scale.haloH, 1);

  const impactMaterial = new THREE.SpriteMaterial({
    map: getImpactTexture(),
    transparent: true,
    opacity: 0,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    depthTest: false,
  });
  const impactGlow = new THREE.Sprite(impactMaterial);
  impactGlow.position.copy(spec.main[spec.main.length - 1]);
  impactGlow.scale.set(scale.impactW, scale.impactH, 1);

  return {
    cloudHalo,
    impactGlow,
    dispose: () => {
      cloudMaterial.dispose();
      impactMaterial.dispose();
    },
  };
}

function sampleCurvePoints(points: THREE.Vector3[]): THREE.Vector3[] {
  const curve = new THREE.CatmullRomCurve3(points, false, "catmullrom", 0.12);
  return curve.getPoints(Math.max(48, points.length * 6));
}

function createScenePathLines(
  points: THREE.Vector3[],
  tier: BoltTier,
  opacityScale = 1,
): { group: THREE.Group; lines: Line2[]; dispose: () => void } {
  const sampled = sampleCurvePoints(points);
  const positions: number[] = [];
  for (const point of sampled) {
    positions.push(point.x, point.y, point.z);
  }

  const group = new THREE.Group();
  const lines: Line2[] = [];
  const geometries: LineGeometry[] = [];
  const materials: LineMaterial[] = [];
  const widths = SCENE_LINE_WIDTH[tier];

  const addLine = (linewidth: number, color: number, opacity: number) => {
    const geometry = new LineGeometry();
    geometry.setPositions(positions);

    const material = new LineMaterial({
      color,
      linewidth,
      transparent: true,
      opacity: opacity * opacityScale,
      depthWrite: false,
      depthTest: false,
      blending: THREE.AdditiveBlending,
      worldUnits: false,
      resolution: lineResolution,
    });
    material.userData.baseOpacity = opacity * opacityScale;

    const line = new Line2(geometry, material);
    line.computeLineDistances();
    group.add(line);
    lines.push(line);
    geometries.push(geometry);
    materials.push(material);
  };

  addLine(widths.glow, 0xb8d8ff, 0.16);
  addLine(widths.core, 0xffffff, 0.92);

  return {
    group,
    lines,
    dispose: () => {
      geometries.forEach((geometry) => geometry.dispose());
      materials.forEach((material) => material.dispose());
    },
  };
}

function buildSceneStrike(spec: BoltSpec): ActiveStrike {
  const root = new THREE.Group();
  const layers: Line2[] = [];
  const disposers: Array<() => void> = [];

  const addPath = (pathPoints: THREE.Vector3[], tier: BoltTier, opacity = 1) => {
    const path = createScenePathLines(pathPoints, tier, opacity);
    root.add(path.group);
    layers.push(...path.lines);
    disposers.push(path.dispose);
  };

  addPath(spec.main, spec.tier);
  for (const branch of spec.branches) {
    addPath(branch, spec.tier, spec.tier === "major" ? 0.82 : 0.65);
  }
  for (const sub of spec.subBranches) {
    addPath(sub, "minor", 0.55);
  }

  const sprites = createSceneSprites(spec);
  root.add(sprites.cloudHalo, sprites.impactGlow);

  const lifetime =
    spec.tier === "major"
      ? 0.34 + Math.random() * 0.22
      : spec.tier === "minor"
        ? 0.2 + Math.random() * 0.12
        : 0.12 + Math.random() * 0.08;

  return {
    root,
    layers,
    cloudHalo: sprites.cloudHalo,
    impactGlow: sprites.impactGlow,
    dispose: () => {
      disposers.forEach((fn) => fn());
      sprites.dispose();
    },
    age: 0,
    lifetime,
    seed: Math.random() * Math.PI * 2,
    power: spec.power,
    thinLines: true,
  };
}

function createTubeMeshes(
  points: THREE.Vector3[],
  widthScale: number,
  tier: BoltTier,
  opacityScale = 1,
): BoltMeshes {
  const tierScale = TIER_SCALE[tier] * widthScale;
  const curve = new THREE.CatmullRomCurve3(points, false, "catmullrom", 0.16);
  const group = new THREE.Group();
  const layers: THREE.Mesh[] = [];
  const geometries: THREE.BufferGeometry[] = [];
  const materials: THREE.Material[] = [];

  for (const layer of GLOW_LAYERS) {
    const geometry = new THREE.TubeGeometry(
      curve,
      Math.max(28, points.length * 2),
      layer.radius * tierScale,
      6,
      false,
    );
    const material = new THREE.MeshBasicMaterial({
      color: layer.color,
      transparent: true,
      opacity: layer.opacity * opacityScale,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      depthTest: false,
    });
    material.userData.baseOpacity = layer.opacity * opacityScale;

    const mesh = new THREE.Mesh(geometry, material);
    group.add(mesh);
    layers.push(mesh);
    geometries.push(geometry);
    materials.push(material);
  }

  const cloudHalo = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: getHaloTexture(tier === "major"),
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      depthTest: false,
    }),
  );
  cloudHalo.position.copy(points[0]);
  cloudHalo.scale.set(tierScale * (tier === "major" ? 110 : 75), tierScale * (tier === "major" ? 82 : 55), 1);
  group.add(cloudHalo);

  const impactGlow = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: getImpactTexture(),
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      depthTest: false,
    }),
  );
  impactGlow.position.copy(points[points.length - 1]);
  impactGlow.scale.set(tierScale * 48, tierScale * 36, 1);
  group.add(impactGlow);

  return {
    group,
    layers,
    cloudHalo,
    impactGlow,
    dispose: () => {
      geometries.forEach((g) => g.dispose());
      materials.forEach((m) => m.dispose());
      (cloudHalo.material as THREE.SpriteMaterial).dispose();
      (impactGlow.material as THREE.SpriteMaterial).dispose();
    },
  };
}

function buildStrikeFromSpec(spec: BoltSpec, widthScale: number): ActiveStrike {
  const root = new THREE.Group();
  const layers: THREE.Mesh[] = [];
  const disposers: Array<() => void> = [];
  let cloudHalo: THREE.Sprite | null = null;
  let impactGlow: THREE.Sprite | null = null;

  const addPath = (points: THREE.Vector3[], tier: BoltTier, opacity = 1) => {
    const meshes = createTubeMeshes(points, widthScale, tier, opacity);
    root.add(meshes.group);
    layers.push(...meshes.layers);
    disposers.push(meshes.dispose);
    if (!cloudHalo || tier === "major") cloudHalo = meshes.cloudHalo;
    if (!impactGlow || tier === "major") impactGlow = meshes.impactGlow;
  };

  addPath(spec.main, spec.tier);
  for (const branch of spec.branches) {
    addPath(branch, spec.tier, spec.tier === "major" ? 0.82 : 0.65);
  }
  for (const sub of spec.subBranches) {
    addPath(sub, "minor", 0.55);
  }

  const lifetime =
    spec.tier === "major"
      ? 0.34 + Math.random() * 0.22
      : spec.tier === "minor"
        ? 0.2 + Math.random() * 0.12
        : 0.12 + Math.random() * 0.08;

  return {
    root,
    layers,
    cloudHalo: cloudHalo!,
    impactGlow: impactGlow!,
    dispose: () => disposers.forEach((fn) => fn()),
    age: 0,
    lifetime,
    seed: Math.random() * Math.PI * 2,
    power: spec.power,
  };
}

export function buildScreenStrikeFromSpec(spec: BoltSpec, width: number): ActiveStrike {
  const widthScale = Math.max(0.75, width / 1920);
  return buildStrikeFromSpec(spec, widthScale);
}

export function buildSceneStrikeFromSpec(spec: BoltSpec): ActiveStrike {
  return buildSceneStrike(spec);
}

export function setBoltLineResolution(width: number, height: number): void {
  lineResolution.set(width, height);
}

export function strikeOpacity(age: number, lifetime: number, seed: number, power: number): number {
  const t = age / lifetime;
  if (t >= 1) return 0;

  const flicker =
    Math.sin(age * 110 + seed) * 0.55 +
    Math.sin(age * 210 + seed * 1.9) * 0.28 +
    Math.sin(age * 47 + seed * 0.5) * 0.22 +
    (Math.random() > 0.93 ? 0.35 : 0);

  const envelope =
    t < 0.05 ? t / 0.05 : t < 0.5 ? 1 : Math.max(0, 1 - (t - 0.5) / 0.5);

  return clamp((0.35 + flicker * 0.45) * envelope * power, 0, 1.6);
}

export function updateStrikeVisuals(strike: ActiveStrike, opacity: number): void {
  for (const mesh of strike.layers) {
    const material = mesh.material as THREE.MeshBasicMaterial | LineMaterial;
    const base = (material.userData.baseOpacity as number) ?? material.opacity;
    material.opacity = base * opacity;
    if (strike.thinLines && "resolution" in material) {
      material.resolution.copy(lineResolution);
    }
  }

  const cloudMat = strike.cloudHalo.material as THREE.SpriteMaterial;
  cloudMat.opacity = opacity * (strike.thinLines ? 0.52 : 0.6);

  const impactMat = strike.impactGlow.material as THREE.SpriteMaterial;
  impactMat.opacity = opacity * (strike.thinLines ? 0.24 : 0.28);
}
