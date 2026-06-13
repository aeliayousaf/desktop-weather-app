import type { WeatherAnimationType } from "../types/weather";

const WEATHER_SOUND_URLS: Partial<Record<WeatherAnimationType, string>> = {
  sun: "/sounds/sun.mp3",
  rain: "/sounds/rain.mp3",
  snow: "/sounds/snow.mp3",
  thunderstorm: "/sounds/thunderstorm.mp3",
  wind: "/sounds/wind.mp3",
};

let activeAudio: HTMLAudioElement | null = null;
let audioUnlocked = false;

function resolveSoundUrl(path: string): string {
  const base = import.meta.env.BASE_URL;
  return `${base}${path.replace(/^\//, "")}`;
}

function stopActiveAudio() {
  if (!activeAudio) return;

  activeAudio.pause();
  activeAudio.currentTime = 0;
  activeAudio.removeAttribute("src");
  activeAudio.load();
  activeAudio = null;
}

export async function unlockWeatherAudio(): Promise<void> {
  if (audioUnlocked) return;

  try {
    const audio = new Audio();
    audio.src =
      "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=";
    audio.volume = 0.001;
    await audio.play();
    audio.pause();
    audioUnlocked = true;
  } catch {
    // Ignore — a later user gesture may unlock playback.
  }
}

export function stopWeatherSound() {
  stopActiveAudio();
}

function waitForAudioReady(audio: HTMLAudioElement): Promise<void> {
  if (audio.readyState >= HTMLMediaElement.HAVE_ENOUGH_DATA) {
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    const onReady = () => {
      cleanup();
      resolve();
    };
    const onError = () => {
      cleanup();
      reject(new Error("Failed to load weather sound"));
    };
    const cleanup = () => {
      audio.removeEventListener("canplaythrough", onReady);
      audio.removeEventListener("error", onError);
    };

    audio.addEventListener("canplaythrough", onReady, { once: true });
    audio.addEventListener("error", onError, { once: true });
    audio.load();
  });
}

export async function playWeatherSound(type: WeatherAnimationType): Promise<void> {
  stopActiveAudio();

  const path = WEATHER_SOUND_URLS[type];
  if (!path) return;

  const audio = new Audio(resolveSoundUrl(path));
  audio.loop = true;
  audio.volume = 0.55;
  audio.preload = "auto";

  try {
    await waitForAudioReady(audio);
    await audio.play();
    activeAudio = audio;
    audioUnlocked = true;
  } catch (error) {
    console.warn(`Weather sound could not play (${type}):`, error);
    stopActiveAudio();
  }
}
