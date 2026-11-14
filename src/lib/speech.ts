import type { LangCode } from "./lessons";

export const LOCALE: Record<LangCode, string> = { en: "en-US", ar: "ar-SA", es: "es-ES", fr: "fr-FR", tr: "tr-TR", de: "de-DE" };

export function canSpeak() {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

/** Speak text with the browser's built-in voices. */
export function speak(text: string, lang: LangCode, slow = false) {
  if (!canSpeak()) return;
  try {
    const synth = window.speechSynthesis;
    synth.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = LOCALE[lang];
    u.rate = slow ? 0.6 : 0.95;
    const voice = synth.getVoices().find((v) => v.lang.toLowerCase().startsWith(lang));
    if (voice) u.voice = voice;
    synth.speak(u);
  } catch {
    /* ignore */
  }
}
