import { createFileRoute } from "@tanstack/react-router";
import { COURSE_IDS } from "@/lib/lessons";
import { scoreSpeech } from "@/lib/speaking";

const MAX_AUDIO_BYTES = 4 * 1024 * 1024; // ~1 minute of compressed speech

/**
 * Speaking practice: transcribe the learner's recording and score it against
 * the sentence they were asked to say. Signed-in learners only.
 */
export const Route = createFileRoute("/api/speak")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { authFromRequest, jsonError } = await import("@/lib/server/request-auth.server");
        const auth = await authFromRequest(request);
        if (!auth) return jsonError(401, "unauthorized");

        const form = await request.formData().catch(() => null);
        const audio = form?.get("audio");
        const expected = String(form?.get("expected") ?? "").trim();
        const lang = String(form?.get("lang") ?? "");
        if (!(audio instanceof Blob) || audio.size === 0 || audio.size > MAX_AUDIO_BYTES) return jsonError(400, "bad_audio");
        if (!expected || expected.length > 200 || !COURSE_IDS.includes(lang as never)) return jsonError(400, "bad_request");

        const quota = await auth.supabase.rpc("consume_ai_quota", { _kind: "speak" });
        if (quota.error) return jsonError(500, "quota_failed");
        if (quota.data !== true) return jsonError(429, "daily_limit");

        const { transcribe, AiError } = await import("@/lib/server/ai.server");
        try {
          const type = audio.type || "audio/webm";
          const ext = type.includes("mp4") ? "mp4" : type.includes("ogg") ? "ogg" : type.includes("wav") ? "wav" : "webm";
          const file = new File([audio], `speech.${ext}`, { type });
          const heard = await transcribe(file, lang);
          return Response.json({ heard, ...scoreSpeech(expected, heard) });
        } catch (err) {
          if (!(err instanceof AiError)) console.error("transcription failed", err);
          return jsonError(err instanceof AiError && err.status === 429 ? 429 : 502, "ai_failed");
        }
      },
    },
  },
});
