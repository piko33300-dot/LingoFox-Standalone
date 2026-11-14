import { describe, expect, it } from "vitest";
import { displayStreak, freezesUsed, missedDays, nextStreak } from "@/lib/streak";
import { initialProgress, mergeProgress, progressActions, sanitizeProgress } from "@/lib/progress-store";

const today = new Date("2026-11-07T12:00:00Z");

describe("missed days", () => {
  it("is 0 when active today or yesterday", () => {
    expect(missedDays("2026-11-07", today)).toBe(0);
    expect(missedDays("2026-11-06", today)).toBe(0);
  });
  it("counts full skipped days", () => {
    expect(missedDays("2026-11-05", today)).toBe(1);
    expect(missedDays("2026-11-03", today)).toBe(3);
  });
});

describe("streak freezes", () => {
  it("keeps the streak alive across a gap the freezes cover", () => {
    expect(nextStreak(5, "2026-11-05", today, 1)).toBe(6);
    expect(freezesUsed("2026-11-05", today, 1)).toBe(1);
  });
  it("does not spend freezes when the gap is too long, and the streak resets", () => {
    expect(nextStreak(5, "2026-11-03", today, 2)).toBe(1);
    expect(freezesUsed("2026-11-03", today, 2)).toBe(0);
  });
  it("spends nothing when there is no gap", () => expect(freezesUsed("2026-11-06", today, 2)).toBe(0));
  it("shows the streak while a freeze still covers the gap", () => {
    expect(displayStreak({ streak: 5, lastActiveDate: "2026-11-05", freezes: 1 }, today)).toBe(5);
    expect(displayStreak({ streak: 5, lastActiveDate: "2026-11-05" }, today)).toBe(0);
  });
  it("keeps the old behaviour without freezes", () => {
    expect(nextStreak(3, "2026-11-06", today)).toBe(4);
    expect(nextStreak(3, "2026-11-07", today)).toBe(3);
    expect(nextStreak(3, "2026-11-01", today)).toBe(1);
    expect(nextStreak(0, null, today)).toBe(1);
  });
});

describe("buying freezes", () => {
  it("costs gems, caps at the maximum and survives save/merge", () => {
    progressActions.reset();
    progressActions.hydrate({ ...initialProgress, gems: 130 });
    expect(progressActions.buyFreeze()).toBe(true);
    expect(progressActions.buyFreeze()).toBe(true);
    expect(progressActions.get().gems).toBe(10);
    expect(progressActions.buyFreeze()).toBe(false);
    expect(sanitizeProgress({ freezes: 99 }).freezes).toBe(2);
    expect(sanitizeProgress({}).freezes).toBe(0);
    expect(mergeProgress({ ...initialProgress, freezes: 1 }, { ...initialProgress, freezes: 2 }).freezes).toBe(2);
    progressActions.reset();
  });
});
