// Pure helpers for Google's Gemini API (no secrets here; safe to unit-test).

export type ChatTurn = { role: "user" | "assistant"; content: string };

export const GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta/models";
export const DEFAULT_GEMINI_MODEL = "gemini-flash-lite-latest";

/** Request body for generateContent / streamGenerateContent. */
export function geminiChatBody(instructions: string, input: ChatTurn[], maxOutputTokens: number) {
  return {
    systemInstruction: { parts: [{ text: instructions }] },
    contents: input.map((m) => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: m.content }] })),
    generationConfig: { maxOutputTokens },
  };
}

type GeminiPart = { text?: unknown; thought?: unknown };
type GeminiChunk = { candidates?: { content?: { parts?: GeminiPart[] } }[] };

/** Visible answer text in one Gemini response (thinking parts are skipped). */
export function geminiText(chunk: unknown): string {
  const parts = (chunk as GeminiChunk | null)?.candidates?.[0]?.content?.parts ?? [];
  return parts
    .filter((p) => p.thought !== true && typeof p.text === "string")
    .map((p) => p.text as string)
    .join("");
}

/**
 * Splits a server-sent-events buffer into complete `data:` payloads.
 * Returns the parsed events and the unfinished remainder to keep buffering.
 */
export function takeSseEvents(buffer: string): { events: unknown[]; rest: string } {
  const normalized = buffer.replace(/\r\n/g, "\n");
  const blocks = normalized.split("\n\n");
  const rest = blocks.pop() ?? "";
  const events: unknown[] = [];
  for (const block of blocks) {
    const data = block
      .split("\n")
      .filter((l) => l.startsWith("data:"))
      .map((l) => l.slice(5).trimStart())
      .join("\n");
    if (!data || data === "[DONE]") continue;
    try {
      events.push(JSON.parse(data));
    } catch {
      // ignore malformed keep-alive lines
    }
  }
  return { events, rest };
}

/** Audio MIME type Gemini understands (drops codec parameters such as ";codecs=opus"). */
export function geminiAudioType(type: string): string {
  const base = (type || "audio/webm").split(";")[0]!.trim().toLowerCase();
  return base.startsWith("audio/") ? base : base.replace(/^video\//, "audio/");
}

export function transcriptionPrompt(language: string): string {
  return [
    `Transcribe exactly what is spoken in this recording. Expected language code: ${language}.`,
    "Reply with only the words that were said, in that language's normal spelling.",
    "No quotes, no translation, no commentary. If nothing intelligible is said, reply with nothing.",
  ].join(" ");
}

/** Base64 without Node's Buffer, so it also runs on edge/worker hosts. */
export function toBase64(bytes: Uint8Array): string {
  let binary = "";
  const step = 0x8000;
  for (let i = 0; i < bytes.length; i += step) {
    binary += String.fromCharCode(...bytes.subarray(i, i + step));
  }
  return btoa(binary);
}
