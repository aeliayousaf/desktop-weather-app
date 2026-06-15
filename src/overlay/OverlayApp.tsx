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
    const win = getCurrentWebviewWindow();

    const keepOverlayOnTop = async () => {
      await win.setBackgroundColor([0, 0, 0, 0]);
      await win.setAlwaysOnTop(true);
      await win.setIgnoreCursorEvents(true);
    };

    void keepOverlayOnTop();

    const interval = window.setInterval(() => {
      void keepOverlayOnTop();
    }, 2500);

    const onFocus = () => {
      void keepOverlayOnTop();
    };
    window.addEventListener("focus", onFocus);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", onFocus);
    };
  }, []);

  return (
    <>
      <AnimationOrchestrator
        activeType={activeAnimation}
        onComplete={clearActiveAnimation}
      />
      <AnimationOrchestrator
        key={testAnimation ? String(testAnimation.id) : "test-idle"}
        activeType={testAnimation?.type ?? null}
        onComplete={clearTestAnimation}
        forcePlay
      />
    </>
  );
}
