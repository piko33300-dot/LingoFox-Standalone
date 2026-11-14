// Speaking practice: choose sentences to say and score what the learner said. Pure, so it is easy to test.
import { normalizeAnswer, type Course } from "./lessons";

/** Score at or above this counts as a correct pronunciation. */
export const SPEAK_PASS_SCORE = 70;
export const SPEAK_SESSION_SIZE = 5;

export type WordMark = { word: string; ok: boolean };
export type SpeakResult = { score: number; passed: boolean; words: WordMark[] };

function editDistance(a: string, b: string): number {
  const dp = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let prev = dp[0]!;
    dp[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const tmp = dp[j]!;
      dp[j] = a[i - 1] === b[j - 1] ? prev : 1 + Math.min(prev, dp[j]!, dp[j - 1]!);
      prev = tmp;
    }
  }
  return dp[b.length]!;
}

/** Two words "match" when they are equal or only one small slip apart (speech-to-text noise). */
function wordsMatch(a: string, b: string) {
  if (a === b) return true;
  const longest = Math.max(a.length, b.length);
  return longest >= 4 && editDistance(a, b) <= 1;
}

/** Compare the expected sentence with what was heard, word by word (order-aware). */
export function scoreSpeech(expected: string, heard: string): SpeakResult {
  const display = expected.trim().split(/\s+/).filter(Boolean);
  const exp = display.map(normalizeAnswer);
  const got = normalizeAnswer(heard).split(" ").filter(Boolean);
  if (exp.length === 0) return { score: 0, passed: false, words: [] };

  // Longest common subsequence with fuzzy word equality.
  const n = exp.length, m = got.length;
  const L = Array.from({ length: n + 1 }, () => new Array<number>(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      L[i]![j] = wordsMatch(exp[i]!, got[j]!) ? 1 + L[i + 1]![j + 1]! : Math.max(L[i + 1]![j]!, L[i]![j + 1]!);
    }
  }
  const ok = new Array<boolean>(n).fill(false);
  let i = 0, j = 0;
  while (i < n && j < m) {
    if (wordsMatch(exp[i]!, got[j]!)) { ok[i] = true; i++; j++; }
    else if (L[i + 1]![j]! >= L[i]![j + 1]!) i++;
    else j++;
  }
  const matched = ok.filter(Boolean).length;
  // Extra words the learner added cost a little, so "yes yes yes no" does not score 100 for "no".
  const extra = Math.max(0, m - matched);
  const raw = (matched / n) * 100 - extra * (50 / n) * 0.5;
  const score = Math.max(0, Math.min(100, Math.round(raw)));
  return { score, passed: score >= SPEAK_PASS_SCORE, words: display.map((word, k) => ({ word, ok: ok[k]! })) };
}

/** Sentences and words to say aloud, from units the learner has started (or the first unit). */
export function speakingItems(course: Course, completed: string[], rand: () => number = Math.random, size = SPEAK_SESSION_SIZE): string[] {
  const started = course.units.filter((u) => u.lessons.some((id) => completed.includes(id)));
  const units = started.length > 0 ? started : course.units.slice(0, 1);
  const pool = new Set<string>();
  for (const u of units) {
    for (const q of u.questions) {
      if (q.type === "builder") pool.add(q.sentence);
      else if (q.type === "listen") pool.add(q.text);
      else if (q.type === "mc") pool.add(q.word);
    }
  }
  const items = [...pool];
  for (let k = items.length - 1; k > 0; k--) {
    const r = Math.floor(rand() * (k + 1));
    [items[k], items[r]] = [items[r]!, items[k]!];
  }
  return items.slice(0, size);
}
