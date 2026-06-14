import { useEffect, useMemo, useRef } from "react";
import { scaleFloat } from "./intensity";

interface UmbrellaOverlayProps {
  intensity: number;
}

interface UmbrellaActor {
  id: number;
  x: number;
  y: number;
  rotation: number;
  tilt: number;
  bobPhase: number;
  wobblePhase: number;
  speed: number;
  width: number;
  height: number;
  bobAmplitude: number;
  bobSpeed: number;
  wobbleSpeed: number;
  tiltAmplitude: number;
  verticalDrift: number;
}

function createUmbrella(id: number, intensity: number, height: number): UmbrellaActor {
  const width = scaleFloat(118, 168, intensity);
  const aspect = 1.35;

  return {
    id,
    x: -width * (1.2 + id * 0.45),
    y: height * scaleFloat(0.34, 0.48, intensity) + id * 28,
    rotation: -18 + Math.random() * 12,
    tilt: 0,
    bobPhase: Math.random() * Math.PI * 2,
    wobblePhase: Math.random() * Math.PI * 2,
    speed: scaleFloat(150, 280, intensity) * (0.9 + id * 0.12),
    width,
    height: width * aspect,
    bobAmplitude: scaleFloat(18, 42, intensity),
    bobSpeed: scaleFloat(2.2, 3.6, intensity) + id * 0.35,
    wobbleSpeed: scaleFloat(3.5, 5.5, intensity),
    tiltAmplitude: scaleFloat(10, 22, intensity),
    verticalDrift: (Math.random() - 0.5) * scaleFloat(8, 18, intensity),
  };
}

export function UmbrellaOverlay({ intensity }: UmbrellaOverlayProps) {
  const actorIds = useMemo(() => [0], []);

  const actorsRef = useRef<UmbrellaActor[]>([]);
  const nodeRefs = useRef<Array<HTMLDivElement | null>>([]);

  useEffect(() => {
    actorsRef.current = actorIds.map((id) =>
      createUmbrella(id, intensity, window.innerHeight),
    );
  }, [actorIds, intensity]);

  useEffect(() => {
    let frameId = 0;
    let last = performance.now();

    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const width = window.innerWidth;
      const height = window.innerHeight;
      const elapsed = now / 1000;

      actorsRef.current.forEach((actor, index) => {
        const node = nodeRefs.current[index];
        if (!node) return;

        actor.x += actor.speed * dt;
        actor.bobPhase += actor.bobSpeed * dt;
        actor.wobblePhase += actor.wobbleSpeed * dt;

        const bob = Math.sin(actor.bobPhase) * actor.bobAmplitude;
        const wobble = Math.sin(actor.wobblePhase) * actor.tiltAmplitude;
        const gust = Math.sin(elapsed * 0.7 + actor.id) * actor.verticalDrift;
        actor.tilt = wobble;
        actor.rotation = -14 + wobble * 0.55;

        if (actor.x > width + actor.width * 1.1) {
          const fresh = createUmbrella(actor.id, intensity, height);
          actor.x = fresh.x;
          actor.y = fresh.y;
          actor.bobPhase = fresh.bobPhase;
          actor.wobblePhase = fresh.wobblePhase;
          actor.verticalDrift = fresh.verticalDrift;
        }

        node.style.width = `${actor.width}px`;
        node.style.height = `${actor.height}px`;
        node.style.transform = `translate3d(${actor.x}px, ${actor.y + bob + gust}px, 0) rotate(${actor.rotation}deg)`;
      });

      frameId = requestAnimationFrame(tick);
    };

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [intensity]);

  return (
    <div className="wind-prop-overlay" aria-hidden="true">
      {actorIds.map((id, index) => (
        <div
          key={id}
          ref={(node) => {
            nodeRefs.current[index] = node;
          }}
          className="umbrella-sprite"
        >
          <img src="/wind/umbrella.png" alt="" draggable={false} />
        </div>
      ))}
    </div>
  );
}
