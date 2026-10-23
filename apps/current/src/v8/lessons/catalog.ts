/**
 * WHICH ACTIVITIES HAVE AN AUTHORED LESSON, KNOWN BEFORE ANY CONTENT LOADS.
 *
 * The catalogue is tiny and ships in the app shell. Each stage's lessons, and
 * the music engine they use, load only when a learner opens one (or makes the
 * stage ready offline), so the course can grow without growing startup or
 * the automatic offline download. A test keeps this list identical to the
 * content it describes.
 */
import type { Lesson, LessonEntry } from "./format";

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

/** One import per stage. Vite emits each as its own lesson chunk (vite.config.ts). */
export const STAGE_LOADERS: Readonly<Record<number, () => Promise<{ LESSONS: readonly Lesson[] }>>> = {
  1: () => import("./stage1"),
  2: () => import("./stage2"),
};

export function lessonForActivity(activityId: string): LessonEntry | null {
  return LESSON_CATALOG.find((entry) => `${entry.unitId}-${entry.activityKind}` === activityId) ?? null;
}

export function lessonsForUnit(unitId: string): LessonEntry[] {
  return LESSON_CATALOG.filter((entry) => entry.unitId === unitId);
}

export function stagesWithLessons(): number[] {
  return [...new Set(LESSON_CATALOG.map((entry) => entry.stage))].sort((a, b) => a - b);
}

export class LessonUnavailableError extends Error {
  constructor(
    message: string,
    readonly offline: boolean,
  ) {
    super(message);
  }
}

/** Load one lesson's stage. A failed fetch while offline, or after an update replaced the files, says so plainly. */
export async function loadLesson(entry: LessonEntry): Promise<Lesson> {
  const loader = STAGE_LOADERS[entry.stage];
  if (!loader) throw new LessonUnavailableError(`Stage ${entry.stage} has no lesson content.`, false);
  let module: { LESSONS: readonly Lesson[] };
  try {
    module = await loader();
  } catch {
    const offline = typeof navigator !== "undefined" && navigator.onLine === false;
    throw new LessonUnavailableError(
      offline
        ? "This lesson isn't saved on this device yet. Reconnect once to open it, or make this stage ready offline next time you're connected."
        : "This lesson couldn't load. If Interval has an update waiting, apply it and try again.",
      offline,
    );
  }
  const lesson = module.LESSONS.find((item) => item.id === entry.id && item.version === entry.version);
  if (!lesson)
    throw new LessonUnavailableError(
      `Lesson ${entry.id} version ${entry.version} is missing from stage ${entry.stage}.`,
      false,
    );
  return lesson;
}
