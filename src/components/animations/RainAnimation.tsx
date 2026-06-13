import { useCallback, useRef } from "react";
import { useAnimationCanvas } from "./useAnimationCanvas";
import "./animations.css";

interface RainAnimationProps {
  intensity: number;
}

interface RainDrop {
  x: number;
  y: number;
  length: number;
  speed: number;
  width: number;
  opacity: number;
  layer: number;
}

interface GlassRipple {
  x: number;
  y: number;
  age: number;
  maxAge: number;
  maxRadius: number;
  strength: number;
}

interface GlassBead {
  x: number;
  y: number;
  radius: number;
  speed: number;
  opacity: number;
  wobble: number;
}

function spawnRipple(width: number, height: number, intensity: number): GlassRipple {
  return {
    x: Math.random() * width,
    y: Math.random() * height,
    age: 0,
    maxAge: 0.55 + Math.random() * 0.45,
    maxRadius: 4 + Math.random() * (10 + intensity / 12),
    strength: 0.35 + Math.random() * 0.45,
  };
}

function maybeSpawnBead(beads: GlassBead[], x: number, y: number) {
  if (Math.random() > 0.35) return;
  beads.push({
    x,
    y,
    radius: 1.2 + Math.random() * 2.2,
    speed: 18 + Math.random() * 28,
    opacity: 0.25 + Math.random() * 0.35,
    wobble: Math.random() * Math.PI * 2,
  });
}

function drawGlassRipple(ctx: CanvasRenderingContext2D, ripple: GlassRipple) {
  const progress = ripple.age / ripple.maxAge;
  const rings = 2;

  for (let ring = 0; ring < rings; ring += 1) {
    const delay = ring * 0.12;
    const ringProgress = Math.max(0, (progress - delay) / (1 - delay));
    if (ringProgress >= 1) continue;

    const radius = ripple.maxRadius * ringProgress;
    const alpha = (1 - ringProgress) * ripple.strength * (ring === 0 ? 0.55 : 0.35);

    ctx.beginPath();
    ctx.ellipse(ripple.x, ripple.y, radius, radius * 0.72, 0, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(210, 228, 245, ${alpha})`;
    ctx.lineWidth = Math.max(0.4, 1.3 - ring * 0.45);
    ctx.stroke();

    if (ring === 0 && ringProgress < 0.25) {
      ctx.beginPath();
      ctx.arc(ripple.x, ripple.y, radius * 0.35, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(230, 242, 255, ${alpha * 0.35})`;
      ctx.fill();
    }
  }
}

function drawGlassBead(ctx: CanvasRenderingContext2D, bead: GlassBead, time: number) {
  const wobbleX = Math.sin(time * 0.004 + bead.wobble) * 0.4;

  ctx.beginPath();
  ctx.ellipse(
    bead.x + wobbleX,
    bead.y,
    bead.radius,
    bead.radius * 1.35,
    0,
    0,
    Math.PI * 2,
  );
  ctx.fillStyle = `rgba(200, 220, 240, ${bead.opacity * 0.45})`;
  ctx.fill();

  ctx.beginPath();
  ctx.arc(bead.x + wobbleX - bead.radius * 0.25, bead.y - bead.radius * 0.35, bead.radius * 0.28, 0, Math.PI * 2);
  ctx.fillStyle = `rgba(255, 255, 255, ${bead.opacity * 0.7})`;
  ctx.fill();
}

function drawGlassStreak(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  len: number,
  width: number,
  alpha: number,
  wind: number,
) {
  ctx.lineCap = "round";
  ctx.lineWidth = width;
  ctx.strokeStyle = `rgba(160, 185, 210, ${alpha * 0.55})`;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x - wind, y + len);
  ctx.stroke();

  ctx.lineWidth = Math.max(0.35, width * 0.45);
  ctx.strokeStyle = `rgba(230, 242, 255, ${alpha * 0.85})`;
  ctx.beginPath();
  ctx.moveTo(x + 0.35, y);
  ctx.lineTo(x - wind + 0.35, y + len);
  ctx.stroke();
}

export function RainAnimation({ intensity }: RainAnimationProps) {
  const dropsRef = useRef<RainDrop[]>([]);
  const ripplesRef = useRef<GlassRipple[]>([]);
  const beadsRef = useRef<GlassBead[]>([]);
  const spawnTimerRef = useRef(0);
  const intensityRef = useRef(intensity);
  intensityRef.current = intensity;

  const ensureDrops = (width: number, height: number) => {
    const count = Math.round(80 + (intensityRef.current / 100) * 220);
    if (dropsRef.current.length !== count) {
      dropsRef.current = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        length: 10 + Math.random() * 26,
        speed: 520 + Math.random() * 380,
        width: 0.5 + Math.random() * 1.1,
        opacity: 0.15 + Math.random() * 0.45,
        layer: Math.random() > 0.35 ? 1 : 0,
      }));
    }
  };

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, width: number, height: number, time: number) => {
      ensureDrops(width, height);
      const intensity = intensityRef.current;
      const speedBoost = 1 + intensity / 200;
      const dt = 1 / 60;

      spawnTimerRef.current += dt;
      const spawnEvery = 1 / (2.5 + intensity / 18);
      while (spawnTimerRef.current >= spawnEvery) {
        spawnTimerRef.current -= spawnEvery;
        const ripple = spawnRipple(width, height, intensity);
        ripplesRef.current.push(ripple);
        if (ripplesRef.current.length > 80) {
          ripplesRef.current.shift();
        }
      }

      ripplesRef.current = ripplesRef.current.filter((ripple) => {
        ripple.age += dt;
        return ripple.age < ripple.maxAge;
      });

      for (const ripple of ripplesRef.current) {
        drawGlassRipple(ctx, ripple);
      }

      beadsRef.current = beadsRef.current.filter((bead) => {
        bead.y += bead.speed * dt;
        bead.x += Math.sin(time * 0.003 + bead.wobble) * 0.15;
        return bead.y < height + bead.radius * 2;
      });

      for (const bead of beadsRef.current) {
        drawGlassBead(ctx, bead, time);
      }

      for (const drop of dropsRef.current) {
        const layerScale = drop.layer === 0 ? 0.65 : 1;
        const len = drop.length * layerScale;
        const wind = len * 0.08;

        drop.y += drop.speed * layerScale * speedBoost * dt;

        if (drop.y > height + len) {
          const impactX = drop.x - wind * 0.5;
          ripplesRef.current.push({
            x: impactX,
            y: height - 2 - Math.random() * 8,
            age: 0,
            maxAge: 0.45 + Math.random() * 0.35,
            maxRadius: 6 + Math.random() * 14,
            strength: 0.4 + Math.random() * 0.35,
          });
          maybeSpawnBead(beadsRef.current, impactX, height - 4);
          if (beadsRef.current.length > 40) beadsRef.current.shift();

          drop.y = -len - Math.random() * 80;
          drop.x = Math.random() * width;
        }

        const alpha =
          drop.opacity * (drop.layer === 0 ? 0.5 : 1) * (0.65 + intensity / 180);

        if (drop.layer === 1) {
          drawGlassStreak(ctx, drop.x, drop.y, len, drop.width * layerScale, alpha, wind);
        } else {
          ctx.strokeStyle = `rgba(170, 195, 220, ${alpha * 0.45})`;
          ctx.lineWidth = drop.width * layerScale;
          ctx.lineCap = "round";
          ctx.beginPath();
          ctx.moveTo(drop.x, drop.y);
          ctx.lineTo(drop.x - wind * 1.4, drop.y + len);
          ctx.stroke();
        }
      }
    },
    [],
  );

  const canvasRef = useAnimationCanvas(draw, [intensity]);

  return <canvas ref={canvasRef} className="animation-canvas animation-canvas--glass" />;
}
