import { describe, it, expect } from "vitest";
import { cleanTextForSpeech, LOCALE } from "../lib/speech";
import { parseTutorContent } from "../lib/tutor";

describe("speech helpers", () => {
  it("cleans markdown and emojis for text-to-speech", () => {
    const raw = "Hello **world**! Here is a `code` block. 🦊 Let's learn #arabic!";
    const cleaned = cleanTextForSpeech(raw);
    expect(cleaned).toBe("Hello world! Here is a code block. Let's learn arabic!");
  });

  it("handles code blocks and whitespace cleanly", () => {
    const raw = "```js\nconsole.log(1)\n``` Great job!   **Awesome**";
    const cleaned = cleanTextForSpeech(raw);
    expect(cleaned).toBe("Great job! Awesome");
  });

  it("has locale codes for all supported course languages", () => {
    expect(LOCALE.en).toBe("en-US");
    expect(LOCALE.ar).toBe("ar-SA");
    expect(LOCALE.es).toBe("es-ES");
    expect(LOCALE.fr).toBe("fr-FR");
    expect(LOCALE.tr).toBe("tr-TR");
    expect(LOCALE.de).toBe("de-DE");
  });
});

describe("parseTutorContent", () => {
  it("separates conversational body from pencil correction note", () => {
    const input = "That sounds natural!\n\n✏️ You should say: 'I am going' instead of 'I going'.\n\nWhat are you planning to do tomorrow?";
    const parsed = parseTutorContent(input);
    expect(parsed.body).toBe("That sounds natural!\n\nWhat are you planning to do tomorrow?");
    expect(parsed.correction).toBe("You should say: 'I am going' instead of 'I going'.");
  });

  it("handles messages without corrections", () => {
    const input = "Welcome to your English lesson! How was your day?";
    const parsed = parseTutorContent(input);
    expect(parsed.body).toBe(input);
    expect(parsed.correction).toBeNull();
  });
});

import {
  isSpeechRecognitionSupported,
  isMediaRecorderSupported,
  isAudioCaptureSupported,
  getVoiceCapability,
} from "../lib/speech-recognition";

describe("speech recognition capabilities & fallbacks", () => {
  it("safely queries browser speech recognition support without crashing", () => {
    const supported = isSpeechRecognitionSupported();
    expect(typeof supported).toBe("boolean");
  });

  it("safely queries media recording support", () => {
    const supported = isMediaRecorderSupported();
    expect(typeof supported).toBe("boolean");
  });

  it("safely queries audio capture support", () => {
    const supported = isAudioCaptureSupported();
    expect(typeof supported).toBe("boolean");
  });

  it("returns a structured capability report", () => {
    const cap = getVoiceCapability();
    expect(typeof cap.liveRecognition).toBe("boolean");
    expect(typeof cap.audioRecording).toBe("boolean");
    expect(typeof cap.hasVoiceInput).toBe("boolean");
  });
});
