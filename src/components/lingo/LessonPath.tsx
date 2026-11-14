import { Fragment } from "react";
import { Link } from "@tanstack/react-router";
import { Check, Lock, Star, BookOpen } from "lucide-react";
import { getCourse } from "@/lib/lessons";
import { currentLessonId, useProgress } from "@/lib/progress-store";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import fox from "@/assets/fox.png";
import { AdBanner } from "./AdBanner";
import { DailyGoalCard } from "./DailyGoal";
import { PracticeCard } from "./PracticeCard";
import { SkillCards } from "./SkillCards";

const OFFSETS = [0, 48, 72, 48, 0, -48, -72, -48];

export function LessonPath() {
  const p = useProgress();
  const { t, loc } = useT();
  const course = getCourse(p.course) ?? getCourse("en")!;
  const current = currentLessonId(p, course.id);
  let n = 0;

  return (
    <div className="mx-auto max-w-md px-4 pb-8 pt-4">
      <DailyGoalCard p={p} />
      <PracticeCard p={p} />
      <SkillCards />
      <div className="h-6" />
      {course.units.map((unit, ui) => {
        const unitStarted = unit.lessons.some((id) => p.completed.includes(id) || id === current);
        return (
          <Fragment key={unit.id}>
            <section className="mb-10">
              <div className={cn("relative mb-16 flex items-center justify-between overflow-hidden rounded-3xl p-5",
                unitStarted ? "bg-pine text-secondary-foreground shadow-elevated" : "bg-locked text-muted-foreground shadow-[0_4px_0_var(--locked-shade)]")}>
                {unitStarted && <span aria-hidden className="texture-dots pointer-events-none absolute inset-0 opacity-70" />}
                {unitStarted && <span aria-hidden className="pointer-events-none absolute -end-10 -top-10 size-32 rounded-full bg-primary/30 blur-2xl" />}
                <div>
                  <p className="relative text-xs font-semibold tracking-wider text-primary-glow">{t("unit")} {ui + 1}</p>
                  <h2 className="relative text-xl font-semibold">{loc(unit.title)}</h2>
                  <p className="relative text-sm opacity-80">{loc(unit.description)}</p>
                </div>
                <span className="relative grid size-12 place-items-center rounded-2xl bg-secondary-foreground/10 ring-1 ring-secondary-foreground/15"><BookOpen className="size-6" /></span>
              </div>

              <div className="relative flex flex-col items-center gap-6">
                {unit.lessons.map((id) => {
                  const offset = OFFSETS[n++ % OFFSETS.length];
                  const done = p.completed.includes(id);
                  const active = id === current;
                  const locked = !done && !active;
                  const node = (
                    <span className={cn(
                      "relative flex size-[72px] items-center justify-center rounded-full transition-transform active:translate-y-1",
                      done && "bg-gold text-gold-foreground shadow-[0_6px_0_var(--gold-shade)]",
                      active && "bg-ember text-primary-foreground shadow-[0_6px_0_var(--primary-shade),var(--shadow-glow)] hover:scale-105",
                      locked && "bg-locked text-locked-shade shadow-[0_6px_0_var(--locked-shade)]",
                    )}>
                      {active && (
                        <>
                          <span className="absolute -inset-2 rounded-full border-4 border-primary animate-pulse-ring" />
                          <span className="absolute -inset-2 rounded-full border-4 border-primary/40" />
                        </>
                      )}
                      {done ? <Check className="size-8" strokeWidth={3.5} /> : locked ? <Lock className="size-7" /> : <Star className="size-8 fill-primary-foreground" />}
                    </span>
                  );
                  return (
                    <div key={id} style={{ transform: `translateX(${offset}px)` }} className="relative">
                      {active && (
                        <div className="absolute -top-12 left-1/2 -translate-x-1/2 animate-float whitespace-nowrap rounded-xl bg-secondary px-3 py-1.5 font-display text-sm font-semibold text-secondary-foreground shadow-soft">
                          {t("start")}
                          <span className="absolute -bottom-1.5 left-1/2 size-3 -translate-x-1/2 rotate-45 bg-secondary" />
                        </div>
                      )}
                      {locked ? (
                        <button disabled aria-label={t("lockedLesson")} className="cursor-not-allowed">{node}</button>
                      ) : (
                        <Link to="/lesson/$lessonId" params={{ lessonId: id }} aria-label={done ? t("practiceLesson") : t("startLesson")}>{node}</Link>
                      )}
                    </div>
                  );
                })}
                {ui === 0 && (
                  <img src={fox} alt="" width={96} height={96} className="pointer-events-none absolute -start-2 top-16 size-24 animate-float opacity-95" />
                )}
              </div>
            </section>
            {ui === 1 && <AdBanner slot="learnBanner" className="mb-10" />}
          </Fragment>
        );
      })}
      <p className="text-center font-display text-muted-foreground">{t("moreSoon")}</p>
    </div>
  );
}
