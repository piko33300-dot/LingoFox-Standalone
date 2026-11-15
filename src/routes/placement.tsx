import { useState, useMemo } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, CheckCircle2, ChevronLeft, ChevronRight, Compass, Sparkles, Trophy, Volume2, X, XCircle, Zap } from "lucide-react";
import { ChunkyButton } from "@/components/lingo/ChunkyButton";
import { FoxMascot } from "@/components/lingo/FoxMascot";
import { COURSES, getCourse, isBuiltAnswerCorrect, type CourseId, type LangCode, type MCQuestion, type BuilderQuestion, type Question } from "@/lib/lessons";
import { progressActions, useProgress } from "@/lib/progress-store";
import { evaluatePlacement, getPlacementQuestions, type PlacementResult } from "@/lib/placement";
import { playSound } from "@/lib/sound";
import { speak } from "@/lib/speech";
import { dirOf, useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/placement")({
  head: () => ({
    meta: [
      { title: "اختبار تحديد المستوى — LingoFox" },
      { name: "description", content: "حدّد مستواك في اللغة خلال دقيقتين ودع فوكس يختار لك الوحدة المناسبة لتخطي الأساسيات والبدء فوراً." },
      { property: "og:title", content: "اختبار تحديد المستوى — LingoFox" },
      { property: "og:description", content: "اختبار ذكي وسريع لتحديد مستواك وبدء التعلم من الوحدة التي تناسبك." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PlacementPage,
});

type Step = "choose_lang" | "quiz" | "result";
type Status = "answering" | "correct" | "wrong";

function PlacementPage() {
  const p = useProgress();
  const navigate = useNavigate();
  const { t, loc, dir, lang } = useT();
  const Arrow = dir === "rtl" ? ArrowRight : ArrowLeft;
  const Chevron = dir === "rtl" ? ChevronLeft : ChevronRight;

  const [selectedCourse, setSelectedCourse] = useState<CourseId>(p.course ?? "en");
  const [step, setStep] = useState<Step>(p.course ? "quiz" : "choose_lang");

  // Quiz state
  const questions = useMemo(() => getPlacementQuestions(selectedCourse), [selectedCourse]);
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [status, setStatus] = useState<Status>("answering");
  const [pick, setPick] = useState<string | null>(null);
  const [built, setBuilt] = useState<number[]>([]);
  const [result, setResult] = useState<PlacementResult | null>(null);

  const course = getCourse(selectedCourse) ?? getCourse("en")!;
  const q = questions[index]!;

  const canCheck = q.type === "mc" ? pick !== null : q.type === "builder" ? built.length > 0 : false;

  const handleCheck = () => {
    if (!canCheck || status !== "answering") return;
    let ok = false;
    if (q.type === "mc") {
      ok = pick === q.answer;
    } else if (q.type === "builder") {
      const words = built.map((idx) => q.bank[idx]!);
      ok = isBuiltAnswerCorrect(q, words);
    }

    if (ok) {
      playSound("correct");
      setStatus("correct");
      setScore((s) => s + 1);
    } else {
      playSound("wrong");
      setStatus("wrong");
    }
  };

  const handleNext = () => {
    playSound("tap");
    setPick(null);
    setBuilt([]);
    setStatus("answering");

    if (index + 1 < questions.length) {
      setIndex((i) => i + 1);
    } else {
      // Finished all diagnostic questions
      const finalScore = status === "correct" ? score : score; // already updated in handleCheck
      const evaluated = evaluatePlacement(selectedCourse, finalScore, questions.length);
      setResult(evaluated);
      setStep("result");
      playSound("complete");
    }
  };

  const startWithCourse = (cid: CourseId) => {
    playSound("tap");
    setSelectedCourse(cid);
    setIndex(0);
    setScore(0);
    setPick(null);
    setBuilt([]);
    setStatus("answering");
    setStep("quiz");
  };

  const applyAndProceed = () => {
    if (!result) return;
    playSound("complete");
    progressActions.applyPlacement(result.courseId, result.targetUnitIndex, result.bonusXp);
    void navigate({ to: "/learn" });
  };

  // 1. Language selector view
  if (step === "choose_lang") {
    return (
      <main className="mx-auto min-h-dvh max-w-md px-5 py-6">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => navigate({ to: p.course ? "/learn" : "/" })}
            className="flex items-center gap-1 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
          >
            <Arrow className="size-4" />
            <span>{p.course ? t("backToLearn") : t("goHome")}</span>
          </button>
        </div>

        <div className="text-center">
          <FoxMascot mood="neutral" size="lg" speech={t("placementSubtitle")} />
          <h1 className="mt-4 text-3xl font-bold text-secondary">{t("placementTitle")}</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">{t("placementChooseLang")}</p>
        </div>

        <div className="mt-6 space-y-3">
          {COURSES.map((c) => (
            <button
              key={c.id}
              onClick={() => startWithCourse(c.id)}
              className={cn(
                "btn-3d flex w-full items-center gap-4 border-2 bg-card p-4 text-start normal-case tracking-normal",
                selectedCourse === c.id ? "border-primary shadow-[0_4px_0_var(--primary-shade)]" : "border-border shadow-[0_4px_0_var(--border)]",
              )}
            >
              <span className="text-4xl" aria-hidden>{c.flag}</span>
              <span className="flex-1">
                <span className="block text-lg font-bold text-secondary">{loc(c.title)}</span>
                <span className="block text-xs font-normal text-muted-foreground">{loc(c.subtitle)}</span>
              </span>
              <Chevron className="size-5 text-muted-foreground" />
            </button>
          ))}
        </div>
      </main>
    );
  }

  // 2. Result Assessment View
  if (step === "result" && result) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-between px-5 py-6">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setStep("choose_lang")}
            className="flex items-center gap-1 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
          >
            <Arrow className="size-4" />
            <span>{t("placementRetake")}</span>
          </button>
          <span className="text-2xl">{course.flag}</span>
        </div>

        <div className="my-auto py-6 text-center animate-slide-up">
          <FoxMascot mood="celebrate" size="lg" speech={loc(result.levelDesc)} />

          <div className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-gold/15 px-3.5 py-1 text-sm font-bold text-gold">
            <Trophy className="size-4" />
            <span>{t("placementScore", { score: result.score, total: result.total })}</span>
          </div>

          <h1 className="mt-3 text-2xl font-bold text-secondary">{loc(result.levelLabel)}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("placementResultSub")}</p>

          <div className="mt-6 space-y-3 text-start">
            <div className="rounded-2xl border-2 border-primary/30 bg-primary/5 p-4 shadow-sm">
              <p className="text-xs font-semibold text-primary">{t("placementTargetUnit", { unit: result.targetUnitIndex + 1 })}</p>
              <h2 className="mt-1 text-lg font-bold text-secondary">{loc(result.targetUnitTitle)}</h2>
              {result.skippedUnitsCount > 0 ? (
                <p className="mt-1 text-xs text-muted-foreground">{t("placementUnlockedMsg", { count: result.skippedUnitsCount })}</p>
              ) : null}
            </div>

            <div className="flex items-center gap-3 rounded-2xl border-2 border-border bg-card p-3.5">
              <span className="grid size-10 place-items-center rounded-xl bg-ember/15 text-ember">
                <Zap className="size-5" />
              </span>
              <div>
                <p className="font-display text-sm font-bold text-secondary">{t("placementBonusXp", { xp: result.bonusXp })}</p>
                <p className="text-xs text-muted-foreground">{t("placementResultTitle")}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-4">
          <ChunkyButton variant="success" onClick={applyAndProceed} className="w-full">
            {t("placementStartLearning")}
          </ChunkyButton>
        </div>
      </main>
    );
  }

  // 3. Diagnostic Quiz View
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-between px-4 pb-6 pt-4">
      {/* Top Header */}
      <div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            aria-label={t("quitLesson")}
            onClick={() => navigate({ to: p.course ? "/learn" : "/courses" })}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="size-6" />
          </button>
          <div className="relative h-3 flex-1 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-ember transition-all duration-300"
              style={{ width: `${((index + 1) / questions.length) * 100}%` }}
            />
          </div>
          <span className="text-xs font-semibold text-muted-foreground">
            {index + 1}/{questions.length}
          </span>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
            <Compass className="size-3" />
            <span>{loc(course.title)}</span>
          </span>
          <span className="text-xs text-muted-foreground">{t("placementQuestionsLeft", { current: index + 1, total: questions.length })}</span>
        </div>

        <h2 className="mt-2 text-xl font-bold text-secondary">
          {q.type === "mc" ? (lang === "ar" ? "اختر المعنى الصحيح:" : "Select the correct translation:") : (lang === "ar" ? "كوّن الجملة الصحيحة:" : "Build the correct sentence:")}
        </h2>

        {/* Question Area */}
        <div className="mt-4">
          {q.type === "mc" ? (
            <PlacementMC
              q={q}
              target={course.target}
              native={course.native}
              pick={pick}
              onPick={(text) => {
                if (status === "answering") {
                  playSound("tap");
                  setPick(text);
                }
              }}
              status={status}
            />
          ) : q.type === "builder" ? (
            <PlacementBuilder
              q={q}
              target={course.target}
              native={course.native}
              built={built}
              setBuilt={(next) => {
                if (status === "answering") {
                  playSound("tap");
                  setBuilt(next);
                }
              }}
              status={status}
            />
          ) : null}
        </div>
      </div>

      {/* Bottom Feedback and Action Bar */}
      <div className="mt-8 space-y-4">
        {status !== "answering" && (
          <div
            className={cn(
              "flex items-center gap-3 rounded-2xl p-4 animate-slide-up",
              status === "correct" ? "bg-success/15 text-success-shade" : "bg-destructive/15 text-destructive",
            )}
          >
            {status === "correct" ? <CheckCircle2 className="size-7 shrink-0" /> : <XCircle className="size-7 shrink-0" />}
            <div className="flex-1">
              <p className="font-display font-bold">{status === "correct" ? t("correct") : t("correctAnswer")}</p>
              {status === "wrong" && (
                <p className="text-sm font-semibold opacity-90">
                  {q.type === "mc" ? q.answer : q.type === "builder" ? q.answer.join(" ") : ""}
                </p>
              )}
            </div>
          </div>
        )}

        {status === "answering" ? (
          <ChunkyButton variant="success" disabled={!canCheck} onClick={handleCheck} className="w-full">
            {t("check")}
          </ChunkyButton>
        ) : (
          <ChunkyButton variant={status === "correct" ? "success" : "danger"} onClick={handleNext} className="w-full">
            {t("continue")}
          </ChunkyButton>
        )}
      </div>
    </main>
  );
}

function PlacementMC({
  q,
  target,
  native,
  pick,
  onPick,
  status,
}: {
  q: MCQuestion;
  target: LangCode;
  native: LangCode;
  pick: string | null;
  onPick: (s: string) => void;
  status: Status;
}) {
  return (
    <>
      <div className="flex items-center gap-3">
        <FoxMascot mood={status === "correct" ? "celebrate" : status === "wrong" ? "encourage" : "neutral"} size="md" speech={q.word} speechLang={target} hint={q.hint} />
        <button
          type="button"
          onClick={() => speak(q.word, target)}
          className="btn-3d flex size-10 shrink-0 items-center justify-center rounded-xl bg-gem text-primary-foreground shadow-[0_4px_0_oklch(0.5_0.15_240)]"
        >
          <Volume2 className="size-5" />
        </button>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        {q.options.map((o) => (
          <button
            key={o.text}
            disabled={status !== "answering"}
            onClick={() => onPick(o.text)}
            className={cn(
              "btn-3d flex flex-col items-center gap-2 border-2 bg-card p-4 normal-case tracking-normal disabled:opacity-100",
              pick === o.text ? "border-gem bg-gem/10 text-gem shadow-[0_4px_0_var(--gem)]" : "border-border shadow-[0_4px_0_var(--border)]",
            )}
          >
            <span className="text-4xl">{o.emoji}</span>
            <span dir={dirOf(native)} className="text-base font-semibold">{o.text}</span>
          </button>
        ))}
      </div>
    </>
  );
}

function PlacementBuilder({
  q,
  target,
  native,
  built,
  setBuilt,
  status,
}: {
  q: BuilderQuestion;
  target: LangCode;
  native: LangCode;
  built: number[];
  setBuilt: (b: number[]) => void;
  status: Status;
}) {
  return (
    <>
      <div className="flex items-center gap-3">
        <FoxMascot mood={status === "correct" ? "celebrate" : status === "wrong" ? "encourage" : "neutral"} size="md" speech={q.sentence} speechLang={target} />
        <button
          type="button"
          onClick={() => speak(q.sentence, target)}
          className="btn-3d flex size-10 shrink-0 items-center justify-center rounded-xl bg-gem text-primary-foreground shadow-[0_4px_0_oklch(0.5_0.15_240)]"
        >
          <Volume2 className="size-5" />
        </button>
      </div>

      <div dir={dirOf(native)} className="mt-5 flex min-h-24 flex-wrap content-start gap-2 rounded-2xl border-2 border-border bg-card/50 p-3">
        {built.map((b, pos) => (
          <button
            key={`${b}-${pos}`}
            disabled={status !== "answering"}
            onClick={() => setBuilt(built.filter((_, k) => k !== pos))}
            className="animate-pop rounded-xl border-2 border-border bg-card px-3.5 py-1.5 font-semibold shadow-[0_3px_0_var(--border)] active:translate-y-0.5"
          >
            {q.bank[b]}
          </button>
        ))}
      </div>

      <div dir={dirOf(native)} className="mt-4 flex flex-wrap gap-2">
        {q.bank.map((w, b) => {
          const used = built.includes(b);
          return (
            <button
              key={`${w}-${b}`}
              disabled={used || status !== "answering"}
              onClick={() => setBuilt([...built, b])}
              className={cn(
                "rounded-xl border-2 px-3.5 py-1.5 font-semibold transition-transform active:translate-y-0.5",
                used ? "border-transparent bg-muted text-transparent shadow-none pointer-events-none" : "border-border bg-card shadow-[0_3px_0_var(--border)]",
              )}
            >
              {w}
            </button>
          );
        })}
      </div>
    </>
  );
}
