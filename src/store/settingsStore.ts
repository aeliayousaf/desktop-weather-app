import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { WeatherAnimationType, TemperatureUnit } from "../types/weather";
import { ANIMATION_TYPES } from "../types/weather";
import { syncSettingsToOverlay } from "../utils/overlayBridge";

export interface Settings {
  city: string;
  latitude: number | null;
  longitude: number | null;
  animationDurationMs: number;
  animationIntensity: number;
  soundEnabled: boolean;
  windThresholdKmh: number;
  temperatureUnit: TemperatureUnit;
  minimalMode: boolean;
  paused: boolean;
  enabledAnimations: Record<WeatherAnimationType, boolean>;
}

interface SettingsState extends Settings {
  setCity: (city: string) => void;
  setLocation: (lat: number, lon: number, city: string) => void;
  updateSettings: (partial: Partial<Settings>) => void;
  setPaused: (paused: boolean) => void;
  toggleAnimationType: (type: WeatherAnimationType) => void;
}

const defaultEnabledAnimations = ANIMATION_TYPES.reduce(
  (acc, type) => {
    acc[type] = true;
    return acc;
  },
  {} as Record<WeatherAnimationType, boolean>,
);

export function getSettingsSnapshot(state: SettingsState): Settings {
  return {
    city: state.city,
    latitude: state.latitude,
    longitude: state.longitude,
    animationDurationMs: state.animationDurationMs,
    animationIntensity: state.animationIntensity,
    soundEnabled: state.soundEnabled,
    windThresholdKmh: state.windThresholdKmh,
    temperatureUnit: state.temperatureUnit,
    minimalMode: state.minimalMode,
    paused: state.paused,
    enabledAnimations: state.enabledAnimations,
  };
}

const notifyOverlay = (state: SettingsState) => {
  void syncSettingsToOverlay(getSettingsSnapshot(state));
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      city: "",
      latitude: null,
      longitude: null,
      animationDurationMs: 8000,
      animationIntensity: 50,
      soundEnabled: false,
      windThresholdKmh: 35,
      temperatureUnit: "celsius" as TemperatureUnit,
      minimalMode: false,
      paused: false,
      enabledAnimations: defaultEnabledAnimations,

      setCity: (city) => {
        set({ city });
        notifyOverlay(get());
      },

      setLocation: (latitude, longitude, city) => {
        set({ latitude, longitude, city });
        notifyOverlay(get());
      },

      updateSettings: (partial) => {
        set(partial);
        notifyOverlay(get());
      },

      setPaused: (paused) => {
        set({ paused });
        notifyOverlay(get());
      },

      toggleAnimationType: (type) => {
        const current = get().enabledAnimations[type];
        set({
          enabledAnimations: {
            ...get().enabledAnimations,
            [type]: !current,
          },
        });
        notifyOverlay(get());
      },
    }),
    {
      name: "weather-overlay-settings",
      merge: (persistedState, currentState) => {
        const persisted = persistedState as Partial<SettingsState> | undefined;
        return {
          ...currentState,
          ...persisted,
          enabledAnimations: {
            ...defaultEnabledAnimations,
            ...persisted?.enabledAnimations,
          },
        };
      },
    },
  ),
);
