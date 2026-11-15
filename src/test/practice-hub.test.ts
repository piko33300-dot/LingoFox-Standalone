import { describe, expect, it } from "vitest";
import { COURSES, getCourse, getCourseVocabulary } from "../lib/lessons";
import { pickDrillSession } from "../lib/review";
import { progressActions } from "../lib/progress-store";

describe("Practice Hub & Vocabulary Extractor", () => {
  it("extracts vocabulary pairs from all courses without duplicates", () => {
    for (const course of COURSES) {
      const vocab = getCourseVocabulary(course);
      expect(vocab.length).toBeGreaterThan(0);
      const words = vocab.map((v) => v.word.toLowerCase());
      const uniqueWords = new Set(words);
      expect(uniqueWords.size).toBe(words.length);
    }
  });

  it("caches vocabulary lookups across multiple calls for fast O(1) performance", () => {
    const es = getCourse("es")!;
    const v1 = getCourseVocabulary(es);
    const v2 = getCourseVocabulary(es);
    expect(v1).toBe(v2); // Exactly same cached object reference in memory
  });

  it("extracts comprehensive vocabulary for English course", () => {
    const en = getCourse("en")!;
    const vocab = getCourseVocabulary(en);
    expect(vocab.length).toBeGreaterThan(20);
    const cat = vocab.find((v) => v.word.toLowerCase() === "cat" || v.word.toLowerCase() === "the cat");
    expect(cat).toBeDefined();
    expect(cat?.translation).toBe("القطة");
  });

  it("picks drill session questions even when 0 lessons are completed", () => {
    for (const course of COURSES) {
      const drill = pickDrillSession(course.id, 5);
      expect(drill.length).toBeGreaterThan(0);
      expect(drill.length).toBeLessThanOrEqual(5);
      expect(drill[0].question).toBeDefined();
    }
  });

  it("records speed challenge completion with XP and gems in progress store", () => {
    const before = progressActions.get();
    const res = progressActions.completeSpeedChallenge(8);
    const after = progressActions.get();

    expect(res.earnedXp).toBe(16);
    expect(res.earnedGems).toBe(4);
    expect(after.xp).toBe(before.xp + 16);
    expect(after.gems).toBe(before.gems + 4);
  });
});
