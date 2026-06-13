import { useCallback, useRef } from "react";
import { useAnimationCanvas } from "./useAnimationCanvas";
import "./animations.css";

interface SnowAnimationProps {
  intensity: number;
}

interface Snowflake {
  x: number;
  y: number;
  radius: number;
  speed: number;
  swayAmp: number;
  swayFreq: number;
  phase: number;
  opacity: number;
  /** 0 = sharp background, 1 = soft blurred foreground */
  layer: 0 | 1;
}

function stormFactor(intensity: number): number {
  const t = Math.max(0, Math.min(100, intensity)) / 100;
  return t * t * (3 - 2 * t);
}

function flakeCount(width: number, height: number, intensity: number): number {
  const storm = stormFactor(intensity);
  const linear = intensity / 100;
  const area = (width * height) / (1920 * 1080);
  return Math.round((28 + storm * 560 + linear * 45) * Math.max(0.7, area));
}

function createSnowflake(
  width: number,
  height: number,
  layer: 0 | 1,
  intensity: number,
): Snowflake {
  const storm = stormFactor(intensity);
  const isForeground = layer === 1;
  const sizeBoost = 1 + storm * 0.4;

  return {
    x: Math.random() * width,
    y: Math.random() * height,
    radius:
      (isForeground ? 2 + Math.random() * 4.2 : 0.6 + Math.random() * 2.2) * sizeBoost,
    speed:
      (isForeground ? 0.8 + Math.random() * 1.5 : 0.3 + Math.random() * 0.85) *
      (1 + storm * 0.85),
    swayAmp:
      (isForeground ? 0.7 + Math.random() * 2.2 : 0.25 + Math.random() * 1) *
      (1 + storm * 0.75),
    swayFreq: isForeground ? 0.6 + Math.random() * 1.4 : 0.4 + Math.random() * 1.2,
    phase: Math.random() * Math.PI * 2,
    opacity:
      (isForeground ? 0.42 + Math.random() * 0.45 : 0.2 + Math.random() * 0.48) *
      (1 + storm * 0.25),
    layer,
  };
}

function updateSnowflake(
  flake: Snowflake,
  width: number,
  height: number,
  t: number,
  dt: number,
  intensity: number,
) {
  const storm = stormFactor(intensity);
  const fallScale = (flake.layer === 1 ? 50 : 36) * (1 + storm * 1.1);
  const wind = 1 + Math.sin(t * 0.35) * storm * 0.35;

  flake.y += flake.speed * dt * fallScale * wind;
  flake.x += Math.sin(t * flake.swayFreq + flake.phase) * flake.swayAmp * wind;

  if (flake.y > height + flake.radius * 2) {
    flake.y = -flake.radius * 2 - Math.random() * 40 * storm;
    flake.x = Math.random() * width;
  }
  if (flake.x < -12) flake.x = width + 12;
  if (flake.x > width + 12) flake.x = -12;
}

function drawSnowflake(ctx: CanvasRenderingContext2D, flake: Snowflake, intensity: number) {
  const storm = stormFactor(intensity);
  const alpha = flake.opacity * (0.6 + intensity / 160 + storm * 0.2);
  const r = flake.radius;

  if (flake.layer === 1) {
    const blur = r * (2.6 + storm * 0.8) + 4;
    ctx.shadowBlur = blur;
    ctx.shadowColor = `rgba(255, 255, 255, ${alpha * 0.55})`;
    ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.74})`;
    ctx.beginPath();
    ctx.arc(flake.x, flake.y, r, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowBlur = blur * 0.45;
    ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.36})`;
    ctx.beginPath();
    ctx.arc(flake.x, flake.y, r * 1.35, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.shadowBlur = 0;
    ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
    ctx.beginPath();
    ctx.arc(flake.x, flake.y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.shadowBlur = 0;
}

export function SnowAnimation({ intensity }: SnowAnimationProps) {
  const flakesRef = useRef<Snowflake[]>([]);
  const lastCountRef = useRef(0);
  const intensityRef = useRef(intensity);
  intensityRef.current = intensity;

  const ensureFlakes = (width: number, height: number) => {
    const total = flakeCount(width, height, intensityRef.current);
    if (flakesRef.current.length === total) return;

    const storm = stormFactor(intensityRef.current);
    const foregroundRatio = 0.26 + storm * 0.24;
    const foregroundCount = Math.round(total * foregroundRatio);
    const backgroundCount = total - foregroundCount;

    if (total > lastCountRef.current && flakesRef.current.length > 0) {
      const toAdd = total - flakesRef.current.length;
      const newForeground = Math.round(toAdd * foregroundRatio);
      const newBackground = toAdd - newForeground;
      flakesRef.current.push(
        ...Array.from({ length: newBackground }, () =>
          createSnowflake(width, height, 0, intensityRef.current),
        ),
        ...Array.from({ length: newForeground }, () =>
          createSnowflake(width, height, 1, intensityRef.current),
        ),
      );
    } else {
      flakesRef.current = [
        ...Array.from({ length: backgroundCount }, () =>
          createSnowflake(width, height, 0, intensityRef.current),
        ),
        ...Array.from({ length: foregroundCount }, () =>
          createSnowflake(width, height, 1, intensityRef.current),
        ),
      ];
    }

    lastCountRef.current = total;
  };

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, width: number, height: number, time: number) => {
      ensureFlakes(width, height);
      const intensity = intensityRef.current;
      const t = time * 0.001;
      const dt = 1 / 60;

      for (const flake of flakesRef.current) {
        updateSnowflake(flake, width, height, t, dt, intensity);
      }

      for (const flake of flakesRef.current) {
        if (flake.layer === 0) {
          drawSnowflake(ctx, flake, intensity);
        }
      }

      for (const flake of flakesRef.current) {
        if (flake.layer === 1) {
          drawSnowflake(ctx, flake, intensity);
        }
      }
    },
    [],
  );

  const canvasRef = useAnimationCanvas(draw, [intensity]);

  return <canvas ref={canvasRef} className="animation-canvas" />;
}
