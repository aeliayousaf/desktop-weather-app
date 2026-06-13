import "./animations.css";

interface SunAnimationProps {
  intensity: number;
}

export function SunAnimation({ intensity }: SunAnimationProps) {
  const opacity = 0.5 + (intensity / 100) * 0.5;

  return (
    <div className="animation-layer sun-layer" style={{ opacity }}>
      <div className="sun-halo" />
      <div className="sun-core" />
    </div>
  );
}
