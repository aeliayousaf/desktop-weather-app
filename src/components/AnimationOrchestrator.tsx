import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { WeatherAnimationType } from "../types/weather";
import { useSettingsStore } from "../store/settingsStore";
import { playWeatherSound } from "../utils/weatherSounds";

const CodropsWeatherAnimation = lazy(() =>
  import("../codrops-weather/CodropsWeatherAnimation").then((module) => ({
    default: module.CodropsWeatherAnimation,
  })),
);

interface AnimationOrchestratorProps {
  activeType: WeatherAnimationType | null;
  onComplete: () => void;
  forcePlay?: boolean;
}

const FADE_MS = 300;

export function AnimationOrchestrator({
  activeType,
  onComplete,
  forcePlay = false,
}: AnimationOrchestratorProps) {
  const { animationDurationMs, animationIntensity, soundEnabled, enabledAnimations, paused } =
    useSettingsStore();

  const [visible, setVisible] = useState(false);
  const [currentType, setCurrentType] = useState<WeatherAnimationType | null>(null);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    if (!activeType) return;
    if (!forcePlay && paused) return;
    if (!forcePlay && !enabledAnimations[activeType]) return;

    setCurrentType(activeType);
    setVisible(true);

    if (soundEnabled) {
      playWeatherSound(activeType);
    }

    const fadeTimer = window.setTimeout(() => {
      setVisible(false);
    }, animationDurationMs);

    const completeTimer = window.setTimeout(() => {
      setCurrentType(null);
      onCompleteRef.current();
    }, animationDurationMs + FADE_MS);

    return () => {
      window.clearTimeout(fadeTimer);
      window.clearTimeout(completeTimer);
    };
  }, [
    activeType,
    animationDurationMs,
    enabledAnimations,
    forcePlay,
    paused,
    soundEnabled,
  ]);

  return (
    <AnimatePresence>
      {visible && currentType && (
        <motion.div
          key={currentType}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: FADE_MS / 1000 }}
          className="overlay-root"
        >
          <Suspense fallback={null}>
            <CodropsWeatherAnimation type={currentType} intensity={animationIntensity} />
          </Suspense>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
