import * as THREE from "three";

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export type BoltTier = "major" | "minor" | "distant";

export interface BoltSpec {
  main: THREE.Vector3[];
  branches: THREE.Vector3[][];
  subBranches: THREE.Vector3[][];
  origin: THREE.Vector3;
  tier: BoltTier;
  power: number;
}

export function generateBoltPoints(
  startX: number,
  startY: number,
  height: number,
  segments: number,
  jitter: number,
  wander = 1,
): THREE.Vector3[] {
  const points: THREE.Vector3[] = [new THREE.Vector3(startX, startY, 0)];
  const step = height / segments;
  let drift = 0;

  for (let i = 1; i <= segments; i += 1) {
    const prev = points[points.length - 1];
    const progress = i / segments;
    const y = startY - step * i;

    drift += (Math.random() - 0.5) * jitter * 0.35 * wander;
    drift *= 0.82;

    const x = clamp(
      prev.x + (Math.random() - 0.5) * jitter * 1.5 * wander + drift,
      startX - jitter * 2.2,
      startX + jitter * 2.2,
    );

    const z = (Math.random() - 0.5) * 0.06 * (1 - progress * 0.4);
    points.push(new THREE.Vector3(x, y, z));
  }

  return points;
}

export function generateBranchPoints(
  from: THREE.Vector3,
  length: number,
  direction: number,
  segments = 5,
): THREE.Vector3[] {
  const step = length / segments;
  const points: THREE.Vector3[] = [from.clone()];

  for (let i = 1; i <= segments; i += 1) {
    const prev = points[points.length - 1];
    const kink = (Math.random() - 0.5) * step * 0.55;
    points.push(
      new THREE.Vector3(
        prev.x + direction * step * (0.75 + Math.random() * 0.2) + kink,
        prev.y - step * (0.82 + Math.random() * 0.12),
        prev.z + (Math.random() - 0.5) * 0.04,
      ),
    );
  }

  return points;
}

function pickSpreadX(width: number, usedSlots: number[]): number {
  const center = width * 0.5;
  const clusterWidth = width * 0.22;
  const slots = 3;
  const slotWidth = clusterWidth / slots;

  let slot = Math.floor(Math.random() * slots);
  let attempts = 0;
  while (usedSlots.includes(slot) && attempts < 8) {
    slot = Math.floor(Math.random() * slots);
    attempts += 1;
  }
  usedSlots.push(slot);

  const jitter = (Math.random() - 0.5) * slotWidth * 0.35;
  return center - clusterWidth * 0.5 + slot * slotWidth + slotWidth * 0.5 + jitter;
}

function attachBranches(
  main: THREE.Vector3[],
  boltHeight: number,
  count: number,
  tier: BoltTier,
): THREE.Vector3[][] {
  const branches: THREE.Vector3[][] = [];
  const usedIndices = new Set<number>();

  for (let i = 0; i < count; i += 1) {
    let attachIndex = 0;
    let guard = 0;
    do {
      attachIndex = 2 + Math.floor(Math.random() * Math.max(1, main.length - 5));
      guard += 1;
    } while (usedIndices.has(attachIndex) && guard < 20);

    usedIndices.add(attachIndex);
    const attach = main[attachIndex];
    const direction = Math.random() > 0.5 ? 1 : -1;
    const lengthScale = tier === "major" ? 0.18 : tier === "minor" ? 0.12 : 0.08;
    const branchLength = boltHeight * (lengthScale + Math.random() * lengthScale * 0.5);
    branches.push(generateBranchPoints(attach, branchLength, direction, tier === "major" ? 6 : 4));
  }

  return branches;
}

function attachSubBranches(branches: THREE.Vector3[][], tier: BoltTier): THREE.Vector3[][] {
  if (tier !== "major") return [];

  const subBranches: THREE.Vector3[][] = [];
  for (const branch of branches) {
    if (Math.random() > 0.55 || branch.length < 4) continue;
    const attach = branch[2 + Math.floor(Math.random() * (branch.length - 3))];
    const direction = Math.random() > 0.5 ? 1 : -1;
    const length = branch[0].distanceTo(branch[branch.length - 1]) * (0.35 + Math.random() * 0.2);
    subBranches.push(generateBranchPoints(attach, length, direction, 3));
  }

  return subBranches;
}

export function createBoltSpec(
  width: number,
  height: number,
  tier: BoltTier = Math.random() > 0.38 ? "major" : "minor",
  usedSlots: number[] = [],
): BoltSpec {
  const startX = pickSpreadX(width, usedSlots);
  const startY = height * (tier === "distant" ? 0.78 + Math.random() * 0.08 : 0.86 + Math.random() * 0.1);

  const heightScale = tier === "major" ? 0.62 + Math.random() * 0.28 : tier === "minor" ? 0.42 + Math.random() * 0.22 : 0.28 + Math.random() * 0.15;
  const boltHeight = height * heightScale;

  const segments = tier === "major" ? 18 + Math.floor(Math.random() * 8) : tier === "minor" ? 12 + Math.floor(Math.random() * 5) : 9 + Math.floor(Math.random() * 4);
  const jitter = width * (tier === "major" ? 0.014 : tier === "minor" ? 0.011 : 0.008);
  const wander = tier === "major" ? 0.95 : tier === "minor" ? 0.75 : 0.55;

  const main = generateBoltPoints(startX, startY, boltHeight, segments, jitter, wander);

  const branchCount =
    tier === "major" ? 1 + Math.floor(Math.random() * 2) : tier === "minor" ? (Math.random() > 0.55 ? 1 : 0) : 0;

  const branches = attachBranches(main, boltHeight, branchCount, tier);
  const subBranches = attachSubBranches(branches, tier);

  const power =
    tier === "major" ? 1.15 + Math.random() * 0.45 : tier === "minor" ? 0.45 + Math.random() * 0.25 : 0.22 + Math.random() * 0.12;

  return { main, branches, subBranches, origin: main[0].clone(), tier, power };
}

export function createSpreadBurst(
  width: number,
  height: number,
  count: number,
): BoltSpec[] {
  const usedSlots: number[] = [];
  const specs: BoltSpec[] = [];

  specs.push(createBoltSpec(width, height, "major", usedSlots));

  while (specs.length < count) {
    const tier: BoltTier = Math.random() > 0.6 ? "minor" : "major";
    specs.push(createBoltSpec(width, height, tier, usedSlots));
  }

  return specs;
}

function pickSceneX(usedSlots: number[]): number {
  const clusterWidth = 8;
  const slots = 4;
  const slotWidth = clusterWidth / slots;

  let slot = Math.floor(Math.random() * slots);
  let attempts = 0;
  while (usedSlots.includes(slot) && attempts < 8) {
    slot = Math.floor(Math.random() * slots);
    attempts += 1;
  }
  usedSlots.push(slot);

  const jitter = (Math.random() - 0.5) * slotWidth * 0.35;
  return -clusterWidth * 0.5 + slot * slotWidth + slotWidth * 0.5 + jitter;
}

function offsetSpecDepth(spec: BoltSpec, z: number): void {
  const offset = (point: THREE.Vector3) => {
    point.z += z;
  };

  spec.main.forEach(offset);
  spec.branches.forEach((branch) => branch.forEach(offset));
  spec.subBranches.forEach((branch) => branch.forEach(offset));
  spec.origin.z += z;
}

export function createSceneBoltSpec(
  tier: BoltTier = Math.random() > 0.38 ? "major" : "minor",
  usedSlots: number[] = [],
): BoltSpec {
  const startX = pickSceneX(usedSlots);
  const startY = tier === "distant" ? 5.2 + Math.random() * 0.8 : 5.8 + Math.random() * 2.2;

  const heightScale =
    tier === "major"
      ? 4.8 + Math.random() * 2.4
      : tier === "minor"
        ? 3.2 + Math.random() * 1.6
        : 2.2 + Math.random() * 1.2;
  const boltHeight = heightScale;

  const segments =
    tier === "major"
      ? 18 + Math.floor(Math.random() * 8)
      : tier === "minor"
        ? 12 + Math.floor(Math.random() * 5)
        : 9 + Math.floor(Math.random() * 4);
  const jitter = tier === "major" ? 0.42 : tier === "minor" ? 0.32 : 0.22;
  const wander = tier === "major" ? 0.95 : tier === "minor" ? 0.75 : 0.55;

  const main = generateBoltPoints(startX, startY, boltHeight, segments, jitter, wander);

  const branchCount =
    tier === "major" ? 1 + Math.floor(Math.random() * 2) : tier === "minor" ? (Math.random() > 0.55 ? 1 : 0) : 0;

  const branches = attachBranches(main, boltHeight, branchCount, tier);
  const subBranches = attachSubBranches(branches, tier);

  const power =
    tier === "major"
      ? 1.15 + Math.random() * 0.45
      : tier === "minor"
        ? 0.45 + Math.random() * 0.25
        : 0.22 + Math.random() * 0.12;

  const spec: BoltSpec = { main, branches, subBranches, origin: main[0].clone(), tier, power };
  offsetSpecDepth(spec, -2.5 - Math.random() * 2);
  return spec;
}

export function createSceneSpreadBurst(count: number): BoltSpec[] {
  const usedSlots: number[] = [];
  const specs: BoltSpec[] = [];

  specs.push(createSceneBoltSpec("major", usedSlots));

  while (specs.length < count) {
    const tier: BoltTier = Math.random() > 0.6 ? "minor" : "major";
    specs.push(createSceneBoltSpec(tier, usedSlots));
  }

  return specs;
}
