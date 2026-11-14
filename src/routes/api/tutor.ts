import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { TUTOR_HISTORY, TUTOR_MAX_INPUT, tutorInstructions } from "@/lib/tutor";
import { COURSE_IDS } from "@/lib/lessons";

const Body = z.object({
  message: z.string().trim().min(1).max(TUTOR_MAX_INPUT),
  course: z.enum(COURSE_IDS as [string, ...string[]]).nullable(),
  ui: z.enum(["ar", "en"]),
  level: z.number().int().min(0).max(10000),
});

/**
 * Fox the AI tutor. Streams the reply as plain text and saves both sides of the
 * conversation to the learner's account. Signed-in learners only.
 */
export const Route = createFileRoute("/api/tutor")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { authFromRequest, jsonError } = await import("@/lib/server/request-auth.server");
        const auth = await authFromRequest(request);
        if (!auth) return jsonError(401, "unauthorized");
        const parsed = Body.safeParse(await request.json().catch(() => null));
        if (!parsed.success) return jsonError(400, "bad_request");
        const { message, course, ui, level } = parsed.data;
        const { supabase, userId } = auth;

        const quota = await supabase.rpc("consume_ai_quota", { _kind: "tutor" });
        if (quota.error) return jsonError(500, "quota_failed");
        if (quota.data !== true) return jsonError(429, "daily_limit");

        const history = await supabase
          .from("tutor_messages")
          .select("role, content")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(TUTOR_HISTORY);
        if (history.error) return jsonError(500, "history_failed");

        const saved = await supabase.from("tutor_messages").insert({ user_id: userId, role: "user", content: message, course });
        if (saved.error) return jsonError(500, "save_failed");

        const { streamChat, AiError } = await import("@/lib/server/ai.server");
        const input = [
          ...[...history.data].reverse().map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
          { role: "user" as const, content: message },
        ];

        let stream: AsyncIterable<string>;
        try {
          stream = await streamChat({ instructions: tutorInstructions(course as never, ui, level), input, maxOutputTokens: 1024 });
        } catch (err) {
          const status = err instanceof AiError ? err.status : 502;
          if (!(err instanceof AiError)) console.error("tutor start failed", err);
          return jsonError(status === 429 ? 429 : status === 503 ? 503 : 502, status === 429 ? "busy" : "ai_failed");
        }

        const encoder = new TextEncoder();
        const body = new ReadableStream<Uint8Array>({
          async start(controller) {
            let full = "";
            try {
              for await (const delta of stream) {
                full += delta;
                controller.enqueue(encoder.encode(delta));
              }
              if (full.trim()) {
                const res = await supabase.from("tutor_messages").insert({ user_id: userId, role: "assistant", content: full, course });
                if (res.error) console.error("tutor reply save failed", res.error.message);
              }
            } catch (err) {
              console.error("tutor stream failed", err instanceof Error ? err.message : err);
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
