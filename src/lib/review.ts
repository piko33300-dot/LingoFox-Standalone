// Spaced-repetition ("Leitner boxes") for questions the learner got wrong.
// Pure logic with no UI or storage, so it is easy to test. Days are YYYY-MM-DD strings.
import { findLesson, findQuestion, type CourseId, type Question } from "./lessons";

export type ReviewEntry = { box: number; due: string };
export type ReviewState = Record<string, ReviewEntry>;

/** Days to wait after a correct review, per box (box 0 → 1 day, box 1 → 2 days, …). */
export const REVIEW_INTERVALS = [1, 2, 4, 8] as const;
export const PRACTICE_SIZE = 6;

const DAY = /^\d{4}-\d{2}-\d{2}$/;

export function addDays(day: string, n: number) {
  const d = new Date(`${day}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

export function sanitizeReview(raw: unknown): ReviewState {
  const out: ReviewState = {};
  if (!raw || typeof raw !== "object") return out;
  for (const [key, v] of Object.entries(raw as Record<string, unknown>)) {
    const e = v as Partial<ReviewEntry> | null;
    if (!e || typeof e.box !== "number" || typeof e.due !== "string" || !DAY.test(e.due)) continue;
    out[key] = { box: Math.max(0, Math.min(REVIEW_INTERVALS.length, Math.floor(e.box))), due: e.due };
  }
  return out;
}

/** A mistake starts (or restarts) tracking; a correct review moves the item up a box, and mastered items are dropped. */
export function recordReview(review: ReviewState, key: string, correct: boolean, today: string): ReviewState {
  const entry = review[key];
  if (!correct) return { ...review, [key]: { box: 0, due: today } };
  if (!entry) return review;
  const next = entry.box + 1;
  if (next > REVIEW_INTERVALS.length) {
    const rest = { ...review };
    delete rest[key];
    return rest;
  }
  return { ...review, [key]: { box: next, due: addDays(today, REVIEW_INTERVALS[entry.box]!) } };
}

/** Union of two devices' states; for the same question keep the one that is due sooner. */
export function mergeReview(a: ReviewState, b: ReviewState): ReviewState {
  const out: ReviewState = { ...a };
  for (const [key, e] of Object.entries(b)) {
    const cur = out[key];
    out[key] = !cur || e.due < cur.due ? e : cur;
  }
  return out;
}

export function dueKeys(review: ReviewState, today: string, courseId?: CourseId | null): string[] {
  const prefix = courseId ? `${courseId}-` : "";
  return Object.entries(review)
    .filter(([key, e]) => e.due <= today && key.startsWith(prefix))
    .sort((x, y) => x[1].due.localeCompare(y[1].due) || x[1].box - y[1].box)
    .map(([key]) => key);
}

const hash = (s: string) => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
};

/**
 * Questions for a practice session: items due for review first, then a
 * day-seeded mix from lessons the learner already finished.
 */
export function pickPractice(review: ReviewState, completed: string[], courseId: CourseId, today: string, limit = PRACTICE_SIZE) {
  const picked = dueKeys(review, today, courseId).slice(0, limit);
  if (picked.length < limit) {
    const pool = new Set<string>();
    for (const id of completed) {
      if (!id.startsWith(`${courseId}-`)) continue;
      for (const key of findLesson(id)?.keys ?? []) if (!picked.includes(key)) pool.add(key);
    }
    const fill = [...pool].sort((x, y) => hash(x + today) - hash(y + today)).slice(0, limit - picked.length);
    picked.push(...fill);
  }
  const items: { key: string; question: Question }[] = [];
  for (const key of picked) {
    const found = findQuestion(key);
    if (found) items.push({ key, question: found.question });
  }
  return items;
}


/**
 * Picks a drill session for heart restoration or general practice directly from a course units.
 * Always returns questions even if the learner has 0 completed lessons.
 */
export function pickDrillSession(courseId: CourseId, limit = 5): { key: string; question: Question }[] {
  const items: { key: string; question: Question }[] = [];
  for (let i = 0; i < limit; i++) {
    const key = `${courseId}-basics:${i}`;
    const found = findQuestion(key);
    if (found) items.push({ key, question: found.question });
  }
  return items;
}
