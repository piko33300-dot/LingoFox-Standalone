import { useState, type ReactNode } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowDown, ArrowUp, Copy, Flame, UserPlus, Zap } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAccount } from "@/lib/account";
import { useT } from "@/lib/i18n";
import { daysLeftInWeek, leagueOf, normalizeFriendCode, weekStart, zoneOf } from "@/lib/leagues";
import { cn } from "@/lib/utils";
import { AppPage, BottomNav } from "@/components/lingo/BottomNav";
import { fieldClass } from "@/components/lingo/field";
import fox from "@/assets/fox.png";

export const Route = createFileRoute("/leaderboard")({
  head: () => ({
    meta: [
      { title: "الدوريات والمتصدرون — LingoFox" },
      { name: "description", content: "نافس في دوري أسبوعي، أضف أصدقاءك، واصعد من البرونزي إلى الماسي بجمع نقاط الخبرة." },
      { property: "og:title", content: "الدوريات والمتصدرون — LingoFox" },
      { property: "og:description", content: "من سيتصدر الدوري هذا الأسبوع؟" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Leaderboard,
});

type Tab = "league" | "friends" | "all";
type Row = { id: string; name: string; xp: number; streak?: number };
const MEDALS = ["🥇", "🥈", "🥉"];

function Leaderboard() {
  const { user, ready } = useAccount();
  const { t } = useT();
  const [tab, setTab] = useState<Tab>("league");

  return (
    <AppPage>
      <div className="mx-auto max-w-md px-4 pt-6">
        {!ready ? (
          <p className="mt-10 text-center text-muted-foreground">{t("loading")}</p>
        ) : !user ? (
          <div className="mt-8 rounded-3xl border-2 border-border bg-card p-6 text-center">
            <span className="text-6xl">🏆</span>
            <h1 className="mt-2 text-3xl font-bold text-secondary">{t("leaderboard")}</h1>
            <img src={fox} alt="" width={96} height={96} className="mx-auto mt-3 size-24 animate-float" />
            <p className="mt-3 font-semibold">{t("leaderboardGuest")}</p>
            <Link to="/auth" className="btn-3d mt-4 block bg-primary px-6 py-3 text-primary-foreground shadow-[0_4px_0_var(--primary-shade)]">{t("signIn")}</Link>
          </div>
        ) : (
          <>
            <div role="tablist" className="grid grid-cols-3 gap-1 rounded-2xl border-2 border-border bg-card p-1">
              {(["league", "friends", "all"] as const).map((k) => (
                <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)}
                  className={cn("rounded-xl py-2 font-display text-sm font-semibold transition-colors",
                    tab === k ? "bg-secondary text-secondary-foreground" : "text-muted-foreground hover:text-foreground")}>
                  {t(k === "league" ? "tabLeague" : k === "friends" ? "tabFriends" : "tabAllTime")}
                </button>
              ))}
            </div>
            {tab === "league" && <LeagueTab userId={user.id} />}
            {tab === "friends" && <FriendsTab userId={user.id} />}
            {tab === "all" && <AllTimeTab userId={user.id} />}
          </>
        )}
      </div>
      <BottomNav />
    </AppPage>
  );
}

function useMyProfile(userId: string) {
  return useQuery({
    queryKey: ["my-profile", userId],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("league, friend_code").eq("id", userId).maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

function LeagueTab({ userId }: { userId: string }) {
  const { t } = useT();
  const me = useMyProfile(userId);
  const league = me.data?.league ?? 0;
  const board = useQuery({
    queryKey: ["league", userId, league, weekStart(new Date())],
    enabled: me.isSuccess,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("weekly_xp")
        .select("user_id, xp, profiles(display_name)")
        .eq("week_start", weekStart(new Date()))
        .eq("league", league)
        .order("xp", { ascending: false })
        .limit(30);
      if (error) throw error;
      return data.map((r): Row => ({ id: r.user_id, xp: r.xp, name: r.profiles?.display_name ?? "🦊" }));
    },
  });
  const info = leagueOf(league);
  const rows = board.data ?? [];

  return (
    <section className="mt-5">
      <div className="flex flex-col items-center text-center">
        <span className="text-6xl">{info.emoji}</span>
        <h1 className="mt-1 text-2xl font-bold text-secondary">{t(info.key)}</h1>
        <p className="text-sm text-muted-foreground">{t("leagueEnds", { n: daysLeftInWeek(new Date()) })}</p>
        <p className="mt-1 text-xs text-muted-foreground">{t("leagueRules")}</p>
      </div>
      {board.isLoading || me.isLoading ? (
        <p className="mt-8 text-center text-muted-foreground">{t("loading")}</p>
      ) : rows.length === 0 ? (
        <p className="mt-8 rounded-2xl border-2 border-dashed border-border p-6 text-center text-muted-foreground">{t("leagueEmpty")}</p>
      ) : (
        <ol className="mt-5 space-y-2">
          {rows.map((row, i) => {
            const zone = zoneOf(i + 1, rows.length, league, row.xp);
            return (
              <BoardRow key={row.id} row={row} rank={i} me={row.id === userId}
                badge={zone === "up" ? <ArrowUp aria-label={t("leagueUp")} className="size-4 text-success" /> : zone === "down" ? <ArrowDown aria-label={t("leagueDown")} className="size-4 text-destructive" /> : null} />
            );
          })}
        </ol>
      )}
    </section>
  );
}

function FriendsTab({ userId }: { userId: string }) {
  const { t } = useT();
  const qc = useQueryClient();
  const me = useMyProfile(userId);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const friends = useQuery({
    queryKey: ["friends", userId, weekStart(new Date())],
    queryFn: async () => {
      const follows = await supabase.from("follows").select("followee_id").eq("follower_id", userId);
      if (follows.error) throw follows.error;
      const ids = [userId, ...follows.data.map((f) => f.followee_id)];
      const [profiles, weekly] = await Promise.all([
        supabase.from("profiles").select("id, display_name, streak").in("id", ids),
        supabase.from("weekly_xp").select("user_id, xp").eq("week_start", weekStart(new Date())).in("user_id", ids),
      ]);
      if (profiles.error) throw profiles.error;
      if (weekly.error) throw weekly.error;
      const xpOf = new Map(weekly.data.map((w) => [w.user_id, w.xp]));
      return profiles.data
        .map((p): Row => ({ id: p.id, name: p.display_name, streak: p.streak, xp: xpOf.get(p.id) ?? 0 }))
        .sort((a, b) => b.xp - a.xp);
    },
  });

  async function add() {
    const c = normalizeFriendCode(code);
    if (c.length !== 6) { toast.error(t("friendNotFound")); return; }
    if (c === me.data?.friend_code) { toast.error(t("friendSelf")); return; }
    setBusy(true);
    try {
      const found = await supabase.from("profiles").select("id").eq("friend_code", c).maybeSingle();
      if (found.error || !found.data) { toast.error(t("friendNotFound")); return; }
      const res = await supabase.from("follows").upsert({ follower_id: userId, followee_id: found.data.id }, { onConflict: "follower_id,followee_id", ignoreDuplicates: true });
      if (res.error) { toast.error(t("friendNotFound")); return; }
      toast.success(t("friendAdded"));
      setCode("");
      void qc.invalidateQueries({ queryKey: ["friends", userId] });
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    const res = await supabase.from("follows").delete().eq("follower_id", userId).eq("followee_id", id);
    if (!res.error) void qc.invalidateQueries({ queryKey: ["friends", userId] });
  }

  const myCode = me.data?.friend_code ?? "······";
  const rows = friends.data ?? [];

  return (
    <section className="mt-5 space-y-4">
      <div className="rounded-2xl border-2 border-border bg-card p-4">
        <p className="text-sm text-muted-foreground">{t("friendCode")}</p>
        <div className="mt-1 flex items-center justify-between gap-3">
          <span dir="ltr" className="font-display text-3xl font-bold tracking-[0.3em] text-secondary">{myCode}</span>
          <button type="button" onClick={() => void navigator.clipboard?.writeText(myCode).then(() => toast.success(t("copied")))}
            aria-label={t("copied")} className="rounded-xl border-2 border-border p-2 text-muted-foreground hover:text-foreground"><Copy className="size-5" /></button>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">{t("friendCodeHint")}</p>
        <form className="mt-4 flex gap-2" onSubmit={(e) => { e.preventDefault(); void add(); }}>
          <input className={cn(fieldClass, "flex-1 uppercase")} dir="ltr" maxLength={8} value={code}
            onChange={(e) => setCode(e.target.value)} placeholder={t("addFriendPlaceholder")} aria-label={t("addFriendPlaceholder")} />
          <button type="submit" disabled={busy} className="btn-3d flex items-center gap-1 bg-primary px-4 text-primary-foreground shadow-[0_4px_0_var(--primary-shade)]">
            <UserPlus className="size-5" /><span className="sr-only">{t("addFriend")}</span>
          </button>
        </form>
      </div>
      {friends.isLoading ? (
        <p className="text-center text-muted-foreground">{t("loading")}</p>
      ) : rows.length <= 1 ? (
        <p className="rounded-2xl border-2 border-dashed border-border p-6 text-center text-muted-foreground">{t("friendsEmpty")}</p>
      ) : (
        <ol className="space-y-2">
          {rows.map((row, i) => (
            <BoardRow key={row.id} row={row} rank={i} me={row.id === userId}
              badge={row.id !== userId ? (
                <button type="button" onClick={() => void remove(row.id)} className="text-xs font-semibold text-muted-foreground hover:text-destructive">{t("unfollow")}</button>
              ) : null} />
          ))}
        </ol>
      )}
    </section>
  );
}

function AllTimeTab({ userId }: { userId: string }) {
  const { t } = useT();
  const board = useQuery({
    queryKey: ["leaderboard", userId],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("id, display_name, xp, streak").order("xp", { ascending: false }).limit(50);
      if (error) throw error;
      return data.map((r): Row => ({ id: r.id, name: r.display_name, xp: r.xp, streak: r.streak }));
    },
  });
  return (
    <section className="mt-5">
      <p className="text-center text-sm text-muted-foreground">{t("leaderboardSub")}</p>
      {board.isLoading ? (
        <p className="mt-8 text-center text-muted-foreground">{t("loading")}</p>
      ) : !board.data?.length ? (
        <p className="mt-8 text-center text-muted-foreground">{t("noOneYet")}</p>
      ) : (
        <ol className="mt-4 space-y-2">
          {board.data.map((row, i) => <BoardRow key={row.id} row={row} rank={i} me={row.id === userId} />)}
        </ol>
      )}
    </section>
  );
}

function BoardRow({ row, rank, me, badge }: { row: Row; rank: number; me: boolean; badge?: ReactNode }) {
  const { t } = useT();
  return (
    <li className={cn("flex items-center gap-3 rounded-2xl border-2 p-3", me ? "border-primary bg-accent" : "border-border bg-card")}>
      <span className="w-8 text-center font-display text-lg font-bold text-muted-foreground">{MEDALS[rank] ?? rank + 1}</span>
      <span className="flex size-10 items-center justify-center rounded-full bg-secondary font-display text-lg font-bold text-secondary-foreground">
        {row.name.slice(0, 1).toUpperCase()}
      </span>
      <span className="flex-1 truncate font-semibold">{row.name}{me && <span className="ms-1 text-sm text-primary">({t("you")})</span>}</span>
      {badge}
      {row.streak !== undefined && <span className="flex items-center gap-1 text-sm font-bold text-flame"><Flame className="size-4 fill-flame" />{row.streak}</span>}
      <span className="flex items-center gap-1 font-display font-bold text-primary"><Zap className="size-4 fill-primary" />{row.xp}</span>
    </li>
  );
}
