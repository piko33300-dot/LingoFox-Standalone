import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { getCourse } from "@/lib/lessons";
import { dayKey, progressActions } from "@/lib/progress-store";
import { pickPractice } from "@/lib/review";
import { useT } from "@/lib/i18n";
import { Quiz, type PracticeSession } from "@/components/lingo/Quiz";
import fox from "@/assets/fox.png";

export const Route = createFileRoute("/practice")({
  head: () => ({
    meta: [
      { title: "تدرّب وراجع — LingoFox" },
      { name: "description", content: "راجع الكلمات التي أخطأت فيها بتكرار متباعد لتثبّتها في ذاكرتك." },
      { property: "og:title", content: "تدرّب وراجع — LingoFox" },
      { property: "og:description", content: "مراجعة ذكية للكلمات التي تحتاج تثبيتاً." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Practice,
});

function Practice() {
  const { t } = useT();
  // undefined = not computed yet (same markup on server and first client render), null = nothing to practice.
  const [session, setSession] = useState<PracticeSession | null | undefined>(undefined);

  useEffect(() => {
    const p = progressActions.get();
    const course = getCourse(p.course) ?? getCourse("en")!;
    const items = pickPractice(p.review, p.completed, course.id, dayKey(new Date()));
    setSession(items.length > 0 ? { course, items } : null);
  }, []);

  if (session === undefined) return <div className="min-h-dvh bg-background" />;
  if (session === null) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-5 px-6 text-center">
        <img src={fox} alt="" width={120} height={120} className="size-28" />
        <p className="font-display text-lg font-semibold text-secondary">{t("practiceEmpty")}</p>
        <Link to="/learn" className="btn-3d block w-full bg-primary px-6 py-3.5 text-primary-foreground shadow-[0_4px_0_var(--primary-shade)]">
          {t("backToLearn")}
        </Link>
      </main>
    );
  }
  return <Quiz practice={session} />;
}
