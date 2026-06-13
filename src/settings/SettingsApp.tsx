import { useEffect, useState } from "react";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import {
  getSettingsSnapshot,
  useSettingsStore,
} from "../store/settingsStore";
import { fetchWeather, geocodeCity } from "../services/weatherService";
import { mapWeatherToAnimation } from "../utils/weatherCodeMapper";
import {
  syncSettingsToOverlay,
  triggerOverlayTestAnimation,
} from "../utils/overlayBridge";
import { unlockWeatherAudio, playWeatherSound, stopWeatherSound } from "../utils/weatherSounds";
import { ANIMATION_TYPES, type WeatherAnimationType } from "../types/weather";
import "../styles/global.css";
import "../styles/settings.css";

const ANIMATION_LABELS: Record<WeatherAnimationType, string> = {
  sun: "Sun",
  rain: "Rain",
  snow: "Snow",
  cloud: "Cloud",
  thunderstorm: "Thunderstorm",
  wind: "Wind",
};

export function SettingsApp() {
  const {
    city,
    latitude,
    longitude,
    animationDurationMs,
    animationIntensity,
    soundEnabled,
    windThresholdKmh,
    enabledAnimations,
    setCity,
    setLocation,
    updateSettings,
    toggleAnimationType,
  } = useSettingsStore();

  const [cityInput, setCityInput] = useState(city);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      await useSettingsStore.persist.rehydrate();
      await syncSettingsToOverlay(getSettingsSnapshot(useSettingsStore.getState()));
    })();
  }, []);

  useEffect(() => {
    const unlockOnInteraction = () => {
      void unlockWeatherAudio();
    };

    document.addEventListener("pointerdown", unlockOnInteraction, { once: true });
    return () => document.removeEventListener("pointerdown", unlockOnInteraction);
  }, []);

  useEffect(() => {
    const overlay = getCurrentWebviewWindow();

    const unlistenPlay = overlay.listen<{ type: WeatherAnimationType }>(
      "play-weather-sound",
      (event) => {
        const { soundEnabled } = useSettingsStore.getState();
        if (!soundEnabled) return;
        void playWeatherSound(event.payload.type);
      },
    );

    const unlistenStop = overlay.listen("stop-weather-sound", () => {
      stopWeatherSound();
    });

    return () => {
      void unlistenPlay.then((fn) => fn());
      void unlistenStop.then((fn) => fn());
    };
  }, []);

  const handleSaveCity = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await geocodeCity(cityInput);
      const locationLabel = `${result.name}, ${result.country}`;
      setLocation(result.latitude, result.longitude, locationLabel);
      setCity(locationLabel);

      const weather = await fetchWeather(result.latitude, result.longitude);
      const currentAnimation = mapWeatherToAnimation(
        weather.weatherCode,
        weather.windSpeedKmh,
        windThresholdKmh,
      );

      if (currentAnimation) {
        if (useSettingsStore.getState().soundEnabled) {
          void unlockWeatherAudio();
          void playWeatherSound(currentAnimation);
        }
        await triggerOverlayTestAnimation(currentAnimation, animationIntensity);
      }

      setSuccess(
        currentAnimation
          ? `Location set to ${locationLabel}. Playing a preview of current weather (${ANIMATION_LABELS[currentAnimation]}).`
          : `Location set to ${locationLabel}.`,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to geocode city");
    } finally {
      setLoading(false);
    }
  };

  const handleTestAnimation = (type: WeatherAnimationType) => {
    if (soundEnabled) {
      void unlockWeatherAudio();
      void playWeatherSound(type);
    }
    void triggerOverlayTestAnimation(type, animationIntensity);
  };

  return (
    <div className="settings-root">
      <header className="settings-header">
        <h1>Weather Overlay</h1>
        <p>
          Animations play when weather changes. Use test buttons below for an
          instant preview.
        </p>
      </header>

      <section className="settings-section">
        <h2>Location</h2>
        <div className="settings-field">
          <label htmlFor="city">City</label>
          <input
            id="city"
            type="text"
            value={cityInput}
            onChange={(e) => setCityInput(e.target.value)}
            placeholder="e.g. London"
            onKeyDown={(e) => e.key === "Enter" && void handleSaveCity()}
          />
          {latitude != null && longitude != null && (
            <p className="settings-location">
              {city || "Saved location"} ({latitude.toFixed(2)}, {longitude.toFixed(2)})
            </p>
          )}
          {error && <p className="settings-error">{error}</p>}
          {success && <p className="settings-success">{success}</p>}
        </div>
        <button
          className="settings-btn settings-btn-primary"
          onClick={() => void handleSaveCity()}
          disabled={loading}
        >
          {loading ? "Saving..." : "Save Location"}
        </button>
      </section>

      <section className="settings-section">
        <h2>Animation</h2>
        <div className="settings-field">
          <label htmlFor="duration">
            Duration: {(animationDurationMs / 1000).toFixed(0)}s
          </label>
          <input
            id="duration"
            type="range"
            min={3000}
            max={15000}
            step={1000}
            value={animationDurationMs}
            onChange={(e) =>
              updateSettings({ animationDurationMs: Number(e.target.value) })
            }
          />
        </div>
        <div className="settings-field">
          <label htmlFor="intensity">Intensity: {animationIntensity}</label>
          <input
            id="intensity"
            type="range"
            min={1}
            max={100}
            value={animationIntensity}
            onChange={(e) =>
              updateSettings({ animationIntensity: Number(e.target.value) })
            }
          />
        </div>
        <div className="settings-row">
          <label htmlFor="sound">Enable sound</label>
          <input
            id="sound"
            type="checkbox"
            checked={soundEnabled}
            onChange={(e) => {
              updateSettings({ soundEnabled: e.target.checked });
              if (e.target.checked) {
                void unlockWeatherAudio();
              } else {
                stopWeatherSound();
              }
            }}
          />
        </div>
      </section>

      <section className="settings-section">
        <h2>Enabled Animations</h2>
        {ANIMATION_TYPES.map((type) => (
          <div key={type} className="settings-row">
            <label htmlFor={`anim-${type}`}>{ANIMATION_LABELS[type]}</label>
            <input
              id={`anim-${type}`}
              type="checkbox"
              checked={enabledAnimations[type]}
              onChange={() => toggleAnimationType(type)}
            />
          </div>
        ))}
      </section>

      <section className="settings-section">
        <h2>Test Animations</h2>
        <div className="test-grid">
          {ANIMATION_TYPES.map((type) => (
            <button
              key={type}
              className="settings-btn settings-btn-secondary"
              onClick={() => handleTestAnimation(type)}
            >
              {ANIMATION_LABELS[type]}
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
