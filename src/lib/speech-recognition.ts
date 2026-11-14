import { LOCALE } from "./speech";
import type { LangCode } from "./lessons";

export function isSpeechRecognitionSupported(): boolean {
  if (typeof window === "undefined") return false;
  return Boolean(
    (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
  );
}

export type VoiceListenerHandlers = {
  onResult: (transcript: string, isFinal: boolean) => void;
  onError: (error: string) => void;
  onEnd: () => void;
  onStart: () => void;
};

export class SpeechRecognizer {
  private recognition: any = null;
  private active = false;

  constructor(lang: LangCode, private handlers: VoiceListenerHandlers) {
    if (!isSpeechRecognitionSupported()) return;
    const Recog = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    this.recognition = new Recog();
    this.recognition.continuous = false;
    this.recognition.interimResults = true;
    this.recognition.lang = LOCALE[lang] || "en-US";

    this.recognition.onstart = () => {
      this.active = true;
      this.handlers.onStart();
    };

    this.recognition.onresult = (event: any) => {
      let interim = "";
      let final = "";
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const item = event.results[i];
        if (item.isFinal) {
          final += item[0].transcript;
        } else {
          interim += item[0].transcript;
        }
      }
      const text = (final || interim).trim();
      if (text) {
        this.handlers.onResult(text, Boolean(final));
      }
    };

    this.recognition.onerror = (event: any) => {
      this.active = false;
      this.handlers.onError(event.error || "speech_recognition_error");
    };

    this.recognition.onend = () => {
      this.active = false;
      this.handlers.onEnd();
    };
  }

  start() {
    if (!this.recognition || this.active) return;
    try {
      this.recognition.start();
    } catch {
      // already started or browser blocked
    }
  }

  stop() {
    if (!this.recognition || !this.active) return;
    try {
      this.recognition.stop();
    } catch {
      // ignore
    }
  }

  abort() {
    if (!this.recognition) return;
    try {
      this.recognition.abort();
    } catch {
      // ignore
    }
    this.active = false;
  }
}
