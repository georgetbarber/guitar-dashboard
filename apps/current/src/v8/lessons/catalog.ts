/**
 * WHICH ACTIVITIES HAVE AN AUTHORED LESSON, KNOWN BEFORE ANY CONTENT LOADS.
 *
 * The catalogue is tiny and ships in the app shell. Each stage's lessons, and
 * the music engine they use, load only when a learner opens one (or makes the
 * stage ready offline), so the course can grow without growing startup or
 * the automatic offline download. A test keeps this list identical to the
 * content it describes. Loading lives in load.ts, which only the lazily
 * loaded lesson player imports.
 */
import type { LessonEntry } from "./format";

export const LESSON_CATALOG: readonly LessonEntry[] = [
  {
    id: "lesson-unit-02-endings",
    version: 1,
    unitId: "unit-02",
    stage: 1,
    activityKind: "technique",
    title: "Three ways to end a note",
  },
  {
    id: "lesson-unit-03-thumb-pulse",
    version: 1,
    unitId: "unit-03",
    stage: 1,
    activityKind: "rhythm",
    title: "A thumb that keeps time",
  },
  {
    id: "lesson-unit-04-constant-motion",
    version: 1,
    unitId: "unit-04",
    stage: 1,
    activityKind: "rhythm",
    title: "The hand that never stops",
  },
  {
    id: "lesson-unit-05-stabs",
    version: 1,
    unitId: "unit-05",
    stage: 1,
    activityKind: "rhythm",
    title: "Stabs and space",
  },
  {
    id: "lesson-unit-06-common-tone",
    version: 1,
    unitId: "unit-06",
    stage: 1,
    activityKind: "rhythm",
    title: "Keep what stays: C to Am",
  },
  {
    id: "lesson-unit-07-open-strings",
    version: 1,
    unitId: "unit-07",
    stage: 2,
    activityKind: "technique",
    title: "Six landmarks and a drone",
  },
  {
    id: "lesson-unit-08-octaves",
    version: 1,
    unitId: "unit-08",
    stage: 2,
    activityKind: "technique",
    title: "The same note, higher up",
  },
  {
    id: "lesson-unit-09-power-chords",
    version: 1,
    unitId: "unit-09",
    stage: 2,
    activityKind: "technique",
    title: "Root and fifth, anywhere",
  },
  {
    id: "lesson-unit-10-third-colour",
    version: 1,
    unitId: "unit-10",
    stage: 2,
    activityKind: "technique",
    title: "One fret changes the third",
  },
  {
    id: "lesson-unit-11-b-string",
    version: 1,
    unitId: "unit-11",
    stage: 2,
    activityKind: "technique",
    title: "The B string's one-fret shift",
  },
  {
    id: "lesson-unit-12-transpose",
    version: 1,
    unitId: "unit-12",
    stage: 2,
    activityKind: "technique",
    title: "Move the riff, keep the meaning",
  },
  {
    id: "lesson-unit-13-home",
    version: 1,
    unitId: "unit-13",
    stage: 3,
    activityKind: "technique",
    title: "Where home is",
  },
  {
    id: "lesson-unit-14-pentatonic",
    version: 1,
    unitId: "unit-14",
    stage: 3,
    activityKind: "technique",
    title: "Five notes around a root",
  },
  {
    id: "lesson-unit-15-motif",
    version: 1,
    unitId: "unit-15",
    stage: 3,
    activityKind: "technique",
    title: "One small idea, three ways",
  },
  {
    id: "lesson-unit-16-endings",
    version: 1,
    unitId: "unit-16",
    stage: 3,
    activityKind: "technique",
    title: "Two endings",
  },
  {
    id: "lesson-unit-17-call-answer",
    version: 1,
    unitId: "unit-17",
    stage: 3,
    activityKind: "technique",
    title: "Call and answer",
  },
  {
    id: "lesson-unit-18-by-ear",
    version: 1,
    unitId: "unit-18",
    stage: 3,
    activityKind: "technique",
    title: "Find it by ear",
  },
  {
    id: "lesson-unit-19-triads",
    version: 1,
    unitId: "unit-19",
    stage: 4,
    activityKind: "technique",
    title: "Three notes, three strings",
  },
  {
    id: "lesson-unit-20-inversions",
    version: 1,
    unitId: "unit-20",
    stage: 4,
    activityKind: "technique",
    title: "The same chord, three ways up",
  },
  {
    id: "lesson-unit-21-common-tones",
    version: 1,
    unitId: "unit-21",
    stage: 4,
    activityKind: "technique",
    title: "What stays when the chord changes",
  },
  {
    id: "lesson-unit-22-travis",
    version: 1,
    unitId: "unit-22",
    stage: 4,
    activityKind: "technique",
    title: "Thumb and fingers, two voices",
  },
  {
    id: "lesson-unit-23-sixths",
    version: 1,
    unitId: "unit-23",
    stage: 4,
    activityKind: "technique",
    title: "Sixths that land on the chord",
  },
  {
    id: "lesson-unit-24-harmonise",
    version: 1,
    unitId: "unit-24",
    stage: 4,
    activityKind: "creative",
    title: "Chords under a tune",
  },
];

export function lessonForActivity(activityId: string): LessonEntry | null {
  return LESSON_CATALOG.find((entry) => `${entry.unitId}-${entry.activityKind}` === activityId) ?? null;
}

export function lessonsForUnit(unitId: string): LessonEntry[] {
  return LESSON_CATALOG.filter((entry) => entry.unitId === unitId);
}

export function stagesWithLessons(): number[] {
  return [...new Set(LESSON_CATALOG.map((entry) => entry.stage))].sort((a, b) => a - b);
}
