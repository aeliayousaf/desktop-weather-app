import { useRef } from "react";
import { useLightningEffect } from "../../hooks/useLightningEffect";
import "./animations.css";

interface LightningAnimationProps {
  intensity: number;
}

export function LightningAnimation({ intensity }: LightningAnimationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useLightningEffect(canvasRef, intensity);

  return (
    <canvas ref={canvasRef} className="animation-canvas animation-canvas--lightning" />
  );
}
