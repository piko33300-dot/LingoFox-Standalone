import { describe, expect, it, beforeEach } from "vitest";
import {
  getDailyQuestsList,
  evaluateDailyQuests,
  evaluateMonthlyChallenge,
  timeUntilMidnight,
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
  });

  it("allows claiming quest rewards through progressActions and prevents duplicate claims", () => {
    const initialGems = progressActions.get().gems;
    const initialXp = progressActions.get().xp;
    const questId = "test-quest-1";

    const claimed = progressActions.claimQuest(questId, 25, 20);
    expect(claimed).toBe(true);

    const after = progressActions.get();
    expect(after.gems).toBe(initialGems + 25);
    expect(after.xp).toBe(initialXp + 20);

    // Second claim for same quest must fail
    const secondClaim = progressActions.claimQuest(questId, 25, 20);
    expect(secondClaim).toBe(false);
    expect(progressActions.get().gems).toBe(after.gems);
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

  it("computes monthly challenge tier and progress correctly", () => {
    const mockProgress: Progress = {
      ...initialProgress,
      dailyActivity: {
        "2026-11-01": { lessons: 1, perfectLessons: 0, practices: 0, stories: 0, claimedQuests: ["q1", "q2"] },
        "2026-11-02": { lessons: 1, perfectLessons: 0, practices: 0, stories: 0, claimedQuests: ["q3", "q4", "q5"] },
        "2026-11-03": { lessons: 1, perfectLessons: 0, practices: 0, stories: 0, claimedQuests: ["q6", "q7", "q8"] },
        "2026-11-04": { lessons: 1, perfectLessons: 0, practices: 0, stories: 0, claimedQuests: ["q9", "q10", "q11", "q12"] },
      },
    };

    const monthly = evaluateMonthlyChallenge(mockProgress, testDate);
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

  it("calculates time until midnight UTC without throwing", () => {
    const time = timeUntilMidnight(testDate);
    expect(time.hours).toBeGreaterThanOrEqual(0);
    expect(time.hours).toBeLessThan(24);
    expect(time.minutes).toBeGreaterThanOrEqual(0);
    expect(time.minutes).toBeLessThan(60);
  });
});
