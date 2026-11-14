import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Flame, Gem, Heart, Zap } from "lucide-react";
import { displayStreak, useProgress } from "@/lib/progress-store";
import { getCourse } from "@/lib/lessons";
import { useT } from "@/lib/i18n";

export function TopBar() {
  const p = useProgress();
  const { t, loc } = useT();
  const course = getCourse(p.course);
  const streak = displayStreak(p, new Date());
  return (
    <header className="glass sticky top-0 z-30 border-b border-border/70">
      <div className="mx-auto flex max-w-md items-center justify-between px-4 py-3 font-display font-semibold">
        <Link to="/courses" className="grid size-10 place-items-center rounded-2xl bg-muted text-2xl ring-1 ring-border transition-transform hover:scale-105" aria-label={`${t("course")}: ${course ? loc(course.title) : ""}`}>
          {course?.flag ?? "🌍"}
        </Link>
        <Stat icon={<Flame className="size-4 fill-flame text-flame" />} value={streak} label={t("streak")} className="text-flame" />
        <Stat icon={<Zap className="size-4 fill-primary text-primary" />} value={p.xp} label={t("xp")} className="text-primary" />
        <Stat icon={<Gem className="size-4 fill-gem/30 text-gem" />} value={p.gems} label={t("gems")} className="text-gem" />
        <Stat icon={<Heart className="size-4 fill-destructive text-destructive" />} value={p.hearts} label={t("hearts")} className="text-destructive" />
      </div>
    </header>
  );
}

function Stat({ icon, value, label, className }: { icon: ReactNode; value: number; label: string; className: string }) {
  return (
    <span aria-label={`${label}: ${value}`} className={`flex items-center gap-1 rounded-full bg-card px-2.5 py-1 text-sm shadow-soft ring-1 ring-border/70 ${className}`}>
      {icon}
      <span key={value} className="animate-pop">{value}</span>
    </span>
  );
}
