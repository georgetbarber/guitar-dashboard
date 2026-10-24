/**
 * Where a learner is in an authored lesson, and what their own reports say.
 *
 * Mirrors pilotProgress.ts for every lesson in src/v8/lessons. Attempts are
 * self-reports tied to an exact lesson and score version; a revised lesson
 * starts again rather than inheriting reports about different music.
 */
import type { Score } from "../core/score/types";
import { calendarDaysBetween, localDateAt } from "./dates";
import { newId } from "./identity";
import type { Lesson, MakingCheck } from "./lessons/format";
import { newSketch } from "./repository";
import type { LessonAttempt, LessonCursor, Sketch, V8State } from "./types";

export function newLessonCursor(lesson: Lesson, now = new Date()): LessonCursor {
  const first = lesson.cueFading[0];
  const score = lesson.scores.find((item) => item.id === first.scoreId)!;
  return {
    id: newId("lesson-session"),
    lessonId: lesson.id,
    lessonVersion: lesson.version,
    step: "learn",
    scoreId: first.scoreId,
    tempo: score.tempo.default,
    assistance: "none",
    updatedAt: now.toISOString(),
  };
}

export function lessonCursor(
  state: Pick<V8State, "lessonCursors">,
  lesson: Pick<Lesson, "id" | "version">,
): LessonCursor | null {
  return (
    (state.lessonCursors ?? []).find(
      (cursor) => cursor.lessonId === lesson.id && cursor.lessonVersion === lesson.version,
    ) ?? null
  );
}

export function lessonAttempts(
  state: Pick<V8State, "lessonAttempts">,
  lesson: Pick<Lesson, "id" | "version">,
): LessonAttempt[] {
  return (state.lessonAttempts ?? []).filter(
    (item) => item.lessonId === lesson.id && item.lessonVersion === lesson.version,
  );
}

export function firstLessonSuccess(attempts: readonly LessonAttempt[]): LessonAttempt | undefined {
  return attempts.find((item) => item.kind === "first-check" && item.outcome === "successful");
}

export function transferSuccess(attempts: readonly LessonAttempt[]): LessonAttempt | undefined {
  return attempts.find((item) => item.kind === "transfer-check" && item.outcome === "successful");
}

export function lessonRecallDue(
  lesson: Pick<Lesson, "retrieval">,
  first: LessonAttempt | undefined,
  today = localDateAt(new Date()),
): boolean {
  return Boolean(first && calendarDaysBetween(first.localDate, today) >= lesson.retrieval.afterDays);
}

/** A later success counts only if it was unaided, at the recall tempo, on a later day. */
export function lessonLaterSuccess(
  lesson: Pick<Lesson, "retrieval">,
  attempts: readonly LessonAttempt[],
): LessonAttempt | undefined {
  const first = firstLessonSuccess(attempts);
  return attempts.find(
    (item) =>
      item.kind === "later-check" &&
      item.outcome === "successful" &&
      item.assistance === "none" &&
      item.tempo === lesson.retrieval.tempo &&
      lessonRecallDue(lesson, first, item.localDate),
  );
}

/**
 * An editable copy of a lesson score for Create. The sketch carries no
 * origin record (older app versions accept only pilot and Free Play origins),
 * so its source is written into its notes instead.
 */
export function sketchFromScore(lesson: Lesson, score: Score, tempo: number, index: number): Sketch {
  const sketch = newSketch(index, { key: score.key.tonic, mode: score.key.mode });
  sketch.name = lesson.title;
  sketch.intention = lesson.performance.instruction;
  sketch.tempo = tempo;
  sketch.metre = score.metre === "3/4" || score.metre === "6/8" ? score.metre : "4/4";
  sketch.sections = score.sections.map((section) => section.label);
  sketch.chords = score.events.flatMap((event) => {
    if (event.kind !== "strum" || !event.chord || event.art?.tie || event.art?.dead) return [];
    const voicing = score.voicings.find((item) => item.id === event.chord);
    if (!voicing) return [];
    return [
      {
        id: newId("chord"),
        symbol: voicing.symbol,
        beats: event.dur / 48,
        // Sketch voicings run from the high E (index 0) to the low E (index 5).
        voicing: [...voicing.frets].reverse(),
      },
    ];
  });
  sketch.melody = score.events.flatMap((event) =>
    event.kind === "note" && !event.art?.tie
      ? event.notes.map((note) => ({
          id: newId("melody"),
          string: note.string - 1,
          fret: note.fret,
          beat: event.at / 48,
          duration: event.dur / 48,
        }))
      : [],
  );
  sketch.rhythmPattern = score.sections.map((section) => section.label).join(" | ");
  sketch.notes = `Started from the draft lesson “${lesson.title}” (${score.title}, score ${score.id} version ${score.version}). The lesson stays as it is in Learn; this is your copy to change.`;
  return sketch;
}

/** Whether a making check's sketch now holds something of the learner's own, by what the lesson asks for. */
export function madeSomething(sketch: Sketch, making: MakingCheck): boolean {
  const chords = sketch.chords.length > 0;
  const changed = sketch.revisions.length > 0;
  return making.adds === "chords" ? chords : making.adds === "melody" ? changed : chords || changed;
}

/** What the learner has made so far, in words: "3 chords", "1 change". */
export function madeSummary(sketch: Sketch, making: MakingCheck): string {
  const count = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;
  const chords = count(sketch.chords.length, "chord");
  const changes = count(sketch.revisions.length, "change");
  return making.adds === "chords" ? chords : making.adds === "melody" ? changes : `${chords} and ${changes}`;
}

/** What to do when the version holds nothing of the learner's yet. */
export const NOTHING_YET: Readonly<Record<MakingCheck["adds"], string>> = {
  chords: "Add your chords in Create, then come back.",
  melody: "Change the melody in Create, then come back.",
  any: "Add or change something in Create, then come back.",
};
