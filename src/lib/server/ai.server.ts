// Server-only AI access for the tutor and speaking practice.
// Uses Google Gemini directly when GEMINI_API_KEY is set (self-hosted copies);
// otherwise falls back to the hosted AI gateway adapter in ai-gateway.server.ts.
import {
  DEFAULT_GEMINI_MODEL,
  GEMINI_BASE,
  geminiAudioType,
  geminiChatBody,
  geminiText,
  takeSseEvents,
  toBase64,
  transcriptionPrompt,
  type ChatTurn,
} from "./gemini";

export type { ChatTurn };

/** status: HTTP status to answer the app with (429 = busy, 503 = not configured, 502 = failed). */
export class AiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export type ChatRequest = { instructions: string; input: ChatTurn[]; maxOutputTokens: number };

function geminiKey(): string | undefined {
  return process.env["GEMINI_API_KEY"]?.trim() || undefined;
}

function geminiModel(kind: "chat" | "transcribe"): string {
  const specific = kind === "transcribe" ? process.env["GEMINI_TRANSCRIBE_MODEL"] : undefined;
  return (specific || process.env["GEMINI_MODEL"] || DEFAULT_GEMINI_MODEL).trim();
}

async function geminiFetch(path: string, key: string, body: unknown): Promise<Response> {
  const res = await fetch(`${GEMINI_BASE}/${path}`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-goog-api-key": key },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const detail = (await res.text().catch(() => "")).slice(0, 300);
    console.error("gemini request failed", res.status, detail);
    throw new AiError(res.status === 429 ? 429 : 502, `gemini_${res.status}`);
  }
  return res;
}

async function* geminiStream(key: string, req: ChatRequest): AsyncGenerator<string> {
  const res = await geminiFetch(
    `${encodeURIComponent(geminiModel("chat"))}:streamGenerateContent?alt=sse`,
    key,
    geminiChatBody(req.instructions, req.input, req.maxOutputTokens),
  );
  if (!res.body) throw new AiError(502, "gemini_no_body");
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  for (;;) {
    const { done, value } = await reader.read();
    buffer += done ? "\n\n" : decoder.decode(value, { stream: true });
    const { events, rest } = takeSseEvents(buffer);
    buffer = rest;
    for (const event of events) {
      const text = geminiText(event);
      if (text) yield text;
    }
    if (done) return;
  }
}

/** Starts a streamed chat reply. Throws AiError before streaming if the provider refuses. */
export async function streamChat(req: ChatRequest): Promise<AsyncIterable<string>> {
  const key = geminiKey();
  if (key) {
    const gen = geminiStream(key, req);
    // Pull the first chunk now so start-up errors surface as an HTTP status, not a broken stream.
    const first = await gen.next();
    return (async function* () {
      if (!first.done) yield first.value;
      yield* gen;
    })();
  }
  const { gatewayStreamChat } = await import("./ai-gateway.server");
  return gatewayStreamChat(req);
}

/** Transcribes a short recording. */
export async function transcribe(file: File, language: string): Promise<string> {
  const key = geminiKey();
  if (key) {
    const data = toBase64(new Uint8Array(await file.arrayBuffer()));
    const res = await geminiFetch(`${encodeURIComponent(geminiModel("transcribe"))}:generateContent`, key, {
      contents: [
        {
          role: "user",
          parts: [{ inline_data: { mime_type: geminiAudioType(file.type), data } }, { text: transcriptionPrompt(language) }],
        },
      ],
      generationConfig: { maxOutputTokens: 200, temperature: 0 },
    });
    return geminiText(await res.json()).trim();
  }
  const { gatewayTranscribe } = await import("./ai-gateway.server");
  return gatewayTranscribe(file, language);
}
