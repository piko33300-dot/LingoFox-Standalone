import type { Localized } from "./lessons";
import type { Progress } from "./progress-store";

export type Achievement = {
  id: string;
  emoji: string;
  title: Localized;
  description: Localized;
  /** current value and the target needed to unlock */
  measure: (p: Progress) => number;
  target: number;
};

const goalDays = (p: Progress) => Object.values(p.xpByDay).filter((x) => x >= p.dailyGoal).length;
const coursesStarted = (p: Progress) => new Set(p.completed.map((id) => id.split("-")[0])).size;

export const ACHIEVEMENTS: Achievement[] = [
  { id: "first-lesson", emoji: "🌱", title: { ar: "البداية", en: "First steps" }, description: { ar: "أكمل أول درس", en: "Finish your first lesson" }, measure: (p) => p.lessonsDone, target: 1 },
  { id: "five-lessons", emoji: "📘", title: { ar: "طالب مجتهد", en: "Bookworm" }, description: { ar: "أكمل 5 دروس", en: "Finish 5 lessons" }, measure: (p) => p.lessonsDone, target: 5 },
  { id: "twenty-lessons", emoji: "🎓", title: { ar: "عالِم صغير", en: "Scholar" }, description: { ar: "أكمل 20 درساً", en: "Finish 20 lessons" }, measure: (p) => p.lessonsDone, target: 20 },
  { id: "perfect", emoji: "💯", title: { ar: "بلا أخطاء", en: "Flawless" }, description: { ar: "أكمل درساً بدون أخطاء", en: "Finish a lesson with no mistakes" }, measure: (p) => p.perfectLessons, target: 1 },
  { id: "perfect-10", emoji: "🏹", title: { ar: "القنّاص", en: "Sharpshooter" }, description: { ar: "10 دروس مثالية", en: "10 perfect lessons" }, measure: (p) => p.perfectLessons, target: 10 },
  { id: "streak-3", emoji: "🔥", title: { ar: "على النار", en: "On fire" }, description: { ar: "تتابع 3 أيام", en: "Reach a 3-day streak" }, measure: (p) => p.longestStreak, target: 3 },
  { id: "streak-7", emoji: "⚡", title: { ar: "أسبوع كامل", en: "Week warrior" }, description: { ar: "تتابع 7 أيام", en: "Reach a 7-day streak" }, measure: (p) => p.longestStreak, target: 7 },
  { id: "streak-30", emoji: "🏆", title: { ar: "أسطورة", en: "Legend" }, description: { ar: "تتابع 30 يوماً", en: "Reach a 30-day streak" }, measure: (p) => p.longestStreak, target: 30 },
  { id: "xp-100", emoji: "⭐", title: { ar: "نجم صاعد", en: "Rising star" }, description: { ar: "اجمع 100 نقطة", en: "Earn 100 XP" }, measure: (p) => p.xp, target: 100 },
  { id: "xp-500", emoji: "🌟", title: { ar: "نجم لامع", en: "Superstar" }, description: { ar: "اجمع 500 نقطة", en: "Earn 500 XP" }, measure: (p) => p.xp, target: 500 },
  { id: "goal-5", emoji: "🎯", title: { ar: "ملتزم", en: "Committed" }, description: { ar: "حقق هدفك اليومي 5 مرات", en: "Hit your daily goal 5 times" }, measure: goalDays, target: 5 },
  { id: "polyglot", emoji: "🌍", title: { ar: "متعدد اللغات", en: "Polyglot" }, description: { ar: "ابدأ دورتين", en: "Start both courses" }, measure: coursesStarted, target: 2 },
];

export function achievementStatus(p: Progress) {
  return ACHIEVEMENTS.map((a) => {
    const value = a.measure(p);
    return { ...a, value: Math.min(value, a.target), unlocked: value >= a.target };
  });
}

export function unlockedIds(p: Progress) {
  return achievementStatus(p).filter((a) => a.unlocked).map((a) => a.id);
}
