import { useState, type FormEvent } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useT } from "@/lib/i18n";
import { ChunkyButton } from "@/components/lingo/ChunkyButton";
import { fieldClass } from "@/components/lingo/field";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "تعيين كلمة مرور جديدة — LingoFox" },
      { name: "description", content: "اختر كلمة مرور جديدة لحسابك في LingoFox." },
      { property: "og:title", content: "تعيين كلمة مرور جديدة — LingoFox" },
      { property: "og:description", content: "استعادة الوصول إلى حسابك." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ResetPassword,
});

function ResetPassword() {
  const { t } = useT();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(t("passwordUpdated"));
    navigate({ to: "/learn" });
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center px-5">
      <h1 className="text-center text-3xl font-bold text-secondary">{t("resetTitle")}</h1>
      <form onSubmit={submit} className="mt-6 space-y-3">
        <input className={fieldClass} type="password" dir="ltr" autoComplete="new-password" placeholder={t("newPassword")} value={password} onChange={(e) => setPassword(e.target.value)} minLength={6} required />
        <ChunkyButton type="submit" disabled={busy}>{t("save")}</ChunkyButton>
      </form>
    </main>
  );
}
