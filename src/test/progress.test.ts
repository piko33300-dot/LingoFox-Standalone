import { describe, expect, it } from "vitest";
import { displayStreak, initialProgress, lessonReward, mergeProgress, nextStreak, sanitizeProgress, progressActions, HEART_REGEN_INTERVAL_MS } from "@/lib/progress-store";
import { playSound } from "@/lib/sound";
import { achievementStatus } from "@/lib/achievements";
import { findLesson, isTypedAnswerCorrect, normalizeAnswer, REFILL_COST, MAX_REWARDED_ADS_PER_DAY, type TypeQuestion } from "@/lib/lessons";

describe("streak", () => {
  const today = new Date("2026-10-26T12:00:00Z");
  it("increments when last active yesterday", () => expect(nextStreak(3, "2026-10-25", today)).toBe(4));
  it("stays when already active today", () => expect(nextStreak(3, "2026-10-26", today)).toBe(3));
  it("resets to 1 after a gap", () => expect(nextStreak(3, "2026-10-20", today)).toBe(1));
  it("shows 0 once a full day is missed", () => expect(displayStreak({ streak: 5, lastActiveDate: "2026-10-23" }, today)).toBe(0));
  it("still shows streak if last active yesterday", () => expect(displayStreak({ streak: 5, lastActiveDate: "2026-10-25" }, today)).toBe(5));
});

describe("rewards", () => {
  it("lesson gives 10 XP and 5 gems", () => expect(lessonReward(2)).toEqual({ xp: 10, gems: 5 }));
  it("perfect lesson adds 5 bonus XP", () => expect(lessonReward(0).xp).toBe(15));
  it("heart refill costs 50 gems", () => expect(REFILL_COST).toBe(50));
  it("rewarded ads are capped at 5 per day", () => expect(MAX_REWARDED_ADS_PER_DAY).toBe(5));
});

describe("answers", () => {
  const q: TypeQuestion = { type: "type", show: "كلب", showLang: "ar", answerLang: "en", accepted: ["dog", "the dog"] };
  it("accepts case and punctuation differences", () => expect(isTypedAnswerCorrect(q, "  The Dog! ")).toBe(true));
  it("rejects wrong words", () => expect(isTypedAnswerCorrect(q, "cat")).toBe(false));
  it("ignores Arabic diacritics and alef forms", () => expect(normalizeAnswer("أَنا")).toBe(normalizeAnswer("انا")));
});

describe("lessons", () => {
  it("each lesson has 6 questions", () => expect(findLesson("en-basics-1")?.questions).toHaveLength(6));
  it("finds Arabic course lessons", () => expect(findLesson("ar-food-2")?.course.id).toBe("ar"));
});

describe("cloud merge", () => {
  it("keeps the higher XP and unions completed lessons", () => {
    const a = { ...initialProgress, xp: 50, completed: ["en-basics-1"] };
    const b = { ...initialProgress, xp: 80, completed: ["en-basics-2"] };
    const m = mergeProgress(a, b);
    expect(m.xp).toBe(80);
    expect(m.completed.sort()).toEqual(["en-basics-1", "en-basics-2"]);
  });
});

describe("achievements", () => {
  it("unlocks first lesson after one lesson", () => {
    const s = achievementStatus({ ...initialProgress, lessonsDone: 1 });
    expect(s.find((a) => a.id === "first-lesson")?.unlocked).toBe(true);
    expect(s.find((a) => a.id === "five-lessons")?.unlocked).toBe(false);
  });
  it("polyglot needs lessons in both courses", () => {
    const s = achievementStatus({ ...initialProgress, completed: ["en-basics-1", "ar-basics-1"] });
    expect(s.find((a) => a.id === "polyglot")?.unlocked).toBe(true);
  });
});

describe("hearts system & audio", () => {
  it("regenerates 1 heart after 4 hours", () => {
    const fourHoursAgo = Date.now() - HEART_REGEN_INTERVAL_MS - 1000;
    const p = sanitizeProgress({ hearts: 3, lastHeartLostAt: fourHoursAgo });
    expect(p.hearts).toBe(4);
  });

  it("caps hearts regeneration at MAX_HEARTS", () => {
    const twoDaysAgo = Date.now() - (48 * 60 * 60 * 1000);
    const p = sanitizeProgress({ hearts: 1, lastHeartLostAt: twoDaysAgo });
    expect(p.hearts).toBe(5);
    expect(p.lastHeartLostAt).toBeNull();
  });

  it("practice completes and restores 1 heart if depleted", () => {
    progressActions.reset();
    progressActions.loseHeart();
    expect(progressActions.get().hearts).toBe(4);
    const res = progressActions.completePractice();
    expect(res.heartRestored).toBe(true);
    expect(progressActions.get().hearts).toBe(5);
  });

  it("playSound executes safely for all sound kinds", () => {
    expect(() => {
      playSound("correct");
      playSound("wrong");
      playSound("complete");
      playSound("streak");
      playSound("tap");
    }).not.toThrow();
  });
});
