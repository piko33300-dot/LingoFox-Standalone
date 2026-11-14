import { describe, expect, it } from "vitest";
import { daysLeftInWeek, normalizeFriendCode, weekStart, weekXp, zoneOf } from "@/lib/leagues";
import { SPEAK_PASS_SCORE, scoreSpeech, speakingItems } from "@/lib/speaking";
import { getCourse, isTypedAnswerCorrect, type TypeQuestion } from "@/lib/lessons";

describe("weekly leagues", () => {
  it("weeks start on Monday (UTC)", () => {
    expect(weekStart(new Date("2026-11-07T10:00:00Z"))).toBe("2026-11-02"); // Saturday
    expect(weekStart(new Date("2026-11-08T23:00:00Z"))).toBe("2026-11-02"); // Sunday
    expect(weekStart(new Date("2026-11-09T00:30:00Z"))).toBe("2026-11-09"); // Monday
  });
  it("weekly XP only counts days since Monday", () => {
    const xp = { "2026-11-01": 50, "2026-11-02": 10, "2026-11-05": 15, "2026-11-07": 5 };
    expect(weekXp(xp, new Date("2026-11-07T12:00:00Z"))).toBe(30);
  });
  it("days left until the Monday reset", () => {
    expect(daysLeftInWeek(new Date("2026-11-07T12:00:00Z"))).toBe(2); // Saturday
    expect(daysLeftInWeek(new Date("2026-11-08T12:00:00Z"))).toBe(1); // Sunday
  });
  it("top 10 with XP move up, bottom 5 move down in a big table", () => {
    expect(zoneOf(1, 30, 0, 100)).toBe("up");
    expect(zoneOf(10, 30, 0, 1)).toBe("up");
    expect(zoneOf(11, 30, 1, 50)).toBe("stay");
    expect(zoneOf(26, 30, 1, 5)).toBe("down");
    expect(zoneOf(26, 30, 0, 5)).toBe("stay"); // Bronze cannot drop
    expect(zoneOf(1, 30, 4, 500)).toBe("stay"); // Diamond is the top league
    expect(zoneOf(3, 4, 0, 0)).toBe("stay"); // no XP, no promotion
  });
  it("friend codes are 6 hex characters", () => {
    expect(normalizeFriendCode(" ab-12 c9ff ")).toBe("AB12C9");
  });
});

describe("speaking score", () => {
  it("a perfect sentence scores 100", () => {
    expect(scoreSpeech("La mujer bebe agua", "la mujer bebe agua.").score).toBe(100);
  });
  it("accents and capitals do not matter", () => {
    expect(scoreSpeech("el niño", "El nino").passed).toBe(true);
  });
  it("missing half the words fails", () => {
    const r = scoreSpeech("I love my family", "I love");
    expect(r.score).toBeLessThan(SPEAK_PASS_SCORE);
    expect(r.words.map((w) => w.ok)).toEqual([true, true, false, false]);
  });
  it("silence scores 0", () => {
    expect(scoreSpeech("hello", "").score).toBe(0);
  });
  it("picks items from the learner's course", () => {
    const course = getCourse("es")!;
    const items = speakingItems(course, [], () => 0.3);
    expect(items.length).toBe(5);
    expect(new Set(items).size).toBe(5);
  });
});

describe("accent-insensitive typing", () => {
  it("accepts Spanish without accents and Turkish dotless i", () => {
    const es: TypeQuestion = { type: "type", show: "طفل", showLang: "ar", answerLang: "es", accepted: ["niño"] };
    expect(isTypedAnswerCorrect(es, "nino")).toBe(true);
    const tr: TypeQuestion = { type: "type", show: "أحمر", showLang: "ar", answerLang: "tr", accepted: ["kırmızı"] };
    expect(isTypedAnswerCorrect(tr, "kirmizi")).toBe(true);
  });
});
