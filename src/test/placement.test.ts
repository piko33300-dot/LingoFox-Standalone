import { describe, expect, it, beforeEach } from "vitest";
import { evaluatePlacement, getPlacementQuestions } from "../lib/placement";
import { currentLessonId, initialProgress, progressActions, useProgress } from "../lib/progress-store";
import { getCourse, COURSE_IDS } from "../lib/lessons";

describe("Placement Test Suite", () => {
  beforeEach(() => {
    progressActions.reset();
  });

  it("provides valid diagnostic questions for all courses", () => {
    for (const cid of COURSE_IDS) {
      const questions = getPlacementQuestions(cid);
      expect(questions.length).toBeGreaterThanOrEqual(6);
      for (const q of questions) {
        expect(["mc", "builder", "listen", "type", "match"]).toContain(q.type);
        if (q.type === "mc") {
          expect(q.options.length).toBeGreaterThanOrEqual(2);
          expect(q.options.some((o) => o.text === q.answer)).toBe(true);
        } else if (q.type === "builder") {
          expect(q.answer.length).toBeGreaterThan(0);
          expect(q.bank.length).toBeGreaterThanOrEqual(q.answer.length);
        }
      }
    }
  });

  it("evaluates beginner level accurately for low score", () => {
    const res = evaluatePlacement("en", 1, 8);
    expect(res.level).toBe("beginner");
    expect(res.targetUnitIndex).toBe(0);
    expect(res.skippedUnitsCount).toBe(0);
    expect(res.bonusXp).toBe(30);
  });

  it("evaluates elementary level accurately for score 4/8", () => {
    const res = evaluatePlacement("en", 4, 8);
    expect(res.level).toBe("elementary");
    expect(res.targetUnitIndex).toBe(2); // Unit 3 (0-indexed: 2)
    expect(res.skippedUnitsCount).toBe(2);
    expect(res.bonusXp).toBe(60);
  });

  it("evaluates intermediate level accurately for score 6/8", () => {
    const res = evaluatePlacement("en", 6, 8);
    expect(res.level).toBe("intermediate");
    expect(res.targetUnitIndex).toBe(4); // Unit 5 (0-indexed: 4)
    expect(res.skippedUnitsCount).toBe(4);
    expect(res.bonusXp).toBe(100);
  });

  it("evaluates advanced level accurately for score 8/8", () => {
    const res = evaluatePlacement("en", 8, 8);
    expect(res.level).toBe("advanced");
    expect(res.targetUnitIndex).toBe(6); // Unit 7 (0-indexed: 6)
    expect(res.skippedUnitsCount).toBe(6);
    expect(res.bonusXp).toBe(150);
  });

  it("places German advanced learner at unit index 6", () => {
    const res = evaluatePlacement("de", 6, 6);
    expect(res.targetUnitIndex).toBe(6);
    expect(res.skippedUnitsCount).toBe(6);
    expect(res.bonusXp).toBe(150);
  });

  it("applyPlacement unlocks prior units, sets course, awards XP, and points to the target lesson", () => {
    // English has 11 units. Place at unit index 2 (Unit 3).
    progressActions.applyPlacement("en", 2, 60);

    const p = progressActions.get();
    expect(p.course).toBe("en");
    expect(p.xp).toBe(initialProgress.xp + 60);

    const en = getCourse("en")!;
    const unit1Lessons = en.units[0]!.lessons;
    const unit2Lessons = en.units[1]!.lessons;
    const unit3Lessons = en.units[2]!.lessons;

    // Units 1 and 2 lessons should all be completed
    for (const id of [...unit1Lessons, ...unit2Lessons]) {
      expect(p.completed).toContain(id);
    }

    // Unit 3 first lesson should NOT be completed
    expect(p.completed).not.toContain(unit3Lessons[0]!);

    // currentLessonId should point directly to unit 3 first lesson!
    const current = currentLessonId(p, "en");
    expect(current).toBe(unit3Lessons[0]);
  });

  it("applyPlacement for beginner (unitIndex 0) unlocks no skipped lessons and starts at Unit 1", () => {
    progressActions.applyPlacement("en", 0, 30);

    const p = progressActions.get();
    expect(p.course).toBe("en");
    expect(p.xp).toBe(initialProgress.xp + 30);

    const en = getCourse("en")!;
    const current = currentLessonId(p, "en");
    expect(current).toBe(en.units[0]!.lessons[0]);
  });
});
