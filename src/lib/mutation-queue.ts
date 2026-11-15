/**
 * LingoFox Persistent Offline Mutation & Sync Queue
 *
 * Provides a resilient, local-storage-backed FIFO queue for background operations
 * (cloud sync, quest claims, profile updates) with:
 * - Exponential backoff retries with jitter
 * - Automatic pause when offline & instant resumption when reconnected
 * - Concurrency mutex to prevent duplicate network races
 * - Deduplication / coalescing keys to avoid redundant operations
 * - Multi-tab synchronization via storage events
 * - React hook `useMutationQueue()` for live UI reactive status
 */

import { useSyncExternalStore } from "react";

export type MutationStatus = "pending" | "processing" | "failed" | "completed";

export interface MutationTask<TPayload = any> {
  id: string;
  type: string;
  payload: TPayload;
  createdAt: number;
  attempts: number;
  maxRetries: number;
  baseDelayMs: number;
  maxDelayMs: number;
  nextAttemptAt: number;
  lastAttemptAt?: number;
  status: MutationStatus;
  lastError?: string;
  dedupKey?: string;
}

export interface EnqueueOptions<TPayload = any> {
  type: string;
  payload: TPayload;
  dedupKey?: string;
  maxRetries?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
}

export type MutationHandler<TPayload = any> = (
  payload: TPayload,
  task: MutationTask<TPayload>
) => Promise<boolean | void>;

export interface QueueStats {
  total: number;
  pending: number;
  processing: number;
  failed: number;
  completed: number;
  isOnline: boolean;
  isProcessing: boolean;
  lastProcessedAt: number | null;
  nextScheduledAttemptAt: number | null;
}

const STORAGE_KEY = "lingofox:mutation-queue:v1";
const DEFAULT_MAX_RETRIES = 5;
const DEFAULT_BASE_DELAY_MS = 1000; // 1s
const DEFAULT_MAX_DELAY_MS = 30000; // 30s

// In-memory tasks store
let tasks: MutationTask[] = [];
let isInitialized = false;
let isProcessing = false;
let pendingDrainRequest = false;
let activeTimer: ReturnType<typeof setTimeout> | null = null;
let lastProcessedAt: number | null = null;

const handlers = new Map<string, MutationHandler<any>>();
const listeners = new Set<() => void>();

function emitChange() {
  listeners.forEach((l) => l());
}

/**
 * Calculates exponential backoff delay based on attempt count.
 * Formula: min(maxDelay, baseDelay * 2^attempts) + optional jitter (0-25%).
 */
export function calculateBackoff(
  attempts: number,
  baseDelayMs: number = DEFAULT_BASE_DELAY_MS,
  maxDelayMs: number = DEFAULT_MAX_DELAY_MS,
  withJitter: boolean = true
): number {
  const safeAttempts = Math.max(0, attempts);
  const exponential = Math.min(maxDelayMs, baseDelayMs * Math.pow(2, safeAttempts));
  if (!withJitter) return exponential;
  const jitter = Math.floor(Math.random() * (baseDelayMs * 0.25));
  return Math.min(maxDelayMs, exponential + jitter);
}

/** Check if current runtime environment is considered online. */
export function isNetworkOnline(): boolean {
  if (typeof navigator !== "undefined" && typeof navigator.onLine === "boolean") {
    return navigator.onLine;
  }
  return true;
}

/** Loads tasks from persistent storage (safe for SSR). */
function loadTasksFromStorage(): MutationTask[] {
  if (typeof window === "undefined" || !window.localStorage) {
    return tasks;
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    // Sanitize tasks
    return parsed.filter(
      (t) =>
        t &&
        typeof t.id === "string" &&
        typeof t.type === "string" &&
        typeof t.status === "string"
    );
  } catch (e) {
    console.warn("Failed to load mutation queue from storage:", e);
    return [];
  }
}

/** Saves tasks to persistent storage (safe for SSR). */
function saveTasksToStorage(currentTasks: MutationTask[]) {
  if (typeof window === "undefined" || !window.localStorage) {
    return;
  }
  try {
    // Keep max 15 completed tasks to prevent unbounded growth
    const activeTasks = currentTasks.filter((t) => t.status !== "completed");
    const completedTasks = currentTasks
      .filter((t) => t.status === "completed")
      .slice(-15);
    const toSave = [...activeTasks, ...completedTasks];
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
  } catch (e) {
    console.warn("Failed to persist mutation queue to storage:", e);
  }
}

/**
 * Registers an asynchronous handler function for a specific mutation type.
 */
export function registerMutationHandler<T = any>(
  type: string,
  handler: MutationHandler<T>
): () => void {
  handlers.set(type, handler);
  // Auto-schedule processing if there are pending tasks of this type
  if (isInitialized && tasks.some((t) => t.type === type && t.status === "pending")) {
    void processQueue();
  }
  return () => {
    handlers.delete(type);
  };
}

/**
 * Enqueues a new mutation task into the persistent queue.
 * Supports coalescing / deduplication when `dedupKey` is provided.
 */
export function enqueueMutation<T = any>(options: EnqueueOptions<T>): string {
  ensureInitialized();

  const {
    type,
    payload,
    dedupKey,
    maxRetries = DEFAULT_MAX_RETRIES,
    baseDelayMs = DEFAULT_BASE_DELAY_MS,
    maxDelayMs = DEFAULT_MAX_DELAY_MS,
  } = options;

  // Deduplication check: if a task with the same dedupKey is pending or processing, coalesce it
  if (dedupKey) {
    const existingIndex = tasks.findIndex(
      (t) =>
        t.dedupKey === dedupKey &&
        (t.status === "pending" || t.status === "processing" || t.status === "failed")
    );

    if (existingIndex >= 0) {
      const existing = tasks[existingIndex];
      const updated: MutationTask<T> = {
        ...existing,
        payload,
        status: "pending",
        lastError: undefined,
        // Reset nextAttemptAt so the latest coalesced state runs promptly
        nextAttemptAt: Date.now(),
      };
      tasks[existingIndex] = updated;
      saveTasksToStorage(tasks);
      emitChange();
      scheduleDrain();
      return updated.id;
    }
  }

  const id = `mut_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  const newTask: MutationTask<T> = {
    id,
    type,
    payload,
    createdAt: Date.now(),
    attempts: 0,
    maxRetries,
    baseDelayMs,
    maxDelayMs,
    nextAttemptAt: Date.now(),
    status: "pending",
    dedupKey,
  };

  tasks.push(newTask);
  saveTasksToStorage(tasks);
  emitChange();
  scheduleDrain();

  return id;
}

/**
 * Schedules a queue drain immediately or at the earliest nextAttemptAt.
 */
function scheduleDrain() {
  if (!isNetworkOnline()) return;

  if (activeTimer) {
    clearTimeout(activeTimer);
    activeTimer = null;
  }

  const now = Date.now();
  const pendingTasks = tasks.filter((t) => t.status === "pending");
  if (pendingTasks.length === 0) return;

  // Find earliest scheduled attempt
  const earliest = Math.min(...pendingTasks.map((t) => t.nextAttemptAt));
  // Guarantee a minimum delay of 30ms to prevent synchronous call-stack recursion
  const delay = Math.max(30, earliest - now);

  activeTimer = setTimeout(() => {
    activeTimer = null;
    void processQueue();
  }, delay);
}

/**
 * Processes the persistent queue, respecting exponential backoff and offline state.
 * Protected by a concurrency mutex to guarantee serialized execution per task.
 */
export async function processQueue(force: boolean = false): Promise<{
  processed: number;
  failed: number;
  remaining: number;
}> {
  ensureInitialized();

  if (!isNetworkOnline() && !force) {
    emitChange();
    return { processed: 0, failed: 0, remaining: getPendingCount() };
  }

  if (isProcessing) {
    pendingDrainRequest = true;
    return { processed: 0, failed: 0, remaining: getPendingCount() };
  }

  isProcessing = true;
  emitChange();

  let processed = 0;
  let failed = 0;

  try {
    const now = Date.now();

    // Eligible tasks: pending and due for execution (or forced)
    const eligibleTasks = tasks
      .filter((t) => t.status === "pending" && (force || t.nextAttemptAt <= now))
      .sort((a, b) => a.createdAt - b.createdAt);

    for (const task of eligibleTasks) {
      if (!isNetworkOnline() && !force) {
        break; // Stop processing further tasks if connection drops mid-drain
      }

      const handler = handlers.get(task.type);
      if (!handler) {
        // No handler registered yet for this type — keep pending until registered
        continue;
      }

      task.status = "processing";
      task.lastAttemptAt = Date.now();
      saveTasksToStorage(tasks);
      emitChange();

      try {
        const result = await handler(task.payload, task);
        if (result === false) {
          throw new Error("Task handler returned unsuccessful status");
        }

        task.status = "completed";
        delete task.lastError;
        processed++;
      } catch (err: any) {
        task.attempts += 1;
        task.lastError = err?.message ?? "Operation failed";

        if (task.attempts >= task.maxRetries) {
          task.status = "failed";
          failed++;
        } else {
          task.status = "pending";
          const backoff = calculateBackoff(
            task.attempts,
            task.baseDelayMs,
            task.maxDelayMs,
            true
          );
          task.nextAttemptAt = Date.now() + backoff;
        }
      }

      saveTasksToStorage(tasks);
      emitChange();
    }

    lastProcessedAt = Date.now();
  } finally {
    isProcessing = false;
    saveTasksToStorage(tasks);
    emitChange();

    if (pendingDrainRequest) {
      pendingDrainRequest = false;
    }
    scheduleDrain();
  }

  return { processed, failed, remaining: getPendingCount() };
}

/** Resets backoff and retries all failed tasks. */
export async function retryFailedMutations(): Promise<{
  processed: number;
  failed: number;
  remaining: number;
}> {
  ensureInitialized();
  const now = Date.now();
  let modified = false;

  for (const t of tasks) {
    if (t.status === "failed") {
      t.status = "pending";
      t.attempts = 0;
      t.nextAttemptAt = now;
      delete t.lastError;
      modified = true;
    }
  }

  if (modified) {
    saveTasksToStorage(tasks);
    emitChange();
    return await processQueue(true);
  }
  return { processed: 0, failed: 0, remaining: getPendingCount() };
}

/** Cancels and removes a specific mutation task. */
export function cancelMutation(taskId: string): boolean {
  ensureInitialized();
  const index = tasks.findIndex((t) => t.id === taskId);
  if (index >= 0) {
    tasks.splice(index, 1);
    saveTasksToStorage(tasks);
    emitChange();
    return true;
  }
  return false;
}

/** Clears all completed mutation tasks from memory and storage. */
export function clearCompletedMutations(): void {
  ensureInitialized();
  tasks = tasks.filter((t) => t.status !== "completed");
  saveTasksToStorage(tasks);
  emitChange();
}

/** Clears the entire queue (useful for testing or total account reset). */
export function clearAllMutations(): void {
  ensureInitialized();
  if (activeTimer) {
    clearTimeout(activeTimer);
    activeTimer = null;
  }
  tasks = [];
  saveTasksToStorage(tasks);
  emitChange();
}

/** Returns live snapshot copy of all tasks in the queue. */
export function getQueueTasks(): MutationTask[] {
  ensureInitialized();
  return [...tasks];
}

function getPendingCount(): number {
  return tasks.filter((t) => t.status === "pending" || t.status === "processing").length;
}

/** Returns overall queue statistics for live telemetry and UI badges. */
export function getQueueStats(): QueueStats {
  ensureInitialized();

  let pending = 0;
  let processing = 0;
  let failed = 0;
  let completed = 0;
  let nextScheduledAttemptAt: number | null = null;

  for (const t of tasks) {
    if (t.status === "pending") {
      pending++;
      if (nextScheduledAttemptAt === null || t.nextAttemptAt < nextScheduledAttemptAt) {
        nextScheduledAttemptAt = t.nextAttemptAt;
      }
    } else if (t.status === "processing") {
      processing++;
    } else if (t.status === "failed") {
      failed++;
    } else if (t.status === "completed") {
      completed++;
    }
  }

  return {
    total: tasks.length,
    pending,
    processing,
    failed,
    completed,
    isOnline: isNetworkOnline(),
    isProcessing,
    lastProcessedAt,
    nextScheduledAttemptAt,
  };
}

/**
 * Initializes the mutation queue event listeners:
 * - Online / Offline network triggers
 * - Visibility change triggers
 * - Multi-tab storage sync
 */
export function startMutationQueue(): void {
  ensureInitialized();
}

function ensureInitialized() {
  if (isInitialized) return;
  isInitialized = true;

  tasks = loadTasksFromStorage();

  if (typeof window !== "undefined") {
    // 1. Online: immediately reset backoff of pending tasks and drain
    window.addEventListener("online", () => {
      const now = Date.now();
      for (const t of tasks) {
        if (t.status === "pending" && t.nextAttemptAt > now) {
          t.nextAttemptAt = now;
        }
      }
      saveTasksToStorage(tasks);
      emitChange();
      void processQueue(true);
    });

    // 2. Offline: emit change to notify UI
    window.addEventListener("offline", () => {
      if (activeTimer) {
        clearTimeout(activeTimer);
        activeTimer = null;
      }
      emitChange();
    });

    // 3. Tab Visibility change: drain on foreground return
    if (typeof document !== "undefined") {
      document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "visible" && isNetworkOnline()) {
          void processQueue();
        }
      });
    }

    // 4. Cross-tab storage synchronization
    window.addEventListener("storage", (event) => {
      if (event.key === STORAGE_KEY) {
        tasks = loadTasksFromStorage();
        emitChange();
        scheduleDrain();
      }
    });

    // Initial check on startup
    scheduleDrain();
  }
}

function subscribeQueue(listener: () => void): () => void {
  ensureInitialized();
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

const serverStatsSnapshot: QueueStats = {
  total: 0,
  pending: 0,
  processing: 0,
  failed: 0,
  completed: 0,
  isOnline: true,
  isProcessing: false,
  lastProcessedAt: null,
  nextScheduledAttemptAt: null,
};

/**
 * React hook to reactively subscribe to the mutation queue status and counts.
 */
export function useMutationQueue(): QueueStats {
  return useSyncExternalStore(subscribeQueue, getQueueStats, () => serverStatsSnapshot);
}
