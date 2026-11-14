import { useEffect, useState, type FormEvent } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAccount } from "@/lib/account";
import { progressActions } from "@/lib/progress-store";
import { useT } from "@/lib/i18n";
import { ChunkyButton } from "@/components/lingo/ChunkyButton";
import { SocialButtons } from "@/components/lingo/SocialButtons";
import { useIsNativeApp } from "@/lib/native";
import fox from "@/assets/fox.png";
import { fieldClass } from "@/components/lingo/field";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "تسجيل الدخول — LingoFox" },
      { name: "description", content: "سجّل الدخول أو أنشئ حساباً لحفظ تقدمك ومنافسة المتعلمين الآخرين." },
      { property: "og:title", content: "تسجيل الدخول — LingoFox" },
      { property: "og:description", content: "احفظ تقدمك في السحابة على كل أجهزتك." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

type Mode = "signin" | "signup" | "forgot";

function AuthPage() {
  const { t } = useT();
  const { user } = useAccount();
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("signin");
  const native = useIsNativeApp();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (user) navigate({ to: progressActions.get().course ? "/learn" : "/courses", replace: true });
  }, [user, navigate]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin + "/auth", data: { display_name: name.trim() } },
        });
        if (error) throw error;
        if (!data.session) { toast.success(t("checkEmail")); setMode("signin"); }
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin + "/reset-password" });
        if (error) throw error;
        toast.success(t("resetSent"));
        setMode("signin");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center px-5 py-10">
      <Link to="/" className="mx-auto"><img src={fox} alt="LingoFox" width={110} height={110} className="size-24 animate-float" /></Link>
      <h1 className="mt-3 text-center text-3xl font-bold text-secondary">
        {mode === "signup" ? t("signUp") : mode === "forgot" ? t("forgotPassword") : t("signIn")}
      </h1>

      <form onSubmit={submit} className="mt-6 space-y-3">
        {mode === "signup" && (
          <input className={fieldClass} placeholder={t("displayName")} value={name} onChange={(e) => setName(e.target.value)} maxLength={40} required />
        )}
        <input className={fieldClass} type="email" dir="ltr" autoComplete="email" placeholder={t("email")} value={email} onChange={(e) => setEmail(e.target.value)} required />
        {mode !== "forgot" && (
          <input className={fieldClass} type="password" dir="ltr" autoComplete={mode === "signup" ? "new-password" : "current-password"} placeholder={t("password")} value={password} onChange={(e) => setPassword(e.target.value)} minLength={6} required />
        )}
        <ChunkyButton type="submit" disabled={busy}>
          {mode === "signup" ? t("signUp") : mode === "forgot" ? t("sendReset") : t("signIn")}
        </ChunkyButton>
      </form>

      {mode === "signin" && (
        <button onClick={() => setMode("forgot")} className="mt-3 text-center text-sm font-semibold text-gem hover:underline">{t("forgotPassword")}</button>
      )}

      {mode !== "forgot" && !native && (
        <>
          <div className="my-5 flex items-center gap-3 text-sm text-muted-foreground">
            <span className="h-0.5 flex-1 bg-border" />{t("or")}<span className="h-0.5 flex-1 bg-border" />
          </div>
          <SocialButtons />
        </>
      )}

      <p className="mt-6 text-center text-sm text-muted-foreground">
        {mode === "signin" ? (
          <>{t("noAccount")} <button onClick={() => setMode("signup")} className="font-bold text-primary hover:underline">{t("signUp")}</button></>
        ) : mode === "signup" ? (
          <>{t("haveAccountQ")} <button onClick={() => setMode("signin")} className="font-bold text-primary hover:underline">{t("signIn")}</button></>
        ) : (
          <button onClick={() => setMode("signin")} className="font-bold text-primary hover:underline">{t("backToSignIn")}</button>
        )}
      </p>
      <Link to="/privacy" className="mt-3 block text-center text-sm font-semibold text-gem hover:underline">{t("privacy")}</Link>
    </main>
  );
}
