// Hosted build: AI calls go through the Lovable AI Gateway (server-side LOVABLE_API_KEY).
// Used when GEMINI_API_KEY is not set (see ai.server.ts), so self-hosted copies keep Gemini.
import { AiError, type ChatRequest } from "./ai.server";
import { takeSseEvents } from "./gemini";

const GATEWAY = "https://ai.gateway.lovable.dev/v1";
// Same light, fast model family the app used on Gemini directly.
const CHAT_MODEL = "google/gemini-3.1-flash-lite";
const TRANSCRIBE_MODEL = "google/gemini-3.5-transcribe";

function apiKey(): string {
  const key = process.env["LOVABLE_API_KEY"]?.trim();
  if (!key) {
    console.error("AI is not configured: LOVABLE_API_KEY is missing.");
    throw new AiError(503, "ai_not_configured");
  }
  return key;
}

function statusFor(res: Response): number {
  if (res.status === 429) return 429;
  if (res.status === 402 || res.status === 403) return 503;
  return 502;
}

async function gatewayFetch(path: string, init: RequestInit): Promise<Response> {
  const res = await fetch(`${GATEWAY}${path}`, init);
  if (!res.ok) {
    const detail = (await res.text().catch(() => "")).slice(0, 300);
    console.error("ai gateway request failed", res.status, detail);
    throw new AiError(statusFor(res), `gateway_${res.status}`);
  }
  return res;
}

type ChatDelta = { choices?: { delta?: { content?: unknown } }[] };

async function* readChatStream(res: Response): AsyncGenerator<string> {
  if (!res.body) throw new AiError(502, "gateway_no_body");
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  for (;;) {
    const { done, value } = await reader.read();
    buffer += done ? "\n\n" : decoder.decode(value, { stream: true });
    const { events, rest } = takeSseEvents(buffer);
    buffer = rest;
    for (const event of events) {
      const text = (event as ChatDelta)?.choices?.[0]?.delta?.content;
      if (typeof text === "string" && text) yield text;
    }
    if (done) return;
  }
}

export async function gatewayStreamChat(req: ChatRequest): Promise<AsyncIterable<string>> {
  const res = await gatewayFetch("/chat/completions", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${apiKey()}`,
      "X-Lovable-AIG-SDK": "fetch",
    },
    body: JSON.stringify({
      model: CHAT_MODEL,
      stream: true,
      max_tokens: req.maxOutputTokens,
      messages: [{ role: "system", content: req.instructions }, ...req.input],
    }),
  });
  return readChatStream(res);
}

type TranscriptEvent = { type?: string; delta?: unknown; text?: unknown };

export async function gatewayTranscribe(file: File, language: string): Promise<string> {
  const type = (file.type || "audio/webm").split(";")[0]!.replace(/^video\//, "audio/");
  const form = new FormData();
  form.append("model", TRANSCRIBE_MODEL);
  form.append("file", new Blob([await file.arrayBuffer()], { type }), file.name || "speech.webm");
  if (language) form.append("language", language);
  form.append("stream", "true");
  const res = await gatewayFetch("/audio/transcriptions", {
    method: "POST",
    headers: { authorization: `Bearer ${apiKey()}`, "X-Lovable-AIG-SDK": "fetch" },
    body: form,
  });
  if (!res.body) throw new AiError(502, "gateway_no_body");
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let text = "";
  let final: string | null = null;
  for (;;) {
    const { done, value } = await reader.read();
    buffer += done ? "\n\n" : decoder.decode(value, { stream: true });
    const { events, rest } = takeSseEvents(buffer);
    buffer = rest;
    for (const e of events as TranscriptEvent[]) {
      if (e?.type === "transcript.text.delta" && typeof e.delta === "string") text += e.delta;
      if (e?.type === "transcript.text.done" && typeof e.text === "string") final = e.text;
    }
    if (done) break;
  }
  return (final ?? text).trim();
}
