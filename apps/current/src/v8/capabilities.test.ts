import { describe, expect, it } from "vitest";
import { PILOT_CAPABILITIES, pilotCapabilitySnapshots } from "./capabilities";
import { createEvidence, masteryFor, recommendPractice, repairFor, retractObservations } from "./learning";
import { daysSinceLastAttempt } from "./learning";
import { isLaterCheckDue, pilotLaterSuccess } from "./pilotProgress";
import { CURRICULUM } from "./curriculum";
import { DEFAULT_STATE } from "./store";
import { ONE_NOTE_QUESTION_ANSWER, PILOT_EPISODE } from "./pilotEpisode";
import { validateEvidence } from "./validation";
import type { PilotAttempt } from "./types";

const report: PilotAttempt = {
  id: "attempt-1",
  cursorId: "cursor-1",
  episodeId: PILOT_EPISODE.id,
  episodeVersion: PILOT_EPISODE.version,
  materialId: ONE_NOTE_QUESTION_ANSWER.id,
  materialVersion: ONE_NOTE_QUESTION_ANSWER.version,
  kind: "first-check",
  assistance: "none",
  method: "self-reported",
  tempo: 60,
  outcome: "successful",
  observation: "I kept the rest after the first note.",
  occurredAt: "2026-09-27T10:00:00.000Z",
};

describe("Phase 5 evidence boundaries", () => {
  it("catalogues listening, naming, locating, timing and playing separately", () => {
    expect(new Set(PILOT_CAPABILITIES.map((item) => item.action))).toEqual(
      new Set(["listening", "naming", "locating", "timing", "playing"]),
    );
    const snapshots = pilotCapabilitySnapshots({ pilotAttempts: [report] });
    expect(
      snapshots.filter((item) => item.status === "whole-phrase-report").map((item) => item.capability.action),
    ).toEqual(["timing", "playing", "playing"]);
    expect(snapshots.filter((item) => item.status === "not-checked").map((item) => item.capability.action)).toEqual([
      "listening",
      "naming",
      "locating",
    ]);
  });

  it("does not carry a previous material version's report into the new lesson", () => {
    const snapshots = pilotCapabilitySnapshots({
      pilotAttempts: [{ ...report, materialVersion: report.materialVersion + 1 }],
    });
    expect(snapshots.every((item) => item.status === "not-checked")).toBe(true);
  });

  it("a correction stops influencing practice, and a difficult task gets a changed support step", () => {
    const activity = CURRICULUM[0].activities.find((item) => item.kind === "technique")!;
    const retry = createEvidence(
      activity.id,
      activity.competencyIds,
      activity.source,
      "none",
      "retry",
      {},
      "2026-09-27T10:00:00.000Z",
    );
    expect(repairFor(activity, retry)).toContain("one clean attack");
    const corrected = [...retry, ...retractObservations(retry)];
    expect(repairFor(activity, corrected)).toBeNull();
    expect(masteryFor(activity.competencyIds[0], corrected).state).toBe("introduced");
    expect(recommendPractice([activity], { ...DEFAULT_STATE, evidence: corrected })).toBe(activity);
  });

  it("retains the experienced calendar date across timezone changes", () => {
    const [observation] = createEvidence(
      "a",
      ["rhythm:unit-01"],
      "performance",
      "none",
      "successful",
      {},
      "2026-09-27T23:30:00.000Z",
    );
    const learner = { ...DEFAULT_STATE, evidence: [{ ...observation, localDate: "2026-09-28" }] };
    expect(daysSinceLastAttempt(learner, new Date("2026-09-29T12:00:00.000Z"))).toBe(1);
    const first = { ...report, occurredAt: "2026-09-27T23:30:00.000Z", localDate: "2026-09-28" };
    expect(isLaterCheckDue(first, new Date("2026-09-28T12:00:00.000Z"), "2026-09-28")).toBe(false);
    const later = {
      ...first,
      id: "later",
      kind: "later-check" as const,
      localDate: "2026-09-29",
      occurredAt: "2026-09-28T23:30:00.000Z",
      tempo: PILOT_EPISODE.delayedCheck.tempo,
    };
    expect(pilotLaterSuccess([first, later])).toEqual(later);
  });

  it("accepts legacy observations without a local date but rejects an impossible new date", () => {
    const [observation] = createEvidence("a", ["rhythm:unit-01"], "performance", "none", "successful", {});
    const legacy = { ...observation };
    delete legacy.localDate;
    expect(() => validateEvidence(legacy)).not.toThrow();
    expect(() => validateEvidence(observation)).not.toThrow();
    expect(() => validateEvidence({ ...observation, localDate: "2026-02-31" })).toThrow();
  });
});
