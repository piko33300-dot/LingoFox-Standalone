import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { EXPLAIN_MAX_INPUT, EXPLAIN_MAX_TURNS, explainInstructions, sanitizeTurns } from "@/lib/explain";

const Body = z.object({
  key: z.string().min(3).max(80),
  answer: z.string().max(EXPLAIN_MAX_INPUT),
  wasCorrect: z.boolean(),
  ui: z.enum(["ar", "en"]),
  messages: z
    .array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().max(4000) }))
    .min(1)
    .max(EXPLAIN_MAX_TURNS * 2),
});

/**
 * "Ask Fox" inside a lesson: explains a question or corrects the learner's own answer.
 * Streams plain text. Signed-in learners only, with a daily quota.
 */
export const Route = createFileRoute("/api/explain")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { authFromRequest, jsonError } = await import("@/lib/server/request-auth.server");
        const auth = await authFromRequest(request);
        if (!auth) return jsonError(401, "unauthorized");
        const parsed = Body.safeParse(await request.json().catch(() => null));
        if (!parsed.success) return jsonError(400, "bad_request");
        const { key, answer, wasCorrect, ui, messages } = parsed.data;

        const instructions = explainInstructions({ key, answer, wasCorrect, ui });
        const input = sanitizeTurns(messages);
        if (!instructions || !input) return jsonError(400, "bad_request");

        const quota = await auth.supabase.rpc("consume_ai_quota", { _kind: "explain" });
        if (quota.error) return jsonError(500, "quota_failed");
        if (quota.data !== true) return jsonError(429, "daily_limit");

        const { streamChat, AiError } = await import("@/lib/server/ai.server");
        let stream: AsyncIterable<string>;
        try {
          stream = await streamChat({ instructions, input, maxOutputTokens: 700 });
        } catch (err) {
          const status = err instanceof AiError ? err.status : 502;
          if (!(err instanceof AiError)) console.error("explain start failed", err);
          return jsonError(status === 429 ? 429 : status === 503 ? 503 : 502, status === 429 ? "busy" : "ai_failed");
        }

        const encoder = new TextEncoder();
        const body = new ReadableStream<Uint8Array>({
          async start(controller) {
            try {
              for await (const delta of stream) controller.enqueue(encoder.encode(delta));
            } catch (err) {
              console.error("explain stream failed", err instanceof Error ? err.message : err);
              controller.enqueue(encoder.encode("\n\n⚠️"));
            } finally {
              controller.close();
            }
          },
        });
        return new Response(body, { headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" } });
      },
    },
  },
});
