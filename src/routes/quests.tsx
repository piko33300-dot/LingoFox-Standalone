import { useState, useEffect } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Sparkles,
  Trophy,
  Zap,
  BookOpen,
  Star,
  CheckCircle2,
  Clock,
  ArrowRight,
  ArrowLeft,
  Flame,
  Award,
} from "lucide-react";
import { toast } from "sonner";
import { TopBar } from "@/components/lingo/TopBar";
import { AppPage, BottomNav } from "@/components/lingo/BottomNav";
import { FoxMascot, type FoxMood } from "@/components/lingo/FoxMascot";
import { useProgress, progressActions } from "@/lib/progress-store";
import {
  evaluateDailyQuests,
  evaluateMonthlyChallenge,
  timeUntilMidnight,
} from "@/lib/quests";
import { playSound } from "@/lib/sound";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/quests")({
  head: () => ({
    meta: [
      { title: "المهام والتحديات اليومية — LingoFox" },
      { name: "description", content: "أكمل المهام اليومية مع ثعلب اللغات لكسب الجواهر ونقاط الخبرة وشارات الإنجاز." },
      { property: "og:title", content: "المهام والتحديات اليومية — LingoFox" },
      { property: "og:description", content: "تحدَّ نفسك يومياً واكسب مكافآت مضاعفة." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: QuestsPage,
});

function QuestsPage() {
  const p = useProgress();
  const { t, dir } = useT();

  const [timeLeft, setTimeLeft] = useState(() => timeUntilMidnight());

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(timeUntilMidnight());
    }, 60 * 1000);
    return () => clearInterval(timer);
  }, []);

  const quests = evaluateDailyQuests(p);
  const monthly = evaluateMonthlyChallenge(p);

  const completedCount = quests.filter((q) => q.completed).length;
  const claimedCount = quests.filter((q) => q.claimed).length;
  const readyToClaimCount = quests.filter((q) => q.completed && !q.claimed).length;
  const allClaimed = quests.length > 0 && claimedCount === quests.length;

  const mascotMood: FoxMood = allClaimed
    ? "celebrate"
    : readyToClaimCount > 0
    ? "celebrate"
    : completedCount > 0
    ? "encourage"
    : "neutral";

  const mascotSpeech = allClaimed
    ? t("questsHeroAllDone")
    : readyToClaimCount > 0
    ? t("questCompleted")
    : t("questsHeroEncourage");

  const handleClaim = (questId: string, gems: number, xp: number) => {
    const ok = progressActions.claimQuest(questId, gems, xp);
    if (ok) {
      playSound("complete");
      toast.success(t("questClaimedToast", { gems, xp }));
    }
  };

  const BackIcon = dir === "rtl" ? ArrowRight : ArrowLeft;

  return (
    <AppPage>
      <TopBar />

      <main className="mx-auto max-w-xl px-4 pb-12 pt-4">
        {/* Navigation link back to learn */}
        <div className="mb-4">
          <Link
            to="/learn"
            className="inline-flex items-center gap-2 font-display text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
          >
            <BackIcon className="size-4" />
            <span>{t("backToLearn")}</span>
          </Link>
        </div>

        {/* Mascot & Header */}
        <section className="mb-6 rounded-3xl border-2 border-border/80 bg-card p-5 shadow-soft">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
            <FoxMascot
              mood={mascotMood}
              size="lg"
              className="shrink-0"
            />
            <div className="flex-1 text-center sm:text-start">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-ember/15 px-3 py-1 font-display text-xs font-bold text-ember">
                <Sparkles className="size-3.5 fill-ember" />
                <span>{t("dailyQuestsTitle")}</span>
              </div>
              <h1 className="mt-2 font-display text-2xl font-bold tracking-tight text-foreground">
                {t("dailyQuestsTitle")}
              </h1>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                {mascotSpeech}
              </p>

              {/* Reset Timer badge */}
              <div className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-muted/80 px-3 py-1 text-xs font-semibold text-muted-foreground">
                <Clock className="size-3.5" />
                <span>
                  {t("questTimeLeft", {
                    time: `${timeLeft.hours}h ${timeLeft.minutes}m`,
                  })}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Monthly Challenge Banner */}
        <section className="mb-6 overflow-hidden rounded-3xl border-2 border-primary/20 bg-gradient-to-br from-primary/10 via-card to-card p-5 shadow-soft">
          <div className="flex items-start justify-between gap-3">
            <div>
              <span className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-primary">
                <Award className="size-4" />
                {t("monthlyChallengeTitle")}
              </span>
              <h2 className="mt-1 font-display text-lg font-bold text-foreground">
                {t("monthlyChallengeTitle")} — {monthly.monthName}
              </h2>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                {t("monthlyChallengeSub")}
              </p>
            </div>
            <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-gold/15 text-gold ring-1 ring-gold/30">
              <Trophy className="size-6 fill-gold/20" />
            </div>
          </div>

          <div className="mt-4">
            <div className="flex items-center justify-between text-xs font-bold text-muted-foreground">
              <span>{t("monthlyProgressCount", { n: monthly.claimedCount })}</span>
              <span className="text-primary font-display">{monthly.percent}%</span>
            </div>
            <div className="mt-1.5 h-3 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-gradient-to-r from-ember to-gold transition-all duration-500"
                style={{ width: `${monthly.percent}%` }}
              />
            </div>
          </div>

          {/* Monthly Badges Tier Indicator */}
          <div className="mt-4 grid grid-cols-3 gap-2 text-center">
            <div
              className={cn(
                "rounded-xl border p-2 transition-colors",
                monthly.claimedCount >= 5
                  ? "border-amber-700/50 bg-amber-500/10 text-amber-700 dark:text-amber-400"
                  : "border-border/60 bg-muted/30 text-muted-foreground"
              )}
            >
              <p className="text-[10px] font-bold">5 {t("quests")}</p>
              <p className="text-xs font-semibold">{t("monthlyTierBronze")}</p>
            </div>
            <div
              className={cn(
                "rounded-xl border p-2 transition-colors",
                monthly.claimedCount >= 12
                  ? "border-slate-400/50 bg-slate-400/10 text-slate-700 dark:text-slate-300"
                  : "border-border/60 bg-muted/30 text-muted-foreground"
              )}
            >
              <p className="text-[10px] font-bold">12 {t("quests")}</p>
              <p className="text-xs font-semibold">{t("monthlyTierSilver")}</p>
            </div>
            <div
              className={cn(
                "rounded-xl border p-2 transition-colors",
                monthly.claimedCount >= 20
                  ? "border-gold/50 bg-gold/10 text-gold"
                  : "border-border/60 bg-muted/30 text-muted-foreground"
              )}
            >
              <p className="text-[10px] font-bold">20 {t("quests")}</p>
              <p className="text-xs font-semibold">{t("monthlyTierGold")}</p>
            </div>
          </div>
        </section>

        {/* Daily Quests List */}
        <section className="space-y-3.5">
          <h2 className="font-display text-lg font-bold text-foreground px-1">
            {t("dailyQuestsTitle")} ({completedCount}/{quests.length})
          </h2>

          {quests.map((q) => {
            const Icon =
              q.quest.icon === "zap"
                ? Zap
                : q.quest.icon === "book"
                ? BookOpen
                : Star;

            return (
              <div
                key={q.quest.id}
                className={cn(
                  "relative overflow-hidden rounded-2xl border-2 p-4 transition-all duration-200",
                  q.claimed
                    ? "border-border/70 bg-card/60 opacity-80"
                    : q.completed
                    ? "border-gold/50 bg-card shadow-soft ring-1 ring-gold/40"
                    : "border-border bg-card shadow-soft"
                )}
              >
                <div className="flex items-start gap-3.5">
                  <div
                    className={cn(
                      "grid size-12 shrink-0 place-items-center rounded-2xl transition-colors",
                      q.claimed
                        ? "bg-muted text-muted-foreground"
                        : q.completed
                        ? "bg-gold/20 text-gold animate-bounce-celebrate"
                        : "bg-ember/15 text-ember"
                    )}
                  >
                    {q.claimed ? (
                      <CheckCircle2 className="size-6 text-muted-foreground" />
                    ) : (
                      <Icon className="size-6" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-display text-base font-bold text-foreground truncate">
                        {t(q.quest.titleKey as any)}
                      </h3>
                      {/* Rewards Tags */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="rounded-full bg-gem/15 px-2 py-0.5 text-xs font-bold text-gem">
                          {t("questRewardGems", { n: q.quest.rewardGems })}
                        </span>
                        <span className="rounded-full bg-ember/15 px-2 py-0.5 text-xs font-bold text-ember">
                          {t("questRewardXp", { n: q.quest.rewardXp })}
                        </span>
                      </div>
                    </div>

                    <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">
                      {t(q.quest.descKey as any)}
                    </p>

                    {/* Progress Bar & CTA */}
                    <div className="mt-3 flex items-center gap-3">
                      <div className="flex-1">
                        <div className="flex items-center justify-between text-xs font-bold text-muted-foreground mb-1">
                          <span>
                            {q.current} / {q.target}
                          </span>
                          <span>{q.percent}%</span>
                        </div>
                        <div className="h-2.5 overflow-hidden rounded-full bg-muted">
                          <div
                            className={cn(
                              "h-full rounded-full transition-all duration-500",
                              q.claimed
                                ? "bg-muted-foreground/40"
                                : q.completed
                                ? "bg-gold"
                                : "bg-ember"
                            )}
                            style={{ width: `${q.percent}%` }}
                          />
                        </div>
                      </div>

                      {/* Claim Button */}
                      <div className="shrink-0">
                        {q.claimed ? (
                          <span className="inline-flex items-center rounded-xl bg-muted px-3 py-1.5 text-xs font-bold text-muted-foreground">
                            {t("questClaimed")}
                          </span>
                        ) : q.completed ? (
                          <button
                            type="button"
                            onClick={() =>
                              handleClaim(
                                q.quest.id,
                                q.quest.rewardGems,
                                q.quest.rewardXp
                              )
                            }
                            className="btn-3d flex items-center gap-1.5 rounded-xl bg-gold px-3.5 py-2 font-display text-xs font-bold text-slate-900 shadow-[0_3px_0_#b45309] hover:brightness-105 active:translate-y-0.5 cursor-pointer"
                          >
                            <Sparkles className="size-4 fill-slate-900" />
                            <span>{t("questClaim")}</span>
                          </button>
                        ) : (
                          <Link
                            to="/learn"
                            className="inline-flex items-center rounded-xl border border-border bg-muted/60 px-3 py-1.5 text-xs font-bold text-foreground transition-colors hover:bg-muted"
                          >
                            {t("start")}
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </section>

        {/* Quick Practice shortcut banner */}
        <div className="mt-6 flex items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4">
          <div>
            <p className="font-display text-sm font-bold text-foreground">
              {t("practiceHubTitle")}
            </p>
            <p className="text-xs text-muted-foreground">
              {t("practiceHubSubtitle")}
            </p>
          </div>
          <Link
            to="/practice"
            className="btn-3d shrink-0 rounded-xl bg-primary px-3.5 py-2 font-display text-xs font-bold text-primary-foreground shadow-[0_2px_0_var(--primary-shade)]"
          >
            {t("practiceStart")}
          </Link>
        </div>
      </main>

      <BottomNav />
    </AppPage>
  );
}
