import { useSyncExternalStore } from "react";
import {
  GEMS_PER_LESSON,
  MAX_HEARTS,
  MAX_REWARDED_ADS_PER_DAY,
  REFILL_COST,
  XP_PER_LESSON,
  XP_PERFECT_BONUS,
  XP_PER_PRACTICE,
  getCourse,
  lessonIdsOf,
  COURSE_IDS,
  type CourseId,
} from "./lessons";
import { FREEZE_COST, MAX_FREEZES, dayKey, displayStreak, freezesUsed, nextStreak } from "./streak";
import { mergeReview, recordReview, sanitizeReview, type ReviewState } from "./review";
import { isStoryId, storyReward } from "./stories";

// Mirrors the `user_progress.data` JSON stored in the cloud for signed-in users.
export type Progress = {
  xp: number;
  gems: number;
  streak: number;
  longestStreak: number;
  lastActiveDate: string | null; // YYYY-MM-DD (UTC)
  hearts: number;
  lastHeartLostAt: number | null;
  completed: string[];
  course: CourseId | null;
  dailyGoal: number;
  xpByDay: Record<string, number>;
  lessonsDone: number;
  perfectLessons: number;
  adsByDay: Record<string, number>;
  /** Questions answered wrong, scheduled for spaced-repetition practice. */
  review: ReviewState;
  /** Streak freezes owned; one is spent automatically per missed day. */
  freezes: number;
  /** Story ids read at least once. */
  stories: string[];
};

export const HEART_REGEN_INTERVAL_MS = 4 * 60 * 60 * 1000;
const KEY = "lingofox-progress-v2";
export const initialProgress: Progress = {
  xp: 0,
  gems: 100,
  streak: 0,
  longestStreak: 0,
  lastActiveDate: null,
  hearts: MAX_HEARTS,
  lastHeartLostAt: null,
  completed: [],
  course: null,
  dailyGoal: 20,
  xpByDay: {},
  lessonsDone: 0,
  perfectLessons: 0,
  adsByDay: {},
  review: {},
  freezes: 0,
  stories: [],
};

let state: Progress = initialProgress;
let loaded = false;
const listeners = new Set<() => void>();

export function sanitizeProgress(raw: unknown): Progress {
  const r = (raw && typeof raw === "object" ? raw : {}) as Partial<Progress>;
  const num = (v: unknown, d: number) => (typeof v === "number" && Number.isFinite(v) ? v : d);
  return {
    ...initialProgress,
    xp: num(r.xp, 0),
    gems: num(r.gems, initialProgress.gems),
    streak: num(r.streak, 0),
    longestStreak: num(r.longestStreak, num(r.streak, 0)),
    lastActiveDate: typeof r.lastActiveDate === "string" ? r.lastActiveDate : null,
    ...(() => {
      let hearts = Math.min(MAX_HEARTS, num(r.hearts, MAX_HEARTS));
      let lastHeartLostAt = typeof r.lastHeartLostAt === "number" && Number.isFinite(r.lastHeartLostAt) ? r.lastHeartLostAt : null;
      if (hearts < MAX_HEARTS && lastHeartLostAt) {
        const elapsed = Math.max(0, Date.now() - lastHeartLostAt);
        const recovered = Math.floor(elapsed / HEART_REGEN_INTERVAL_MS);
        if (recovered > 0) {
          hearts = Math.min(MAX_HEARTS, hearts + recovered);
          lastHeartLostAt = hearts >= MAX_HEARTS ? null : lastHeartLostAt + recovered * HEART_REGEN_INTERVAL_MS;
        }
      } else if (hearts >= MAX_HEARTS) {
        lastHeartLostAt = null;
      }
      return { hearts, lastHeartLostAt };
    })(),
    completed: Array.isArray(r.completed) ? r.completed.filter((x): x is string => typeof x === "string") : [],
    course: COURSE_IDS.includes(r.course as CourseId) ? (r.course as CourseId) : null,
    dailyGoal: num(r.dailyGoal, 20),
    xpByDay: r.xpByDay && typeof r.xpByDay === "object" ? r.xpByDay : {},
    lessonsDone: num(r.lessonsDone, 0),
    perfectLessons: num(r.perfectLessons, 0),
    adsByDay: r.adsByDay && typeof r.adsByDay === "object" ? r.adsByDay : {},
    review: sanitizeReview(r.review),
    freezes: Math.max(0, Math.min(MAX_FREEZES, Math.floor(num(r.freezes, 0)))),
    stories: Array.isArray(r.stories) ? Array.from(new Set(r.stories.filter(isStoryId))) : [],
  };
}

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const raw = localStorage.getItem(KEY) ?? localStorage.getItem("lingofox-progress-v1");
    if (raw) state = sanitizeProgress(JSON.parse(raw));
  } catch {
    /* ignore */
  }
}
function set(next: Progress) {
  state = next;
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* ignore */ }
  listeners.forEach((l) => l());
}

export { dayKey, displayStreak, nextStreak };

export function lessonReward(mistakes: number) {
  return { xp: XP_PER_LESSON + (mistakes === 0 ? XP_PERFECT_BONUS : 0), gems: GEMS_PER_LESSON };
}

/** Combine guest progress with cloud progress on sign-in, never losing either. */
export function mergeProgress(a: Progress, b: Progress): Progress {
  const base = a.xp >= b.xp ? a : b;
  const other = base === a ? b : a;
  const xpByDay: Record<string, number> = { ...other.xpByDay };
  for (const [d, v] of Object.entries(base.xpByDay)) xpByDay[d] = Math.max(v, xpByDay[d] ?? 0);
  const adsByDay: Record<string, number> = { ...other.adsByDay };
  for (const [d, v] of Object.entries(base.adsByDay)) adsByDay[d] = Math.max(v, adsByDay[d] ?? 0);
  const lastActiveDate = [a.lastActiveDate, b.lastActiveDate].filter(Boolean).sort().pop() ?? null;
  return {
    ...base,
    streak: Math.max(a.streak, b.streak),
    longestStreak: Math.max(a.longestStreak, b.longestStreak, a.streak, b.streak),
    lastActiveDate,
    completed: Array.from(new Set([...a.completed, ...b.completed])),
    course: base.course ?? other.course,
    xpByDay,
    adsByDay,
    lessonsDone: Math.max(a.lessonsDone, b.lessonsDone),
    perfectLessons: Math.max(a.perfectLessons, b.perfectLessons),
    review: mergeReview(a.review, b.review),
    freezes: Math.max(a.freezes, b.freezes),
    stories: Array.from(new Set([...a.stories, ...b.stories])),
    lastHeartLostAt: a.hearts < b.hearts ? a.lastHeartLostAt : b.lastHeartLostAt,
  };
}

export function adsWatchedToday(p: Progress, today = new Date()) {
  return p.adsByDay[dayKey(today)] ?? 0;
}

export const progressActions = {
  get: () => { load(); return state; },
  hydrate(next: Progress) { set(next); },
  setCourse(course: CourseId) { set({ ...state, course }); },
  setDailyGoal(goal: number) { set({ ...state, dailyGoal: goal }); },
  loseHeart() {
    const nextHearts = Math.max(0, state.hearts - 1);
    const lastHeartLostAt = nextHearts < MAX_HEARTS ? (state.lastHeartLostAt ?? Date.now()) : null;
    set({ ...state, hearts: nextHearts, lastHeartLostAt });
  },
  refillHearts(): boolean {
    if (state.gems < REFILL_COST) return false;
    set({ ...state, hearts: MAX_HEARTS, lastHeartLostAt: null, gems: state.gems - REFILL_COST });
    return true;
  },
  rewardAd(): boolean {
    const today = dayKey(new Date());
    const seen = state.adsByDay[today] ?? 0;
    if (seen >= MAX_REWARDED_ADS_PER_DAY) return false;
    set({ ...state, hearts: MAX_HEARTS, lastHeartLostAt: null, adsByDay: { ...state.adsByDay, [today]: seen + 1 } });
    return true;
  },
  completeLesson(lessonId: string, mistakes: number) {
    const today = new Date();
    const t = dayKey(today);
    const reward = lessonReward(mistakes);
    const used = freezesUsed(state.lastActiveDate, today, state.freezes);
    const streak = nextStreak(state.streak, state.lastActiveDate, today, state.freezes);
    set({
      ...state,
      freezes: state.freezes - used,
      xp: state.xp + reward.xp,
      gems: state.gems + reward.gems,
      streak,
      longestStreak: Math.max(state.longestStreak, streak),
      lastActiveDate: t,
      xpByDay: { ...state.xpByDay, [t]: (state.xpByDay[t] ?? 0) + reward.xp },
      lessonsDone: state.lessonsDone + 1,
      perfectLessons: state.perfectLessons + (mistakes === 0 ? 1 : 0),
      completed: state.completed.includes(lessonId) ? state.completed : [...state.completed, lessonId],
    });
    return { ...reward, freezeUsed: used };
  },
  /** Track a question for spaced repetition (a mistake starts tracking; a correct answer advances it). */
  recordReview(key: string, correct: boolean) {
    const review = recordReview(state.review, key, correct, dayKey(new Date()));
    if (review !== state.review) set({ ...state, review });
  },
  /** Finish a practice session: XP and streak, but it does not count as a new lesson. */
  completePractice() {
    const today = new Date();
    const t = dayKey(today);
    const used = freezesUsed(state.lastActiveDate, today, state.freezes);
    const streak = nextStreak(state.streak, state.lastActiveDate, today, state.freezes);
    const earnedHeart = state.hearts < MAX_HEARTS;
    const nextHearts = earnedHeart ? state.hearts + 1 : state.hearts;
    const lastHeartLostAt = nextHearts >= MAX_HEARTS ? null : state.lastHeartLostAt;
    set({
      ...state,
      hearts: nextHearts,
      lastHeartLostAt,
      freezes: state.freezes - used,
      xp: state.xp + XP_PER_PRACTICE,
      streak,
      longestStreak: Math.max(state.longestStreak, streak),
      lastActiveDate: t,
      xpByDay: { ...state.xpByDay, [t]: (state.xpByDay[t] ?? 0) + XP_PER_PRACTICE },
    });
    return { xp: XP_PER_PRACTICE, gems: 0, freezeUsed: used, heartRestored: earnedHeart };
  },
  /** Finish reading a story: full reward the first time, a smaller one on re-reads. Both keep the streak. */
  completeStory(storyId: string) {
    const today = new Date();
    const t = dayKey(today);
    const reward = storyReward(state.stories.includes(storyId));
    const used = freezesUsed(state.lastActiveDate, today, state.freezes);
    const streak = nextStreak(state.streak, state.lastActiveDate, today, state.freezes);
    set({
      ...state,
      freezes: state.freezes - used,
      xp: state.xp + reward.xp,
      gems: state.gems + reward.gems,
      streak,
      longestStreak: Math.max(state.longestStreak, streak),
      lastActiveDate: t,
      xpByDay: { ...state.xpByDay, [t]: (state.xpByDay[t] ?? 0) + reward.xp },
      stories: state.stories.includes(storyId) ? state.stories : [...state.stories, storyId],
    });
    return { ...reward, freezeUsed: used };
  },
  buyFreeze(): boolean {
    if (state.freezes >= MAX_FREEZES || state.gems < FREEZE_COST) return false;
    set({ ...state, freezes: state.freezes + 1, gems: state.gems - FREEZE_COST });
    return true;
  },
  reset() { set(initialProgress); },
};

function subscribe(l: () => void) {
  load();
  listeners.add(l);
  queueMicrotask(l);
  return () => listeners.delete(l);
}
export function subscribeProgress(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function useProgress() {
  return useSyncExternalStore(subscribe, () => { load(); return state; }, () => initialProgress);
}

export function currentLessonId(p: Progress, courseId: CourseId | null = p.course) {
  const course = getCourse(courseId);
  if (!course) return null;
  return lessonIdsOf(course).find((id) => !p.completed.includes(id)) ?? null;
}
