import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  initialProgress,
  mergeProgress,
  dayKey,
  type Progress,
} from "../lib/progress-store";
import {
  isQuestClaimed,
  getAllClaimedQuests,
  getQuestReward,
} from "../lib/quests";
import {
  clearAllMutations,
  enqueueMutation,
  processQueue,
  registerMutationHandler,
  getQueueTasks,
} from "../lib/mutation-queue";

describe("Concurrent Two-Device Quest Claim & Reconnection Integration Tests", () => {
  const testDate = new Date("2026-11-15T12:00:00Z");
  const dKey = dayKey(testDate);

  const quest1 = `quest-xp-${dKey}`; // +15 gems, +10 XP
  const quest2 = `quest-lessons-${dKey}`; // +20 gems, +15 XP
  const quest3 = `quest-mastery-${dKey}`; // +25 gems, +20 XP

  // Simulated Cloud DB Storage
  let cloudDatabase: {
    userId: string;
    progress: Progress;
    version: number;
  };

  const baselineProgress: Progress = {
    ...initialProgress,
    gems: 100,
    xp: 50,
    dailyActivity: {
      [dKey]: {
        lessons: 2,
        perfectLessons: 1,
        practices: 1,
        stories: 0,
        claimedQuests: [],
      },
    },
  };

  beforeEach(() => {
    clearAllMutations();
    localStorage.clear();
    cloudDatabase = {
      userId: "usr_fox_test_123",
      progress: JSON.parse(JSON.stringify(baselineProgress)),
      version: 1,
    };
  });

  it("simulates concurrent offline claim of the SAME quest on two devices, verifying single reward tally upon reconnect", async () => {
    // 1. Both devices start with synchronized baseline progress from cloud
    const deviceA_Progress: Progress = JSON.parse(JSON.stringify(cloudDatabase.progress));
    const deviceB_Progress: Progress = JSON.parse(JSON.stringify(cloudDatabase.progress));

    expect(deviceA_Progress.gems).toBe(100);
    expect(deviceA_Progress.xp).toBe(50);
    expect(isQuestClaimed(deviceA_Progress, quest1)).toBe(false);
    expect(isQuestClaimed(deviceB_Progress, quest1)).toBe(false);

    // 2. Both devices go offline
    let isDeviceA_Online = false;
    let isDeviceB_Online = false;

    // 3. Device A claims Quest 1 offline
    const rew1 = getQuestReward(quest1)!;
    expect(rew1).toEqual({ gems: 15, xp: 10 });

    deviceA_Progress.gems += rew1.gems;
    deviceA_Progress.xp += rew1.xp;
    deviceA_Progress.dailyActivity[dKey].claimedQuests.push(quest1);

    expect(deviceA_Progress.gems).toBe(115);
    expect(deviceA_Progress.xp).toBe(60);
    expect(isQuestClaimed(deviceA_Progress, quest1)).toBe(true);

    // 4. Device B concurrently claims the SAME Quest 1 offline
    deviceB_Progress.gems += rew1.gems;
    deviceB_Progress.xp += rew1.xp;
    deviceB_Progress.dailyActivity[dKey].claimedQuests.push(quest1);

    expect(deviceB_Progress.gems).toBe(115);
    expect(deviceB_Progress.xp).toBe(60);
    expect(isQuestClaimed(deviceB_Progress, quest1)).toBe(true);

    // 5. Device A reconnects first & syncs with cloud
    isDeviceA_Online = true;
    cloudDatabase.progress = mergeProgress(cloudDatabase.progress, deviceA_Progress);
    cloudDatabase.version += 1;

    expect(cloudDatabase.progress.gems).toBe(115);
    expect(cloudDatabase.progress.xp).toBe(60);
    expect(cloudDatabase.progress.dailyActivity[dKey].claimedQuests).toEqual([quest1]);

    // 6. Device B reconnects second & syncs with cloud
    isDeviceB_Online = true;
    // Cloud reconciles with Device B's progress
    const reconciledCloud = mergeProgress(cloudDatabase.progress, deviceB_Progress);
    cloudDatabase.progress = reconciledCloud;
    cloudDatabase.version += 1;

    // 7. Critical assertion: Gems and XP must NOT be counted twice!
    // Expected: 100 base + 15 (quest 1 once) = 115 gems, NOT 130!
    // Expected: 50 base + 10 (quest 1 once) = 60 XP, NOT 70!
    expect(reconciledCloud.gems).toBe(115);
    expect(reconciledCloud.xp).toBe(60);

    // Claimed quests contains quest1 exactly once
    const allClaimed = getAllClaimedQuests(reconciledCloud);
    expect(allClaimed.size).toBe(1);
    expect(allClaimed.has(quest1)).toBe(true);

    // Neither device can claim quest1 again
    expect(isQuestClaimed(reconciledCloud, quest1)).toBe(true);
  });

  it("simulates concurrent claims of overlapping quests on Device A (Q1, Q2) and Device B (Q2, Q3)", async () => {
    // Baseline: 100 gems, 50 XP
    const deviceA: Progress = JSON.parse(JSON.stringify(cloudDatabase.progress));
    const deviceB: Progress = JSON.parse(JSON.stringify(cloudDatabase.progress));

    const r1 = getQuestReward(quest1)!; // +15 gems, +10 XP
    const r2 = getQuestReward(quest2)!; // +20 gems, +15 XP
    const r3 = getQuestReward(quest3)!; // +25 gems, +20 XP

    // Device A claims Q1 and Q2 offline
    deviceA.gems += r1.gems + r2.gems; // 100 + 35 = 135
    deviceA.xp += r1.xp + r2.xp; // 50 + 25 = 75
    deviceA.dailyActivity[dKey].claimedQuests.push(quest1, quest2);

    // Device B concurrently claims Q2 and Q3 offline
    deviceB.gems += r2.gems + r3.gems; // 100 + 45 = 145
    deviceB.xp += r2.xp + r3.xp; // 50 + 35 = 85
    deviceB.dailyActivity[dKey].claimedQuests.push(quest2, quest3);

    // Both reconnect and sync
    // Device A syncs first
    cloudDatabase.progress = mergeProgress(cloudDatabase.progress, deviceA);
    expect(cloudDatabase.progress.gems).toBe(135);
    expect(cloudDatabase.progress.xp).toBe(75);

    // Device B syncs second
    cloudDatabase.progress = mergeProgress(cloudDatabase.progress, deviceB);

    // Exact reconciliation check:
    // Base: 100 gems, 50 XP
    // Q1 (15 gems, 10 XP)
    // Q2 (20 gems, 15 XP) -> claimed on both devices, must be counted ONCE!
    // Q3 (25 gems, 20 XP) -> claimed on device B
    // Total gems: 100 + 15 + 20 + 25 = 160 gems!
    // Total XP: 50 + 10 + 15 + 20 = 95 XP!
    expect(cloudDatabase.progress.gems).toBe(160);
    expect(cloudDatabase.progress.xp).toBe(95);

    const claimed = getAllClaimedQuests(cloudDatabase.progress);
    expect(claimed.size).toBe(3);
    expect(Array.from(claimed).sort()).toEqual([quest2, quest3, quest1].sort());
  });

  it("preserves non-quest lesson achievements and prevents double reward counting during concurrent sync", () => {
    const deviceA: Progress = JSON.parse(JSON.stringify(cloudDatabase.progress));
    const deviceB: Progress = JSON.parse(JSON.stringify(cloudDatabase.progress));

    const r1 = getQuestReward(quest1)!; // +15 gems, +10 XP

    // Device A does 2 new lessons (+20 XP, 0 gems) AND claims Q1 (+15 gems, +10 XP)
    deviceA.xp += 20 + r1.xp; // 50 + 30 = 80
    deviceA.gems += r1.gems; // 100 + 15 = 115
    deviceA.lessonsDone += 2;
    deviceA.dailyActivity[dKey].lessons += 2;
    deviceA.dailyActivity[dKey].claimedQuests.push(quest1);

    // Device B does 1 practice (+5 XP, 0 gems) AND claims Q1 (+15 gems, +10 XP)
    deviceB.xp += 5 + r1.xp; // 50 + 15 = 65
    deviceB.gems += r1.gems; // 100 + 15 = 115
    deviceB.dailyActivity[dKey].practices += 1;
    deviceB.dailyActivity[dKey].claimedQuests.push(quest1);

    // Reconcile
    const merged = mergeProgress(deviceA, deviceB);

    // Lesson XP (20) + Base (50) + Q1 reward once (10) = 80 XP
    // Base gems (100) + Q1 reward once (15) = 115 gems
    expect(merged.gems).toBe(115);
    expect(merged.xp).toBe(80);
    expect(merged.lessonsDone).toBe(deviceA.lessonsDone);
    expect(merged.dailyActivity[dKey].practices).toBe(2);
    expect(merged.dailyActivity[dKey].claimedQuests).toEqual([quest1]);
  });

  it("integrates with persistent mutation queue: queues sync while offline and flushes cleanly on reconnection", async () => {
    const syncCalls: Array<{ source: string; gems: number }> = [];

    const unregister = registerMutationHandler("cloud_sync_test", async (payload: any) => {
      syncCalls.push(payload);
      return true;
    });

    // Enqueue sync tasks representing device offline changes
    enqueueMutation({
      type: "cloud_sync_test",
      payload: { source: "device_A", gems: 115 },
      dedupKey: "sync_usr_fox_test_123",
    });

    // An updated offline state coalesces into the same task
    enqueueMutation({
      type: "cloud_sync_test",
      payload: { source: "device_A_updated", gems: 115 },
      dedupKey: "sync_usr_fox_test_123",
    });

    const tasks = getQueueTasks();
    expect(tasks).toHaveLength(1);
    expect(tasks[0].payload).toEqual({ source: "device_A_updated", gems: 115 });

    // Process upon reconnect
    const result = await processQueue(true);
    expect(result.processed).toBe(1);
    expect(syncCalls).toHaveLength(1);
    expect(syncCalls[0].source).toBe("device_A_updated");

    unregister();
  });
});
