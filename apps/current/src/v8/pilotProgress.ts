import { ONE_NOTE_QUESTION_ANSWER, PILOT_EPISODE } from "./pilotEpisode";
import { calendarDaysBetween, localDateAt } from "./dates";
import { newId } from "./identity";
import type { PilotAttempt, PilotCursor, V8State } from "./types";

export function newPilotCursor(): PilotCursor {
  return {
    id: newId("episode-session"),
    episodeId: PILOT_EPISODE.id,
    episodeVersion: PILOT_EPISODE.version,
    materialId: ONE_NOTE_QUESTION_ANSWER.id,
    materialVersion: ONE_NOTE_QUESTION_ANSWER.version,
    step: "learn",
    sectionId: "whole",
    tempo: ONE_NOTE_QUESTION_ANSWER.tempo.default,
    assistance: "none",
    updatedAt: new Date().toISOString(),
  };
}

export function pilotAttempts(state: Pick<V8State, "pilotAttempts">): PilotAttempt[] {
  return (state.pilotAttempts ?? []).filter(
    (item) =>
      item.episodeId === PILOT_EPISODE.id &&
      item.episodeVersion === PILOT_EPISODE.version &&
      item.materialId === ONE_NOTE_QUESTION_ANSWER.id &&
      item.materialVersion === ONE_NOTE_QUESTION_ANSWER.version,
  );
}

export function firstPilotSuccess(attempts: readonly PilotAttempt[]): PilotAttempt | undefined {
  return attempts.find((item) => item.kind === "first-check" && item.outcome === "successful");
}

export function isLaterCheckDue(firstSuccess: PilotAttempt | undefined, now = new Date(), today = localDateAt(now)): boolean {
  return Boolean(
    firstSuccess &&
    calendarDaysBetween(firstSuccess.localDate ?? firstSuccess.occurredAt.slice(0, 10), today) >= PILOT_EPISODE.delayedCheck.earliestDaysLater,
  );
}

export function pilotLaterSuccess(attempts: readonly PilotAttempt[]): PilotAttempt | undefined {
  const first = firstPilotSuccess(attempts);
  return attempts.find(
    (item) =>
      item.kind === "later-check" &&
      item.outcome === "successful" &&
      item.assistance === "none" &&
      item.tempo === PILOT_EPISODE.delayedCheck.tempo &&
      isLaterCheckDue(first, new Date(item.occurredAt), item.localDate ?? item.occurredAt.slice(0, 10)),
  );
}
