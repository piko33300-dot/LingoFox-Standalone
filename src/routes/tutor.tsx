import { useEffect, useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAccount } from "@/lib/account";
import { useT, type I18nKey } from "@/lib/i18n";
import { getCourse } from "@/lib/lessons";
import { progressActions, useProgress } from "@/lib/progress-store";
import { TUTOR_MAX_INPUT, type TutorMessage } from "@/lib/tutor";
import { AppPage, BottomNav } from "@/components/lingo/BottomNav";
import { Conversation, ConversationContent, ConversationScrollButton } from "@/components/ai-elements/conversation";
import { Message, MessageContent, MessageResponse } from "@/components/ai-elements/message";
import { PromptInput, PromptInputFooter, PromptInputSubmit, PromptInputTextarea, type PromptInputMessage } from "@/components/ai-elements/prompt-input";
import { Shimmer } from "@/components/ai-elements/shimmer";
import fox from "@/assets/fox.png";

export const Route = createFileRoute("/tutor")({
  head: () => ({
    meta: [
      { title: "تحدّث مع فوكس — معلّمك الذكي | LingoFox" },
      { name: "description", content: "محادثة حقيقية مع معلّم ذكي يصحّح أخطاءك فوراً بالإنجليزية والإسبانية والفرنسية والتركية والألمانية والعربية." },
      { property: "og:title", content: "تحدّث مع فوكس — معلّمك الذكي" },
      { property: "og:description", content: "تدرّب على المحادثة مع تصحيح فوري لأخطائك." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Tutor,
});

const STARTERS: I18nKey[] = ["tutorStarter1", "tutorStarter2", "tutorStarter3"];

function Tutor() {
  const { user, ready } = useAccount();
  const { t, loc } = useT();
  const p = useProgress();
  const course = getCourse(p.course) ?? getCourse("en")!;

  return (
    <AppPage>
      <div className="mx-auto flex h-[calc(100dvh-6rem)] max-w-md flex-col px-4 pt-4">
        <header className="flex items-center gap-3 pb-3">
          <img src={fox} alt="" width={48} height={48} className="size-12" />
          <div className="flex-1">
            <h1 className="text-xl font-bold text-secondary">{t("tutorTitle")}</h1>
            <p className="text-xs text-muted-foreground">{course.flag} {loc(course.title)} · {t("tutorSub")}</p>
          </div>
        </header>
        {!ready ? (
          <p className="mt-10 text-center text-muted-foreground">{t("loading")}</p>
        ) : !user ? (
          <div className="mt-6 rounded-3xl border-2 border-border bg-card p-6 text-center">
            <img src={fox} alt="" width={96} height={96} className="mx-auto size-24 animate-float" />
            <p className="mt-3 font-semibold">{t("tutorGuest")}</p>
            <Link to="/auth" className="btn-3d mt-4 block bg-primary px-6 py-3 text-primary-foreground shadow-[0_4px_0_var(--primary-shade)]">{t("signIn")}</Link>
          </div>
        ) : (
          <TutorChat key={user.id} userId={user.id} courseId={course.id} />
        )}
      </div>
      <BottomNav />
    </AppPage>
  );
}

function TutorChat({ userId, courseId }: { userId: string; courseId: string }) {
  const { t, lang } = useT();
  const [messages, setMessages] = useState<TutorMessage[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [status, setStatus] = useState<"ready" | "submitted" | "streaming" | "error">("ready");
  const [draft, setDraft] = useState("");
  const abortRef = useRef<AbortController | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    let cancelled = false;
    void supabase
      .from("tutor_messages")
      .select("id, role, content")
      .eq("user_id", userId)
      .order("created_at", { ascending: true })
      .limit(200)
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) toast.error(t("tutorError"));
        setMessages((data ?? []).map((m) => ({ id: m.id, role: m.role as TutorMessage["role"], content: m.content })));
        setLoaded(true);
      });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  useEffect(() => { if (status === "ready") inputRef.current?.focus(); }, [status, loaded]);

  async function send(text: string) {
    const message = text.trim().slice(0, TUTOR_MAX_INPUT);
    if (!message || status === "submitted" || status === "streaming") return;
    const userMsg: TutorMessage = { id: `u-${Date.now()}`, role: "user", content: message };
    const replyId = `a-${Date.now()}`;
    setMessages((m) => [...m, userMsg]);
    setDraft("");
    setStatus("submitted");
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      const res = await fetch("/api/tutor", {
        method: "POST",
        signal: controller.signal,
        headers: { "content-type": "application/json", ...(token ? { authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ message, course: courseId, ui: lang, level: progressActions.get().lessonsDone }),
      });
      if (!res.ok || !res.body) {
        const code = (await res.json().catch(() => ({}))) as { error?: string };
        toast.error(code.error === "daily_limit" ? t("tutorLimit") : t("tutorError"));
        setStatus("ready");
        return;
      }
      setStatus("streaming");
      setMessages((m) => [...m, { id: replyId, role: "assistant", content: "" }]);
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        setMessages((m) => m.map((x) => (x.id === replyId ? { ...x, content: x.content + chunk } : x)));
      }
      setStatus("ready");
    } catch (err) {
      if ((err as Error).name !== "AbortError") toast.error(t("tutorError"));
      setStatus("ready");
    } finally {
      abortRef.current = null;
    }
  }

  async function clearChat() {
    const { error } = await supabase.from("tutor_messages").delete().eq("user_id", userId);
    if (error) { toast.error(t("tutorError")); return; }
    setMessages([]);
    toast.success(t("tutorCleared"));
  }

  const busy = status === "submitted" || status === "streaming";

  return (
    <>
      <Conversation className="min-h-0 flex-1 rounded-3xl border-2 border-border bg-card">
        <ConversationContent className="gap-5 p-4">
          {loaded && messages.length === 0 && (
            <div className="flex flex-col items-center gap-4 py-6 text-center">
              <img src={fox} alt="" width={88} height={88} className="size-22 animate-float" />
              <p className="font-display font-semibold text-secondary">{t("tutorEmpty")}</p>
              <div className="flex flex-wrap justify-center gap-2">
                {STARTERS.map((k) => (
                  <button key={k} type="button" onClick={() => void send(t(k))}
                    className="rounded-full border-2 border-border bg-background px-3 py-1.5 text-sm font-semibold text-secondary transition-colors hover:border-primary">
                    {t(k)}
                  </button>
                ))}
              </div>
            </div>
          )}
          {messages.map((m) => (
            <Message key={m.id} from={m.role}>
              <MessageContent>
                {m.role === "assistant" ? (
                  <MessageResponse isAnimating={status === "streaming" && m === messages[messages.length - 1]}>{m.content}</MessageResponse>
                ) : (
                  <p className="whitespace-pre-wrap">{m.content}</p>
                )}
              </MessageContent>
            </Message>
          ))}
          {status === "submitted" && (
            <Message from="assistant"><MessageContent><Shimmer>{t("tutorThinking")}</Shimmer></MessageContent></Message>
          )}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      <div className="py-3">
        <PromptInput onSubmit={(msg: PromptInputMessage) => void send(msg.text)} className="rounded-2xl border-2 border-border bg-card">
          <PromptInputTextarea
            ref={inputRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            maxLength={TUTOR_MAX_INPUT}
            placeholder={t("tutorPlaceholder")}
            dir="auto"
          />
          <PromptInputFooter className="justify-between">
            <button type="button" onClick={() => void clearChat()} disabled={busy || messages.length === 0}
              className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground disabled:opacity-40">
              <RotateCcw className="size-3.5" />{t("tutorClear")}
            </button>
            <PromptInputSubmit status={status} disabled={!busy && !draft.trim()} onStop={() => abortRef.current?.abort()} />
          </PromptInputFooter>
        </PromptInput>
      </div>
    </>
  );
}
