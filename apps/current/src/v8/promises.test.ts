import { describe, expect, it } from "vitest";
import { buildSession, completedActivityIdsFromEvidence, createEvidence, liveObservations, masteryFor, retractObservations } from "./learning";
import { newSketch } from "./repository";
import { DEFAULT_STATE } from "./store";
import { MODE_OPTIONS, TONAL_ROOTS } from "./validation";
import { validateEvidence } from "./validation";
import type { CompetencyEvidence, V8State } from "./types";

const state = (overrides: Partial<V8State> = {}): V8State => ({ ...DEFAULT_STATE, ...overrides });
const withMinutes = (dailyMinutes: number) => state({ settings: { ...DEFAULT_STATE.settings, dailyMinutes } });

describe("a session is the length the learner chose (B01)", () => {
  it("adds up to exactly the chosen budget, at every setting the control offers", () => {
    /*
     * The planner used to produce the same 25 minutes whatever was set, while
     * Learn displayed the chosen figure as though it applied.
     */
    for (let minutes = 10; minutes <= 90; minutes += 5) {
      const session = buildSession(withMinutes(minutes));
      const summed = session.items.reduce((total, item) => total + item.minutes, 0);
      expect(summed).toBe(minutes);
      expect(session.totalMinutes).toBe(minutes);
    }
  });

  it("gives a short session fewer parts rather than unusable slivers", () => {
    const short = buildSession(withMinutes(10));
    const long = buildSession(withMinutes(90));
    expect(short.items.length).toBeLessThan(long.items.length);
    // Padding a ten-minute session out to five items would be the same
    // overstatement in a different shape.
    expect(short.items.every((item) => item.minutes >= 3)).toBe(true);
  });

  it("never repeats one activity to fill two parts of the same session", () => {
    for (const minutes of [10, 25, 45, 90]) {
      const ids = buildSession(withMinutes(minutes)).items.map((item) => item.activityId);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });

  it("stays within the range the settings control allows, whatever is stored", () => {
    expect(buildSession(withMinutes(2)).totalMinutes).toBe(10);
    expect(buildSession(withMinutes(500)).totalMinutes).toBe(90);
  });
});

describe("a new sketch starts in the music the learner is in (B10)", () => {
  it("inherits the current root and mode instead of assuming C major", () => {
    const sketch = newSketch(0, { key: "E", mode: "minor" });
    expect(sketch.key).toBe("E");
    expect(sketch.mode).toBe("minor");
  });

  it("still has a sensible default when no context is given", () => {
    expect(newSketch(0).key).toBe("C");
    expect(newSketch(0).mode).toBe("major");
  });

  it("offers roots and modes the validator and the rest of the app agree on", () => {
    // Create previously offered seven roots and Settings twelve, so a key chosen
    // in one place could not be chosen in the other.
    for (const root of TONAL_ROOTS) expect(() => newSketch(0, { key: root, mode: "major" })).not.toThrow();
    expect(TONAL_ROOTS).toHaveLength(12);
    expect(MODE_OPTIONS.map(([id]) => id)).toEqual(["major", "minor", "dorian", "mixolydian", "blues"]);
  });
});

describe("an observation says how it was established (B07)", () => {
  const observed = (outcome: CompetencyEvidence["outcome"] = "successful", artifactId?: string) =>
    createEvidence("activity-1", ["ear:u1"], "creation", "none", outcome, {}, "2026-09-14T09:00:00.000Z", artifactId);

  it("records every outcome as self-reported, because that is all the app can do", () => {
    expect(observed()[0].method).toBe("self-reported");
  });

  it("links a creative observation to the sketch that actually exists", () => {
    const [record] = observed("successful", "sketch-abc");
    expect(record.artifactId).toBe("sketch-abc");
    // A pointer to saved work, never a judgement of it: nothing here scores it.
    expect(Object.keys(record)).not.toContain("quality");
  });

  it("accepts a record written before the field existed", () => {
    const [record] = observed();
    const legacy = { ...record };
    delete legacy.method;
    expect(() => validateEvidence(legacy)).not.toThrow();
  });

  it("rejects a claim to have measured anything", () => {
    const [record] = observed();
    expect(() => validateEvidence({ ...record, method: "measured" })).toThrow(/method/);
  });
});

describe("observations are immutable, and corrected by retraction (B29)", () => {
  const at = "2026-09-14T09:00:00.000Z";
  const success = () => createEvidence("activity-1", ["ear:u1"], "production", "none", "successful", {}, at);

  it("stops a retracted success from completing its activity", () => {
    const recorded = success();
    expect(completedActivityIdsFromEvidence(recorded)).toEqual(["activity-1"]);

    const corrected = [...recorded, ...retractObservations(recorded)];
    expect(completedActivityIdsFromEvidence(corrected)).toEqual([]);
  });

  it("keeps the original record rather than rewriting history", () => {
    const recorded = success();
    const corrected = [...recorded, ...retractObservations(recorded)];
    // The point of a retraction is that both halves survive and can be read.
    expect(corrected).toHaveLength(2);
    expect(corrected[0].id).toBe(recorded[0].id);
    expect(corrected[1].retracts).toBe(recorded[0].id);
    expect(liveObservations(corrected)).toEqual([]);
  });

  it("does not let a retraction count as an observation of its own", () => {
    const recorded = createEvidence("activity-1", ["ear:u1"], "production", "none", "successful", {}, at);
    const corrected = [...recorded, ...retractObservations(recorded)];
    expect(masteryFor("ear:u1", corrected).state).toBe("introduced");
    expect(masteryFor("ear:u1", recorded).state).toBe("practising");
  });

  it("leaves every other observation standing", () => {
    const first = createEvidence("activity-1", ["ear:u1"], "production", "none", "successful", {}, at);
    const second = createEvidence("activity-2", ["ear:u2"], "production", "none", "successful", {}, at);
    const corrected = [...first, ...second, ...retractObservations(first)];
    expect(completedActivityIdsFromEvidence(corrected)).toEqual(["activity-2"]);
  });

  it("gives a retraction its own identity and passes validation", () => {
    const recorded = success();
    const [retraction] = retractObservations(recorded);
    expect(retraction.id).not.toBe(recorded[0].id);
    expect(() => validateEvidence(retraction)).not.toThrow();
  });
});
