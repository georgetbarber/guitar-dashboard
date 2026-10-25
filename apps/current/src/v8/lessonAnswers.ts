/**
 * ANSWERS TO LESSON LISTENING QUESTIONS, CHECKED WITHOUT LOADING A LESSON.
 *
 * A listening check (lesson `checkKind: "listening"`) records each answer as
 * exact-answer evidence named `lesson:<lesson id>:<question id>`. The answer
 * keys travel in the shell's lesson catalogue, so validation can tell a
 * genuine answer from a forged one on any device, as it does for concept
 * checks (conceptChecks.ts). Answers to questions this build does not know
 * are left to the build that wrote them (decision A19).
 */
import { activityById } from "./curriculum";
import { LESSON_CATALOG } from "./lessons/catalog";
import type { LessonAnswerKey, LessonEntry } from "./lessons/format";
import type { CompetencyEvidence } from "./types";

export function lessonAnswerKey(checkId: string): { entry: LessonEntry; key: LessonAnswerKey } | undefined {
  const match = /^lesson:([^:]+):([^:]+)$/.exec(checkId);
  if (!match) return undefined;
  const entry = LESSON_CATALOG.find((item) => item.id === match[1]);
  const key = entry?.answers?.find((item) => item.questionId === match[2]);
  return entry && key ? { entry, key } : undefined;
}

/** Whether a recorded answer is exactly what this build's answer key says it should be. */
export function lessonAnswerIsValid(item: CompetencyEvidence): boolean {
  if (item.method !== "exact-answer" || !item.checkId || !item.response) return false;
  const known = lessonAnswerKey(item.checkId);
  if (!known || item.contentVersion !== known.key.version) return false;
  const { entry, key } = known;
  const activity = activityById(`${entry.unitId}-${entry.activityKind}`);
  return (
    Boolean(activity) &&
    item.activityId === activity!.id &&
    activity!.competencyIds.includes(item.competencyId) &&
    item.source === "recognition" &&
    (item.assistance === "none" || item.assistance === "hint") &&
    item.context.key === key.key &&
    item.context.mode === key.mode &&
    key.choices.includes(item.response) &&
    item.outcome === (item.response === key.answer ? "successful" : "retry")
  );
}
