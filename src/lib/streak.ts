// Streak maths, including "streak freezes" that cover missed days. Pure, so it is easy to test.
export const MAX_FREEZES = 2;
export const FREEZE_COST = 60;

const DAY_MS = 86_400_000;

export const dayKey = (d: Date) => d.toISOString().slice(0, 10);

/** Full days skipped between the last activity and today (0 when active today or yesterday). */
export function missedDays(last: string | null, today: Date): number {
  if (!last) return 0;
  const diff = Math.round((Date.parse(`${dayKey(today)}T00:00:00Z`) - Date.parse(`${last}T00:00:00Z`)) / DAY_MS);
  if (Number.isNaN(diff)) return Infinity;
  return Math.max(0, diff - 1);
}

/** How many freezes get spent when the learner comes back after a gap (0 if the gap is too long to cover). */
export function freezesUsed(last: string | null, today: Date, freezes: number): number {
  const gap = missedDays(last, today);
  return gap > 0 && gap <= freezes ? gap : 0;
}

export function nextStreak(streak: number, last: string | null, today: Date, freezes = 0): number {
  if (last === dayKey(today)) return Math.max(streak, 1);
  if (!last) return 1;
  return missedDays(last, today) <= freezes ? streak + 1 : 1;
}

/** Streak shown to the user: drops to 0 once a gap is longer than the freezes can cover. */
export function displayStreak(
  p: { streak: number; lastActiveDate: string | null; freezes?: number | undefined },
  today: Date,
): number {
  if (!p.lastActiveDate) return 0;
  return missedDays(p.lastActiveDate, today) <= (p.freezes ?? 0) ? p.streak : 0;
}
