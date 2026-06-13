import { useEffect, useRef } from "react";

export type CanvasDrawFn = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  time: number,
) => void;

export function useAnimationCanvas(draw: CanvasDrawFn, deps: unknown[] = []) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawRef = useRef(draw);
  drawRef.current = draw;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let frameId = 0;
    let width = 0;
    let height = 0;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    window.addEventListener("resize", resize);

    const loop = (time: number) => {
      ctx.clearRect(0, 0, width, height);
      drawRef.current(ctx, width, height, time);
      frameId = requestAnimationFrame(loop);
    };

    frameId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener("resize", resize);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- caller controls redraw deps
  }, deps);

  return canvasRef;
}
