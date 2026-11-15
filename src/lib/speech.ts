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

/** In-memory voice cache to avoid synchronous IPC voice queries on every utterance. */
let cachedVoices: SpeechSynthesisVoice[] = [];
let voiceCacheByLang = new Map<string, SpeechSynthesisVoice>();
let voicesInitialized = false;
let activeUtteranceRef: SpeechSynthesisUtterance | null = null;

function initVoices() {
  if (!canSpeak() || voicesInitialized) return;
  try {
    const synth = window.speechSynthesis;
    const load = () => {
      cachedVoices = synth.getVoices();
      voiceCacheByLang.clear();
      for (const v of cachedVoices) {
        const prefix = v.lang.toLowerCase().split("-")[0];
        if (!voiceCacheByLang.has(prefix) || v.default) {
          voiceCacheByLang.set(prefix, v);
        }
        const full = v.lang.toLowerCase();
        if (!voiceCacheByLang.has(full)) {
          voiceCacheByLang.set(full, v);
        }
      }
      if (cachedVoices.length > 0) {
        voicesInitialized = true;
      }
    };

    load();
    if (typeof synth.onvoiceschanged !== "undefined") {
      synth.onvoiceschanged = load;
    }
  } catch {
    /* ignore */
  }
}

// Auto-init on client environment
if (typeof window !== "undefined") {
  initVoices();
}

/** Prewarm speech synthesis engine and voices to eliminate latency on first tap. */
export function prewarmSpeech() {
  if (!canSpeak()) return;
  initVoices();
}

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
    activeUtteranceRef = null;
    window.speechSynthesis.cancel();
  } catch {
    /* ignore */
  }
}

/** Check if speech synthesis is currently active. */
export function isSpeaking(): boolean {
  if (!canSpeak()) return false;
  try {
    return window.speechSynthesis.speaking;
  } catch {
    return false;
  }
}

/** Find best matching voice using fast cached lookup. */
function getBestVoice(targetLang: string): SpeechSynthesisVoice | undefined {
  initVoices();
  const lower = targetLang.toLowerCase();
  const prefix = lower.split("-")[0];
  return voiceCacheByLang.get(lower) || voiceCacheByLang.get(prefix) || cachedVoices.find((v) => v.lang.toLowerCase().startsWith(prefix));
}

/** Speak text with low-latency cached browser voices. */
export function speak(
  text: string,
  lang: LangCode | string,
  options?: boolean | SpeakOptions
) {
  if (!canSpeak() || !text.trim()) return;
  try {
    const synth = window.speechSynthesis;
    // Cancel prior speech without delay
    synth.cancel();

    const clean = cleanTextForSpeech(text);
    if (!clean) return;

    const slow = typeof options === "boolean" ? options : options?.slow ?? false;
    const onStart = typeof options === "object" ? options?.onStart : undefined;
    const onEnd = typeof options === "object" ? options?.onEnd : undefined;

    // Resolve locale properly whether LangCode or full locale was passed
    const resolvedLocale = (lang in LOCALE ? LOCALE[lang as LangCode] : lang) || "en-US";

    const u = new SpeechSynthesisUtterance(clean);
    u.lang = resolvedLocale;
    u.rate = slow ? 0.68 : 0.95;

    const voice = getBestVoice(resolvedLocale);
    if (voice) {
      u.voice = voice;
    }

    // Keep reference alive to prevent browser GC from cutting off speech midway
    activeUtteranceRef = u;

    u.onstart = () => {
      onStart?.();
    };

    const handleFinish = () => {
      if (activeUtteranceRef === u) {
        activeUtteranceRef = null;
      }
      onEnd?.();
    };

    u.onend = handleFinish;
    u.onerror = handleFinish;

    synth.speak(u);
  } catch {
    /* ignore */
  }
}
