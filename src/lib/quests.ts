import { dayKey, type Progress } from "./progress-store";

export type QuestKind = "xp" | "lessons" | "mastery";

export interface DailyQuest {
  id: string;
  kind: QuestKind;
  target: number;
  rewardGems: number;
  rewardXp: number;
  icon: "zap" | "book" | "star";
  titleKey: string;
  descKey: string;
}

export interface QuestProgress {
  quest: DailyQuest;
  current: number;
  target: number;
  completed: boolean;
  claimed: boolean;
  percent: number;
}

export interface MonthlyChallenge {
  monthKey: string;
  monthName: string;
  claimedCount: number;
  targetCount: number;
  percent: number;
  tier: "none" | "bronze" | "silver" | "gold";
  daysLeft: number;
}

/** Standard set of 3 daily quests tailored for active learners. */
export function getDailyQuestsList(dateKey: string): DailyQuest[] {
  return [
    {
      id: `quest-xp-${dateKey}`,
      kind: "xp",
      target: 30,
      rewardGems: 15,
      rewardXp: 10,
      icon: "zap",
      titleKey: "questXp30Title",
      descKey: "questXp30Desc",
    },
    {
      id: `quest-lessons-${dateKey}`,
      kind: "lessons",
      target: 2,
      rewardGems: 20,
      rewardXp: 15,
      icon: "book",
      titleKey: "questLessons2Title",
      descKey: "questLessons2Desc",
    },
    {
      id: `quest-mastery-${dateKey}`,
      kind: "mastery",
      target: 1,
      rewardGems: 25,
      rewardXp: 20,
      icon: "star",
      titleKey: "questMasteryTitle",
      descKey: "questMasteryDesc",
    },
  ];
}

/** Evaluates player's real-time progress for all daily quests. */
export function evaluateDailyQuests(progress: Progress, date: Date = new Date()): QuestProgress[] {
  const dKey = dayKey(date);
  const quests = getDailyQuestsList(dKey);
  const act = progress.dailyActivity?.[dKey] ?? {
    lessons: 0,
    perfectLessons: 0,
    practices: 0,
    stories: 0,
    claimedQuests: [],
  };

  const xpEarned = progress.xpByDay?.[dKey] ?? 0;
  const lessonsAndPractice = (act.lessons ?? 0) + (act.practices ?? 0);
  const masteryCount = (act.perfectLessons ?? 0) > 0 ? 1 : (act.practices ?? 0) > 0 ? 1 : 0;

  return quests.map((quest) => {
    let current = 0;
    if (quest.kind === "xp") {
      current = xpEarned;
    } else if (quest.kind === "lessons") {
      current = lessonsAndPractice;
    } else {
      current = masteryCount;
    }

    const completed = current >= quest.target;
    const claimed = act.claimedQuests?.includes(quest.id) ?? false;
    const percent = Math.min(100, Math.round((current / quest.target) * 100));

    return {
      quest,
      current: Math.min(current, quest.target),
      target: quest.target,
      completed,
      claimed,
      percent,
    };
  });
}

/** Evaluates monthly quest challenge (20 quests goal in the calendar month). */
export function evaluateMonthlyChallenge(progress: Progress, date: Date = new Date()): MonthlyChallenge {
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth(); // 0-11
  const monthPrefix = `${year}-${String(month + 1).padStart(2, "0")}`;

  let claimedCount = 0;
  if (progress.dailyActivity) {
    for (const [dKey, act] of Object.entries(progress.dailyActivity)) {
      if (dKey.startsWith(monthPrefix) && Array.isArray(act.claimedQuests)) {
        claimedCount += act.claimedQuests.length;
      }
    }
  }

  const targetCount = 20;
  const percent = Math.min(100, Math.round((claimedCount / targetCount) * 100));

  let tier: "none" | "bronze" | "silver" | "gold" = "none";
  if (claimedCount >= 20) tier = "gold";
  else if (claimedCount >= 12) tier = "silver";
  else if (claimedCount >= 5) tier = "bronze";

  const lastDayOfMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const currentDayOfMonth = date.getUTCDate();
  const daysLeft = Math.max(1, lastDayOfMonth - currentDayOfMonth);

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  return {
    monthKey: monthPrefix,
    monthName: monthNames[month],
    claimedCount,
    targetCount,
    percent,
    tier,
    daysLeft,
  };
}

/** Formats remaining time until next UTC day (midnight 00:00 UTC). */
export function timeUntilMidnight(date: Date = new Date()): { hours: number; minutes: number } {
  const now = date.getTime();
  const tomorrow = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() + 1)).getTime();
  const diffMs = Math.max(0, tomorrow - now);
  const totalMinutes = Math.floor(diffMs / (60 * 1000));
  return {
    hours: Math.floor(totalMinutes / 60),
    minutes: totalMinutes % 60,
  };
}
