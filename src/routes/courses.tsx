import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { COURSES, lessonIdsOf } from "@/lib/lessons";
import { progressActions, useProgress } from "@/lib/progress-store";
import { setLang, useT } from "@/lib/i18n";
import { ArrowLeft, ArrowRight, Languages } from "lucide-react";
import { cn } from "@/lib/utils";
import fox from "@/assets/fox.png";

export const Route = createFileRoute("/courses")({
  head: () => ({
    meta: [
      { title: "اختر دورتك — LingoFox" },
      { name: "description", content: "اختر لغتك المفضلة من أشهر لغات العالم: الإنجليزية، الإسبانية، الفرنسية، الألمانية، الإيطالية، التركية، أو العربية." },
      { property: "og:title", content: "اختر دورتك — LingoFox" },
      { property: "og:description", content: "دورات مجانية لأشهر لغات العالم بمستويات متقدمة ومعلم ذكي." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Courses,
});

function Courses() {
  const p = useProgress();
  const navigate = useNavigate();
  const { t, loc, dir, lang } = useT();
  const Chevron = dir === "rtl" ? ChevronLeft : ChevronRight;
  const BackArrow = dir === "rtl" ? ArrowRight : ArrowLeft;
  return (
    <main className="mx-auto min-h-dvh max-w-md px-5 py-6">
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => navigate({ to: p.course ? "/learn" : "/" })}
          className="flex items-center gap-1 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
        >
          <BackArrow className="size-4" />
          <span>{p.course ? t("backToLearn") : t("goHome")}</span>
        </button>
        <button
          onClick={() => setLang(lang === "ar" ? "en" : "ar")}
          className="flex items-center gap-1.5 rounded-full border-2 border-border bg-card px-3 py-1 font-display text-xs font-semibold text-muted-foreground hover:bg-muted transition-colors"
        >
          <Languages className="size-3.5" />
          <span>{lang === "ar" ? "English" : "العربية"}</span>
        </button>
      </div>
      <img src={fox} alt="" width={120} height={120} className="mx-auto size-28 animate-float" />
      <h1 className="mt-4 text-center text-3xl font-bold text-secondary">{t("chooseCourse")}</h1>
      <p className="mt-1 text-center text-muted-foreground">{t("chooseCourseSub")}</p>
      <div className="mt-8 space-y-4">
        {COURSES.map((c) => {
          const ids = lessonIdsOf(c);
          const done = ids.filter((id) => p.completed.includes(id)).length;
          const active = p.course === c.id;
          return (
            <button
              key={c.id}
              onClick={() => { progressActions.setCourse(c.id); navigate({ to: "/learn" }); }}
              className={cn("btn-3d flex w-full items-center gap-4 border-2 bg-card p-4 text-start normal-case tracking-normal",
                active ? "border-primary shadow-[0_4px_0_var(--primary-shade)]" : "border-border shadow-[0_4px_0_var(--border)]")}
            >
              <span className="text-5xl">{c.flag}</span>
              <span className="flex-1">
                <span className="block text-xl font-bold text-secondary">{loc(c.title)}</span>
                <span className="block text-sm font-normal text-muted-foreground">{loc(c.subtitle)}</span>
                <span className="mt-2 block h-2 overflow-hidden rounded-full bg-muted">
                  <span className="block h-full rounded-full bg-success" style={{ width: `${(done / ids.length) * 100}%` }} />
                </span>
              </span>
              <Chevron className="size-6 text-muted-foreground" />
            </button>
          );
        })}
      </div>
    </main>
  );
}
