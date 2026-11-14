import { useEffect, useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Mic, MicOff, RotateCcw, Sparkles, Square, Volume2, VolumeX } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAccount } from "@/lib/account";
import { useT, type I18nKey } from "@/lib/i18n";
import { getCourse, type Course } from "@/lib/lessons";
import { progressActions, useProgress } from "@/lib/progress-store";
import { TUTOR_MAX_INPUT, parseTutorContent, type TutorMessage } from "@/lib/tutor";
import { speak, stopSpeaking } from "@/lib/speech";
import { isSpeechRecognitionSupported, SpeechRecognizer } from "@/lib/speech-recognition";
import { cn } from "@/lib/utils";
import { AppPage, BottomNav } from "@/components/lingo/BottomNav";
import { Conversation, ConversationContent, ConversationScrollButton } from "@/components/ai-elements/conversation";
import { Message, MessageContent, MessageResponse } from "@/components/ai-elements/message";
import { PromptInput, PromptInputFooter, PromptInputSubmit, PromptInputTextarea, type PromptInputMessage } from "@/components/ai-elements/prompt-input";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { FoxMascot, type FoxMood } from "@/components/lingo/FoxMascot";

export const Route = createFileRoute("/tutor")({
  head: () => ({
    meta: [
      { title: "تحدّث مع فوكس — معلّمك الذكي | LingoFox" },
      { name: "description", content: "محادثة صوتية وكتابية حقيقية مع معلّم ذكي يصحّح أخطاءك فوراً بالإنجليزية والإسبانية والفرنسية والتركية والألمانية والعربية." },
      { property: "og:title", content: "تحدّث مع فوكس — معلّمك الذكي" },
      { property: "og:description", content: "تدرّب على المحادثة الصوتية مع تصحيح فوري لأخطائك." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Tutor,
});

const STARTERS: I18nKey[] = ["tutorStarter1", "tutorStarter2", "tutorStarter3"];

function pickMime() {
  if (typeof MediaRecorder === "undefined") return "";
  for (const m of ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg"]) {
    if (MediaRecorder.isTypeSupported(m)) return m;
  }
  return "";
}


function Tutor() {
  const { user, ready } = useAccount();
  const { t, loc } = useT();
  const p = useProgress();
  const course = getCourse(p.course) ?? getCourse("en")!;
  const [mascotMood, setMascotMood] = useState<FoxMood>("neutral");

  return (
    <AppPage>
      <div className="mx-auto flex h-[calc(100dvh-6rem)] max-w-md flex-col px-4 pt-4">
        <header className="flex items-center gap-3 pb-3">
          <FoxMascot mood={mascotMood} size="sm" className="transition-transform duration-300" />
          <div className="flex-1">
            <h1 className="text-xl font-bold text-secondary">{t("tutorTitle")}</h1>
            <p className="text-xs text-muted-foreground">{course.flag} {loc(course.title)} · {t("tutorSub")}</p>
          </div>
        </header>
        {!ready ? (
          <p className="mt-10 text-center text-muted-foreground">{t("loading")}</p>
        ) : !user ? (
          <div className="mt-6 rounded-3xl border-2 border-border bg-card p-6 text-center">
            <FoxMascot mood="encourage" size="lg" className="mx-auto" />
            <p className="mt-3 font-semibold">{t("tutorGuest")}</p>
            <Link to="/auth" className="btn-3d mt-4 block bg-primary px-6 py-3 text-primary-foreground shadow-[0_4px_0_var(--primary-shade)]">{t("signIn")}</Link>
          </div>
        ) : (
          <TutorChat
            key={user.id}
            userId={user.id}
            course={course}
            onMoodChange={setMascotMood}
          />
        )}
      </div>
      <BottomNav />
    </AppPage>
  );
}

function TutorChat({
  userId,
  course,
  onMoodChange,
}: {
  userId: string;
  course: Course;
  onMoodChange: (mood: FoxMood) => void;
}) {
  const { t, lang } = useT();
  const [messages, setMessages] = useState<TutorMessage[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [status, setStatus] = useState<"ready" | "submitted" | "streaming" | "error">("ready");
  const [draft, setDraft] = useState("");
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [autoPlay, setAutoPlay] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("lingofox_tutor_autoplay") === "true";
  });
  const [isRecording, setIsRecording] = useState(false);
  const [recordingMethod, setRecordingMethod] = useState<"speech_api" | "media_recorder" | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const recognizerRef = useRef<SpeechRecognizer | null>(null);
  const mediaRecRef = useRef<MediaRecorder | null>(null);
  const mediaChunksRef = useRef<Blob[]>([]);

  // Update header mascot mood based on conversation state
  useEffect(() => {
    if (status === "submitted") {
      onMoodChange("thinking");
    } else if (status === "streaming" || playingId !== null) {
      onMoodChange("speaking");
    } else {
      const last = messages[messages.length - 1];
      if (last?.role === "assistant" && last.content.includes("✏️")) {
        onMoodChange("encourage");
      } else {
        onMoodChange("neutral");
      }
    }
  }, [status, playingId, messages, onMoodChange]);

  // Clean up any audio or recording when unmounting
  useEffect(() => {
    return () => {
      stopSpeaking();
      recognizerRef.current?.abort();
      if (mediaRecRef.current?.state === "recording") {
        mediaRecRef.current.stream.getTracks().forEach((tr) => tr.stop());
      }
    };
  }, []);

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

  function toggleAutoPlay() {
    const next = !autoPlay;
    setAutoPlay(next);
    localStorage.setItem("lingofox_tutor_autoplay", String(next));
    toast.success(next ? t("tutorAutoPlay") + " (مفعّل)" : t("tutorAutoPlay") + " (معطّل)");
  }

  function handlePlaySpeech(id: string, text: string, slow = false) {
    if (playingId === id) {
      stopSpeaking();
      setPlayingId(null);
      return;
    }
    stopSpeaking();
    setPlayingId(id);
    speak(text, course.target, {
      slow,
      onStart: () => setPlayingId(id),
      onEnd: () => setPlayingId(null),
    });
  }

  async function send(text: string) {
    const message = text.trim().slice(0, TUTOR_MAX_INPUT);
    if (!message || status === "submitted" || status === "streaming") return;
    stopSpeaking();
    setPlayingId(null);
    const userMsg: TutorMessage = { id: `u-${Date.now()}`, role: "user", content: message };
    const replyId = `a-${Date.now()}`;
    setMessages((m) => [...m, userMsg]);
    setDraft("");
    setStatus("submitted");
    const controller = new AbortController();
    abortRef.current = controller;
    let accumulated = "";
    try {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      const res = await fetch("/api/tutor", {
        method: "POST",
        signal: controller.signal,
        headers: { "content-type": "application/json", ...(token ? { authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ message, course: course.id, ui: lang, level: progressActions.get().lessonsDone }),
      });
      if (!res.ok || !res.body) {
        const code = (await res.json().catch(() => ({}))) as { error?: string };
        toast.error(code.error === "daily_limit" ? t("tutorLimit") : code.error === "ai_not_configured" ? t("aiNotConfigured") : t("tutorError"));
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
        accumulated += chunk;
        setMessages((m) => m.map((x) => (x.id === replyId ? { ...x, content: x.content + chunk } : x)));
      }
      setStatus("ready");

      if (autoPlay && accumulated.trim()) {
        const parsed = parseTutorContent(accumulated);
        handlePlaySpeech(replyId, parsed.reply || accumulated);
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") toast.error(t("tutorError"));
      setStatus("ready");
    } finally {
      abortRef.current = null;
    }
  }

  // Voice input handling (Web Speech API with MediaRecorder fallback)
  async function startRecording() {
    if (isRecording) {
      stopRecording();
      return;
    }

    if (isSpeechRecognitionSupported()) {
      try {
        const rec = new SpeechRecognizer(course.target, {
          onStart: () => {
            setIsRecording(true);
            setRecordingMethod("speech_api");
          },
          onResult: (transcript) => {
            setDraft(transcript);
          },
          onError: () => {
            setIsRecording(false);
            setRecordingMethod(null);
            toast.error(t("speakNoMic"));
          },
          onEnd: () => {
            setIsRecording(false);
            setRecordingMethod(null);
          },
        });
        recognizerRef.current = rec;
        rec.start();
        return;
      } catch {
        // Fall back to MediaRecorder
      }
    }

    // MediaRecorder fallback
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mime = pickMime();
      const rec = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
      mediaChunksRef.current = [];
      rec.ondataavailable = (e) => {
        if (e.data.size > 0) mediaChunksRef.current.push(e.data);
      };
      rec.onstop = () => {
        stream.getTracks().forEach((tr) => tr.stop());
        void checkTranscribe(new Blob(mediaChunksRef.current, { type: rec.mimeType || mime || "audio/webm" }));
      };
      mediaRecRef.current = rec;
      rec.start();
      setIsRecording(true);
      setRecordingMethod("media_recorder");
    } catch {
      setIsRecording(false);
      setRecordingMethod(null);
      toast.error(t("speakNoMic"));
    }
  }

  function stopRecording() {
    if (recordingMethod === "speech_api") {
      recognizerRef.current?.stop();
    } else if (recordingMethod === "media_recorder") {
      if (mediaRecRef.current?.state === "recording") {
        mediaRecRef.current.stop();
      }
    }
    setIsRecording(false);
    setRecordingMethod(null);
  }

  async function checkTranscribe(audio: Blob) {
    try {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      const form = new FormData();
      form.append("audio", audio);
      form.append("expected", "sentence");
      form.append("lang", course.target);
      const res = await fetch("/api/speak", {
        method: "POST",
        body: form,
        headers: token ? { authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const result = (await res.json()) as { heard?: string };
        if (result.heard?.trim()) {
          setDraft(result.heard.trim());
        }
      }
    } catch {
      /* ignore */
    }
  }

  async function clearChat() {
    stopSpeaking();
    setPlayingId(null);
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
              <FoxMascot mood="neutral" size="lg" />
              <p className="font-display font-semibold text-secondary">{t("tutorEmpty")}</p>
              <div className="flex flex-wrap justify-center gap-2">
                {STARTERS.map((k) => (
                  <button key={k} type="button" onClick={() => void send(t(k))}
                    className="rounded-full border-2 border-border bg-background px-3.5 py-2 text-sm font-semibold text-secondary transition-all hover:border-primary hover:bg-primary/5 active:scale-95">
                    {t(k)}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m) => {
            const isAssistant = m.role === "assistant";
            const parsed = isAssistant ? parseTutorContent(m.content) : null;
            const isPlaying = playingId === m.id;

            return (
              <Message key={m.id} from={m.role}>
                <MessageContent className={cn(isAssistant && "w-full max-w-full")}>
                  {isAssistant ? (
                    <div className="space-y-2">
                      {parsed?.correction && (
                        <div className="rounded-2xl border-2 border-primary/25 bg-primary/10 p-3 text-sm animate-fade-in">
                          <div className="flex items-center justify-between gap-1.5 pb-1 font-bold text-primary">
                            <span className="flex items-center gap-1.5">
                              <Sparkles className="size-4" />
                              <span>{t("tutorCorrectionTitle")}</span>
                            </span>
                            <button
                              type="button"
                              onClick={() => handlePlaySpeech(`${m.id}-corr`, parsed.correction!)}
                              className="inline-flex items-center gap-1 rounded-full bg-primary/20 px-2 py-0.5 text-xs font-semibold text-primary transition-colors hover:bg-primary/30"
                              title={t("tutorListen")}
                            >
                              <Volume2 className="size-3" />
                              <span>{t("tutorListen")}</span>
                            </button>
                          </div>
                          <p className="font-semibold text-foreground" dir="auto">{parsed.correction}</p>
                        </div>
                      )}

                      <MessageResponse isAnimating={status === "streaming" && m === messages[messages.length - 1]}>
                        {parsed?.reply ?? m.content}
                      </MessageResponse>

                      {status !== "streaming" && m.content.trim() && (
                        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-border/40">
                          <button
                            type="button"
                            onClick={() => handlePlaySpeech(m.id, parsed?.reply ?? m.content)}
                            className={cn(
                              "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold transition-colors",
                              isPlaying
                                ? "bg-primary text-primary-foreground animate-pulse"
                                : "bg-muted text-muted-foreground hover:bg-primary/15 hover:text-primary"
                            )}
                            title={t("tutorListen")}
                          >
                            {isPlaying ? <VolumeX className="size-3.5" /> : <Volume2 className="size-3.5" />}
                            <span>{isPlaying ? t("speakStop") : t("tutorListen")}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handlePlaySpeech(`${m.id}-slow`, parsed?.reply ?? m.content, true)}
                            className="inline-flex items-center gap-1 rounded-full bg-muted/60 px-2 py-1 text-xs font-semibold text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
                            title={t("tutorListenSlow")}
                          >
                            <span>🐢 {t("slow")}</span>
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="whitespace-pre-wrap">{m.content}</p>
                  )}
                </MessageContent>
              </Message>
            );
          })}

          {status === "submitted" && (
            <Message from="assistant"><MessageContent><Shimmer>{t("tutorThinking")}</Shimmer></MessageContent></Message>
          )}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      {/* Voice recording indicator */}
      {isRecording && (
        <div className="mt-2 flex items-center justify-between rounded-2xl border-2 border-destructive/40 bg-destructive/10 px-4 py-2.5 animate-pulse">
          <div className="flex items-center gap-2 text-sm font-semibold text-destructive">
            <Mic className="size-4 animate-bounce" />
            <span>{t("tutorVoiceListening")}</span>
          </div>
          <button
            type="button"
            onClick={stopRecording}
            className="flex items-center gap-1 rounded-xl bg-destructive px-3 py-1 text-xs font-bold text-destructive-foreground hover:brightness-110"
          >
            <Square className="size-3 fill-current" />
            <span>{t("speakStop")}</span>
          </button>
        </div>
      )}

      <div className="py-3">
        <PromptInput onSubmit={(msg: PromptInputMessage) => void send(msg.text)} className="rounded-2xl border-2 border-border bg-card">
          <PromptInputTextarea
            ref={inputRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            maxLength={TUTOR_MAX_INPUT}
            placeholder={isRecording ? t("tutorVoiceListening") : t("tutorPlaceholder")}
            dir="auto"
          />
          <PromptInputFooter className="justify-between">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => void clearChat()}
                disabled={busy || messages.length === 0}
                className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground disabled:opacity-40"
                title={t("tutorClear")}
              >
                <RotateCcw className="size-3.5" />
                <span className="hidden sm:inline">{t("tutorClear")}</span>
              </button>

              <button
                type="button"
                onClick={toggleAutoPlay}
                className={cn(
                  "flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold transition-colors",
                  autoPlay ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground"
                )}
                title={t("tutorAutoPlay")}
              >
                <Volume2 className="size-3.5" />
                <span className="hidden sm:inline">{t("tutorAutoPlay")}</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={isRecording ? stopRecording : () => void startRecording()}
                disabled={busy}
                aria-label={t("tutorVoiceInput")}
                title={t("tutorVoiceInput")}
                className={cn(
                  "grid size-9 place-items-center rounded-xl transition-all active:scale-95 disabled:opacity-40",
                  isRecording
                    ? "bg-destructive text-destructive-foreground animate-pulse"
                    : "bg-muted text-muted-foreground hover:bg-primary/20 hover:text-primary"
                )}
              >
                {isRecording ? <Square className="size-4 fill-current" /> : <Mic className="size-4" />}
              </button>

              <PromptInputSubmit status={status} disabled={!busy && !draft.trim()} onStop={() => abortRef.current?.abort()} />
            </div>
          </PromptInputFooter>
        </PromptInput>
      </div>
    </>
  );
}
