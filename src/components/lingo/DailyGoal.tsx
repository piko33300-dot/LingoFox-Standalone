import { Target } from "lucide-react";
import { dayKey, type Progress } from "@/lib/progress-store";
import { useT } from "@/lib/i18n";

export function DailyGoalCard({ p }: { p: Progress }) {
  const { t } = useT();
  const today = p.xpByDay[dayKey(new Date())] ?? 0;
  const pct = Math.min(100, (today / p.dailyGoal) * 100);
  const done = today >= p.dailyGoal;
  return (
    <div className="rounded-2xl border-2 border-border bg-card p-4">
      <div className="flex items-center gap-3">
        <span className="flex size-11 items-center justify-center rounded-full bg-accent text-accent-foreground">
          <Target className="size-6" />
        </span>
        <div className="flex-1">
          <p className="font-display font-semibold">{done ? t("dailyGoalDone") : t("dailyGoal")}</p>
          <p className="text-sm text-muted-foreground">{t("xpToday", { x: today, g: p.dailyGoal })}</p>
        </div>
      </div>
      <div className="mt-3 h-3 overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full bg-flame transition-[width] duration-500" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

/** Last 5 weeks of activity, newest day last. */
export function StreakCalendar({ p }: { p: Progress }) {
  const { lang } = useT();
  const today = new Date();
  const days = Array.from({ length: 35 }, (_, i) => {
    const d = new Date(today);
    d.setUTCDate(d.getUTCDate() - (34 - i));
    return d;
  });
  const fmt = new Intl.DateTimeFormat(lang === "ar" ? "ar" : "en", { weekday: "narrow", timeZone: "UTC" });
  return (
    <div>
      <div className="grid grid-cols-7 gap-1.5 text-center text-xs font-bold text-muted-foreground">
        {days.slice(28).map((d) => <span key={d.toISOString()}>{fmt.format(d)}</span>)}
      </div>
      <div className="mt-2 grid grid-cols-7 gap-1.5">
        {days.map((d) => {
          const k = dayKey(d);
          const xp = p.xpByDay[k] ?? 0;
          const isToday = k === dayKey(today);
          return (
            <span
              key={k}
              title={`${k}: ${xp} XP`}
              className={[
                "flex aspect-square items-center justify-center rounded-lg text-xs font-bold",
                xp >= p.dailyGoal ? "bg-flame text-primary-foreground" : xp > 0 ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground",
                isToday ? "ring-2 ring-secondary ring-offset-1" : "",
              ].join(" ")}
            >
              {xp >= p.dailyGoal ? "🔥" : d.getUTCDate()}
            </span>
          );
        })}
      </div>
    </div>
  );
}
