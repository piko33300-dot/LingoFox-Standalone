import type { LangCode } from "./lessons";

export const LOCALE: Record<LangCode, string> = {
  en: "en-US",
  ar: "ar-SA",
  es: "es-ES",
  fr: "fr-FR",
  tr: "tr-TR",
  de: "de-DE",
  it: "it-IT",
};

export function canSpeak(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

export type SpeakOptions = {
  slow?: boolean;
  onStart?: () => void;
  onEnd?: () => void;
};

/** Clean text for natural speech synthesis (strip markdown, asterisks, emojis, URLs). */
export function cleanTextForSpeech(text: string): string {
  return text
    .replace(/```[\s\S]*?```/g, "")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/#+\s*/g, "")
    .replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** Stop ongoing speech playback. */
export function stopSpeaking() {
  if (!canSpeak()) return;
  try {
    window.speechSynthesis.cancel();
  } catch {
    /* ignore */
  }
}

/** Speak text with the browser's built-in voices. */
export function speak(
  text: string,
  lang: LangCode,
  options?: boolean | SpeakOptions
) {
  if (!canSpeak() || !text.trim()) return;
  try {
    const synth = window.speechSynthesis;
    synth.cancel();
    const clean = cleanTextForSpeech(text);
    if (!clean) return;

    const slow = typeof options === "boolean" ? options : options?.slow ?? false;
    const onStart = typeof options === "object" ? options?.onStart : undefined;
    const onEnd = typeof options === "object" ? options?.onEnd : undefined;

    const u = new SpeechSynthesisUtterance(clean);
    u.lang = LOCALE[lang] || "en-US";
    u.rate = slow ? 0.65 : 0.95;
    const voice = synth.getVoices().find((v) => v.lang.toLowerCase().startsWith(lang));
    if (voice) u.voice = voice;

    if (onStart) u.onstart = onStart;
    if (onEnd) {
      u.onend = onEnd;
      u.onerror = onEnd;
    }

    synth.speak(u);
  } catch {
    /* ignore */
  }
}
