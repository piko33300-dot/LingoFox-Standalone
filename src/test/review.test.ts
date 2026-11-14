import { describe, expect, it } from "vitest";
import { addDays, dueKeys, mergeReview, pickPractice, recordReview, sanitizeReview, type ReviewState } from "@/lib/review";
import { findLesson, findQuestion } from "@/lib/lessons";
import { initialProgress, mergeProgress, sanitizeProgress } from "@/lib/progress-store";

const TODAY = "2026-11-07";

describe("question keys", () => {
  it("every lesson question resolves from its key", () => {
    const l = findLesson("en-verbs-2")!;
    expect(l.keys).toHaveLength(l.questions.length);
    l.keys.forEach((k, i) => expect(findQuestion(k)?.question).toBe(l.questions[i]));
  });
  it("rejects unknown keys", () => expect(findQuestion("nope:1")).toBeNull());
});

describe("spaced repetition", () => {
  it("a mistake is due immediately", () => {
    const r = recordReview({}, "en-basics:0", false, TODAY);
    expect(r["en-basics:0"]).toEqual({ box: 0, due: TODAY });
    expect(dueKeys(r, TODAY)).toEqual(["en-basics:0"]);
  });
  it("correct answers push it out with growing gaps, then it is mastered", () => {
    let r: ReviewState = recordReview({}, "k", false, TODAY);
    const gaps: number[] = [];
    let day = TODAY;
    for (let i = 0; i < 4; i++) {
      r = recordReview(r, "k", true, day);
      gaps.push((Date.parse(r["k"]!.due) - Date.parse(day)) / 86_400_000);
      day = r["k"]!.due;
    }
    expect(gaps).toEqual([1, 2, 4, 8]);
    expect(recordReview(r, "k", true, day)).toEqual({});
  });
  it("a wrong answer resets the box", () => {
    const r = recordReview(recordReview({}, "k", false, TODAY), "k", true, TODAY);
    expect(recordReview(r, "k", false, addDays(TODAY, 1))["k"]!.box).toBe(0);
  });
  it("correct answers on untracked questions change nothing", () => {
    const r: ReviewState = {};
    expect(recordReview(r, "k", true, TODAY)).toBe(r);
  });
  it("only due items of the chosen course are returned", () => {
    const r: ReviewState = { "en-a:0": { box: 0, due: TODAY }, "ar-a:0": { box: 0, due: TODAY }, "en-b:0": { box: 1, due: addDays(TODAY, 2) } };
    expect(dueKeys(r, TODAY, "en")).toEqual(["en-a:0"]);
  });
  it("sanitizes junk and merges keeping the sooner due date", () => {
    expect(sanitizeReview({ a: { box: 2, due: "2026-01-01" }, b: { box: "x" }, c: null })).toEqual({ a: { box: 2, due: "2026-01-01" } });
    const m = mergeReview({ k: { box: 2, due: "2026-11-10" } }, { k: { box: 0, due: "2026-11-08" }, j: { box: 1, due: "2026-11-09" } });
    expect(m["k"]!.due).toBe("2026-11-08");
    expect(Object.keys(m).sort()).toEqual(["j", "k"]);
  });
});

describe("practice session", () => {
  it("puts due items first and fills from finished lessons", () => {
    const due = findLesson("en-basics-1")!.keys[0]!;
    const items = pickPractice({ [due]: { box: 0, due: TODAY } }, ["en-basics-1", "en-greetings-1"], "en", TODAY);
    expect(items).toHaveLength(6);
    expect(items[0]!.key).toBe(due);
    expect(new Set(items.map((i) => i.key)).size).toBe(6);
  });
  it("is empty when nothing is learned yet", () => expect(pickPractice({}, [], "en", TODAY)).toEqual([]));
  it("does not mix courses", () => {
    const items = pickPractice({}, ["ar-basics-1"], "en", TODAY);
    expect(items).toEqual([]);
  });
});

describe("progress integration", () => {
  it("review survives sanitize and merge", () => {
    const a = { ...initialProgress, review: { k1: { box: 0, due: TODAY } } };
    const b = sanitizeProgress({ ...initialProgress, review: { k2: { box: 1, due: TODAY } } });
    expect(Object.keys(mergeProgress(a, b).review).sort()).toEqual(["k1", "k2"]);
  });
  it("old saves without review load fine", () => expect(sanitizeProgress({ xp: 5 }).review).toEqual({}));
});
