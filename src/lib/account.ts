import { useSyncExternalStore } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import {
  displayStreak,
  mergeProgress,
  progressActions,
  sanitizeProgress,
  subscribeProgress,
} from "./progress-store";
import { weekStart, weekXp } from "./leagues";
import {
  enqueueMutation,
  processQueue,
  registerMutationHandler,
  startMutationQueue,
  type QueueStats,
  getQueueStats,
} from "./mutation-queue";

export type SyncStatus = "idle" | "syncing" | "offline" | "error";

export interface SyncState {
  status: SyncStatus;
  isOnline: boolean;
  hasPendingSync: boolean;
  lastSyncedAt: Date | null;
  lastError: string | null;
  queuedCount: number;
}

type AccountState = { user: User | null; role: string | null; ready: boolean };
let account: AccountState = { user: null, role: null, ready: false };
const accountListeners = new Set<() => void>();
const emitAccount = (next: AccountState) => {
  account = next;
  accountListeners.forEach((l) => l());
};

let syncState: SyncState = {
  status: typeof navigator !== "undefined" && !navigator.onLine ? "offline" : "idle",
  isOnline: typeof navigator !== "undefined" ? navigator.onLine : true,
  hasPendingSync: false,
  lastSyncedAt: null,
  lastError: null,
  queuedCount: 0,
};

const syncListeners = new Set<() => void>();
const emitSync = (next: SyncState) => {
  syncState = next;
  syncListeners.forEach((l) => l());
};

let started = false;
let pushTimer: ReturnType<typeof setTimeout> | null = null;
let pulling = false;
let syncMutex = false;
let queuedSyncRerun = false;

async function fetchRole(userId: string): Promise<string> {
  try {
    const { data } = await supabase.from("profiles").select("role").eq("id", userId).maybeSingle();
    return (data as { role?: string } | null)?.role ?? "user";
  } catch {
    return "user";
  }
}

/** Low-level core execution of bidirectional cloud synchronization. */
export async function executeCloudProgressSync(userId: string): Promise<boolean> {
  if (syncMutex) {
    queuedSyncRerun = true;
    return true;
  }

  syncMutex = true;
  pulling = true;
  emitSync({ ...syncState, status: "syncing", lastError: null });

  try {
    // 1. Pull latest cloud snapshot
    const { data, error: pullErr } = await supabase
      .from("user_progress")
      .select("data")
      .eq("user_id", userId)
      .maybeSingle();

    if (pullErr) throw pullErr;

    // 2. Reconcile with local progress (deduplicating claimed quests & preserving rewards)
    const local = progressActions.get();
    const merged = data?.data ? mergeProgress(local, sanitizeProgress(data.data)) : local;
    progressActions.hydrate(merged);

    // 3. Push unified progress to cloud tables
    const [upsertProg, updateProf] = await Promise.all([
      supabase.from("user_progress").upsert(
        { user_id: userId, data: merged as unknown as Json },
        { onConflict: "user_id" }
      ),
      supabase.from("profiles").update({
        xp: merged.xp,
        streak: displayStreak(merged, new Date()),
      }).eq("id", userId),
    ]);

    if (upsertProg.error) throw upsertProg.error;
    if (updateProf.error) throw updateProf.error;

    // 4. Update weekly league table if active this week
    const week = weekXp(merged.xpByDay, new Date());
    if (week > 0) {
      const { error: weekErr } = await supabase
        .from("weekly_xp")
        .upsert(
          { user_id: userId, xp: week, week_start: weekStart(new Date()) },
          { onConflict: "user_id,week_start" }
        );
      if (weekErr) console.warn("weekly xp sync failed", weekErr.message);
    }

    const qStats = getQueueStats();
    emitSync({
      ...syncState,
      status: "idle",
      isOnline: true,
      hasPendingSync: qStats.pending > 0,
      lastSyncedAt: new Date(),
      lastError: null,
      queuedCount: qStats.pending,
    });
    return true;
  } catch (err: any) {
    console.warn("Cloud sync encountered network issue, queued for exponential retry:", err?.message);
    const isOff = typeof navigator !== "undefined" && !navigator.onLine;
    const qStats = getQueueStats();
    emitSync({
      ...syncState,
      status: isOff ? "offline" : "error",
      isOnline: !isOff,
      hasPendingSync: true,
      lastError: err?.message ?? "Network sync error",
      queuedCount: qStats.pending,
    });
    return false;
  } finally {
    pulling = false;
    syncMutex = false;
    if (queuedSyncRerun) {
      queuedSyncRerun = false;
      void executeCloudProgressSync(userId);
    }
  }
}

/**
 * Synchronizes local progress bidirectionally with the cloud database.
 * If offline or if the request fails, it is automatically routed to the
 * persistent mutation queue for exponential backoff retries.
 */
export async function syncCloudProgress(userId: string): Promise<boolean> {
  const isOnline = typeof navigator !== "undefined" ? navigator.onLine : true;

  if (!isOnline) {
    enqueueMutation({
      type: "sync_progress",
      payload: { userId },
      dedupKey: `sync_progress:${userId}`,
    });
    const qStats = getQueueStats();
    emitSync({
      ...syncState,
      isOnline: false,
      status: "offline",
      hasPendingSync: true,
      queuedCount: qStats.pending,
    });
    return false;
  }

  // Attempt live sync first
  const ok = await executeCloudProgressSync(userId);
  if (!ok) {
    // Enqueue in persistent queue for exponential backoff retry
    enqueueMutation({
      type: "sync_progress",
      payload: { userId },
      dedupKey: `sync_progress:${userId}`,
    });
    const qStats = getQueueStats();
    emitSync({
      ...syncState,
      hasPendingSync: true,
      queuedCount: qStats.pending,
    });
  }
  return ok;
}

/** Explicit manual sync trigger available to UI buttons and retry actions. */
export async function syncNow(): Promise<boolean> {
  const uid = account.user?.id;
  if (!uid) return true;
  // Trigger both live sync and persistent queue drainage
  const [syncOk] = await Promise.all([
    syncCloudProgress(uid),
    processQueue(true),
  ]);
  return syncOk;
}

/** Start auth tracking + cloud progress sync once, in the browser. */
export function startAccount(onIdentityChange: () => void) {
  if (started || typeof window === "undefined") return;
  started = true;

  // Initialize persistent mutation queue and register sync handler
  startMutationQueue();
  registerMutationHandler<{ userId: string }>("sync_progress", async ({ userId }) => {
    const ok = await executeCloudProgressSync(userId);
    if (!ok) throw new Error("Sync failed, will retry with backoff");
    return true;
  });

  // Listen to network reconnection
  window.addEventListener("online", () => {
    const qStats = getQueueStats();
    emitSync({ ...syncState, isOnline: true, queuedCount: qStats.pending });
    if (account.user) {
      void syncCloudProgress(account.user.id);
    }
  });

  window.addEventListener("offline", () => {
    const qStats = getQueueStats();
    emitSync({ ...syncState, isOnline: false, status: "offline", queuedCount: qStats.pending });
  });

  // Re-check sync when returning from background / mobile tab switch
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible" && navigator.onLine) {
      if (syncState.hasPendingSync && account.user) {
        void syncCloudProgress(account.user.id);
      }
    }
  });

  supabase.auth.getUser().then(async ({ data }) => {
    const user = data.user ?? null;
    const role = user ? await fetchRole(user.id) : null;
    emitAccount({ user, role, ready: true });
    if (user) void syncCloudProgress(user.id);
  });

  supabase.auth.onAuthStateChange(async (event, session) => {
    if (event !== "SIGNED_IN" && event !== "SIGNED_OUT" && event !== "USER_UPDATED") return;
    const user = session?.user ?? null;
    const changed = user?.id !== account.user?.id;
    const role = user ? await fetchRole(user.id) : null;
    emitAccount({ user, role, ready: true });
    if (event === "SIGNED_IN" && user && changed) void syncCloudProgress(user.id);
    onIdentityChange();
  });

  subscribeProgress(() => {
    const uid = account.user?.id;
    if (!uid || pulling) return;

    if (typeof navigator !== "undefined" && !navigator.onLine) {
      enqueueMutation({
        type: "sync_progress",
        payload: { userId: uid },
        dedupKey: `sync_progress:${uid}`,
      });
      const qStats = getQueueStats();
      emitSync({
        ...syncState,
        hasPendingSync: true,
        status: "offline",
        isOnline: false,
        queuedCount: qStats.pending,
      });
      return;
    }

    const qStats = getQueueStats();
    emitSync({ ...syncState, hasPendingSync: true, queuedCount: qStats.pending });
    if (pushTimer) clearTimeout(pushTimer);
    pushTimer = setTimeout(() => {
      void syncCloudProgress(uid);
    }, 1200);
  });
}

/** Stop any queued cloud save, e.g. right before the account is deleted. */
export function cancelPendingSync() {
  if (pushTimer) clearTimeout(pushTimer);
  pushTimer = null;
  queuedSyncRerun = false;
}

export async function signOut() {
  await supabase.auth.signOut();
  progressActions.reset();
  emitAccount({ user: null, role: null, ready: true });
}

export async function refreshAccountRole() {
  if (account.user) {
    const role = await fetchRole(account.user.id);
    emitAccount({ ...account, role });
  }
}

function subscribeAccount(l: () => void) {
  accountListeners.add(l);
  return () => accountListeners.delete(l);
}

const serverAccountSnapshot: AccountState = { user: null, role: null, ready: false };
export function useAccount() {
  return useSyncExternalStore(subscribeAccount, () => account, () => serverAccountSnapshot);
}

export function useIsAdmin(): boolean {
  const { user, role } = useAccount();
  return Boolean(user && role === "admin");
}

function subscribeSync(l: () => void) {
  syncListeners.add(l);
  return () => syncListeners.delete(l);
}

const serverSyncSnapshot: SyncState = {
  status: "idle",
  isOnline: true,
  hasPendingSync: false,
  lastSyncedAt: null,
  lastError: null,
  queuedCount: 0,
};

export function useSyncStatus(): SyncState {
  return useSyncExternalStore(subscribeSync, () => syncState, () => serverSyncSnapshot);
}
