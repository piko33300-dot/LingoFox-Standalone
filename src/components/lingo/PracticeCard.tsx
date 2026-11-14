import { Link } from "@tanstack/react-router";
import { Dumbbell } from "lucide-react";
import { getCourse } from "@/lib/lessons";
import { dayKey, type Progress } from "@/lib/progress-store";
import { dueKeys } from "@/lib/review";
import { useT } from "@/lib/i18n";

/** Entry point to spaced-repetition practice; shown once the learner has finished a lesson in this course. */
export function PracticeCard({ p }: { p: Progress }) {
  const { t } = useT();
  const course = getCourse(p.course) ?? getCourse("en")!;
  if (!p.completed.some((id) => id.startsWith(`${course.id}-`))) return null;
  const due = dueKeys(p.review, dayKey(new Date()), course.id).length;
  return (
    <Link to="/practice" className="mt-4 flex items-center gap-3 rounded-2xl border-2 border-border bg-card p-4 transition-colors hover:bg-muted">
      <span className="flex size-11 items-center justify-center rounded-full bg-gem/15 text-gem">
        <Dumbbell className="size-6" />
      </span>
      <div className="flex-1">
        <p className="font-display font-semibold">{t("practiceTitle")}</p>
        <p className="text-sm text-muted-foreground">{due > 0 ? t("practiceDue", { n: due }) : t("practiceAny")}</p>
      </div>
      <span className="btn-3d shrink-0 bg-primary px-4 py-2 text-sm text-primary-foreground shadow-[0_4px_0_var(--primary-shade)]">{t("practiceStart")}</span>
    </Link>
  );
}
