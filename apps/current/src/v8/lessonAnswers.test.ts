import { describe, expect, it } from "vitest";
import { activityById } from "./curriculum";
import { conceptCheckById } from "./conceptChecks";
import { lessonAnswerIsValid, lessonAnswerKey } from "./lessonAnswers";
import { completedActivityIdsFromEvidence } from "./learning";
import { answersSeenToday, listeningOutcome, recordLessonAnswer, shuffleListeningSet } from "./lessonProgress";
import { LESSON_CATALOG } from "./lessons/catalog";
import { FEELS_LESSON } from "./lessons/stage5";
import { MODES_LESSON } from "./lessons/stage6";
import { DEFAULT_STATE } from "./store";
import { validateEvidence, validateLessonAttempt, validateState } from "./validation";

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

  it("complete the activity only when a whole set, recorded together, was right", () => {
    const questions = FEELS_LESSON.listening!.questions;
    const set = (at: Date, wrong: number[]) =>
      questions.flatMap((question, index) =>
        recordLessonAnswer(
          FEELS_LESSON,
          question,
          wrong.includes(index) ? question.choices.find((item) => item !== question.answer)! : question.answer,
          false,
          activity,
          at,
        ),
      );
    const partial = set(new Date("2026-10-25T10:00:00Z"), [1]);
    expect(completedActivityIdsFromEvidence(partial)).not.toContain(activity.id);
    // A later set with every answer right completes it.
    const whole = set(new Date("2026-10-26T10:00:00Z"), []);
    expect(completedActivityIdsFromEvidence([...partial, ...whole])).toContain(activity.id);
  });

  it("are shuffled for every run, questions and choices, without losing any", () => {
    const questions = MODES_LESSON.listening!.questions;
    const sequence = [0.1, 0.9, 0.4, 0.7, 0.2, 0.6, 0.3];
    let call = 0;
    const shuffled = shuffleListeningSet(questions, () => sequence[call++ % sequence.length]);
    expect(shuffled.map((q) => q.id).sort()).toEqual(questions.map((q) => q.id).sort());
    expect(shuffled.map((q) => q.id)).not.toEqual(questions.map((q) => q.id));
    for (const question of shuffled) {
      const original = questions.find((q) => q.id === question.id)!;
      expect([...question.choices].sort()).toEqual([...original.choices].sort());
      expect(question.answer).toBe(original.answer);
    }
  });

  it("know when this lesson's answers were already shown today", () => {
    const [answer] = recordLessonAnswer(FEELS_LESSON, first, first.answer, false, activity, new Date(2026, 9, 25, 12));
    expect(answersSeenToday(FEELS_LESSON, [answer], new Date(2026, 9, 25, 18))).toBe(true);
    expect(answersSeenToday(FEELS_LESSON, [answer], new Date(2026, 9, 26, 9))).toBe(false);
    expect(answersSeenToday(MODES_LESSON, [answer], new Date(2026, 9, 25, 18))).toBe(false);
  });

  it("record a set's attempt with values builds before Batch 3 accept, and say the app marked it (A19)", () => {
    const attempt = {
      id: "lesson-attempt-1",
      cursorId: "lesson-session-1",
      lessonId: FEELS_LESSON.id,
      lessonVersion: 1,
      scoreId: first.scoreId,
      scoreVersion: 1,
      kind: "first-check",
      assistance: "hint",
      method: "self-reported",
      checkedAnswers: { right: 3, total: 4 },
      tempo: 60,
      outcome: "partial",
      observation: "The app marked 3 of 4 examples right.",
      occurredAt: "2026-10-25T10:00:00.000Z",
      localDate: "2026-10-25",
    };
    expect(() => validateLessonAttempt(attempt)).not.toThrow();
    // Older builds accept only self-reported, so this build never writes anything else.
    expect(() => validateLessonAttempt({ ...attempt, method: "exact-answer" })).toThrow(/method/);
    expect(() => validateLessonAttempt({ ...attempt, checkedAnswers: { right: 5, total: 4 } })).toThrow(
      /checkedAnswers/,
    );
    // Help on an answer stays within what older builds accept on exact-answer evidence: none or hint.
    const [hinted] = recordLessonAnswer(FEELS_LESSON, first, first.answer, true, activity);
    expect(["none", "hint"]).toContain(hinted.assistance);
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
