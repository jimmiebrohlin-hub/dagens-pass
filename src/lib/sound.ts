export interface SoundSettings {
  enabled: boolean;
  vibration: boolean;
}

export const DEFAULT_SOUND: SoundSettings = {
  enabled: true,
  vibration: true,
};

type WebAudioWindow = Window & typeof globalThis & {
  webkitAudioContext?: typeof AudioContext;
};

let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const audioWindow = window as WebAudioWindow;
  const AudioContextCtor = audioWindow.AudioContext ?? audioWindow.webkitAudioContext;
  if (!AudioContextCtor) return null;
  audioContext ??= new AudioContextCtor();
  return audioContext;
}

async function resumeAudioContext(ctx: AudioContext) {
  if (ctx.state === "suspended") {
    await ctx.resume();
  }
}

export async function unlockTimerSound() {
  const ctx = getAudioContext();
  if (!ctx) return false;
  await resumeAudioContext(ctx);

  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();
  gain.gain.value = 0;
  oscillator.connect(gain);
  gain.connect(ctx.destination);
  oscillator.start();
  oscillator.stop(ctx.currentTime + 0.01);
  return true;
}

function playBeep(ctx: AudioContext, start: number, frequency: number, duration: number) {
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();

  oscillator.type = "sine";
  oscillator.frequency.value = frequency;
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(0.12, start + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);

  oscillator.connect(gain);
  gain.connect(ctx.destination);
  oscillator.start(start);
  oscillator.stop(start + duration + 0.02);
}

export async function playTimerDoneCue(settings: SoundSettings = DEFAULT_SOUND) {
  if (settings.vibration && typeof navigator !== "undefined" && "vibrate" in navigator) {
    navigator.vibrate([90, 50, 90]);
  }

  if (!settings.enabled) return;

  const ctx = getAudioContext();
  if (!ctx) return;
  await resumeAudioContext(ctx);

  const now = ctx.currentTime + 0.02;
  playBeep(ctx, now, 660, 0.12);
  playBeep(ctx, now + 0.18, 880, 0.16);
}
