import { Link } from "@tanstack/react-router";
import { BookOpen, MessageCircle, Mic } from "lucide-react";
import { useT } from "@/lib/i18n";

/** Entry points to stories, AI speaking practice and the AI tutor, shown on the learning path. */
export function SkillCards() {
  const { t } = useT();
  return (
    <div className="mt-3 grid grid-cols-2 gap-3">
      <Link to="/stories" className="col-span-2 flex items-center gap-3 rounded-2xl border-2 border-border bg-card p-4 transition-colors hover:bg-muted">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-flame/15 text-flame"><BookOpen className="size-6" /></span>
        <span className="flex flex-col">
          <span className="font-display font-bold text-secondary">{t("storiesTitle")}</span>
          <span className="text-xs text-muted-foreground">{t("storiesSub")}</span>
        </span>
      </Link>
      <Link to="/speak" className="flex flex-col gap-2 rounded-2xl border-2 border-border bg-card p-4 transition-colors hover:bg-muted">
        <span className="flex size-11 items-center justify-center rounded-full bg-primary/15 text-primary"><Mic className="size-6" /></span>
        <span className="font-display font-bold text-secondary">{t("speakTitle")}</span>
        <span className="text-xs text-muted-foreground">{t("speakSub")}</span>
      </Link>
      <Link to="/tutor" className="flex flex-col gap-2 rounded-2xl border-2 border-border bg-card p-4 transition-colors hover:bg-muted">
        <span className="flex size-11 items-center justify-center rounded-full bg-success/15 text-success-shade"><MessageCircle className="size-6" /></span>
        <span className="font-display font-bold text-secondary">{t("tutorTitle")}</span>
        <span className="text-xs text-muted-foreground">{t("tutorSub")}</span>
      </Link>
    </div>
  );
}
