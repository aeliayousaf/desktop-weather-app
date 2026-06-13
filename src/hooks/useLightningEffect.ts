import { useEffect, useRef } from "react";
import type { LightningEffectHandle } from "../lightning-effect/createLightningEffect";

export function useLightningEffect(
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  intensity: number,
) {
  const handleRef = useRef<LightningEffectHandle | null>(null);
  const intensityRef = useRef(intensity);
  intensityRef.current = intensity;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let cancelled = false;

    import("../lightning-effect/createLightningEffect")
      .then(({ createLightningEffect }) => {
        if (cancelled) return;
        const handle = createLightningEffect(canvas);
        handleRef.current = handle;
        handle.setIntensity(intensityRef.current);
      })
      .catch((error) => {
        console.error("Lightning effect failed to start:", error);
      });

    const onResize = () => {
      handleRef.current?.resize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener("resize", onResize);

    return () => {
      cancelled = true;
      window.removeEventListener("resize", onResize);
      handleRef.current?.destroy();
      handleRef.current = null;
    };
  }, [canvasRef]);

  useEffect(() => {
    handleRef.current?.setIntensity(intensity);
  }, [intensity]);
}
