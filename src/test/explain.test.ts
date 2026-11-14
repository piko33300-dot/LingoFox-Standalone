import { describe, expect, it } from "vitest";
import { EXPLAIN_MAX_INPUT, EXPLAIN_MAX_TURNS, correctAnswerText, explainInstructions, sanitizeTurns } from "@/lib/explain";
import { findLesson } from "@/lib/lessons";

const lesson = findLesson("en-verbs-2")!;
const key = lesson.keys[0]!;

describe("Ask Fox context", () => {
  it("builds instructions from the real question, including its correct answer", () => {
    const text = explainInstructions({ key, answer: "my try", wasCorrect: false, ui: "ar" })!;
    expect(text).toContain(`Correct answer: "${correctAnswerText(lesson.questions[0]!)}"`);
    expect(text).toContain(`The learner answered: "my try"`);
    expect(text).toContain("Always reply in Arabic");
  });
  it("explains in English when the interface is English", () => {
    expect(explainInstructions({ key, answer: "", wasCorrect: false, ui: "en" })).toContain("Always reply in English");
  });
  it("rejects unknown question keys", () => {
    expect(explainInstructions({ key: "nope:9", answer: "", wasCorrect: false, ui: "ar" })).toBeNull();
  });
  it("cuts the learner's answer to the input limit", () => {
    const long = "a".repeat(EXPLAIN_MAX_INPUT + 50);
    const text = explainInstructions({ key, answer: long, wasCorrect: false, ui: "ar" })!;
    expect(text).toContain(`"${"a".repeat(EXPLAIN_MAX_INPUT)}"`);
    expect(text).not.toContain("a".repeat(EXPLAIN_MAX_INPUT + 1));
  });
});

describe("Ask Fox conversation limits", () => {
  it("keeps only the last turns", () => {
    const turns = Array.from({ length: 13 }, (_, i) => ({ role: i % 2 ? ("assistant" as const) : ("user" as const), content: `m${i}` }));
    const kept = sanitizeTurns(turns)!;
    expect(kept).toHaveLength(EXPLAIN_MAX_TURNS);
    expect(kept.at(-1)!.content).toBe("m12");
  });
  it("requires the last message to come from the learner", () => {
    expect(sanitizeTurns([{ role: "user", content: "hi" }, { role: "assistant", content: "hello" }])).toBeNull();
    expect(sanitizeTurns([])).toBeNull();
  });
});
