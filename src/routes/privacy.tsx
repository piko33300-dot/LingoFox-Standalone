import { createFileRoute, Link } from "@tanstack/react-router";
import { setLang, useT } from "@/lib/i18n";
import { ArrowLeft, ArrowRight, Languages } from "lucide-react";
import { CONTACT_EMAIL, POLICY_UPDATED, PRIVACY_SECTIONS } from "@/lib/legal";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "سياسة الخصوصية — LingoFox" },
      { name: "description", content: "كيف يجمع LingoFox بياناتك ويستخدمها ويحميها، وكيف تحذف حسابك." },
      { property: "og:title", content: "سياسة الخصوصية — LingoFox" },
      { property: "og:description", content: "بياناتك وخصوصيتك في LingoFox." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Privacy,
});

function Privacy() {
  const { t, loc, lang, dir } = useT();
  const BackArrow = dir === "rtl" ? ArrowRight : ArrowLeft;
  return (
    <main className="mx-auto max-w-md px-5 py-6">
      <div className="flex items-center justify-between mb-4">
        <Link to="/learn" className="flex items-center gap-1 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors">
          <BackArrow className="size-4" />
          <span>{t("backToLearn")}</span>
        </Link>
        <button
          type="button"
          onClick={() => setLang(lang === "ar" ? "en" : "ar")}
          className="flex items-center gap-1.5 rounded-full border-2 border-border bg-card px-3 py-1 font-display text-xs font-semibold text-muted-foreground hover:bg-muted transition-colors"
        >
          <Languages className="size-3.5" />
          <span>{lang === "ar" ? "English" : "العربية"}</span>
        </button>
      </div>
      <h1 className="text-3xl font-bold text-secondary">{t("privacy")}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{POLICY_UPDATED}</p>
      {PRIVACY_SECTIONS.map((s, i) => (
        <section key={i} className="mt-6">
          <h2 className="text-lg font-bold text-secondary">{loc(s.title)}</h2>
          {s.body.map((b, j) => (
            <p key={j} className="mt-2 leading-relaxed">{loc(b)}</p>
          ))}
        </section>
      ))}
      {CONTACT_EMAIL && (
        <p className="mt-6 leading-relaxed">
          {lang === "ar" ? "للتواصل أو لطلب حذف بياناتك: " : "Contact or data deletion requests: "}
          <a href={`mailto:${CONTACT_EMAIL}`} dir="ltr" className="font-bold text-gem hover:underline">{CONTACT_EMAIL}</a>
        </p>
      )}
      <Link to="/learn" className="btn-3d mt-8 block w-full bg-primary px-6 py-3.5 text-center text-primary-foreground shadow-[0_4px_0_var(--primary-shade)]">
        {t("backToLearn")}
      </Link>
    </main>
  );
}
