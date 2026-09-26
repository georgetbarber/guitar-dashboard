import { describe, expect, it } from "vitest";
import { createEvidence } from "./learning";
import { ONE_NOTE_QUESTION_ANSWER, PILOT_EPISODE } from "./pilotEpisode";
import { firstPilotSuccess, isLaterCheckDue, pilotAttempts, pilotLaterSuccess } from "./pilotProgress";
import { DEFAULT_STATE } from "./store";
import type { PilotAttempt } from "./types";

const dayOne = new Date(2026, 8, 26, 20, 0);
const later = new Date(2026, 8, 27, 9, 0);
const first: PilotAttempt = {
  id: "attempt-first",
  cursorId: "cursor-1",
  episodeId: PILOT_EPISODE.id,
  episodeVersion: PILOT_EPISODE.version,
  materialId: ONE_NOTE_QUESTION_ANSWER.id,
  materialVersion: ONE_NOTE_QUESTION_ANSWER.version,
  kind: "first-check",
  assistance: "hint",
  method: "self-reported",
  tempo: 60,
  outcome: "successful",
  observation: "The rests landed after I counted aloud.",
  occurredAt: dayOne.toISOString(),
};

describe("pilot evidence stays separate from legacy progress", () => {
  it("does not turn an old broad activity completion into exact pilot success", () => {
    const old = createEvidence("unit-01-rhythm", ["rhythm:unit-01"], "performance", "none", "successful", {});
    const legacy = { ...DEFAULT_STATE, evidence: old, completedActivityIds: ["unit-01-rhythm"] };
    expect(pilotAttempts(legacy)).toEqual([]);
    expect(firstPilotSuccess([])).toBeUndefined();
  });

  it("waits for a different local calendar day, then requires an unaided later success", () => {
    expect(isLaterCheckDue(first, dayOne)).toBe(false);
    expect(isLaterCheckDue(first, later)).toBe(true);
    const assisted: PilotAttempt = {
      ...first,
      id: "assisted-later",
      kind: "later-check",
      occurredAt: later.toISOString(),
    };
    const independent: PilotAttempt = { ...assisted, id: "independent-later", assistance: "none", tempo: 72 };
    expect(pilotLaterSuccess([first, assisted])).toBeUndefined();
    expect(pilotLaterSuccess([first, assisted, independent])?.id).toBe("independent-later");
    expect(pilotLaterSuccess([first, { ...independent, occurredAt: dayOne.toISOString() }])).toBeUndefined();
    expect(pilotLaterSuccess([first, { ...independent, tempo: 50 }])).toBeUndefined();
  });

  it("does not reinterpret attempts against an older material version as current", () => {
    expect(pilotAttempts({ ...DEFAULT_STATE, pilotAttempts: [{ ...first, materialVersion: 2 }, first] })).toEqual([
      first,
    ]);
  });
});
