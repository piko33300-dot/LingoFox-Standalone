import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2 } from "lucide-react";
import { getCourse } from "@/lib/lessons";
import { useProgress } from "@/lib/progress-store";
import { storiesOf } from "@/lib/stories";
import { useT } from "@/lib/i18n";
import { TopBar } from "@/components/lingo/TopBar";
import { AppPage, BottomNav } from "@/components/lingo/BottomNav";

export const Route = createFileRoute("/stories")({
  head: () => ({
    meta: [
      { title: "القصص — LingoFox" },
      { name: "description", content: "قصص قصيرة للقراءة والاستماع مع أسئلة فهم، بكل لغات LingoFox." },
      { property: "og:title", content: "القصص — LingoFox" },
      { property: "og:description", content: "اقرأ واستمع لقصص قصيرة وأجب عن أسئلتها." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Stories,
});

function Stories() {
  const p = useProgress();
  const { t, loc } = useT();
  const course = getCourse(p.course) ?? getCourse("en")!;
  const list = storiesOf(course.id);
  return (
    <AppPage>
      <TopBar />
      <main className="mx-auto max-w-md px-4 py-6">
        <h1 className="font-display text-2xl font-bold text-secondary">{t("storiesTitle")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("storiesSub")}</p>
        <p className="mt-5 font-display text-sm font-semibold text-muted-foreground">{t("storiesPick")}</p>
        <ul className="mt-2 grid grid-cols-2 gap-3">
          {list.map((s) => {
            const read = p.stories.includes(s.id);
            return (
              <li key={s.id}>
                <Link
                  to="/story/$storyId"
                  params={{ storyId: s.id }}
                  className="relative flex h-full flex-col items-center gap-2 rounded-2xl border-2 border-border bg-card p-4 text-center shadow-[0_4px_0_var(--border)] transition-colors hover:bg-muted"
                >
                  {read && (
                    <span className="absolute end-2 top-2 flex items-center gap-1 text-xs font-semibold text-success-shade">
                      <CheckCircle2 className="size-4" />{t("storyRead")}
                    </span>
                  )}
                  <span className="mt-3 text-5xl" aria-hidden>{s.emoji}</span>
                  <span className="font-display font-bold text-secondary">{loc(s.title)}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </main>
      <BottomNav />
    </AppPage>
  );
}
