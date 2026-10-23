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
    id: "lesson-unit-06-common-tone",
    version: 1,
    unitId: "unit-06",
    stage: 1,
    activityKind: "rhythm",
    title: "Keep what stays: C to Am",
  },
  {
    id: "lesson-unit-10-third-colour",
    version: 1,
    unitId: "unit-10",
    stage: 2,
    activityKind: "technique",
    title: "One fret changes the third",
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
