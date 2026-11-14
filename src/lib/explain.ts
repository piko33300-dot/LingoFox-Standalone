// "Ask Fox" inside lessons: the learner asks about a question or sends their own
// answer, and Fox explains / corrects it. Pure helpers shared by the page and the server.
import { findQuestion, type Course, type Question, type UiLang } from "./lessons";

export const EXPLAIN_MAX_INPUT = 400;
/** Messages kept per question (learner + Fox), so a sheet stays a short focused chat. */
export const EXPLAIN_MAX_TURNS = 8;
export const EXPLAIN_DAILY_LIMIT = 60;

const NAMES: Record<string, string> = { en: "English", ar: "Arabic", es: "Spanish", fr: "French", tr: "Turkish", de: "German" };

/** The correct answer as plain text ("" for matching pairs). */
export function correctAnswerText(q: Question): string {
  switch (q.type) {
    case "mc": return q.answer;
    case "builder": return q.answer.join(" ");
    case "listen": return q.answer;
    case "type": return q.accepted[0] ?? "";
    case "match": return q.pairs.map(([a, b]) => `${a} = ${b}`).join(", ");
  }
}

/** A plain-English description of the exercise, for the model. */
export function describeQuestion(q: Question, course: Course): string {
  const target = NAMES[course.target]!;
  const native = NAMES[course.native]!;
  switch (q.type) {
    case "mc":
      return `Multiple choice: pick the ${native} meaning of the ${target} word "${q.word}". Options: ${q.options.map((o) => o.text).join(" / ")}.`;
    case "builder":
      return `Sentence builder: translate the ${target} sentence "${q.sentence}" into ${native} using word tiles (${q.bank.join(", ")}).`;
    case "listen":
      return `Listening: the learner heard "${q.text}" in ${target} and had to pick it from: ${q.options.join(" / ")}.`;
    case "type":
      return `Typing: translate "${q.show}" (${NAMES[q.showLang]}) into ${NAMES[q.answerLang]}.`;
    case "match":
      return `Matching pairs between ${target} and ${native}.`;
  }
}

export type ExplainTurn = { role: "user" | "assistant"; content: string };

export type ExplainContext = {
  key: string;
  answer: string;
  wasCorrect: boolean;
  ui: UiLang;
};

/** Resolves the question on the server from its stable key; never trusts client-sent question text. */
export function explainInstructions(ctx: ExplainContext): string | null {
  const found = findQuestion(ctx.key);
  if (!found) return null;
  const { course, question } = found;
  const target = NAMES[course.target]!;
  const explainIn = NAMES[ctx.ui === "ar" ? "ar" : "en"]!;
  const answer = ctx.answer.trim().slice(0, EXPLAIN_MAX_INPUT);
  return [
    `You are Fox, the friendly fox tutor of the LingoFox language app. The learner is studying ${target}.`,
    `They are in the middle of a lesson exercise and asked you for help with it.`,
    `Exercise: ${describeQuestion(question, course)}`,
    `Correct answer: "${correctAnswerText(question)}".`,
    answer
      ? `The learner answered: "${answer}" — the app marked it ${ctx.wasCorrect ? "correct" : "wrong"}.`
      : `The learner has not answered yet.`,
    `Always reply in ${explainIn}, quoting ${target} words as they are.`,
    `When the learner sends a new answer of their own, say clearly first whether it is correct (✅), acceptable with a small issue (⚠️) or wrong (❌), then give the corrected version.`,
    `Explain the why in plain words: the meaning, the grammar or spelling point, and one short extra example sentence with its translation.`,
    `Be warm and encouraging. Keep every reply under 110 words. Use short lines or a tiny list, no tables, no headings.`,
    `Stay on this exercise and language learning; politely decline anything unrelated or unsafe.`,
  ].join("\n");
}

/** Trims a client conversation to what the server accepts: alternating, capped, last turn from the learner. */
export function sanitizeTurns(turns: ExplainTurn[]): ExplainTurn[] | null {
  const kept = turns
    .filter((t) => (t.role === "user" || t.role === "assistant") && typeof t.content === "string" && t.content.trim())
    .slice(-EXPLAIN_MAX_TURNS)
    .map((t) => ({ role: t.role, content: t.content.trim().slice(0, t.role === "user" ? EXPLAIN_MAX_INPUT : 2000) }));
  if (!kept.length || kept[kept.length - 1]!.role !== "user") return null;
  return kept;
}
