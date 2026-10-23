/**
 * LOADING A STAGE'S LESSONS.
 *
 * Imported only by the lazily loaded lesson player, so neither these loaders
 * nor the stage files they name are part of the app shell.
 */
import type { Lesson, LessonEntry } from "./format";

/** One import per stage. Vite emits each as its own lesson chunk (vite.config.ts). */
export const STAGE_LOADERS: Readonly<Record<number, () => Promise<{ LESSONS: readonly Lesson[] }>>> = {
  1: () => import("./stage1"),
  2: () => import("./stage2"),
};

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
