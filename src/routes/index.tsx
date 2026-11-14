import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, MessageCircleQuestion, MessagesSquare, Mic, Sparkles, Trophy } from "lucide-react";
import type { ComponentType } from "react";
import logoBadge from "@/assets/logo-badge.png";
import foxHero from "@/assets/fox-hero.webp";
import { ChunkyButton } from "@/components/lingo/ChunkyButton";
import { useT, setLang, type I18nKey } from "@/lib/i18n";
import { COURSES } from "@/lib/lessons";
import { progressActions } from "@/lib/progress-store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "LingoFox — تعلّم اللغات مع معلّم ذكي" },
      { name: "description", content: "تعلّم الإنجليزية والإسبانية والفرنسية والألمانية والإيطالية والتركية والعربية بدروس قصيرة ومعلّم ذكاء اصطناعي يشرح أخطاءك ويصحّح إجاباتك." },
      { property: "og:title", content: "LingoFox — تعلّم اللغات مع ثعلب ذكي" },
      { property: "og:description", content: "دروس قصيرة، شرح فوري لأخطائك، تدريب على النطق ودوريات أسبوعية." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Splash,
});

const LESSON_COUNT = COURSES.reduce((n, c) => n + c.units.reduce((m, u) => m + u.lessons.length, 0), 0);

const FEATURES: { icon: ComponentType<{ className?: string }>; title: I18nKey; sub: I18nKey; tone: string }[] = [
  { icon: MessageCircleQuestion, title: "featAskFox", sub: "featAskFoxSub", tone: "bg-ember text-primary-foreground" },
  { icon: MessagesSquare, title: "featTutor", sub: "featTutorSub", tone: "bg-success text-primary-foreground" },
  { icon: Mic, title: "featSpeak", sub: "featSpeakSub", tone: "bg-gem text-primary-foreground" },
  { icon: Trophy, title: "featLeagues", sub: "featLeaguesSub", tone: "bg-gold text-gold-foreground" },
];

function Splash() {
  const navigate = useNavigate();
  const { t, lang, loc } = useT();
  const start = () => navigate({ to: progressActions.get().course ? "/learn" : "/courses" });
  const Arrow = lang === "ar" ? ArrowLeft : ArrowRight;

  return (
    <main className="bg-splash relative min-h-dvh overflow-hidden text-secondary-foreground">
      <div aria-hidden className="texture-dots pointer-events-none absolute inset-0 opacity-60 [mask-image:linear-gradient(to_bottom,black,transparent_70%)]" />

      <header className="relative mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-5">
        <div className="flex items-center gap-2" dir="ltr">
          <img src={logoBadge} alt="" width={40} height={40} className="size-10" />
          <span className="font-display text-xl font-bold">Lingo<span className="text-ember">Fox</span></span>
        </div>
        <button
          onClick={() => setLang(lang === "ar" ? "en" : "ar")}
          className="glass-dark rounded-full border border-secondary-foreground/20 px-4 py-1.5 font-display text-sm font-medium transition-colors hover:bg-secondary-foreground/15"
        >
          {lang === "ar" ? "English" : "العربية"}
        </button>
      </header>

      <section className="relative mx-auto grid w-full max-w-6xl items-center gap-6 px-6 pb-10 pt-2 lg:grid-cols-[1.1fr_1fr] lg:gap-10 lg:pt-10">
        <div className="order-2 text-center lg:order-1 lg:text-start">
          <span className="glass-dark inline-flex items-center gap-2 rounded-full border border-secondary-foreground/15 px-3 py-1 font-display text-xs font-medium text-primary-glow">
            <Sparkles className="size-3.5" /> {t("heroEyebrow")}
          </span>
          <h1 className="mt-4 text-balance text-4xl font-bold leading-[1.15] sm:text-5xl lg:text-6xl">{t("heroTitle")}</h1>
          <p className="mx-auto mt-4 max-w-xl text-pretty text-base leading-relaxed text-secondary-foreground/75 sm:text-lg lg:mx-0">{t("heroSub")}</p>

          <div className="mx-auto mt-7 w-full max-w-sm space-y-3 lg:mx-0">
            <ChunkyButton onClick={start} className="flex items-center justify-center gap-2">
              {t("getStarted")} <Arrow className="size-5" />
            </ChunkyButton>
            <ChunkyButton variant="ghostLight" onClick={() => navigate({ to: "/auth" })}>{t("haveAccount")}</ChunkyButton>
          </div>

          <dl className="mx-auto mt-8 grid max-w-sm grid-cols-3 divide-x divide-secondary-foreground/15 rtl:divide-x-reverse lg:mx-0">
            {[
              [String(COURSES.length), t("heroLanguages", { n: "" }).trim()],
              [`${LESSON_COUNT}+`, t("heroLessons", { n: "" }).replace("+", "").trim()],
              ["5′", t("heroDaily")],
            ].map(([v, l]) => (
              <div key={l} className="px-2 text-center">
                <dt className="font-display text-2xl font-bold text-ember">{v}</dt>
                <dd className="mt-0.5 text-xs leading-tight text-secondary-foreground/65">{l}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="relative order-1 mx-auto flex w-full max-w-md flex-col items-center lg:order-2">
          <div aria-hidden className="absolute top-6 size-56 rounded-full bg-primary/35 blur-3xl sm:size-72" />
          <div aria-hidden className="absolute top-10 size-52 rounded-full border border-secondary-foreground/10 sm:size-64" />
          <img src={foxHero} alt="LingoFox" width={768} height={768} className="relative size-56 animate-float drop-shadow-2xl sm:size-72" />
          <div className="relative mt-4 hidden w-full grid-cols-2 gap-3 lg:grid">
            {FEATURES.map((f) => <Feature key={f.title} {...f} />)}
          </div>
        </div>
      </section>

      <section className="relative mx-auto max-w-6xl px-6 pb-8 lg:hidden">
        <div className="grid grid-cols-2 gap-3">
          {FEATURES.map((f) => <Feature key={f.title} {...f} />)}
        </div>
      </section>

      <section className="relative border-t border-secondary-foreground/10 bg-secondary-shade/50">
        <div className="mx-auto max-w-6xl px-6 py-8">
          <h2 className="text-center font-display text-lg font-semibold text-secondary-foreground/85 lg:text-start">{t("heroChoose")}</h2>
          <div className="no-scrollbar -mx-6 mt-4 flex gap-3 overflow-x-auto px-6 pb-1 lg:mx-0 lg:flex-wrap lg:px-0">
            {COURSES.map((c) => (
              <button
                key={c.id}
                onClick={() => { progressActions.setCourse(c.id); void navigate({ to: "/learn" }); }}
                className="glass-dark flex shrink-0 items-center gap-2 rounded-2xl border border-secondary-foreground/15 px-4 py-2.5 font-display font-medium transition-colors hover:bg-secondary-foreground/15"
              >
                <span className="text-2xl" aria-hidden>{c.flag}</span>
                <span>{loc(c.title)}</span>
              </button>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

function Feature({ icon: Icon, title, sub, tone }: (typeof FEATURES)[number]) {
  const { t } = useT();
  return (
    <div className="rounded-3xl bg-card p-4 text-card-foreground shadow-elevated">
      <span className={`grid size-10 place-items-center rounded-2xl ${tone}`}><Icon className="size-5" /></span>
      <p className="mt-3 font-display font-semibold leading-tight text-secondary">{t(title)}</p>
      <p className="mt-1 text-xs leading-snug text-muted-foreground">{t(sub)}</p>
    </div>
  );
}
