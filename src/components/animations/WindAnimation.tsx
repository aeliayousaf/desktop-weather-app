import { useCallback, useRef } from "react";
import { useAnimationCanvas } from "./useAnimationCanvas";
import "./animations.css";

interface WindAnimationProps {
  intensity: number;
}

interface WindStreak {
  x: number;
  y: number;
  length: number;
  speed: number;
  width: number;
  opacity: number;
  curve: number;
}

export function WindAnimation({ intensity }: WindAnimationProps) {
  const streaksRef = useRef<WindStreak[]>([]);
  const intensityRef = useRef(intensity);
  intensityRef.current = intensity;

  const ensureStreaks = (width: number, height: number) => {
    const count = Math.round(25 + (intensityRef.current / 100) * 55);
    if (streaksRef.current.length !== count) {
      streaksRef.current = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        length: 60 + Math.random() * 180,
        speed: 8 + Math.random() * 18,
        width: 0.5 + Math.random() * 1.5,
        opacity: 0.08 + Math.random() * 0.2,
        curve: (Math.random() - 0.5) * 0.15,
      }));
    }
  };

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, width: number, height: number) => {
      ensureStreaks(width, height);
      const intensity = intensityRef.current;
      const dt = 1 / 60;

      for (const streak of streaksRef.current) {
        streak.x += streak.speed * dt * 60;

        if (streak.x > width + streak.length) {
          streak.x = -streak.length - Math.random() * 200;
          streak.y = Math.random() * height;
        }

        const alpha = streak.opacity * (0.6 + intensity / 150);
        const grad = ctx.createLinearGradient(
          streak.x,
          streak.y,
          streak.x + streak.length,
          streak.y + streak.length * streak.curve,
        );
        grad.addColorStop(0, `rgba(200, 215, 230, 0)`);
        grad.addColorStop(0.35, `rgba(210, 225, 240, ${alpha})`);
        grad.addColorStop(0.7, `rgba(190, 210, 230, ${alpha * 0.7})`);
        grad.addColorStop(1, `rgba(200, 215, 230, 0)`);

        ctx.strokeStyle = grad;
        ctx.lineWidth = streak.width;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(streak.x, streak.y);
        ctx.quadraticCurveTo(
          streak.x + streak.length * 0.5,
          streak.y + streak.length * streak.curve * 0.5,
          streak.x + streak.length,
          streak.y + streak.length * streak.curve,
        );
        ctx.stroke();
      }
    },
    [],
  );

  const canvasRef = useAnimationCanvas(draw, [intensity]);

  return <canvas ref={canvasRef} className="animation-canvas" />;
}
