import type { WeatherAnimationType } from "../types/weather";

let audioContext: AudioContext | null = null;

function getContext(): AudioContext {
  if (!audioContext) {
    audioContext = new AudioContext();
  }
  return audioContext;
}

function playTone(
  frequency: number,
  duration: number,
  type: OscillatorType = "sine",
  volume = 0.05,
) {
  const ctx = getContext();
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();

  oscillator.type = type;
  oscillator.frequency.value = frequency;
  gain.gain.value = volume;

  oscillator.connect(gain);
  gain.connect(ctx.destination);

  oscillator.start();
  oscillator.stop(ctx.currentTime + duration);
}

export function playWeatherSound(type: WeatherAnimationType) {
  switch (type) {
    case "sun":
      playTone(440, 0.3, "sine", 0.03);
      break;
    case "rain":
      playTone(200, 0.5, "triangle", 0.02);
      playTone(180, 0.5, "triangle", 0.02);
      break;
    case "snow":
      playTone(600, 0.4, "sine", 0.02);
      break;
    case "cloud":
      playTone(300, 0.3, "sine", 0.02);
      break;
    case "thunderstorm":
      playTone(200, 0.5, "triangle", 0.02);
      setTimeout(() => playTone(80, 0.15, "sawtooth", 0.06), 200);
      setTimeout(() => playTone(60, 0.2, "sawtooth", 0.04), 320);
      break;
    case "wind":
      playTone(150, 0.6, "triangle", 0.02);
      break;
  }
}
