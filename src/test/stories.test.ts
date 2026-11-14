import { beforeEach, describe, expect, it } from "vitest";
import { COURSE_IDS } from "@/lib/lessons";
import { STORIES, storiesOf, storySteps } from "@/lib/stories";
import { initialProgress, mergeProgress, progressActions, sanitizeProgress } from "@/lib/progress-store";

describe("stories content", () => {
  it("every course has at least two stories", () => {
    for (const c of COURSE_IDS) expect(storiesOf(c).length).toBeGreaterThanOrEqual(2);
  });
  it("ids are unique and prefixed with the course id", () => {
    expect(new Set(STORIES.map((s) => s.id)).size).toBe(STORIES.length);
    for (const s of STORIES) expect(s.id.startsWith(`${s.course}-story-`)).toBe(true);
  });
  it("every question points at a real line and a real option", () => {
    for (const s of STORIES) {
      for (const q of s.questions) {
        expect(q.after).toBeLessThan(s.lines.length);
        expect(q.options[q.answer]).toBeDefined();
      }
      expect(storySteps(s).length).toBe(s.lines.length + s.questions.length);
    }
  });
});

describe("story rewards", () => {
  beforeEach(() => progressActions.hydrate(initialProgress));

  it("first read gives 10 XP and 5 gems, a re-read gives 5 XP and no gems", () => {
    const first = progressActions.completeStory("en-story-1");
    expect(first).toMatchObject({ xp: 10, gems: 5 });
    const again = progressActions.completeStory("en-story-1");
    expect(again).toMatchObject({ xp: 5, gems: 0 });
    const p = progressActions.get();
    expect(p.xp).toBe(15);
    expect(p.gems).toBe(initialProgress.gems + 5);
    expect(p.stories).toEqual(["en-story-1"]);
  });

  it("reading a story keeps the streak alive", () => {
    progressActions.completeStory("es-story-1");
    expect(progressActions.get().streak).toBe(1);
  });

  it("read stories survive sync merge and unknown ids are dropped", () => {
    const a = sanitizeProgress({ stories: ["en-story-1", "bogus"] });
    const b = sanitizeProgress({ stories: ["fr-story-2"] });
    expect(a.stories).toEqual(["en-story-1"]);
    expect(mergeProgress(a, b).stories.sort()).toEqual(["en-story-1", "fr-story-2"]);
  });
});
