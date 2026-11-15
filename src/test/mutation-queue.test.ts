import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  calculateBackoff,
  enqueueMutation,
  processQueue,
  registerMutationHandler,
  retryFailedMutations,
  clearAllMutations,
  cancelMutation,
  getQueueTasks,
  getQueueStats,
  startMutationQueue,
} from "@/lib/mutation-queue";

describe("Mutation Queue & Exponential Backoff Engine", () => {
  beforeEach(() => {
    clearAllMutations();
    localStorage.clear();
    startMutationQueue();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    clearAllMutations();
    vi.restoreAllMocks();
  });

  describe("calculateBackoff", () => {
    it("calculates exact deterministic exponential backoff when jitter is disabled", () => {
      expect(calculateBackoff(0, 1000, 30000, false)).toBe(1000); // 1000 * 2^0
      expect(calculateBackoff(1, 1000, 30000, false)).toBe(2000); // 1000 * 2^1
      expect(calculateBackoff(2, 1000, 30000, false)).toBe(4000); // 1000 * 2^2
      expect(calculateBackoff(3, 1000, 30000, false)).toBe(8000); // 1000 * 2^3
      expect(calculateBackoff(4, 1000, 30000, false)).toBe(16000); // 1000 * 2^4
    });

    it("respects maxDelay ceiling", () => {
      expect(calculateBackoff(10, 1000, 30000, false)).toBe(30000);
      expect(calculateBackoff(5, 1000, 15000, false)).toBe(15000);
    });

    it("adds non-negative jitter within expected boundary", () => {
      const withJitter = calculateBackoff(1, 1000, 30000, true);
      expect(withJitter).toBeGreaterThanOrEqual(2000);
      expect(withJitter).toBeLessThanOrEqual(2250); // 1000 * 0.25 jitter max
    });
  });

  describe("enqueueMutation & Coalescing", () => {
    it("enqueues tasks into storage and reflects in stats", () => {
      const taskId = enqueueMutation({
        type: "test_action",
        payload: { value: 42 },
      });

      expect(taskId).toMatch(/^mut_/);
      const tasks = getQueueTasks();
      expect(tasks).toHaveLength(1);
      expect(tasks[0].id).toBe(taskId);
      expect(tasks[0].type).toBe("test_action");
      expect(tasks[0].payload).toEqual({ value: 42 });
      expect(tasks[0].status).toBe("pending");

      const stats = getQueueStats();
      expect(stats.total).toBe(1);
      expect(stats.pending).toBe(1);
    });

    it("coalesces tasks with the same dedupKey instead of creating duplicates", () => {
      const id1 = enqueueMutation({
        type: "sync_progress",
        payload: { step: 1 },
        dedupKey: "sync:user_1",
      });

      const id2 = enqueueMutation({
        type: "sync_progress",
        payload: { step: 2 },
        dedupKey: "sync:user_1",
      });

      expect(id2).toBe(id1);
      const tasks = getQueueTasks();
      expect(tasks).toHaveLength(1);
      expect(tasks[0].payload).toEqual({ step: 2 });
    });
  });

  describe("processQueue with Handlers & Exponential Backoff", () => {
    it("successfully completes tasks when handler resolves", async () => {
      const handler = vi.fn().mockResolvedValue(true);
      const unregister = registerMutationHandler("complete_test", handler);

      enqueueMutation({
        type: "complete_test",
        payload: { msg: "hello" },
      });

      const result = await processQueue(true);
      expect(result.processed).toBe(1);
      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith({ msg: "hello" }, expect.anything());

      const tasks = getQueueTasks();
      expect(tasks[0].status).toBe("completed");

      unregister();
    });

    it("retries with exponential backoff on handler rejection", async () => {
      const handler = vi.fn().mockRejectedValue(new Error("Network timeout"));
      const unregister = registerMutationHandler("fail_test", handler);

      enqueueMutation({
        type: "fail_test",
        payload: { try: 1 },
        maxRetries: 3,
        baseDelayMs: 500,
        maxDelayMs: 5000,
      });

      const now = Date.now();
      const res = await processQueue(true);
      expect(res.processed).toBe(0);
      expect(res.failed).toBe(0); // Not permanently failed yet, pending retry

      const tasks = getQueueTasks();
      expect(tasks[0].status).toBe("pending");
      expect(tasks[0].attempts).toBe(1);
      expect(tasks[0].lastError).toBe("Network timeout");
      expect(tasks[0].nextAttemptAt).toBeGreaterThan(now);

      unregister();
    });

    it("marks task as failed when exceeding maxRetries", async () => {
      const handler = vi.fn().mockRejectedValue(new Error("Fatal 500"));
      const unregister = registerMutationHandler("fatal_test", handler);

      enqueueMutation({
        type: "fatal_test",
        payload: {},
        maxRetries: 2,
      });

      // Attempt 1
      await processQueue(true);
      let tasks = getQueueTasks();
      expect(tasks[0].status).toBe("pending");
      expect(tasks[0].attempts).toBe(1);

      // Force Attempt 2
      await processQueue(true);
      tasks = getQueueTasks();
      expect(tasks[0].status).toBe("failed");
      expect(tasks[0].attempts).toBe(2);

      const stats = getQueueStats();
      expect(stats.failed).toBe(1);
      expect(stats.pending).toBe(0);

      unregister();
    });

    it("retries all failed tasks with retryFailedMutations()", async () => {
      const handler = vi.fn()
        .mockRejectedValueOnce(new Error("First fail"))
        .mockResolvedValueOnce(true);

      const unregister = registerMutationHandler("revive_test", handler);

      enqueueMutation({
        type: "revive_test",
        payload: {},
        maxRetries: 1,
      });

      // Fail it to terminal state
      await processQueue(true);
      expect(getQueueTasks()[0].status).toBe("failed");

      // Revive and retry
      await retryFailedMutations();
      expect(handler).toHaveBeenCalledTimes(2);

      const tasks = getQueueTasks();
      expect(tasks[0].status).toBe("completed");

      unregister();
    });
  });

  describe("Offline and Reconnection", () => {
    it("halts processing when navigator is offline unless forced", async () => {
      const handler = vi.fn().mockResolvedValue(true);
      const unregister = registerMutationHandler("offline_check", handler);

      Object.defineProperty(navigator, "onLine", {
        configurable: true,
        value: false,
      });

      enqueueMutation({
        type: "offline_check",
        payload: {},
      });

      const res = await processQueue(false);
      expect(res.processed).toBe(0);
      expect(handler).not.toHaveBeenCalled();

      // Restore online
      Object.defineProperty(navigator, "onLine", {
        configurable: true,
        value: true,
      });

      await processQueue(false);
      expect(handler).toHaveBeenCalledTimes(1);

      unregister();
    });
  });
});

  describe("Cancellation & Queue Hygiene", () => {
    it("cancels pending mutations by id", () => {
      const id = enqueueMutation({
        type: "cancel_me",
        payload: { x: 10 },
      });

      expect(getQueueTasks()).toHaveLength(1);
      const ok = cancelMutation(id);
      expect(ok).toBe(true);
      expect(getQueueTasks()).toHaveLength(0);
      expect(getQueueStats().pending).toBe(0);
    });

    it("clears all mutations", () => {
      enqueueMutation({ type: "a", payload: {} });
      enqueueMutation({ type: "b", payload: {} });
      expect(getQueueTasks()).toHaveLength(2);

      clearAllMutations();
      expect(getQueueTasks()).toHaveLength(0);
      expect(getQueueStats().total).toBe(0);
    });
  });

  describe("Concurrency & Mutex Protection", () => {
    it("serializes concurrent processQueue calls without data corruption", async () => {
      let activeExecutions = 0;
      let maxConcurrent = 0;

      const handler = vi.fn().mockImplementation(async () => {
        activeExecutions++;
        maxConcurrent = Math.max(maxConcurrent, activeExecutions);
        await new Promise((r) => setTimeout(r, 25));
        activeExecutions--;
        return true;
      });

      const unregister = registerMutationHandler("concurrent_test", handler);

      enqueueMutation({ type: "concurrent_test", payload: { i: 1 } });
      enqueueMutation({ type: "concurrent_test", payload: { i: 2 } });

      // Trigger two processQueue calls concurrently
      const [res1, res2] = await Promise.all([
        processQueue(true),
        processQueue(true),
      ]);

      // Max concurrent task executions should be exactly 1
      expect(maxConcurrent).toBe(1);
      expect(res1.processed + res2.processed).toBe(2);

      unregister();
    });
  });
