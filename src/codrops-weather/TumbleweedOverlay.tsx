import { useEffect, useMemo, useRef } from "react";
import { scaleFloat } from "./intensity";

interface TumbleweedOverlayProps {
  intensity: number;
}

interface TumbleweedActor {
  id: number;
  x: number;
  rotation: number;
  bouncePhase: number;
  speed: number;
  size: number;
  bounceHeight: number;
  bounceSpeed: number;
}

function createActor(id: number, intensity: number): TumbleweedActor {
  const size = scaleFloat(68, 108, intensity);

  return {
    id,
    x: -size * (1.1 + id * 0.35),
    rotation: Math.random() * 360,
    bouncePhase: Math.random() * Math.PI * 2,
    speed: scaleFloat(240, 480, intensity) * (0.92 + id * 0.08),
    size,
    bounceHeight: scaleFloat(8, 22, intensity),
    bounceSpeed: scaleFloat(7, 13, intensity) + id,
  };
}

export function TumbleweedOverlay({ intensity }: TumbleweedOverlayProps) {
  const actorCount = intensity > 78 ? 2 : 1;
  const actorIds = useMemo(
    () => Array.from({ length: actorCount }, (_, id) => id),
    [actorCount],
  );

  const actorsRef = useRef<TumbleweedActor[]>([]);
  const nodeRefs = useRef<Array<HTMLDivElement | null>>([]);

  useEffect(() => {
    actorsRef.current = actorIds.map((id) => createActor(id, intensity));
  }, [actorIds, intensity]);

  useEffect(() => {
    let frameId = 0;
    let last = performance.now();

    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const width = window.innerWidth;
      const height = window.innerHeight;
      const taskbarBase = Math.max(10, Math.min(28, height * 0.018));

      actorsRef.current.forEach((actor, index) => {
        const node = nodeRefs.current[index];
        if (!node) return;

        actor.x += actor.speed * dt;
        actor.bouncePhase += actor.bounceSpeed * dt;
        actor.rotation += (actor.speed * dt * 360) / (Math.PI * actor.size * 0.82);

        if (actor.x > width + actor.size * 1.1) {
          actor.x = -actor.size * (1.15 + index * 0.25);
          actor.bouncePhase = Math.random() * Math.PI * 2;
        }

        const bounce = Math.abs(Math.sin(actor.bouncePhase)) * actor.bounceHeight;
        const bottomOffset = taskbarBase + bounce;

        node.style.width = `${actor.size}px`;
        node.style.height = `${actor.size}px`;
        node.style.transform = `translate3d(${actor.x}px, ${-bottomOffset}px, 0) rotate(${actor.rotation}deg)`;
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
          className="tumbleweed-sprite"
        >
          <img src="/wind/tumbleweed.png" alt="" draggable={false} />
        </div>
      ))}
    </div>
  );
}
