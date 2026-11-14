import { useEffect, useMemo, useState, type ButtonHTMLAttributes, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import { CheckCircle2, Gem, MessageCircleQuestion, HeartCrack, Heart, PlayCircle, Snail, Volume2, X, XCircle, Zap } from "lucide-react";
import {
  findLesson,
  isBuiltAnswerCorrect,
  isTypedAnswerCorrect,
  MAX_REWARDED_ADS_PER_DAY,
  REFILL_COST,
  type BuilderQuestion,
  type Course,
  type LangCode,
  type ListenQuestion,
  type MatchQuestion,
  type MCQuestion,
  type Question,
  type TypeQuestion,
} from "@/lib/lessons";
import { adsWatchedToday, lessonReward, progressActions, useProgress } from "@/lib/progress-store";
import { playSound } from "@/lib/sound";
import { speak } from "@/lib/speech";
import { dirOf, useT, type I18nKey } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { ChunkyButton } from "./ChunkyButton";
import { AdBanner } from "./AdBanner";
import { RewardedAd } from "./RewardedAd";
import { AskFox } from "./AskFox";
import fox from "@/assets/fox.png";

type Status = "answering" | "correct" | "wrong";

const PROMPT: Record<Question["type"], I18nKey> = {
  mc: "qMc",
  builder: "qBuilder",
  listen: "qListen",
  type: "qType",
  match: "qMatch",
};

function correctText(q: Question) {
  switch (q.type) {
    case "mc": return q.answer;
    case "builder": return q.answer.join(" ");
    case "listen": return q.answer;
    case "type": return q.accepted[0];
    case "match": return "";
  }
}

export type PracticeSession = { course: Course; items: { key: string; question: Question }[] };

/** A normal lesson (`lessonId`) or a spaced-repetition practice session (`practice`). */
export function Quiz({ lessonId, practice }: { lessonId?: string; practice?: PracticeSession }) {
  const lesson = useMemo(
    () => practice
      ? { course: practice.course, questions: practice.items.map((i) => i.question), keys: practice.items.map((i) => i.key) }
      : findLesson(lessonId ?? "")!,
    [lessonId, practice],
  );
  const keyOf = useMemo(() => new Map<Question, string>(lesson.questions.map((qq, n): [Question, string] => [qq, lesson.keys[n] ?? ""])), [lesson]);
  const { course } = lesson;
  const navigate = useNavigate();
  const progress = useProgress();
  const { t } = useT();
  const [queue, setQueue] = useState(() => lesson.questions);
  const [i, setI] = useState(0);
  const [solved, setSolved] = useState(0);
  const [status, setStatus] = useState<Status>("answering");
  const [pick, setPick] = useState<string | null>(null);
  const [built, setBuilt] = useState<number[]>([]);
  const [typed, setTyped] = useState("");
  const [matchDone, setMatchDone] = useState(false);
  const [mistakes, setMistakes] = useState(0);
  const [result, setResult] = useState<{ xp: number; gems: number; freezeUsed: number } | null>(null);
  const [showAd, setShowAd] = useState(false);
  const [asked, setAsked] = useState<{ key: string; answer: string; wasCorrect: boolean } | null>(null);
  const [lastAnswer, setLastAnswer] = useState("");

  const q = queue[i]!;
  const total = lesson.questions.length;
  const pct = ((solved + (status === "correct" ? 1 : 0)) / total) * 100;
  const canCheck =
    q.type === "mc" || q.type === "listen" ? pick !== null
    : q.type === "builder" ? built.length > 0
    : q.type === "type" ? typed.trim().length > 0
    : matchDone;

  useEffect(() => {
    if (q.type === "listen") {
      const id = setTimeout(() => speak(q.text, course.target), 250);
      return () => clearTimeout(id);
    }
    return undefined;
  }, [q, course.target]);

  function check() {
    if (!canCheck) return;
    const ok =
      q.type === "mc" || q.type === "listen" ? pick === q.answer
      : q.type === "builder" ? isBuiltAnswerCorrect(q, built.map((b) => q.bank[b] ?? ""))
      : q.type === "type" ? isTypedAnswerCorrect(q, typed)
      : matchDone;
    setStatus(ok ? "correct" : "wrong");
    setLastAnswer(
      q.type === "mc" || q.type === "listen" ? pick ?? ""
      : q.type === "builder" ? built.map((b) => q.bank[b] ?? "").join(" ")
      : q.type === "type" ? typed.trim()
      : "",
    );
    playSound(ok ? "correct" : "wrong");
    const key = keyOf.get(q);
    if (key) progressActions.recordReview(key, ok);
    if (!ok) {
      setMistakes((m) => m + 1);
      if (!practice) progressActions.loseHeart();
    }
  }
  function next() {
    if (status === "correct" && i + 1 >= queue.length) {
      setResult(practice ? progressActions.completePractice() : progressActions.completeLesson(lessonId ?? "", mistakes));
      playSound("complete");
      return;
    }
    if (status === "correct") setSolved((n) => n + 1);
    // A missed question comes back at the end of the lesson.
    if (status === "wrong") setQueue((qs) => [...qs, q]);
    if (status !== "answering") setI(i + 1);
    setStatus("answering");
    setPick(null);
    setBuilt([]);
    setTyped("");
    setMatchDone(false);
  }

  if (result) return <Complete reward={result} practice={!!practice} perfect={mistakes === 0} onContinue={() => navigate({ to: "/learn" })} />;

  const disabled = status !== "answering";
  const outOfHearts = !practice && progress.hearts === 0 && status !== "correct";

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col bg-background">
      <div className="flex items-center gap-3 px-4 pt-5">
        <button aria-label={t("quitLesson")} onClick={() => navigate({ to: "/learn" })} className="text-muted-foreground transition-colors hover:text-foreground">
          <X className="size-7" />
        </button>
        <div className="h-4 flex-1 overflow-hidden rounded-full bg-muted" dir="ltr">
          <div className="relative h-full rounded-full bg-primary transition-[width] duration-500 ease-out" style={{ width: `${pct}%` }}>
            <span className="absolute inset-x-2 top-1 h-1 rounded-full bg-primary-foreground/30" />
          </div>
        </div>
        <span className="flex items-center gap-1 font-display font-bold text-destructive" aria-label={`${t("hearts")}: ${progress.hearts}`}>
          <Heart className="size-6 fill-destructive" />
          <span key={progress.hearts} className="animate-pop">{progress.hearts}</span>
        </span>
      </div>

      <div key={`${i}-${q.type}`} className="flex-1 px-5 pt-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
        <h2 className="text-2xl font-bold text-secondary">{t(PROMPT[q.type])}</h2>
        {q.type === "mc" && <MC q={q} target={course.target} native={course.native} pick={pick} onPick={setPick} disabled={disabled} />}
        {q.type === "listen" && <Listen q={q} target={course.target} pick={pick} onPick={setPick} disabled={disabled} />}
        {q.type === "builder" && <Builder q={q} target={course.target} native={course.native} built={built} setBuilt={setBuilt} disabled={disabled} shake={status === "wrong"} />}
        {q.type === "type" && <TypeIn q={q} target={course.target} value={typed} onChange={setTyped} onSubmit={check} disabled={disabled} shake={status === "wrong"} />}
        {q.type === "match" && <Match q={q} target={course.target} native={course.native} onDone={() => setMatchDone(true)} disabled={disabled} />}
      </div>

      <div className={cn("sticky bottom-0 border-t-2 px-5 pb-8 pt-5 transition-colors",
        status === "answering" && "border-border bg-background",
        status === "correct" && "animate-slide-up border-transparent bg-success-soft",
        status === "wrong" && "animate-slide-up border-transparent bg-destructive-soft")}>
        {status === "correct" && (
          <div className="mb-4 flex items-center gap-3 text-success-shade">
            <CheckCircle2 className="size-9 fill-success text-primary-foreground" />
            <p className="font-display text-2xl font-bold">{t("amazing")}</p>
          </div>
        )}
        {status === "wrong" && (
          <div className="mb-4 flex items-start gap-3 text-destructive">
            <XCircle className="size-9 shrink-0 fill-destructive text-primary-foreground" />
            <div>
              <p className="font-display text-2xl font-bold">{t("correctAnswer")}</p>
              <p className="font-semibold">{correctText(q)}</p>
            </div>
          </div>
        )}
        {status === "answering" ? (
          <ChunkyButton variant="success" disabled={!canCheck} onClick={check}>{t("check")}</ChunkyButton>
        ) : (
          <div className="flex gap-3">
            {keyOf.get(q) && (
              <button
                type="button"
                onClick={() => setAsked({ key: keyOf.get(q)!, answer: lastAnswer, wasCorrect: status === "correct" })}
                className={cn("btn-3d flex shrink-0 items-center gap-2 border-2 bg-card px-4 normal-case tracking-normal",
                  status === "correct" ? "border-success/40 text-success-shade shadow-[0_4px_0_var(--success-shade)]" : "border-destructive/40 text-destructive shadow-[0_4px_0_var(--destructive)]")}
              >
                <MessageCircleQuestion className="size-5" />
                <span>{t("askFox")}</span>
              </button>
            )}
            <ChunkyButton variant={status === "correct" ? "success" : "danger"} onClick={next}>{t("continue")}</ChunkyButton>
          </div>
        )}
      </div>

      {outOfHearts && !showAd && (
        <GameOver
          gems={progress.gems}
          adsLeft={MAX_REWARDED_ADS_PER_DAY - adsWatchedToday(progress)}
          onRefill={() => { if (progressActions.refillHearts()) next(); }}
          onWatchAd={() => setShowAd(true)}
          onQuit={() => navigate({ to: "/learn" })}
        />
      )}
      {asked && <AskFox questionKey={asked.key} answer={asked.answer} wasCorrect={asked.wasCorrect} onClose={() => setAsked(null)} />}
      {showAd && (
        <RewardedAd
          onClose={() => setShowAd(false)}
          onReward={() => { progressActions.rewardAd(); setShowAd(false); next(); }}
        />
      )}
    </div>
  );
}

function SpeakButton({ text, lang, big }: { text: string; lang: LangCode; big?: boolean }) {
  const { t } = useT();
  return (
    <button
      type="button"
      aria-label={t("tapToListen")}
      onClick={() => speak(text, lang)}
      className={cn("btn-3d flex shrink-0 items-center justify-center bg-gem text-primary-foreground shadow-[0_4px_0_oklch(0.5_0.15_240)]",
        big ? "size-24 rounded-3xl" : "size-10 rounded-xl")}
    >
      <Volume2 className={big ? "size-12" : "size-5"} />
    </button>
  );
}

function Bubble({ children, lang, hint }: { children: string; lang: LangCode; hint?: string | undefined }) {
  return (
    <div className="rounded-2xl border-2 border-border bg-card px-4 py-2">
      <p dir={dirOf(lang)} lang={lang} className="font-display text-xl font-semibold">{children}</p>
      {hint && <p dir="ltr" className="text-sm italic text-muted-foreground">{hint}</p>}
    </div>
  );
}

function MC({ q, target, native, pick, onPick, disabled }: { q: MCQuestion; target: LangCode; native: LangCode; pick: string | null; onPick: (s: string) => void; disabled: boolean }) {
  return (
    <>
      <div className="mt-5 flex items-center gap-3">
        <img src={fox} alt="" width={64} height={64} className="size-16" />
        <Bubble lang={target} hint={q.hint}>{q.word}</Bubble>
        <SpeakButton text={q.word} lang={target} />
      </div>
      <div className="mt-6 grid grid-cols-2 gap-3">
        {q.options.map((o) => (
          <button key={o.text} disabled={disabled} onClick={() => onPick(o.text)}
            className={cn("btn-3d flex flex-col items-center gap-2 border-2 disabled:opacity-100 bg-card p-4 normal-case tracking-normal",
              pick === o.text ? "border-gem bg-gem/10 text-gem shadow-[0_4px_0_var(--gem)]" : "border-border shadow-[0_4px_0_var(--border)]")}>
            <span className="text-5xl">{o.emoji}</span>
            <span dir={dirOf(native)} className="text-lg">{o.text}</span>
          </button>
        ))}
      </div>
    </>
  );
}

function Listen({ q, target, pick, onPick, disabled }: { q: ListenQuestion; target: LangCode; pick: string | null; onPick: (s: string) => void; disabled: boolean }) {
  const { t } = useT();
  return (
    <>
      <div className="mt-6 flex items-center justify-center gap-4">
        <SpeakButton text={q.text} lang={target} big />
        <button type="button" onClick={() => speak(q.text, target, true)} aria-label={t("slow")}
          className="btn-3d flex size-16 items-center justify-center rounded-2xl border-2 border-border bg-card text-gem shadow-[0_4px_0_var(--border)]">
          <Snail className="size-8" />
        </button>
      </div>
      <div className="mt-8 grid grid-cols-1 gap-3">
        {q.options.map((o) => (
          <button key={o} disabled={disabled} onClick={() => onPick(o)} dir={dirOf(target)}
            className={cn("btn-3d border-2 bg-card px-4 py-3.5 text-lg normal-case tracking-normal disabled:opacity-100",
              pick === o ? "border-gem bg-gem/10 text-gem shadow-[0_4px_0_var(--gem)]" : "border-border shadow-[0_4px_0_var(--border)]")}>
            {o}
          </button>
        ))}
      </div>
    </>
  );
}

function Builder({ q, target, native, built, setBuilt, disabled, shake }: { q: BuilderQuestion; target: LangCode; native: LangCode; built: number[]; setBuilt: (b: number[]) => void; disabled: boolean; shake: boolean }) {
  return (
    <>
      <div className="mt-5 flex items-center gap-3">
        <img src={fox} alt="" width={80} height={80} className="size-20" />
        <Bubble lang={target}>{q.sentence}</Bubble>
        <SpeakButton text={q.sentence} lang={target} />
      </div>
      <div dir={dirOf(native)} className={cn("mt-6 flex min-h-28 flex-wrap content-start gap-2 border-y-2 border-border py-3", shake && "animate-shake")}>
        {built.map((b, pos) => (
          <Chip key={b} disabled={disabled} onClick={() => setBuilt(built.filter((_, k) => k !== pos))}>{q.bank[b]}</Chip>
        ))}
      </div>
      <div dir={dirOf(native)} className="mt-8 flex flex-wrap justify-center gap-2">
        {q.bank.map((w, idx) => {
          const used = built.includes(idx);
          return used ? (
            <span key={idx} className="rounded-xl bg-muted px-4 py-2 text-transparent">{w}</span>
          ) : (
            <Chip key={idx} disabled={disabled} onClick={() => setBuilt([...built, idx])}>{w}</Chip>
          );
        })}
      </div>
    </>
  );
}

function TypeIn({ q, target, value, onChange, onSubmit, disabled, shake }: { q: TypeQuestion; target: LangCode; value: string; onChange: (v: string) => void; onSubmit: () => void; disabled: boolean; shake: boolean }) {
  const { t } = useT();
  return (
    <>
      <div className="mt-5 flex items-center gap-3">
        <img src={fox} alt="" width={64} height={64} className="size-16" />
        <Bubble lang={q.showLang}>{q.show}</Bubble>
        {q.showLang === target && <SpeakButton text={q.show} lang={target} />}
      </div>
      <form onSubmit={(e) => { e.preventDefault(); onSubmit(); }}>
        <textarea
          dir={dirOf(q.answerLang)}
          lang={q.answerLang}
          value={value}
          disabled={disabled}
          autoFocus
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
          placeholder={t("typeHere")}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); onSubmit(); } }}
          className={cn("mt-6 h-36 w-full resize-none rounded-2xl border-2 border-border bg-muted p-4 text-xl outline-none focus:border-gem", shake && "animate-shake")}
        />
      </form>
    </>
  );
}

function Match({ q, target, native, onDone, disabled }: { q: MatchQuestion; target: LangCode; native: LangCode; onDone: () => void; disabled: boolean }) {
  // Right column order: deterministic shuffle so pairs aren't aligned.
  const rightOrder = useMemo(() => q.pairs.map((_, i) => i).sort((a, b) => ((a * 7 + 3) % 5) - ((b * 7 + 3) % 5)), [q]);
  const [left, setLeft] = useState<number | null>(null);
  const [right, setRight] = useState<number | null>(null);
  const [matched, setMatched] = useState<number[]>([]);
  const [wrong, setWrong] = useState(false);

  useEffect(() => {
    if (left === null || right === null) return;
    if (left === right) {
      const next = [...matched, left];
      setMatched(next);
      playSound("correct");
      if (next.length === q.pairs.length) onDone();
      setLeft(null); setRight(null);
    } else {
      setWrong(true);
      const id = setTimeout(() => { setWrong(false); setLeft(null); setRight(null); }, 450);
      return () => clearTimeout(id);
    }
    return undefined;
  }, [left, right]); // eslint-disable-line react-hooks/exhaustive-deps

  const cell = (selected: boolean, done: boolean) => cn(
    "btn-3d min-h-14 border-2 px-3 py-3 text-lg normal-case tracking-normal disabled:opacity-100",
    done ? "border-success/40 bg-success-soft text-success-shade opacity-60 shadow-none"
      : selected ? cn("border-gem bg-gem/10 text-gem shadow-[0_4px_0_var(--gem)]", wrong && "animate-shake border-destructive text-destructive")
      : "border-border bg-card shadow-[0_4px_0_var(--border)]",
  );

  return (
    <div className="mt-8 grid grid-cols-2 gap-3">
      <div className="flex flex-col gap-3">
        {q.pairs.map(([word], idx) => (
          <button key={word} dir={dirOf(target)} disabled={disabled || matched.includes(idx)} className={cell(left === idx, matched.includes(idx))}
            onClick={() => { setLeft(idx); speak(word, target); }}>{word}</button>
        ))}
      </div>
      <div className="flex flex-col gap-3">
        {rightOrder.map((idx) => (
          <button key={q.pairs[idx]![1]} dir={dirOf(native)} disabled={disabled || matched.includes(idx)} className={cell(right === idx, matched.includes(idx))}
            onClick={() => setRight(idx)}>{q.pairs[idx]![1]}</button>
        ))}
      </div>
    </div>
  );
}

function Chip({ children, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button {...props} className="animate-pop rounded-xl border-2 border-border bg-card px-4 py-2 font-semibold shadow-[0_3px_0_var(--border)] transition-transform active:translate-y-0.5">
      {children}
    </button>
  );
}

function GameOver({ gems, adsLeft, onRefill, onWatchAd, onQuit }: { gems: number; adsLeft: number; onRefill: () => void; onWatchAd: () => void; onQuit: () => void }) {
  const { t } = useT();
  const canAfford = gems >= REFILL_COST;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-secondary/70 backdrop-blur-sm sm:items-center">
      <div className="w-full max-w-md animate-slide-up rounded-t-3xl bg-card p-6 text-center sm:rounded-3xl">
        <HeartCrack className="mx-auto size-16 animate-pop text-destructive" />
        <h2 className="mt-3 text-3xl font-bold text-secondary">{t("outOfHearts")}</h2>
        <p className="mt-2 text-muted-foreground">{t("outOfHeartsSub")}</p>
        <div className="mt-6 space-y-3">
          <ChunkyButton disabled={!canAfford} onClick={onRefill} className="flex items-center justify-center gap-2">
            {t("refillFor")} <Gem className="size-5" /> {REFILL_COST}
          </ChunkyButton>
          {!canAfford && <p className="text-sm text-destructive">{t("youHaveGems", { n: gems })}</p>}
          <ChunkyButton variant="secondary" disabled={adsLeft <= 0} onClick={onWatchAd} className="flex items-center justify-center gap-2">
            <PlayCircle className="size-5" /> {t("watchAdRefill")}
          </ChunkyButton>
          {adsLeft <= 0 && <p className="text-sm text-muted-foreground">{t("adLimit")}</p>}
          <ChunkyButton variant="outline" onClick={onQuit}>{t("quitLesson")}</ChunkyButton>
        </div>
      </div>
    </div>
  );
}

function Complete({ reward, perfect, practice, onContinue }: { reward: { xp: number; gems: number; freezeUsed: number }; perfect: boolean; practice: boolean; onContinue: () => void }) {
  const p = useProgress();
  const { t } = useT();
  const bonus = lessonReward(0).xp - lessonReward(1).xp;
  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-between px-6 py-10 text-center">
      <div />
      <div className="w-full">
        <img src={fox} alt="" width={180} height={180} className="mx-auto size-44 animate-float" />
        <h1 className="mt-4 text-4xl font-bold text-primary">{t(practice ? "practiceDone" : "lessonComplete")}</h1>
        {reward.freezeUsed > 0 && <p className="mt-2 font-display font-semibold text-gem">{t("freezeSaved", { n: reward.freezeUsed })}</p>}
        {perfect && !practice && <p className="mt-2 font-display font-semibold text-success-shade">{t("perfectLesson", { n: bonus })}</p>}
        <div className="mt-6 grid grid-cols-3 gap-3">
          <Tile label={t("earned")} value={`+${reward.xp}`} icon={<Zap className="size-5 fill-primary-foreground" />} tone="bg-primary" />
          <Tile label={t("gems")} value={`+${reward.gems}`} icon={<Gem className="size-5" />} tone="bg-gem" />
          <Tile label={t("totalXp")} value={String(p.xp)} icon={<Zap className="size-5" />} tone="bg-secondary" />
        </div>
        <AdBanner slot="lessonComplete" className="mt-6" />
      </div>
      <ChunkyButton variant="success" onClick={onContinue} className="mt-6">{t("continue")}</ChunkyButton>
    </div>
  );
}

function Tile({ label, value, icon, tone }: { label: string; value: string; icon: ReactNode; tone: string }) {
  return (
    <div className={cn("overflow-hidden rounded-2xl border-2 border-transparent", tone)}>
      <p className="py-1 text-xs font-bold uppercase text-primary-foreground">{label}</p>
      <p className="flex items-center justify-center gap-1 rounded-xl bg-card py-3 font-display text-xl font-bold text-foreground">{icon}{value}</p>
    </div>
  );
}
