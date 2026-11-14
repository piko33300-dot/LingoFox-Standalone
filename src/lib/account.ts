import { useSyncExternalStore } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import { displayStreak, mergeProgress, progressActions, sanitizeProgress, subscribeProgress } from "./progress-store";
import { weekStart, weekXp } from "./leagues";

type AccountState = { user: User | null; role: string | null; ready: boolean };
let account: AccountState = { user: null, role: null, ready: false };
const listeners = new Set<() => void>();
const emit = (next: AccountState) => { account = next; listeners.forEach((l) => l()); };

let started = false;
let pushTimer: ReturnType<typeof setTimeout> | null = null;
let pulling = false;

async function fetchRole(userId: string): Promise<string> {
  try {
    const { data } = await supabase.from("profiles").select("role").eq("id", userId).maybeSingle();
    return (data as { role?: string } | null)?.role ?? "user";
  } catch {
    return "user";
  }
}

async function pull(userId: string) {
  pulling = true;
  try {
    const { data } = await supabase.from("user_progress").select("data").eq("user_id", userId).maybeSingle();
    const local = progressActions.get();
    const merged = data?.data ? mergeProgress(local, sanitizeProgress(data.data)) : local;
    progressActions.hydrate(merged);
  } finally {
    pulling = false;
  }
  await push(userId);
}

async function push(userId: string) {
  const p = progressActions.get();
  await Promise.all([
    supabase.from("user_progress").upsert({ user_id: userId, data: p as unknown as Json }, { onConflict: "user_id" }),
    supabase.from("profiles").update({ xp: p.xp, streak: displayStreak(p, new Date()) }).eq("id", userId),
  ]);
  // Weekly league table: only written once the learner has earned XP this week.
  const week = weekXp(p.xpByDay, new Date());
  if (week > 0) {
    const { error } = await supabase.from("weekly_xp").upsert({ user_id: userId, xp: week, week_start: weekStart(new Date()) }, { onConflict: "user_id,week_start" });
    if (error) console.warn("weekly xp sync failed", error.message);
  }
}

/** Start auth tracking + cloud progress sync once, in the browser. */
export function startAccount(onIdentityChange: () => void) {
  if (started || typeof window === "undefined") return;
  started = true;

  supabase.auth.getUser().then(async ({ data }) => {
    const user = data.user ?? null;
    const role = user ? await fetchRole(user.id) : null;
    emit({ user, role, ready: true });
    if (user) void pull(user.id);
  });

  supabase.auth.onAuthStateChange(async (event, session) => {
    if (event !== "SIGNED_IN" && event !== "SIGNED_OUT" && event !== "USER_UPDATED") return;
    const user = session?.user ?? null;
    const changed = user?.id !== account.user?.id;
    const role = user ? await fetchRole(user.id) : null;
    emit({ user, role, ready: true });
    if (event === "SIGNED_IN" && user && changed) void pull(user.id);
    onIdentityChange();
  });

  subscribeProgress(() => {
    const uid = account.user?.id;
    if (!uid || pulling) return;
    if (pushTimer) clearTimeout(pushTimer);
    pushTimer = setTimeout(() => void push(uid), 1200);
  });
}

/** Stop any queued cloud save, e.g. right before the account is deleted. */
export function cancelPendingSync() {
  if (pushTimer) clearTimeout(pushTimer);
  pushTimer = null;
}

export async function signOut() {
  await supabase.auth.signOut();
  progressActions.reset();
  emit({ user: null, role: null, ready: true });
}

export async function refreshAccountRole() {
  if (account.user) {
    const role = await fetchRole(account.user.id);
    emit({ ...account, role });
  }
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}
const serverSnapshot: AccountState = { user: null, role: null, ready: false };
export function useAccount() {
  return useSyncExternalStore(subscribe, () => account, () => serverSnapshot);
}

export function useIsAdmin(): boolean {
  const { user, role } = useAccount();
  return Boolean(user && role === "admin");
}
