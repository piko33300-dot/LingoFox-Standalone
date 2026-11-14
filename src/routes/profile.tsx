import { useEffect, useState, type ReactNode } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Flame, Gem, LogOut, Shield, Star, Trash2, Trophy, Zap, BookCheck } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { cancelPendingSync, signOut, useAccount, useIsAdmin } from "@/lib/account";
import { deleteMyAccount } from "@/lib/account.functions";
import { achievementStatus } from "@/lib/achievements";
import { DAILY_GOAL_OPTIONS, getCourse } from "@/lib/lessons";
import { displayStreak, progressActions, useProgress } from "@/lib/progress-store";
import { setLang, useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { AppPage, BottomNav } from "@/components/lingo/BottomNav";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { ChunkyButton } from "@/components/lingo/ChunkyButton";
import { DailyGoalCard, StreakCalendar } from "@/components/lingo/DailyGoal";
import { fieldClass } from "@/components/lingo/field";
import { InstallApp } from "@/components/lingo/InstallApp";
import { ReminderCard } from "@/components/lingo/ReminderCard";
import { StreakFreezeCard } from "@/components/lingo/StreakFreezeCard";
import fox from "@/assets/fox.png";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "حسابي وإحصائياتي — LingoFox" },
      { name: "description", content: "إحصائياتك وتقويم التتابع وهدفك اليومي وإنجازاتك في LingoFox." },
      { property: "og:title", content: "حسابي — LingoFox" },
      { property: "og:description", content: "تابع تقدمك وإنجازاتك." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Profile,
});

function Profile() {
  const p = useProgress();
  const { user } = useAccount();
  const isAdmin = useIsAdmin();
  const { t, loc, lang } = useT();
  const course = getCourse(p.course);
  const achievements = achievementStatus(p);
  const unlocked = achievements.filter((a) => a.unlocked).length;

  return (
    <AppPage>
      <div className="mx-auto max-w-md space-y-6 px-4 pt-6">
        <ProfileHeader />

        <section className="grid grid-cols-2 gap-3" aria-label={t("stats")}>
          <StatCard icon={<Flame className="size-6 fill-flame text-flame" />} value={displayStreak(p, new Date())} label={t("streak")} />
          <StatCard icon={<Zap className="size-6 fill-primary text-primary" />} value={p.xp} label={t("xp")} />
          <StatCard icon={<BookCheck className="size-6 text-success" />} value={p.lessonsDone} label={t("lessonsDone")} />
          <StatCard icon={<Star className="size-6 fill-flame/40 text-flame" />} value={p.perfectLessons} label={t("perfectLessons")} />
          <StatCard icon={<Trophy className="size-6 text-primary" />} value={p.longestStreak} label={t("longestStreak")} />
          <StatCard icon={<Gem className="size-6 fill-gem/30 text-gem" />} value={p.gems} label={t("gems")} />
        </section>

        <StreakFreezeCard p={p} />
        <DailyGoalCard p={p} />
        <section className="rounded-2xl border-2 border-border bg-card p-4">
          <h2 className="text-lg font-bold text-secondary">{t("dailyGoal")}</h2>
          <div className="mt-3 grid grid-cols-4 gap-2">
            {DAILY_GOAL_OPTIONS.map((g) => (
              <button key={g} onClick={() => progressActions.setDailyGoal(g)}
                className={cn("rounded-xl border-2 py-2 font-display font-semibold transition-colors",
                  p.dailyGoal === g ? "border-flame bg-accent text-accent-foreground" : "border-border text-muted-foreground hover:text-foreground")}>
                {g} XP
              </button>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border-2 border-border bg-card p-4">
          <h2 className="mb-3 text-lg font-bold text-secondary">{t("streakCalendar")}</h2>
          <StreakCalendar p={p} />
        </section>

        <section>
          <h2 className="mb-3 flex items-baseline justify-between text-lg font-bold text-secondary">
            {t("achievements")} <span className="text-sm font-semibold text-muted-foreground">{unlocked}/{achievements.length}</span>
          </h2>
          <div className="grid grid-cols-3 gap-3">
            {achievements.map((a) => (
              <div key={a.id} title={loc(a.description)}
                className={cn("flex flex-col items-center rounded-2xl border-2 p-3 text-center",
                  a.unlocked ? "border-flame/50 bg-accent" : "border-border bg-card")}>
                <span className={cn("text-3xl", !a.unlocked && "opacity-30 grayscale")}>{a.emoji}</span>
                <span className="mt-1 font-display text-sm font-semibold leading-tight">{loc(a.title)}</span>
                <span className="mt-0.5 text-[11px] leading-tight text-muted-foreground">{loc(a.description)}</span>
                {!a.unlocked && (
                  <span className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <span className="block h-full rounded-full bg-flame" style={{ width: `${(a.value / a.target) * 100}%` }} />
                  </span>
                )}
              </div>
            ))}
          </div>
        </section>

        <ReminderCard />
        <InstallApp />

        <section className="space-y-4 rounded-2xl border-2 border-border bg-card p-4">
          <h2 className="text-lg font-bold text-secondary">{t("settings")}</h2>
          <div className="flex items-center justify-between gap-3">
            <span className="font-semibold">{t("interfaceLang")}</span>
            <div className="flex rounded-xl border-2 border-border p-1">
              {(["ar", "en"] as const).map((l) => (
                <button key={l} onClick={() => setLang(l)}
                  className={cn("rounded-lg px-3 py-1 font-display text-sm font-semibold", lang === l ? "bg-secondary text-secondary-foreground" : "text-muted-foreground")}>
                  {l === "ar" ? "العربية" : "English"}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="font-semibold">{t("course")}</span>
            <Link to="/courses" className="flex items-center gap-2 rounded-xl border-2 border-border px-3 py-1 font-display text-sm font-semibold hover:bg-muted">
              <span className="text-lg">{course?.flag ?? "🌍"}</span>{course ? loc(course.title) : "—"} · {t("changeCourse")}
            </Link>
          </div>
          {isAdmin && (
            <Link to="/admin">
              <ChunkyButton variant="primary" className="w-full flex items-center justify-center gap-2 shadow-glow">
                <Shield className="size-5" /> لوحة تحكم المشرف 🛡️
              </ChunkyButton>
            </Link>
          )}
          {user && <SignOutButton />}
          {user && <DeleteAccountButton />}
          <Link to="/privacy" className="block text-center text-sm font-semibold text-gem hover:underline">{t("privacy")}</Link>
        </section>
      </div>
      <BottomNav />
    </AppPage>
  );
}

function ProfileHeader() {
  const { user } = useAccount();
  const { t } = useT();
  const qc = useQueryClient();
  const profile = useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("display_name").eq("id", user!.id).maybeSingle();
      if (error) throw error;
      return data;
    },
  });
  const [name, setName] = useState("");
  useEffect(() => { if (profile.data) setName(profile.data.display_name); }, [profile.data]);

  async function save() {
    if (!user || !name.trim()) return;
    const { error } = await supabase.from("profiles").update({ display_name: name.trim().slice(0, 40) }).eq("id", user.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(t("saved"));
    void qc.invalidateQueries({ queryKey: ["profile"] });
    void qc.invalidateQueries({ queryKey: ["leaderboard"] });
  }

  return (
    <section className="flex flex-col items-center rounded-3xl bg-splash p-5 text-center text-secondary-foreground">
      <img src={fox} alt="" width={96} height={96} className="size-24 rounded-full border-4 border-primary bg-accent object-cover" />
      {user ? (
        <div className="mt-3 w-full space-y-2">
          <p className="text-sm opacity-80" dir="ltr">{user.email}</p>
          <div className="flex gap-2">
            <input className={cn(fieldClass, "text-foreground")} aria-label={t("displayName")} value={name} onChange={(e) => setName(e.target.value)} maxLength={40} />
            <button onClick={save} className="btn-3d shrink-0 bg-primary px-4 text-primary-foreground shadow-[0_4px_0_var(--primary-shade)]">{t("save")}</button>
          </div>
        </div>
      ) : (
        <div className="mt-3 w-full">
          <h1 className="text-2xl font-bold">{t("guest")}</h1>
          <p className="mt-1 text-sm opacity-90">{t("guestNote")}</p>
          <Link to="/auth" className="btn-3d mt-4 block w-full bg-primary px-6 py-3 text-primary-foreground shadow-[0_4px_0_var(--primary-shade)]">{t("signIn")}</Link>
        </div>
      )}
    </section>
  );
}

function SignOutButton() {
  const { t } = useT();
  const qc = useQueryClient();
  const navigate = useNavigate();
  return (
    <ChunkyButton variant="outline" className="flex items-center justify-center gap-2" onClick={async () => {
      await qc.cancelQueries();
      qc.clear();
      await signOut();
      navigate({ to: "/auth", replace: true });
    }}>
      <LogOut className="size-5" /> {t("signOut")}
    </ChunkyButton>
  );
}

function DeleteAccountButton() {
  const { t } = useT();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);

  async function confirmDelete() {
    setBusy(true);
    try {
      cancelPendingSync();
      await deleteMyAccount();
      await qc.cancelQueries();
      qc.clear();
      cancelPendingSync();
      await signOut();
      navigate({ to: "/auth", replace: true });
    } catch {
      toast.error(t("deleteFailed"));
      setBusy(false);
    }
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <ChunkyButton variant="outline" className="flex items-center justify-center gap-2 text-destructive">
          <Trash2 className="size-5" /> {t("deleteAccount")}
        </ChunkyButton>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("deleteTitle")}</AlertDialogTitle>
          <AlertDialogDescription>{t("deleteWarn")}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={busy}>{t("cancel")}</AlertDialogCancel>
          <AlertDialogAction disabled={busy} onClick={(e) => { e.preventDefault(); void confirmDelete(); }}>
            {busy ? t("deleting") : t("deleteConfirm")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function StatCard({ icon, value, label }: { icon: ReactNode; value: number; label: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border-2 border-border bg-card p-3">
      {icon}
      <div>
        <p className="font-display text-xl font-bold leading-none">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}
