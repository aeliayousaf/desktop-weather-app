import { useEffect } from "react";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import { AnimationOrchestrator } from "../components/AnimationOrchestrator";
import { useWeatherWatcher } from "../hooks/useWeatherWatcher";
import "../styles/global.css";

export function OverlayApp() {
  const {
    activeAnimation,
    testAnimation,
    clearActiveAnimation,
    clearTestAnimation,
  } = useWeatherWatcher();

  useEffect(() => {
    const window = getCurrentWebviewWindow();
    void window.setIgnoreCursorEvents(true);
  }, []);

  return (
    <>
      <AnimationOrchestrator
        activeType={activeAnimation}
        onComplete={clearActiveAnimation}
      />
      <AnimationOrchestrator
        key={testAnimation?.id}
        activeType={testAnimation?.type ?? null}
        onComplete={clearTestAnimation}
        forcePlay
      />
    </>
  );
}
