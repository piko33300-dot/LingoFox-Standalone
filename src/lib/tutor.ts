// AI tutor ("Fox"): prompt and limits. Pure and shared by the server route and the page.
import { getCourse, type CourseId, type UiLang } from "./lessons";

export const TUTOR_MAX_INPUT = 500;
export const TUTOR_HISTORY = 20;
export const TUTOR_DAILY_LIMIT = 40;

const NAMES: Record<string, string> = { en: "English", ar: "Arabic", es: "Spanish", fr: "French", tr: "Turkish", de: "German", it: "Italian" };

export function tutorInstructions(courseId: CourseId | null, ui: UiLang, level: number): string {
  const course = getCourse(courseId) ?? getCourse("en")!;
  const target = NAMES[course.target]!;
  const native = NAMES[ui === "ar" ? "ar" : "en"]!;
  const stage = level < 3 ? "absolute beginner" : level < 12 ? "beginner" : "lower-intermediate";
  return [
    `You are Fox, the friendly fox tutor of the LingoFox language app.`,
    `The learner speaks ${native} and is learning ${target}. Their level: ${stage} (${level} lessons done).`,
    `Hold a natural, encouraging conversation mostly in ${target}, using short, simple sentences suited to their level.`,
    `After the learner writes, if they made mistakes, start with one short line "✏️" followed by the corrected sentence and a very brief explanation in ${native}. Then continue the conversation.`,
    `When the learner writes in ${native} or asks for help, explain briefly in ${native} and give a ${target} example.`,
    `Add a ${native} translation in parentheses for any sentence that may be new to them.`,
    `End most replies with one easy question to keep them talking. Keep every reply under 90 words.`,
    `Stay on language learning, everyday topics and culture. Politely refuse anything unsafe or unrelated.`,
  ].join("\n");
}

export type TutorMessage = { id: string; role: "user" | "assistant"; content: string };

/** Parse tutor assistant message to separate conversational body from correction note. */
export function parseTutorContent(content: string): { reply: string; body: string; correction: string | null } {
  if (!content.includes("✏️")) {
    return { reply: content.trim(), body: content.trim(), correction: null };
  }
  const lines = content.split("\n");
  const corr: string[] = [];
  const rest: string[] = [];
  let inCorr = false;
  for (const line of lines) {
    if (line.includes("✏️")) {
      inCorr = true;
      const stripped = line.replace("✏️", "").trim();
      if (stripped) corr.push(stripped);
    } else if (inCorr && line.trim() !== "") {
      corr.push(line.trim());
    } else if (inCorr && line.trim() === "") {
      inCorr = false;
    } else {
      rest.push(line);
    }
  }
  const reply = rest.join("\n").trim() || content.trim();
  const correction = corr.join(" ").trim() || null;
  return { reply, body: reply, correction };
}
