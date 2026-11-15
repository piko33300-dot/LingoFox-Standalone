import { Link } from "@tanstack/react-router";
import { Sparkles, CheckCircle2, ChevronLeft, ChevronRight } from "lucide-react";
import { type Progress } from "@/lib/progress-store";
import { evaluateDailyQuests } from "@/lib/quests";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export function QuestsCard({ p }: { p: Progress }) {
  const { t, dir } = useT();
  const quests = evaluateDailyQuests(p);
  const total = quests.length;
  const completed = quests.filter((q) => q.completed).length;
  const claimed = quests.filter((q) => q.claimed).length;
  const allClaimed = total > 0 && claimed === total;
  const pct = Math.round((completed / total) * 100);

  const ArrowIcon = dir === "rtl" ? ChevronLeft : ChevronRight;

  return (
    <Link
      to="/quests"
      className={cn(
        "mt-4 block rounded-2xl border-2 p-4 transition-all duration-200 hover:scale-[1.01] active:scale-[0.99]",
        allClaimed
          ? "border-gold/40 bg-card shadow-soft"
          : completed > claimed
          ? "border-ember/40 bg-card shadow-soft ring-1 ring-ember/30"
          : "border-border bg-card hover:bg-muted/50"
      )}
    >
      <div className="flex items-center gap-3">
        <span
          className={cn(
            "flex size-11 items-center justify-center rounded-2xl transition-transform",
            allClaimed
              ? "bg-gold/15 text-gold"
              : completed > claimed
              ? "bg-ember/15 text-ember animate-bounce-celebrate"
              : "bg-primary/10 text-primary"
          )}
        >
          {allClaimed ? (
            <CheckCircle2 className="size-6 text-gold" />
          ) : (
            <Sparkles className="size-6" />
          )}
        </span>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className="font-display font-semibold text-foreground truncate">
              {t("questsCardTitle")}
            </p>
            <span className="font-display text-xs font-bold text-muted-foreground">
              {completed}/{total}
            </span>
          </div>
          <p className="text-xs text-muted-foreground truncate">
            {allClaimed
              ? t("allQuestsDone")
              : t("questsCardProgress", { done: completed, total })}
          </p>
        </div>

        <span className="flex items-center text-muted-foreground">
          <ArrowIcon className="size-5 shrink-0" />
        </span>
      </div>

      <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
        <div
          className={cn(
            "h-full rounded-full transition-[width] duration-500",
            allClaimed ? "bg-gold" : "bg-ember"
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
    </Link>
  );
}
