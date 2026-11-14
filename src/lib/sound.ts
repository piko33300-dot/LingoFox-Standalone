// Sound effect placeholder: short synthesized tones via Web Audio.
export function playSound(kind: "correct" | "wrong" | "complete") {
  if (typeof window === "undefined") return;
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx();
    const notes = kind === "correct" ? [660, 880] : kind === "complete" ? [523, 659, 784, 1046] : [220, 160];
    notes.forEach((f, i) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = kind === "wrong" ? "sawtooth" : "sine";
      o.frequency.value = f;
      const t = ctx.currentTime + i * 0.1;
      g.gain.setValueAtTime(0.15, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
      o.connect(g).connect(ctx.destination);
      o.start(t);
      o.stop(t + 0.22);
    });
  } catch {
    /* ignore */
  }
}
