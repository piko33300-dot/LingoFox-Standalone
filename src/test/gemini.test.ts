import { describe, expect, it } from "vitest";
import { geminiAudioType, geminiChatBody, geminiText, takeSseEvents, toBase64 } from "@/lib/server/gemini";

describe("Gemini helpers", () => {
  it("maps tutor history to Gemini roles (assistant -> model)", () => {
    const body = geminiChatBody("be kind", [
      { role: "user", content: "hola" },
      { role: "assistant", content: "¡Hola!" },
    ], 1024);
    expect(body.contents.map((c) => c.role)).toEqual(["user", "model"]);
    expect(body.systemInstruction.parts[0]!.text).toBe("be kind");
    expect(body.generationConfig.maxOutputTokens).toBe(1024);
  });

  it("returns visible text and skips thinking parts", () => {
    const chunk = { candidates: [{ content: { parts: [{ text: "plan", thought: true }, { text: "Hola" }, { text: "!" }] } }] };
    expect(geminiText(chunk)).toBe("Hola!");
    expect(geminiText({})).toBe("");
  });

  it("splits a streamed buffer into whole events and keeps the unfinished tail", () => {
    const buf = 'data: {"a":1}\n\ndata: {"a":2}\r\n\r\ndata: {"a"';
    const { events, rest } = takeSseEvents(buf);
    expect(events).toEqual([{ a: 1 }, { a: 2 }]);
    expect(rest).toBe('data: {"a"');
  });

  it("strips codec parameters from recording types", () => {
    expect(geminiAudioType("audio/webm;codecs=opus")).toBe("audio/webm");
    expect(geminiAudioType("")).toBe("audio/webm");
    expect(geminiAudioType("video/mp4")).toBe("audio/mp4");
  });

  it("encodes base64 without Node's Buffer", () => {
    expect(toBase64(new TextEncoder().encode("LingoFox"))).toBe("TGluZ29Gb3g=");
  });
});
