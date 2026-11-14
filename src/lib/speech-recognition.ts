import { LOCALE } from "./speech";
import type { LangCode } from "./lessons";

/** Check if Web Speech API recognition is available in the current browser. */
export function isSpeechRecognitionSupported(): boolean {
  if (typeof window === "undefined") return false;
  return Boolean(
    (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
  );
}

/** Check if MediaRecorder is available for fallback audio recording. */
export function isMediaRecorderSupported(): boolean {
  return typeof window !== "undefined" && typeof (window as any).MediaRecorder !== "undefined";
}

/** Check if navigator.mediaDevices.getUserMedia is available for recording audio. */
export function isAudioCaptureSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    Boolean(navigator?.mediaDevices && typeof navigator.mediaDevices.getUserMedia === "function")
  );
}

export type VoiceCapability = {
  liveRecognition: boolean;
  audioRecording: boolean;
  hasVoiceInput: boolean;
};

/** Get comprehensive voice capabilities of the current user agent. */
export function getVoiceCapability(): VoiceCapability {
  const live = isSpeechRecognitionSupported();
  const rec = isAudioCaptureSupported() && isMediaRecorderSupported();
  return {
    liveRecognition: live,
    audioRecording: rec,
    hasVoiceInput: live || rec,
  };
}

export type VoiceListenerHandlers = {
  onResult: (transcript: string, isFinal: boolean) => void;
  onError: (errorKind: "not-allowed" | "no-speech" | "audio-capture" | "network" | "unknown") => void;
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
      const raw = String(event.error || "").toLowerCase();
      let kind: "not-allowed" | "no-speech" | "audio-capture" | "network" | "unknown" = "unknown";
      if (raw.includes("not-allowed") || raw.includes("permission")) {
        kind = "not-allowed";
      } else if (raw.includes("no-speech")) {
        kind = "no-speech";
      } else if (raw.includes("audio-capture")) {
        kind = "audio-capture";
      } else if (raw.includes("network")) {
        kind = "network";
      }
      this.handlers.onError(kind);
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
