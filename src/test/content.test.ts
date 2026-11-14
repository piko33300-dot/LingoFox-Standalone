import { describe, expect, it } from "vitest";
import { COURSES, QUESTIONS_PER_LESSON, findLesson, lessonIdsOf } from "@/lib/lessons";

describe("course content integrity", () => {
  for (const course of COURSES) {
    for (const unit of course.units) {
      describe(`${course.id}/${unit.id}`, () => {
        it("has enough questions and 3 lessons", () => {
          expect(unit.questions.length).toBeGreaterThanOrEqual(QUESTIONS_PER_LESSON);
          expect(unit.lessons).toHaveLength(3);
        });
        it("every question is answerable", () => {
          for (const q of unit.questions) {
            if (q.type === "mc") {
              expect(q.options.map((o) => o.text)).toContain(q.answer);
              expect(new Set(q.options.map((o) => o.text)).size).toBe(q.options.length);
            } else if (q.type === "listen") {
              expect(q.options).toContain(q.answer);
            } else if (q.type === "builder") {
              const bank = [...q.bank];
              for (const w of q.answer) {
                const at = bank.indexOf(w);
                expect(at, `missing word "${w}" in ${q.sentence}`).toBeGreaterThanOrEqual(0);
                bank.splice(at, 1);
              }
            } else if (q.type === "type") {
              expect(q.accepted.length).toBeGreaterThan(0);
            } else if (q.type === "match") {
              expect(q.pairs).toHaveLength(4);
            }
          }
        });
      });
    }
  }

  it("lesson ids are unique and resolvable", () => {
    const ids = COURSES.flatMap(lessonIdsOf);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(findLesson(id)?.questions).toHaveLength(QUESTIONS_PER_LESSON);
  });
});
