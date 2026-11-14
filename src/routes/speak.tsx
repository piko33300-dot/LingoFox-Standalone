import { useEffect, useRef, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Mic, Square, Volume2, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAccount } from "@/lib/account";
import { useT } from "@/lib/i18n";
import { getCourse } from "@/lib/lessons";
import { progressActions } from "@/lib/progress-store";
import { speak } from "@/lib/speech";
import { speakingItems, type SpeakResult } from "@/lib/speaking";
import { cn } from "@/lib/utils";
import { ChunkyButton } from "@/components/lingo/ChunkyButton";
import fox from "@/assets/fox.png";

export const Route = createFileRoute("/speak")({
  head: () => ({
    meta: [
      { title: "تدرّب على النطق — LingoFox" },
      { name: "description", content: "قل الجمل بصوتك ويقيّم الذكاء الاصطناعي نطقك كلمة بكلمة." },
      { property: "og:title", content: "تدرّب على النطق — LingoFox" },
      { property: "og:description", content: "تقييم فوري لنطقك بالذكاء الاصطناعي." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Speak,
});

type Phase = "idle" | "recording" | "checking" | "result";

function pickMime() {
  if (typeof MediaRecorder === "undefined") return "";
  for (const m of ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg"]) {
    if (MediaRecorder.isTypeSupported(m)) return m;
  }
  return "";
}

function Speak() {
  const { user, ready } = useAccount();
  const { t } = useT();
  const navigate = useNavigate();
  const [items, setItems] = useState<string[] | null>(null);
  const [courseId, setCourseId] = useState<string>("en");
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>("idle");
  const [result, setResult] = useState<(SpeakResult & { heard: string }) | null>(null);
  const [finished, setFinished] = useState(false);
  const recRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    const p = progressActions.get();
    const course = getCourse(p.course) ?? getCourse("en")!;
    setCourseId(course.target);
    setItems(speakingItems(course, p.completed));
  }, []);

  useEffect(() => () => recRef.current?.stream.getTracks().forEach((tr) => tr.stop()), []);

  if (!ready || items === null) return <div className="min-h-dvh bg-background" />;
  if (!user) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-5 px-6 text-center">
        <img src={fox} alt="" width={120} height={120} className="size-28" />
        <p className="font-display text-lg font-semibold text-secondary">{t("speakGuest")}</p>
        <Link to="/auth" className="btn-3d block w-full bg-primary px-6 py-3.5 text-primary-foreground shadow-[0_4px_0_var(--primary-shade)]">{t("signIn")}</Link>
      </main>
    );
  }
  if (finished) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-5 px-6 text-center">
        <img src={fox} alt="" width={140} height={140} className="size-32 animate-float" />
        <h1 className="text-2xl font-bold text-secondary">{t("speakDone")}</h1>
        <p className="font-display text-xl font-bold text-primary">+5 XP</p>
        <ChunkyButton onClick={() => navigate({ to: "/learn" })}>{t("backToLearn")}</ChunkyButton>
      </main>
    );
  }

  const sentence = items[index] ?? "";

  async function start() {
    setResult(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mime = pickMime();
      const rec = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
      chunksRef.current = [];
      rec.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      rec.onstop = () => {
        stream.getTracks().forEach((tr) => tr.stop());
        void check(new Blob(chunksRef.current, { type: rec.mimeType || mime || "audio/webm" }));
      };
      recRef.current = rec;
      rec.start();
      setPhase("recording");
    } catch {
      setPhase("idle");
      setResult(null);
      alertOnce(t("speakNoMic"));
    }
  }

  function stop() {
    if (recRef.current?.state === "recording") recRef.current.stop();
    setPhase("checking");
  }

  async function check(audio: Blob) {
    try {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      const form = new FormData();
      form.append("audio", audio);
      form.append("expected", sentence);
      form.append("lang", courseId);
      const res = await fetch("/api/speak", { method: "POST", body: form, headers: token ? { authorization: `Bearer ${token}` } : {} });
      const body = (await res.json()) as (SpeakResult & { heard: string }) | { error: string };
      if (!res.ok || "error" in body) {
        alertOnce("error" in body && body.error === "daily_limit" ? t("speakLimit") : t("speakError"));
        setPhase("idle");
        return;
      }
      setResult(body);
      setPhase("result");
    } catch {
      alertOnce(t("speakError"));
      setPhase("idle");
    }
  }

  function next() {
    setResult(null);
    setPhase("idle");
    if (index + 1 >= items!.length) {
      progressActions.completePractice();
      setFinished(true);
    } else {
      setIndex(index + 1);
    }
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col px-5 pb-8 pt-5">
      <div className="flex items-center gap-3">
        <Link to="/learn" aria-label={t("backToLearn")} className="text-muted-foreground hover:text-foreground"><X className="size-7" /></Link>
        <div className="h-4 flex-1 overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-success transition-all" style={{ width: `${(index / items.length) * 100}%` }} />
        </div>
      </div>

      <h1 className="mt-8 text-2xl font-bold text-secondary">{t("speakSay")}</h1>
      <div className="mt-5 flex items-center gap-3">
        <img src={fox} alt="" width={72} height={72} className="size-18 shrink-0" />
        <div className="relative flex-1 rounded-2xl border-2 border-border bg-card p-4">
          <p lang={courseId} dir="auto" className="font-display text-2xl font-bold text-foreground">
            {result ? result.words.map((w, i) => (
              <span key={i} className={cn(w.ok ? "text-success" : "text-destructive")}>{w.word}{" "}</span>
            )) : sentence}
          </p>
          <button type="button" onClick={() => speak(sentence, courseId as never)} aria-label="🔊"
            className="mt-2 flex items-center gap-1 text-sm font-semibold text-gem"><Volume2 className="size-5" /></button>
        </div>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center gap-4">
        {phase === "checking" ? (
          <p className="animate-pulse font-display font-semibold text-muted-foreground">{t("speakChecking")}</p>
        ) : phase !== "result" ? (
          <>
            <button type="button" onClick={phase === "recording" ? stop : () => void start()}
              aria-label={phase === "recording" ? t("speakStop") : t("speakTap")}
              className={cn("flex size-28 items-center justify-center rounded-full shadow-[0_6px_0_var(--primary-shade)] transition-transform active:translate-y-1",
                phase === "recording" ? "animate-pulse bg-destructive text-destructive-foreground" : "bg-primary text-primary-foreground")}>
              {phase === "recording" ? <Square className="size-10 fill-current" /> : <Mic className="size-12" />}
            </button>
            <p className="font-display font-semibold text-muted-foreground">{phase === "recording" ? t("speakStop") : t("speakTap")}</p>
          </>
        ) : null}
      </div>

      {phase === "result" && result ? (
        <div className={cn("rounded-3xl p-5", result.passed ? "bg-success-soft" : "bg-accent")}>
          <p className={cn("text-xl font-bold", result.passed ? "text-success-shade" : "text-flame")}>
            {result.passed ? t("speakGreat") : t("speakTryAgain")} · {t("speakScore", { n: result.score })}
          </p>
          {result.heard && <p className="mt-1 text-sm text-muted-foreground" dir="auto">{t("speakHeard")} “{result.heard}”</p>}
          <div className="mt-4 grid grid-cols-2 gap-3">
            <ChunkyButton variant="outline" onClick={() => { setResult(null); setPhase("idle"); }}>{t("speakRetry")}</ChunkyButton>
            <ChunkyButton variant={result.passed ? "success" : "primary"} onClick={next}>{t("speakNext")}</ChunkyButton>
          </div>
        </div>
      ) : (
        phase === "idle" && <button type="button" onClick={next} className="mx-auto font-display font-semibold text-muted-foreground hover:text-foreground">{t("speakSkip")}</button>
      )}
    </main>
  );
}

function alertOnce(message: string) {
  void import("sonner").then(({ toast }) => toast.error(message));
}
