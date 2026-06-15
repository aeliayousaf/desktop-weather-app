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
  emitWeatherUpdate,
} from "../utils/overlayBridge";
import { unlockWeatherAudio, playWeatherSound, stopWeatherSound } from "../utils/weatherSounds";
import { applyMinimalMode, showSettingsOnStartup } from "../utils/minimalMode";
import { ANIMATION_TYPES, type WeatherAnimationType } from "../types/weather";
import { TemperatureUnitToggle } from "../components/TemperatureUnitToggle";
import { LiquidGlassCard, LiquidGlassProvider } from "./LiquidGlassCard";
import { useCurrentWeather } from "./useCurrentWeather";
import { WeatherIndicator } from "./WeatherIndicator";
import "../styles/settings.css";
import "./liquidGlass.css";

const ANIMATION_LABELS: Record<WeatherAnimationType, string> = {
  sun: "Sun",
  partlyCloudy: "Partly Cloud",
  rain: "Rain",
  snow: "Snow",
  cloud: "Cloud",
  thunderstorm: "Thunderstorm",
  wind: "Wind",
};

const ANIMATION_ICONS: Record<WeatherAnimationType, string> = {
  sun: "☀️",
  partlyCloudy: "⛅",
  rain: "🌧️",
  snow: "❄️",
  cloud: "☁️",
  thunderstorm: "⛈️",
  wind: "💨",
};

function SettingsToggle({
  id,
  checked,
  onChange,
  label,
}: {
  id: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
}) {
  return (
    <div className="settings-row">
      <label className="settings-row-label" htmlFor={id}>
        {label}
      </label>
      <label className="settings-toggle">
        <input
          id={id}
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
        />
        <span className="settings-toggle-track" aria-hidden="true" />
      </label>
    </div>
  );
}

export function SettingsApp() {
  const {
    city,
    latitude,
    longitude,
    animationDurationMs,
    animationIntensity,
    soundEnabled,
    windThresholdKmh,
    temperatureUnit,
    minimalMode,
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
  const { weather, loading: weatherLoading, error: weatherError, setWeather } =
    useCurrentWeather(latitude, longitude);

  useEffect(() => {
    void (async () => {
      await useSettingsStore.persist.rehydrate();
      const state = useSettingsStore.getState();
      await syncSettingsToOverlay(getSettingsSnapshot(state));
      await applyMinimalMode(state.minimalMode);
      if (!state.minimalMode) {
        await showSettingsOnStartup();
      }
    })();
  }, []);

  useEffect(() => {
    if (!success) return;

    const timer = window.setTimeout(() => {
      setSuccess(null);
    }, 4000);

    return () => window.clearTimeout(timer);
  }, [success]);

  useEffect(() => {
    const unlockOnInteraction = () => {
      void unlockWeatherAudio();
    };

    document.addEventListener("pointerdown", unlockOnInteraction, { once: true });
    return () => document.removeEventListener("pointerdown", unlockOnInteraction);
  }, []);

  useEffect(() => {
    const overlay = getCurrentWebviewWindow();

    const unlistenPlay = overlay.listen<{ type: WeatherAnimationType; isDay?: boolean }>(
      "play-weather-sound",
      (event) => {
        const { soundEnabled } = useSettingsStore.getState();
        if (!soundEnabled) return;
        void playWeatherSound(event.payload.type, event.payload.isDay);
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
      const snapshot = {
        ...weather,
        fetchedAt: new Date().toISOString(),
      };
      useSettingsStore.getState().setIsDay(weather.isDay);
      setWeather(snapshot);
      void emitWeatherUpdate(snapshot);
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
    <LiquidGlassProvider>
      <div className="settings-root">
        <header className="settings-header">
          <div className="settings-header-brand">
            <img
              className="settings-app-icon"
              src="/app-logo.png"
              alt=""
              width={88}
              height={88}
            />
            <div>
              <h1>Weather Overlay</h1>
              <p>
                Animations play when weather changes. Use test buttons below for an
                instant preview.
              </p>
            </div>
          </div>
        </header>

        <LiquidGlassCard>
          <h2 className="settings-section-title">Display</h2>
          <SettingsToggle
            id="minimal-mode"
            label="Minimal desktop widget"
            checked={minimalMode}
            onChange={(checked) => {
              updateSettings({ minimalMode: checked });
              void applyMinimalMode(checked, { hideSettings: checked });
            }}
          />
          <p className="settings-hint">
            Shows only the current weather card on your desktop. Open full settings from
            the tray or the widget gear icon.
          </p>
        </LiquidGlassCard>

        {(city || weather) && (
          <LiquidGlassCard>
            <h2 className="settings-section-title">Current Weather</h2>
            <WeatherIndicator
              city={city}
              weather={weather}
              loading={weatherLoading}
              error={weatherError}
              temperatureUnit={temperatureUnit}
            />
            <TemperatureUnitToggle
              unit={temperatureUnit}
              onChange={(unit) => updateSettings({ temperatureUnit: unit })}
            />
          </LiquidGlassCard>
        )}

        <LiquidGlassCard>
          <h2 className="settings-section-title">Location</h2>
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
        </LiquidGlassCard>

        <LiquidGlassCard>
          <h2 className="settings-section-title">Animation</h2>
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
          <SettingsToggle
            id="sound"
            label="Enable sound"
            checked={soundEnabled}
            onChange={(checked) => {
              updateSettings({ soundEnabled: checked });
              if (checked) {
                void unlockWeatherAudio();
              } else {
                stopWeatherSound();
              }
            }}
          />
        </LiquidGlassCard>

        <LiquidGlassCard>
          <h2 className="settings-section-title">Enabled Animations</h2>
          {ANIMATION_TYPES.map((type) => (
            <SettingsToggle
              key={type}
              id={`anim-${type}`}
              label={ANIMATION_LABELS[type]}
              checked={enabledAnimations[type]}
              onChange={() => toggleAnimationType(type)}
            />
          ))}
        </LiquidGlassCard>

        <LiquidGlassCard>
          <h2 className="settings-section-title">Test Animations</h2>
          <div className="test-grid">
            {ANIMATION_TYPES.map((type) => (
              <button
                key={type}
                className="settings-btn settings-btn-secondary"
                onClick={() => handleTestAnimation(type)}
              >
                <span aria-hidden="true" className="test-celestial-icons">
                  {type === "sun" ? (
                    <>
                      <span>☀️</span>
                      <svg
                        className="test-celestial-moon"
                        viewBox="0 0 24 24"
                        width="1.1em"
                        height="1.1em"
                        fill="currentColor"
                      >
                        <path d="M12 3a9 9 0 1 0 9 9 7 7 0 0 1-9-9z" />
                      </svg>
                    </>
                  ) : (
                    ANIMATION_ICONS[type]
                  )}
                </span>
                {type === "sun" ? "Sun / Moon" : ANIMATION_LABELS[type]}
              </button>
            ))}
          </div>
        </LiquidGlassCard>
      </div>
    </LiquidGlassProvider>
  );
}
