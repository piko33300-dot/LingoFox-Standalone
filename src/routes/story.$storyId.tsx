import { useEffect, useRef, useState, type ReactNode } from "react";
import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { Gem, Volume2, X, Zap } from "lucide-react";
import { getCourse } from "@/lib/lessons";
import { progressActions, useProgress } from "@/lib/progress-store";
import { findStory, storySteps } from "@/lib/stories";
import { speak } from "@/lib/speech";
import { dirOf, useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { ChunkyButton } from "@/components/lingo/ChunkyButton";
import fox from "@/assets/fox.png";

export const Route = createFileRoute("/story/$storyId")({
  loader: ({ params }) => {
    const story = findStory(params.storyId);
    if (!story) throw notFound();
    return { title: story.title };
  },
  head: ({ loaderData }) => {
    const title = `${loaderData?.title.ar ?? "قصة"} — قصص LingoFox`;
    return {
      meta: [
        { title },
        { name: "description", content: "قصة قصيرة للقراءة والاستماع مع أسئلة فهم." },
        { property: "og:title", content: title },
        { property: "og:description", content: "اقرأ واستمع وأجب عن الأسئلة." },
        { property: "og:type", content: "article" },
        { name: "twitter:card", content: "summary" },
      ],
    };
  },
  component: StoryReader,
});

function StoryReader() {
  const { storyId } = Route.useParams();
  const story = findStory(storyId)!;
  const course = getCourse(story.course)!;
  const steps = storySteps(story);
  const navigate = useNavigate();
  const { t, loc } = useT();
  const [shown, setShown] = useState(1);
  const [answers, setAnswers] = useState<Record<number, number[]>>({});
  const [openTr, setOpenTr] = useState<number | null>(null);
  const [reward, setReward] = useState<{ xp: number; gems: number; replay: boolean } | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const p = useProgress();

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" }); }, [shown, answers]);

  const current = steps[shown - 1]!;
  const solved = (qi: number) => (answers[qi] ?? []).includes(story.questions[qi]!.answer);
  const blocked = current.kind === "question" && !solved(current.index);
  const atEnd = shown >= steps.length;

  function next() {
    if (blocked) return;
    if (atEnd) {
      const replay = progressActions.get().stories.includes(story.id);
      const r = progressActions.completeStory(story.id);
      setReward({ xp: r.xp, gems: r.gems, replay });
      return;
    }
    const step = steps[shown]!;
    if (step.kind === "line") speak(story.lines[step.index]!.text, course.target);
    setShown(shown + 1);
  }

  function pick(qi: number, oi: number) {
    if (solved(qi)) return;
    setAnswers({ ...answers, [qi]: [...(answers[qi] ?? []), oi] });
  }

  if (reward) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-between px-6 py-10 text-center">
        <div />
        <div className="w-full">
          <img src={fox} alt="" width={180} height={180} className="mx-auto size-44 animate-float" />
          <h1 className="mt-4 text-4xl font-bold text-primary">{t("storyComplete")}</h1>
          {reward.replay && <p className="mt-2 text-sm text-muted-foreground">{t("storyReplay")}</p>}
          <div className="mt-6 grid grid-cols-3 gap-3">
            <Tile label={t("earned")} value={`+${reward.xp}`} icon={<Zap className="size-5" />} tone="bg-primary" />
            <Tile label={t("gems")} value={`+${reward.gems}`} icon={<Gem className="size-5" />} tone="bg-gem" />
            <Tile label={t("totalXp")} value={String(p.xp)} icon={<Zap className="size-5" />} tone="bg-secondary" />
          </div>
        </div>
        <ChunkyButton variant="success" onClick={() => navigate({ to: "/stories" })} className="mt-6">{t("backToStories")}</ChunkyButton>
      </main>
    );
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col">
      <header className="sticky top-0 z-10 flex items-center gap-3 border-b-2 border-border bg-background/95 px-4 py-3 backdrop-blur">
        <Link to="/stories" aria-label={t("backToStories")} className="text-muted-foreground hover:text-foreground"><X className="size-6" /></Link>
        <div className="h-4 flex-1 overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-success transition-all" style={{ width: `${(shown / steps.length) * 100}%` }} />
        </div>
      </header>

      <main className="flex-1 px-4 py-5">
        <div className="text-center">
          <span className="text-5xl" aria-hidden>{story.emoji}</span>
          <h1 className="mt-2 font-display text-2xl font-bold text-secondary">{loc(story.title)}</h1>
          <p className="mt-1 text-xs text-muted-foreground">{t("storyTapHint")}</p>
        </div>

        <ol className="mt-5 space-y-4">
          {steps.slice(0, shown).map((step, i) => {
            if (step.kind === "line") {
              const line = story.lines[step.index]!;
              return (
                <li key={`l${step.index}`} className="flex animate-pop items-start gap-2" dir={dirOf(course.target)}>
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted text-2xl" aria-hidden>{line.who}</span>
                  <div className="flex-1">
                    <button
                      type="button"
                      onClick={() => setOpenTr(openTr === step.index ? null : step.index)}
                      className="w-full rounded-2xl border-2 border-border bg-card px-4 py-3 text-start text-lg font-semibold"
                    >
                      {line.text}
                    </button>
                    {openTr === step.index && (
                      <p className="mt-1 px-2 text-sm text-muted-foreground" dir={dirOf(course.native)}>{line.tr}</p>
                    )}
                  </div>
                  <button
                    type="button"
                    aria-label={t("storyListen")}
                    onClick={() => speak(line.text, course.target)}
                    className="mt-2 shrink-0 text-gem"
                  >
                    <Volume2 className="size-6" />
                  </button>
                </li>
              );
            }
            const q = story.questions[step.index]!;
            const tried = answers[step.index] ?? [];
            const ok = solved(step.index);
            const lastWrong = !ok && tried.length > 0;
            return (
              <li key={`q${step.index}`} className={cn("rounded-2xl border-2 border-gem/40 bg-gem/5 p-4", i === shown - 1 && "animate-pop")}>
                <p className="font-display font-bold text-secondary">{loc(q.q)}</p>
                <div className="mt-3 grid gap-2" dir={dirOf(course.target)}>
                  {q.options.map((o, oi) => {
                    const isAnswer = ok && oi === q.answer;
                    const wrong = tried.includes(oi) && oi !== q.answer;
                    return (
                      <button
                        key={o}
                        type="button"
                        disabled={ok || wrong}
                        onClick={() => pick(step.index, oi)}
                        className={cn(
                          "rounded-xl border-2 border-border bg-card px-4 py-2.5 text-start font-semibold transition-colors",
                          isAnswer && "border-success bg-success/15 text-success-shade",
                          wrong && "border-destructive/40 bg-destructive/10 text-destructive line-through",
                        )}
                      >
                        {o}
                      </button>
                    );
                  })}
                </div>
                {ok && <p className="mt-2 text-sm font-semibold text-success-shade">{t("storyCorrect")}</p>}
                {lastWrong && <p className="mt-2 text-sm font-semibold text-destructive">{t("storyTryAgain")}</p>}
              </li>
            );
          })}
        </ol>
        <div ref={endRef} />
      </main>

      <footer className="sticky bottom-0 border-t-2 border-border bg-background/95 px-4 pb-[max(env(safe-area-inset-bottom),1rem)] pt-4 backdrop-blur">
        <ChunkyButton variant="success" disabled={blocked} onClick={next}>{t("continue")}</ChunkyButton>
      </footer>
    </div>
  );
}

function Tile({ label, value, icon, tone }: { label: string; value: string; icon: ReactNode; tone: string }) {
  return (
    <div className={cn("overflow-hidden rounded-2xl border-2 border-transparent", tone)}>
      <p className="py-1 text-xs font-bold uppercase text-primary-foreground">{label}</p>
      <p className="flex items-center justify-center gap-1 rounded-xl bg-card py-3 font-display text-xl font-bold text-foreground">{icon}{value}</p>
    </div>
  );
}
