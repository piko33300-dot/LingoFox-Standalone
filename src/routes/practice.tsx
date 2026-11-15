import { useEffect, useState, useMemo } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Flame,
  Heart,
  Repeat,
  Zap,
  Volume2,
  Search,
  ArrowRight,
  BookOpen,
  Sparkles,
  Trophy,
  Play,
  RotateCcw,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { getCourse, getCourseVocabulary, MAX_HEARTS, type Course, type VocabItem } from "@/lib/lessons";
import { dayKey, progressActions, useProgress } from "@/lib/progress-store";
import { pickPractice, pickDrillSession } from "@/lib/review";
import { useT } from "@/lib/i18n";
import { LOCALE, speak } from "@/lib/speech";
import { playSound } from "@/lib/sound";
import { Quiz, type PracticeSession } from "@/components/lingo/Quiz";
import { FoxMascot } from "@/components/lingo/FoxMascot";
import { TopBar } from "@/components/lingo/TopBar";
import { AppPage, BottomNav } from "@/components/lingo/BottomNav";

export const Route = createFileRoute("/practice")({
  head: () => ({
    meta: [
      { title: "مركز التدريب والمراجعة — LingoFox" },
      { name: "description", content: "تدرّب على تثبيت الكلمات، استعد قلوبك، وتحدَّ سرعتك مع الثعلب." },
      { property: "og:title", content: "مركز التدريب — LingoFox" },
      { property: "og:description", content: "تدريب ذكي ومراجعة متباعدة وتحديات سرعة." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PracticeRoute,
});

type PracticeMode = "hub" | "drill" | "match-madness" | "vocab";

function PracticeRoute() {
  const p = useProgress();
  const { t, loc, dir } = useT();
  const [mode, setMode] = useState<PracticeMode>("hub");
  const [session, setSession] = useState<PracticeSession | null>(null);

  const course = getCourse(p.course) ?? getCourse("en")!;
  const srsDueItems = useMemo(() => {
    return pickPractice(p.review, p.completed, course.id, dayKey(new Date()));
  }, [p.review, p.completed, course.id]);

  const vocabulary = useMemo(() => {
    return getCourseVocabulary(course);
  }, [course]);

  // Start heart recovery / regular drill
  const handleStartHeartDrill = () => {
    const drillItems = srsDueItems.length > 0 ? srsDueItems : pickDrillSession(course.id, 5);
    setSession({ course, items: drillItems });
    setMode("drill");
  };

  // Start SRS due review
  const handleStartSrs = () => {
    if (srsDueItems.length === 0) return;
    setSession({ course, items: srsDueItems });
    setMode("drill");
  };

  if (mode === "drill" && session) {
    return (
      <div className="relative min-h-dvh bg-background">
        <button
          type="button"
          onClick={() => {
            setMode("hub");
            setSession(null);
          }}
          className="absolute top-4 start-4 z-40 rounded-full bg-card p-2 text-muted-foreground shadow-soft ring-1 ring-border/70 hover:text-foreground"
          aria-label={t("back")}
        >
          <ArrowRight className="size-5 rtl:rotate-180" />
        </button>
        <Quiz practice={session} />
      </div>
    );
  }

  if (mode === "match-madness") {
    return <MatchMadnessView course={course} vocabulary={vocabulary} onBack={() => setMode("hub")} />;
  }

  if (mode === "vocab") {
    return <VocabularyVaultView course={course} vocabulary={vocabulary} onBack={() => setMode("hub")} />;
  }

  return (
    <AppPage>
      <TopBar />
      <main className="mx-auto max-w-md space-y-6 px-4 pt-6">
        {/* Header Hero */}
        <section className="relative overflow-hidden rounded-3xl border-2 border-border bg-gradient-to-br from-card via-card to-accent/30 p-6 shadow-soft">
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-1.5">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 font-display text-xs font-bold text-primary">
                <Sparkles className="size-3.5 text-primary" />
                {course.flag} {loc(course.title)}
              </span>
              <h1 className="font-display text-2xl font-black text-secondary">
                {t("practiceHubTitle")}
              </h1>
              <p className="text-xs font-medium text-muted-foreground leading-relaxed">
                {t("practiceHubSubtitle")}
              </p>
            </div>
            <div className="shrink-0">
              <FoxMascot size="sm" mood="thinking" />
            </div>
          </div>
        </section>

        {/* Action Hub Cards */}
        <div className="grid gap-3.5">
          {/* Card 1: Heart Recovery Drill */}
          <button
            type="button"
            onClick={handleStartHeartDrill}
            className="group relative flex w-full items-center gap-4 rounded-2xl border-2 border-destructive/20 bg-card p-4 text-start shadow-soft transition-all hover:border-destructive/50 hover:shadow-md active:scale-[0.99]"
          >
            <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-destructive/10 text-destructive ring-1 ring-destructive/20 group-hover:scale-105 transition-transform">
              <Heart className="size-6 fill-destructive" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="font-display font-bold text-foreground">
                  {t("heartPracticeTitle")}
                </h2>
                <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-[11px] font-bold text-destructive">
                  +1 ❤️
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                {t("heartPracticeDesc")}
              </p>
            </div>
            <Play className="size-5 shrink-0 text-destructive group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5 transition-transform" />
          </button>

          {/* Card 2: Match Madness 60s */}
          <button
            type="button"
            onClick={() => setMode("match-madness")}
            className="group relative flex w-full items-center gap-4 rounded-2xl border-2 border-flame/20 bg-card p-4 text-start shadow-soft transition-all hover:border-flame/50 hover:shadow-md active:scale-[0.99]"
          >
            <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-flame/10 text-flame ring-1 ring-flame/20 group-hover:scale-105 transition-transform">
              <Zap className="size-6 fill-flame" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="font-display font-bold text-foreground">
                  {t("matchMadnessTitle")}
                </h2>
                <span className="rounded-full bg-flame/15 px-2 py-0.5 text-[11px] font-bold text-flame">
                  60s ⚡
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                {t("matchMadnessDesc")}
              </p>
            </div>
            <Play className="size-5 shrink-0 text-flame group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5 transition-transform" />
          </button>

          {/* Card 3: Spaced Repetition (SRS) Review */}
          <button
            type="button"
            onClick={handleStartSrs}
            disabled={srsDueItems.length === 0}
            className={`group relative flex w-full items-center gap-4 rounded-2xl border-2 p-4 text-start shadow-soft transition-all ${
              srsDueItems.length > 0
                ? "border-primary/30 bg-card hover:border-primary/60 hover:shadow-md active:scale-[0.99]"
                : "border-border bg-card/60 opacity-75"
            }`}
          >
            <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/20">
              <Repeat className="size-6" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="font-display font-bold text-foreground">
                  {t("practiceTitle")}
                </h2>
                {srsDueItems.length > 0 && (
                  <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[11px] font-bold text-primary">
                    {srsDueItems.length}
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                {srsDueItems.length > 0
                  ? t("practiceDue", { n: srsDueItems.length })
                  : t("practiceDone")}
              </p>
            </div>
            {srsDueItems.length > 0 && (
              <Play className="size-5 shrink-0 text-primary group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5 transition-transform" />
            )}
          </button>

          {/* Card 4: Vocabulary Vault */}
          <button
            type="button"
            onClick={() => setMode("vocab")}
            className="group relative flex w-full items-center gap-4 rounded-2xl border-2 border-border bg-card p-4 text-start shadow-soft transition-all hover:border-primary/40 hover:shadow-md active:scale-[0.99]"
          >
            <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-secondary/10 text-secondary ring-1 ring-secondary/20 group-hover:scale-105 transition-transform">
              <BookOpen className="size-6" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="font-display font-bold text-foreground">
                  {t("vocabVaultTitle")}
                </h2>
                <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-bold text-muted-foreground">
                  {t("vocabCount", { n: vocabulary.length })}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                {t("vocabVaultDesc")}
              </p>
            </div>
            <ArrowRight className="size-5 shrink-0 text-muted-foreground rtl:rotate-180 group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5 transition-transform" />
          </button>
        </div>
      </main>
      <BottomNav />
    </AppPage>
  );
}

/** ---------------- Match Madness 60-Second Game ---------------- */
function MatchMadnessView({
  course,
  vocabulary,
  onBack,
}: {
  course: Course;
  vocabulary: VocabItem[];
  onBack: () => void;
}) {
  const { t } = useT();
  const [timeLeft, setTimeLeft] = useState(60);
  const [matches, setMatches] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);

  // Active word pairs on board (up to 5 pairs)
  const [pool, setPool] = useState<VocabItem[]>(() => {
    return [...vocabulary].sort(() => Math.random() - 0.5);
  });
  const [activePairs, setActivePairs] = useState<VocabItem[]>(() => {
    return pool.slice(0, 5);
  });

  const [selectedTarget, setSelectedTarget] = useState<string | null>(null);
  const [selectedNative, setSelectedNative] = useState<string | null>(null);
  const [wrongAnimation, setWrongAnimation] = useState(false);
  const [earnedSummary, setEarnedSummary] = useState<{ earnedXp: number; earnedGems: number } | null>(null);

  // Shuffled lists for UI display
  const targetWords = useMemo(() => {
    return activePairs.map((p) => p.word).sort((a, b) => a.localeCompare(b));
  }, [activePairs]);

  const nativeWords = useMemo(() => {
    return activePairs.map((p) => p.translation).sort((a, b) => a.localeCompare(b));
  }, [activePairs]);

  // Timer countdown
  useEffect(() => {
    if (isGameOver) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleGameOver();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isGameOver, matches]);

  const handleGameOver = () => {
    setIsGameOver(true);
    playSound("complete");
    const res = progressActions.completeSpeedChallenge(matches);
    setEarnedSummary(res);
  };

  const handleSelectTarget = (word: string) => {
    playSound("tap");
    setSelectedTarget(word);
    checkMatch(word, selectedNative);
  };

  const handleSelectNative = (trans: string) => {
    playSound("tap");
    setSelectedNative(trans);
    checkMatch(selectedTarget, trans);
  };

  const checkMatch = (target: string | null, native: string | null) => {
    if (!target || !native) return;

    const matchedPair = activePairs.find((p) => p.word === target && p.translation === native);
    if (matchedPair) {
      playSound("correct");
      setMatches((m) => m + 1);
      setSelectedTarget(null);
      setSelectedNative(null);

      // Replace matched pair with a fresh word from pool
      setActivePairs((prev) => {
        const remaining = prev.filter((p) => p !== matchedPair);
        const nextFromPool = pool.find((p) => !prev.includes(p) && p !== matchedPair);
        return nextFromPool ? [...remaining, nextFromPool] : remaining;
      });
    } else {
      playSound("wrong");
      setWrongAnimation(true);
      setTimeout(() => {
        setWrongAnimation(false);
        setSelectedTarget(null);
        setSelectedNative(null);
      }, 500);
    }
  };

  const handlePlayAgain = () => {
    setTimeLeft(60);
    setMatches(0);
    setIsGameOver(false);
    setSelectedTarget(null);
    setSelectedNative(null);
    const shuffled = [...vocabulary].sort(() => Math.random() - 0.5);
    setPool(shuffled);
    setActivePairs(shuffled.slice(0, 5));
    setEarnedSummary(null);
  };

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-between p-4 bg-background">
      {/* Top Header */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={onBack}
            className="rounded-full bg-card p-2 text-muted-foreground shadow-soft ring-1 ring-border/70 hover:text-foreground"
            aria-label={t("back")}
          >
            <ArrowRight className="size-5 rtl:rotate-180" />
          </button>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 rounded-full bg-flame/15 px-3 py-1 font-display font-bold text-flame text-sm">
              <Flame className="size-4 fill-flame" />
              {t("matchMadnessScore")}: {matches}
            </span>
            <span className="flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 font-display font-bold text-foreground text-sm">
              ⏱️ {timeLeft}s
            </span>
          </div>
        </div>

        {/* Animated Timer Bar */}
        <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full bg-gradient-to-r from-primary to-flame transition-all duration-1000 ease-linear"
            style={{ width: `${(timeLeft / 60) * 100}%` }}
          />
        </div>
      </div>

      {/* Main Game Screen */}
      {!isGameOver ? (
        <div className="my-auto space-y-4">
          <div className="text-center">
            <p className="font-display text-sm font-semibold text-muted-foreground">
              {t("matchMadnessDesc")}
            </p>
          </div>

          <div className={`grid grid-cols-2 gap-3 transition-transform ${wrongAnimation ? "animate-shake" : ""}`}>
            {/* Target Language Column */}
            <div className="space-y-2">
              {targetWords.map((word) => {
                const isSelected = selectedTarget === word;
                return (
                  <button
                    key={word}
                    type="button"
                    onClick={() => handleSelectTarget(word)}
                    className={`btn-3d w-full rounded-2xl border-2 px-3 py-3.5 font-display text-base font-bold transition-all shadow-[0_3px_0_rgba(0,0,0,0.1)] ${
                      isSelected
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-card text-foreground hover:bg-muted"
                    }`}
                  >
                    {word}
                  </button>
                );
              })}
            </div>

            {/* Native Language Column */}
            <div className="space-y-2">
              {nativeWords.map((trans) => {
                const isSelected = selectedNative === trans;
                return (
                  <button
                    key={trans}
                    type="button"
                    onClick={() => handleSelectNative(trans)}
                    className={`btn-3d w-full rounded-2xl border-2 px-3 py-3.5 font-display text-base font-bold transition-all shadow-[0_3px_0_rgba(0,0,0,0.1)] ${
                      isSelected
                        ? "border-flame bg-flame text-white"
                        : "border-border bg-card text-foreground hover:bg-muted"
                    }`}
                  >
                    {trans}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        /* Game Over Dialog Card */
        <div className="my-auto space-y-6 rounded-3xl border-2 border-border bg-card p-6 text-center shadow-lg">
          <FoxMascot mood="celebrate" size="md" />
          <div className="space-y-2">
            <h2 className="font-display text-2xl font-black text-secondary">
              {t("matchMadnessFinish")}
            </h2>
            <p className="text-sm font-semibold text-muted-foreground">
              {t("matchMadnessScore")}: {matches} مطابقة
            </p>
            {earnedSummary && (
              <div className="flex justify-center gap-4 py-2">
                <span className="flex items-center gap-1.5 rounded-full bg-primary/10 px-3.5 py-1.5 font-display font-bold text-primary">
                  <Zap className="size-4 fill-primary" />+{earnedSummary.earnedXp} XP
                </span>
                {earnedSummary.earnedGems > 0 && (
                  <span className="flex items-center gap-1.5 rounded-full bg-gem/15 px-3.5 py-1.5 font-display font-bold text-gem">
                    💎 +{earnedSummary.earnedGems}
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="space-y-2.5 pt-2">
            <button
              type="button"
              onClick={handlePlayAgain}
              className="btn-3d flex w-full items-center justify-center gap-2 bg-primary px-4 py-3.5 font-display font-bold text-primary-foreground shadow-[0_4px_0_var(--primary-shade)]"
            >
              <RotateCcw className="size-5" />
              {t("matchMadnessPlayAgain")}
            </button>
            <button
              type="button"
              onClick={onBack}
              className="btn-3d flex w-full items-center justify-center gap-2 border-2 border-border bg-card px-4 py-3 font-display font-semibold text-muted-foreground hover:text-foreground shadow-[0_3px_0_rgba(0,0,0,0.06)]"
            >
              {t("back")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/** ---------------- Vocabulary Vault View ---------------- */
function VocabularyVaultView({
  course,
  vocabulary,
  onBack,
}: {
  course: Course;
  vocabulary: VocabItem[];
  onBack: () => void;
}) {
  const { t, loc } = useT();
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search.trim()) return vocabulary;
    const q = search.trim().toLowerCase();
    return vocabulary.filter(
      (v) => v.word.toLowerCase().includes(q) || v.translation.toLowerCase().includes(q),
    );
  }, [vocabulary, search]);

  const handleSpeak = (word: string) => {
    playSound("tap");
    speak(word, LOCALE[course.target]);
  };

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col p-4 bg-background">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-4 border-b border-border">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="rounded-full bg-card p-2 text-muted-foreground shadow-soft ring-1 ring-border/70 hover:text-foreground"
            aria-label={t("back")}
          >
            <ArrowRight className="size-5 rtl:rotate-180" />
          </button>
          <div>
            <h1 className="font-display text-xl font-bold text-foreground">
              {t("vocabVaultTitle")}
            </h1>
            <p className="text-xs text-muted-foreground">
              {course.flag} {loc(course.title)} • {t("vocabCount", { n: filtered.length })}
            </p>
          </div>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative my-4">
        <Search className="absolute start-3.5 top-3.5 size-4 text-muted-foreground" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("vocabSearchPlaceholder")}
          className="w-full rounded-2xl border-2 border-border bg-card py-2.5 ps-10 pe-4 text-sm font-medium text-foreground outline-none transition-colors focus:border-primary shadow-soft"
        />
      </div>

      {/* Words List */}
      <div className="flex-1 space-y-2.5 overflow-y-auto pb-10">
        {filtered.length > 0 ? (
          filtered.map((item, idx) => (
            <div
              key={`${item.word}-${idx}`}
              className="flex items-center justify-between gap-3 rounded-2xl border-2 border-border/80 bg-card p-3.5 shadow-soft transition-all hover:border-primary/40"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-display text-base font-bold text-foreground">
                    {item.word}
                  </span>
                  <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                    {loc(item.unitTitle)}
                  </span>
                </div>
                <p className="text-xs font-medium text-muted-foreground mt-0.5">
                  {item.translation}
                </p>
              </div>

              <button
                type="button"
                onClick={() => handleSpeak(item.word)}
                className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary transition-transform hover:scale-105 active:scale-95"
                aria-label={item.word}
              >
                <Volume2 className="size-4" />
              </button>
            </div>
          ))
        ) : (
          <div className="py-12 text-center text-muted-foreground">
            <p className="font-display font-semibold">{t("vocabEmpty")}</p>
          </div>
        )}
      </div>
    </div>
  );
}
