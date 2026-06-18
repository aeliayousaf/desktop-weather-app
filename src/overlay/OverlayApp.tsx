import { useEffect } from "react";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import { AnimationOrchestrator } from "../components/AnimationOrchestrator";
import { useWeatherWatcher } from "../hooks/useWeatherWatcher";
import { ensureOverlayOnTop } from "../utils/overlayStack";
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
      await ensureOverlayOnTop();
    };

    void keepOverlayOnTop();

    const interval = window.setInterval(() => {
      void keepOverlayOnTop();
    }, 1000);

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
