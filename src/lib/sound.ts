// High-fidelity synthesized audio engine via Web Audio API with smooth envelopes and haptics.
export type SoundKind = "correct" | "wrong" | "complete" | "streak" | "tap";

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  try {
    if (!audioCtx) {
      const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (Ctx) audioCtx = new Ctx();
    }
    if (audioCtx && audioCtx.state === "suspended") {
      void audioCtx.resume();
    }
    return audioCtx;
  } catch {
    return null;
  }
}

export function playSound(kind: SoundKind) {
  if (typeof window === "undefined") return;

  // Gentle haptic feedback for mobile touch devices
  if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
    try {
      if (kind === "correct") navigator.vibrate(25);
      else if (kind === "wrong") navigator.vibrate([35, 45, 35]);
      else if (kind === "complete") navigator.vibrate([30, 40, 50, 40, 90]);
      else if (kind === "streak") navigator.vibrate([40, 50, 80]);
      else if (kind === "tap") navigator.vibrate(10);
    } catch {
      /* ignore if disabled */
    }
  }

  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;

    if (kind === "tap") {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(400, now + 0.03);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.035);
      return;
    }

    if (kind === "correct") {
      // Harmonic chime: E5 (659.25Hz) + B5 (987.77Hz) with sparkling high overtone
      const notes = [
        { freq: 659.25, time: 0, dur: 0.22, vol: 0.16 },
        { freq: 987.77, time: 0.08, dur: 0.35, vol: 0.18 },
        { freq: 1318.5, time: 0.14, dur: 0.30, vol: 0.09 },
      ];
      for (const n of notes) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(n.freq, now + n.time);
        gain.gain.setValueAtTime(0.001, now + n.time);
        gain.gain.linearRampToValueAtTime(n.vol, now + n.time + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + n.time + n.dur);
        osc.connect(gain).connect(ctx.destination);
        osc.start(now + n.time);
        osc.stop(now + n.time + n.dur + 0.02);
      }
      return;
    }

    if (kind === "wrong") {
      // Warm, muted double thud (non-jarring soft tone with lowpass filter)
      const tones = [
        { freq: 175, time: 0, dur: 0.15, vol: 0.18 },
        { freq: 130, time: 0.11, dur: 0.22, vol: 0.20 },
      ];
      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(380, now);
      filter.connect(ctx.destination);

      for (const t of tones) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(t.freq, now + t.time);
        osc.frequency.exponentialRampToValueAtTime(t.freq * 0.85, now + t.time + t.dur);
        gain.gain.setValueAtTime(0.001, now + t.time);
        gain.gain.linearRampToValueAtTime(t.vol, now + t.time + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + t.time + t.dur);
        osc.connect(gain).connect(filter);
        osc.start(now + t.time);
        osc.stop(now + t.time + t.dur + 0.02);
      }
      return;
    }

    if (kind === "complete") {
      // Grand celebratory major chord arpeggio: C5 -> E5 -> G5 -> C6 with warm reverb tail
      const arpeggio = [
        { freq: 523.25, time: 0.0, dur: 0.45, vol: 0.15 },
        { freq: 659.25, time: 0.1, dur: 0.50, vol: 0.15 },
        { freq: 783.99, time: 0.2, dur: 0.55, vol: 0.17 },
        { freq: 1046.5, time: 0.32, dur: 0.70, vol: 0.22 },
        { freq: 1318.5, time: 0.38, dur: 0.65, vol: 0.10 },
      ];
      for (const a of arpeggio) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(a.freq, now + a.time);
        gain.gain.setValueAtTime(0.001, now + a.time);
        gain.gain.linearRampToValueAtTime(a.vol, now + a.time + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + a.time + a.dur);
        osc.connect(gain).connect(ctx.destination);
        osc.start(now + a.time);
        osc.stop(now + a.time + a.dur + 0.03);
      }
      return;
    }

    if (kind === "streak") {
      // Rising fanfare for streak milestone
      const fanfare = [
        { freq: 440.0, time: 0.0, dur: 0.25, vol: 0.14 },
        { freq: 554.37, time: 0.09, dur: 0.28, vol: 0.16 },
        { freq: 659.25, time: 0.18, dur: 0.32, vol: 0.18 },
        { freq: 880.0, time: 0.28, dur: 0.55, vol: 0.22 },
      ];
      for (const f of fanfare) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(f.freq, now + f.time);
        gain.gain.setValueAtTime(0.001, now + f.time);
        gain.gain.linearRampToValueAtTime(f.vol, now + f.time + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + f.time + f.dur);
        osc.connect(gain).connect(ctx.destination);
        osc.start(now + f.time);
        osc.stop(now + f.time + f.dur + 0.03);
      }
    }
  } catch {
    /* ignore audio playback failure */
  }
}
