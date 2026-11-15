import { describe, expect, it, beforeEach } from "vitest";
import {
  getDailyQuestsList,
  evaluateDailyQuests,
  evaluateMonthlyChallenge,
  timeUntilMidnight,
  isQuestClaimed,
  getAllClaimedQuests,
  getQuestReward,
} from "../lib/quests";
import {
  initialProgress,
  progressActions,
  sanitizeProgress,
  mergeProgress,
  dayKey,
  type Progress,
} from "../lib/progress-store";

describe("Daily Quests & Challenges System", () => {
  const testDate = new Date("2026-11-15T10:00:00Z");
  const dKey = dayKey(testDate);

  beforeEach(() => {
    progressActions.reset();
  });

  it("generates deterministic 3 daily quests per date", () => {
    const list = getDailyQuestsList(dKey);
    expect(list).toHaveLength(3);
    expect(list[0].id).toBe(`quest-xp-${dKey}`);
    expect(list[0].kind).toBe("xp");
    expect(list[0].target).toBe(30);

    expect(list[1].id).toBe(`quest-lessons-${dKey}`);
    expect(list[1].kind).toBe("lessons");
    expect(list[1].target).toBe(2);

    expect(list[2].id).toBe(`quest-mastery-${dKey}`);
    expect(list[2].kind).toBe("mastery");
    expect(list[2].target).toBe(1);
  });

  it("evaluates quest completion accurately based on progress and activity", () => {
    const mockProgress: Progress = {
      ...initialProgress,
      xpByDay: { [dKey]: 35 },
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

    const quests = evaluateDailyQuests(mockProgress, testDate);
    expect(quests).toHaveLength(3);

    // Quest 1 (XP 30): 35 earned -> completed!
    expect(quests[0].current).toBe(30);
    expect(quests[0].completed).toBe(true);
    expect(quests[0].claimed).toBe(false);
    expect(quests[0].percent).toBe(100);

    // Quest 2 (Lessons 2): 2 lessons + 1 practice = 3 -> completed!
    expect(quests[1].current).toBe(2);
    expect(quests[1].completed).toBe(true);
    expect(quests[1].percent).toBe(100);

    // Quest 3 (Mastery 1): 1 perfect lesson -> completed!
    expect(quests[2].current).toBe(1);
    expect(quests[2].completed).toBe(true);
    expect(quests[2].percent).toBe(100);
  });

  it("marks quests as claimed when recorded in claimedQuests", () => {
    const questList = getDailyQuestsList(dKey);
    const mockProgress: Progress = {
      ...initialProgress,
      xpByDay: { [dKey]: 35 },
      dailyActivity: {
        [dKey]: {
          lessons: 1,
          perfectLessons: 0,
          practices: 0,
          stories: 0,
          claimedQuests: [questList[0].id],
        },
      },
    };

    const quests = evaluateDailyQuests(mockProgress, testDate);
    expect(quests[0].claimed).toBe(true);
    expect(quests[1].claimed).toBe(false);
    expect(isQuestClaimed(mockProgress, questList[0].id)).toBe(true);
  });

  it("allows claiming quest rewards through progressActions and strictly prevents duplicate claims", () => {
    const initialGems = progressActions.get().gems;
    const initialXp = progressActions.get().xp;
    const questId = `quest-xp-${dKey}`;

    const claimed = progressActions.claimQuest(questId, 15, 10);
    expect(claimed).toBe(true);

    const after = progressActions.get();
    expect(after.gems).toBe(initialGems + 15);
    expect(after.xp).toBe(initialXp + 10);

    // Second claim for same quest must return false and NOT increment rewards
    const secondClaim = progressActions.claimQuest(questId, 15, 10);
    expect(secondClaim).toBe(false);
    expect(progressActions.get().gems).toBe(after.gems);
    expect(progressActions.get().xp).toBe(after.xp);
  });

  it("prevents double-counting when merging two states that both claimed the same quest", () => {
    const questId = `quest-xp-${dKey}`;
    // Base cloud state has 100 gems, 50 XP, and claimed questId
    const cloudProgress: Progress = {
      ...initialProgress,
      gems: 115,
      xp: 60,
      dailyActivity: {
        [dKey]: {
          lessons: 1,
          perfectLessons: 0,
          practices: 0,
          stories: 0,
          claimedQuests: [questId],
        },
      },
    };

    // Offline local state also claimed the same questId
    const localProgress: Progress = {
      ...initialProgress,
      gems: 115,
      xp: 60,
      dailyActivity: {
        [dKey]: {
          lessons: 1,
          perfectLessons: 0,
          practices: 0,
          stories: 0,
          claimedQuests: [questId],
        },
      },
    };

    const merged = mergeProgress(localProgress, cloudProgress);
    // Gems and XP must NOT be doubled (must remain 115 and 60, not 130 and 70)
    expect(merged.gems).toBe(115);
    expect(merged.xp).toBe(60);
    expect(merged.dailyActivity[dKey].claimedQuests).toEqual([questId]);
  });

  it("reconciles different quest claims from two devices without losing any reward or double counting", () => {
    const q1 = `quest-xp-${dKey}`; // +15 gems, +10 XP
    const q2 = `quest-lessons-${dKey}`; // +20 gems, +15 XP

    // Device A (offline) claimed q1 on top of 100 gems / 50 XP baseline
    const deviceA: Progress = {
      ...initialProgress,
      gems: 115,
      xp: 60,
      dailyActivity: {
        [dKey]: { lessons: 2, perfectLessons: 0, practices: 0, stories: 0, claimedQuests: [q1] },
      },
    };

    // Device B (online) claimed q2 on top of 100 gems / 50 XP baseline
    const deviceB: Progress = {
      ...initialProgress,
      gems: 120,
      xp: 65,
      dailyActivity: {
        [dKey]: { lessons: 2, perfectLessons: 0, practices: 0, stories: 0, claimedQuests: [q2] },
      },
    };

    const merged = mergeProgress(deviceA, deviceB);
    // Total gems should be base 100 + 15 (q1) + 20 (q2) = 135 gems!
    // Total XP should be base 50 + 10 (q1) + 15 (q2) = 75 XP!
    expect(merged.gems).toBe(135);
    expect(merged.xp).toBe(75);
    expect(merged.dailyActivity[dKey].claimedQuests).toEqual(expect.arrayContaining([q1, q2]));

    // Neither quest can be claimed again
    expect(isQuestClaimed(merged, q1)).toBe(true);
    expect(isQuestClaimed(merged, q2)).toBe(true);
  });

  it("updates dailyActivity automatically when completing lessons and practice", () => {
    const todayKey = dayKey(new Date());

    progressActions.completeLesson("en-basics-1", 0); // 0 mistakes = perfect
    let p = progressActions.get();
    expect(p.dailyActivity[todayKey]?.lessons).toBe(1);
    expect(p.dailyActivity[todayKey]?.perfectLessons).toBe(1);

    progressActions.completePractice();
    p = progressActions.get();
    expect(p.dailyActivity[todayKey]?.practices).toBe(1);

    progressActions.completeSpeedChallenge(10);
    p = progressActions.get();
    expect(p.dailyActivity[todayKey]?.practices).toBe(2);
  });

  it("computes monthly challenge tier and progress correctly without duplicate counting", () => {
    const mockProgress: Progress = {
      ...initialProgress,
      dailyActivity: {
        "2026-11-01": { lessons: 1, perfectLessons: 0, practices: 0, stories: 0, claimedQuests: ["q1", "q2", "q2"] },
        "2026-11-02": { lessons: 1, perfectLessons: 0, practices: 0, stories: 0, claimedQuests: ["q3", "q4", "q5"] },
        "2026-11-03": { lessons: 1, perfectLessons: 0, practices: 0, stories: 0, claimedQuests: ["q6", "q7", "q8"] },
        "2026-11-04": { lessons: 1, perfectLessons: 0, practices: 0, stories: 0, claimedQuests: ["q9", "q10", "q11", "q12"] },
      },
    };

    const monthly = evaluateMonthlyChallenge(mockProgress, testDate);
    // 12 unique quests (q2 duplicate safely ignored by Set)
    expect(monthly.claimedCount).toBe(12);
    expect(monthly.targetCount).toBe(20);
    expect(monthly.percent).toBe(60);
    expect(monthly.tier).toBe("silver");
    expect(monthly.daysLeft).toBeGreaterThan(0);
  });

  it("sanitizes and merges dailyActivity reliably across sessions", () => {
    const raw = {
      xp: 50,
      dailyActivity: {
        "2026-11-15": { lessons: 3, perfectLessons: 2, practices: 1, stories: 0, claimedQuests: ["q1"] },
      },
    };

    const sanitized = sanitizeProgress(raw);
    expect(sanitized.dailyActivity["2026-11-15"].lessons).toBe(3);
    expect(sanitized.dailyActivity["2026-11-15"].claimedQuests).toContain("q1");

    const guest: Progress = {
      ...initialProgress,
      dailyActivity: {
        "2026-11-15": { lessons: 1, perfectLessons: 0, practices: 2, stories: 0, claimedQuests: ["q2"] },
      },
    };

    const merged = mergeProgress(sanitized, guest);
    expect(merged.dailyActivity["2026-11-15"].lessons).toBe(3);
    expect(merged.dailyActivity["2026-11-15"].practices).toBe(2);
    expect(merged.dailyActivity["2026-11-15"].claimedQuests).toEqual(expect.arrayContaining(["q1", "q2"]));
  });

  it("identifies quest rewards deterministically", () => {
    expect(getQuestReward("quest-xp-2026-11-15")).toEqual({ gems: 15, xp: 10 });
    expect(getQuestReward("quest-lessons-2026-11-15")).toEqual({ gems: 20, xp: 15 });
    expect(getQuestReward("quest-mastery-2026-11-15")).toEqual({ gems: 25, xp: 20 });
    expect(getQuestReward("unknown-quest-id")).toBeNull();
  });

  it("extracts all unique claimed quests across multiple days", () => {
    const mock: Progress = {
      ...initialProgress,
      dailyActivity: {
        "2026-11-14": { lessons: 1, perfectLessons: 0, practices: 0, stories: 0, claimedQuests: ["q-a", "q-b"] },
        "2026-11-15": { lessons: 1, perfectLessons: 0, practices: 0, stories: 0, claimedQuests: ["q-b", "q-c"] },
      },
    };
    const all = getAllClaimedQuests(mock);
    expect(Array.from(all).sort()).toEqual(["q-a", "q-b", "q-c"]);
  });

  it("calculates time until midnight UTC without throwing", () => {
    const time = timeUntilMidnight(testDate);
    expect(time.hours).toBeGreaterThanOrEqual(0);
    expect(time.hours).toBeLessThan(24);
    expect(time.minutes).toBeGreaterThanOrEqual(0);
    expect(time.minutes).toBeLessThan(60);
  });
});
