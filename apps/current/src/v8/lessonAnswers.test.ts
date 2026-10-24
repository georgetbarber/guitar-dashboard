import { describe, expect, it } from "vitest";
import { activityById } from "./curriculum";
import { conceptCheckById } from "./conceptChecks";
import { lessonAnswerIsValid, lessonAnswerKey } from "./lessonAnswers";
import { listeningOutcome, recordLessonAnswer } from "./lessonProgress";
import { LESSON_CATALOG } from "./lessons/catalog";
import { FEELS_LESSON } from "./lessons/stage5";
import { MODES_LESSON } from "./lessons/stage6";
import { DEFAULT_STATE } from "./store";
import { validateEvidence, validateState } from "./validation";

const activity = activityById("unit-30-listen-compare")!;
const [first] = FEELS_LESSON.listening!.questions;

describe("listening answers", () => {
  it("are exact answers against the unit's activity, marked right or wrong by the answer key", () => {
    const right = recordLessonAnswer(FEELS_LESSON, first, first.answer, false, activity);
    const wrong = recordLessonAnswer(
      FEELS_LESSON,
      first,
      first.choices.find((item) => item !== first.answer)!,
      true,
      activity,
    );
    expect(right).toHaveLength(activity.competencyIds.length);
    expect(right[0]).toMatchObject({
      method: "exact-answer",
      source: "recognition",
      activityId: "unit-30-listen-compare",
      checkId: "lesson:lesson-unit-30-feels:example-1",
      contentVersion: 2,
      outcome: "successful",
      assistance: "none",
      context: { key: "A", mode: "minor" },
    });
    expect(wrong[0]).toMatchObject({ outcome: "retry", assistance: "hint" });
    for (const item of [...right, ...wrong]) {
      expect(lessonAnswerIsValid(item)).toBe(true);
      expect(() => validateEvidence(item)).not.toThrow();
    }
    expect(() => validateState({ ...DEFAULT_STATE, evidence: [...right, ...wrong] })).not.toThrow();
    expect(() => recordLessonAnswer(FEELS_LESSON, first, "Bossa nova", false, activity)).toThrow();
  });

  it("refuse a forged result: a wrong answer marked right, another activity, or an answer not on offer", () => {
    const [answer] = recordLessonAnswer(
      FEELS_LESSON,
      first,
      first.choices.find((item) => item !== first.answer)!,
      false,
      activity,
    );
    for (const forged of [
      { ...answer, outcome: "successful" as const },
      { ...answer, activityId: "unit-30-technique" },
      { ...answer, response: "Bossa nova" },
      { ...answer, context: { key: "E", mode: "minor" as const } },
    ]) {
      expect(lessonAnswerIsValid(forged)).toBe(false);
      expect(() => validateEvidence(forged)).toThrow(/checked lesson answer/);
    }
  });

  it("keep their answer keys in the shell catalogue, for both listening lessons", () => {
    expect(lessonAnswerKey("lesson:lesson-unit-30-feels:example-1")?.key.answer).toBe(first.answer);
    const entry = LESSON_CATALOG.find((item) => item.id === MODES_LESSON.id)!;
    expect(entry.answers?.map((key) => key.questionId)).toEqual(MODES_LESSON.listening!.questions.map((q) => q.id));
    expect(lessonAnswerKey("lesson:lesson-unit-30-feels:example-99")).toBeUndefined();
  });

  it("start at content version 2, which builds that predate lesson questions accept unchecked (A19)", () => {
    // Those builds refuse an exact answer whose check they do not know at version 1, and accept later versions.
    for (const entry of LESSON_CATALOG)
      for (const key of entry.answers ?? []) {
        expect(key.version, `${entry.id} ${key.questionId}`).toBeGreaterThanOrEqual(2);
        expect(conceptCheckById(`lesson:${entry.id}:${key.questionId}`)).toBeUndefined();
      }
    const [answer] = recordLessonAnswer(FEELS_LESSON, first, first.answer, false, activity);
    // An answer to a question this build has never heard of passes at version 2 and is refused at version 1.
    const future = { ...answer, checkId: "lesson:lesson-unit-99-future:example-1" };
    expect(() => validateEvidence(future)).not.toThrow();
    expect(() => validateEvidence({ ...future, contentVersion: 1 })).toThrow(/checked answer/);
  });

  it("score a set: all right is a success, at least half is partial, fewer is a retry", () => {
    expect([listeningOutcome(4, 4), listeningOutcome(2, 4), listeningOutcome(1, 4), listeningOutcome(3, 5)]).toEqual([
      "successful",
      "partial",
      "retry",
      "partial",
    ]);
  });
});
