// Weekly leagues: pure helpers shared by the UI and the cloud sync.
import type { I18nKey } from "./i18n";

export const LEAGUES: { id: number; key: I18nKey; emoji: string }[] = [
  { id: 0, key: "leagueBronze", emoji: "🥉" },
  { id: 1, key: "leagueSilver", emoji: "🥈" },
  { id: 2, key: "leagueGold", emoji: "🥇" },
  { id: 3, key: "leagueSapphire", emoji: "💎" },
  { id: 4, key: "leagueDiamond", emoji: "👑" },
];
/** Top places that move up a league when the week ends (mirrors rollover_leagues in the database). */
export const PROMOTE_TOP = 10;
/** Bottom places that move down when a league table has more than PROMOTE_TOP learners. */
export const DEMOTE_BOTTOM = 5;

export const leagueOf = (id: number | null | undefined) => LEAGUES[Math.max(0, Math.min(LEAGUES.length - 1, id ?? 0))]!;

/** Monday (UTC) of the week containing `d`, as YYYY-MM-DD. */
export function weekStart(d: Date): string {
  const day = d.getUTCDay(); // 0 = Sunday
  const back = (day + 6) % 7;
  const monday = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - back));
  return monday.toISOString().slice(0, 10);
}

/** XP earned from Monday (UTC) up to and including today. */
export function weekXp(xpByDay: Record<string, number>, now: Date): number {
  const from = weekStart(now);
  const to = now.toISOString().slice(0, 10);
  let total = 0;
  for (const [day, xp] of Object.entries(xpByDay)) {
    if (day >= from && day <= to && typeof xp === "number" && Number.isFinite(xp)) total += xp;
  }
  return total;
}

/** Days left until the league week resets (Monday 00:00 UTC). */
export function daysLeftInWeek(now: Date): number {
  const day = now.getUTCDay();
  return day === 0 ? 1 : 8 - day;
}

/** Where a place in the table leads when the week ends. */
export function zoneOf(position: number, total: number, league: number, xp: number): "up" | "down" | "stay" {
  if (position <= PROMOTE_TOP && xp > 0 && league < LEAGUES.length - 1) return "up";
  if (total > PROMOTE_TOP && position > total - DEMOTE_BOTTOM && league > 0) return "down";
  return "stay";
}

export function normalizeFriendCode(input: string): string {
  return input.toUpperCase().replace(/[^A-F0-9]/g, "").slice(0, 6);
}
