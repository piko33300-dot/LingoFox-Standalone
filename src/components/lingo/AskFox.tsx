import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAccount } from "@/lib/account";
import { useT, type I18nKey } from "@/lib/i18n";
import { EXPLAIN_MAX_INPUT, type ExplainTurn } from "@/lib/explain";
import { Conversation, ConversationContent, ConversationScrollButton } from "@/components/ai-elements/conversation";
import { Message, MessageContent, MessageResponse } from "@/components/ai-elements/message";
import { PromptInput, PromptInputFooter, PromptInputSubmit, PromptInputTextarea, type PromptInputMessage } from "@/components/ai-elements/prompt-input";
import { Shimmer } from "@/components/ai-elements/shimmer";
import fox from "@/assets/fox.png";

type Props = { questionKey: string; answer: string; wasCorrect: boolean; onClose: () => void };
type Status = "ready" | "submitted" | "streaming" | "error";

const QUICK: I18nKey[] = ["askFoxRule", "askFoxExample"];

/** Bottom sheet: personal explanation / correction for the current lesson question. */
export function AskFox(props: Props) {
  const { t } = useT();
  const { user, ready } = useAccount();
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") props.onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [props]);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-secondary/60 backdrop-blur-sm sm:items-center" onClick={props.onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t("askFoxTitle")}
        onClick={(e) => e.stopPropagation()}
        className="flex h-[82dvh] w-full max-w-md animate-slide-up flex-col rounded-t-[2rem] bg-card shadow-elevated sm:h-[680px] sm:rounded-[2rem]"
      >
        <header className="flex items-center gap-3 border-b-2 border-border px-5 py-4">
          <div className="grid size-12 place-items-center rounded-2xl bg-primary/15">
            <img src={fox} alt="" width={40} height={40} className="size-10" />
          </div>
          <div className="flex-1">
            <h2 className="font-display text-lg font-bold text-secondary">{t("askFoxTitle")}</h2>
            <p className="text-xs text-muted-foreground">{t("askFoxSub")}</p>
          </div>
          <button type="button" onClick={props.onClose} aria-label={t("close")}
            className="grid size-10 place-items-center rounded-xl text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
            <X className="size-5" />
          </button>
        </header>
        {!ready ? (
          <p className="m-auto text-muted-foreground">{t("loading")}</p>
        ) : !user ? (
          <div className="m-auto max-w-xs p-6 text-center">
            <img src={fox} alt="" width={96} height={96} className="mx-auto size-24 animate-float" />
            <p className="mt-3 font-semibold">{t("askFoxGuest")}</p>
            <Link to="/auth" className="btn-3d mt-4 block bg-primary px-6 py-3 text-primary-foreground shadow-[0_4px_0_var(--primary-shade)]">{t("signIn")}</Link>
          </div>
        ) : (
          <AskFoxChat {...props} />
        )}
      </div>
    </div>
  );
}

function AskFoxChat({ questionKey, answer, wasCorrect }: Props) {
  const { t, lang } = useT();
  const [messages, setMessages] = useState<(ExplainTurn & { id: string })[]>([]);
  const [status, setStatus] = useState<Status>("ready");
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const abortRef = useRef<AbortController | null>(null);
  const started = useRef(false);

  async function send(text: string) {
    const content = text.trim().slice(0, EXPLAIN_MAX_INPUT);
    if (!content || status === "submitted" || status === "streaming") return;
    const userMsg = { id: `u-${Date.now()}`, role: "user" as const, content };
    const replyId = `a-${Date.now()}`;
    const history = [...messages, userMsg];
    setMessages(history);
    setDraft("");
    setError(null);
    setStatus("submitted");
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      const res = await fetch("/api/explain", {
        method: "POST",
        signal: controller.signal,
        headers: { "content-type": "application/json", ...(token ? { authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({
          key: questionKey,
          answer,
          wasCorrect,
          ui: lang,
          messages: history.map(({ role, content: c }) => ({ role, content: c })),
        }),
      });
      if (!res.ok || !res.body) {
        const code = (await res.json().catch(() => ({}))) as { error?: string };
        setError(code.error === "daily_limit" ? t("askFoxLimit") : code.error === "busy" ? t("askFoxBusy") : code.error === "ai_not_configured" ? t("aiNotConfigured") : t("askFoxError"));
        setStatus("error");
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
      if ((err as Error).name !== "AbortError") { setError(t("askFoxError")); setStatus("error"); }
      else setStatus("ready");
    } finally {
      abortRef.current = null;
    }
  }

  // Open with an explanation of the learner's answer right away.
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    void send(t(wasCorrect ? "askFoxWhyRight" : "askFoxWhyWrong"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Stop a running reply when the sheet closes (deferred so a dev double-mount doesn't cancel it).
  const mounted = useRef(false);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      setTimeout(() => { if (!mounted.current) abortRef.current?.abort(); }, 0);
    };
  }, []);

  const busy = status === "submitted" || status === "streaming";

  return (
    <>
      <Conversation className="min-h-0 flex-1">
        <ConversationContent className="gap-5 p-4">
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
          {error && <p role="alert" className="rounded-2xl bg-destructive-soft px-4 py-3 text-sm font-semibold text-destructive">{error}</p>}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      <div className="space-y-2 border-t-2 border-border px-4 pb-5 pt-3">
        <div className="flex flex-wrap gap-2">
          {QUICK.map((k) => (
            <button key={k} type="button" disabled={busy} onClick={() => void send(t(k))}
              className="rounded-full border-2 border-border bg-background px-3 py-1 text-xs font-semibold text-secondary transition-colors hover:border-primary disabled:opacity-50">
              {t(k)}
            </button>
          ))}
        </div>
        <PromptInput onSubmit={(msg: PromptInputMessage) => void send(msg.text)} className="rounded-2xl border-2 border-border bg-background">
          <PromptInputTextarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            maxLength={EXPLAIN_MAX_INPUT}
            placeholder={t("askFoxPlaceholder")}
            dir="auto"
            className="min-h-12"
          />
          <PromptInputFooter className="justify-end">
            <PromptInputSubmit status={status} disabled={!busy && !draft.trim()} onStop={() => abortRef.current?.abort()} />
          </PromptInputFooter>
        </PromptInput>
      </div>
    </>
  );
}
