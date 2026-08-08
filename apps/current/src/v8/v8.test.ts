import { describe, expect, it } from "vitest";
import { buildChords, createContext } from "../core/music/theory";
import { generateShapes } from "../core/instrument/guitar";
import { assessFingering } from "../core/instrument/fingering";
import { analyzeChromaticPitch } from "../core/music/chromatic";
import { transformMotif } from "../core/music/motif";
import { transformRhythm, validateRhythm } from "../core/music/rhythm";
import { CURRICULUM, validateCurriculum } from "./curriculum";
import { DEFAULT_STATE } from "./store";
import { buildSession, completedActivityIdsFromEvidence, createEvidence, masteryFor, recommendPractice, recommendedPracticeStrand } from "./learning";
import { availableFreePlayModes, buildFreePlaySequence, freePlayAbilityLevel } from "./freePlay";
import { cloudProfile, cloudSketch, mergeCloudSnapshot } from "./sync";

describe("V8 musical-freedom foundations", () => {
  it("ships forty-eight validated core units with the complete activity contract", () => {
    expect(CURRICULUM).toHaveLength(48);
    expect(validateCurriculum()).toEqual([]);
    expect(CURRICULUM.every((unit) => unit.activities.some((activity) => activity.kind === "creative"))).toBe(true);
  });

  it("builds a balanced twenty-five-minute session", () => {
    const session = buildSession(DEFAULT_STATE, new Date("2026-07-13T09:00:00Z"));
    expect(session.totalMinutes).toBe(25);
    expect(session.items).toHaveLength(5);
    expect(session.items.some((item) => ["creative", "reflection"].includes(item.kind))).toBe(true);
  });

  it("builds varied free-play flows only from relationships available at the learner's level", () => {
    expect(freePlayAbilityLevel(DEFAULT_STATE)).toBe(1);
    expect(availableFreePlayModes(DEFAULT_STATE)).toEqual(["groove", "riff"]);
    const firstFlow = buildFreePlaySequence(DEFAULT_STATE, "mix", 1);
    expect(firstFlow).toHaveLength(8);
    expect(new Set(firstFlow.map((prompt) => prompt.mode))).toEqual(new Set(["groove", "riff"]));
    expect(firstFlow.every((prompt) => prompt.displayTokens.length > 0 && prompt.physicalCue && prompt.variation)).toBe(true);

    const advanced = { ...DEFAULT_STATE, completedActivityIds: [CURRICULUM[18].activities[0].id] };
    expect(freePlayAbilityLevel(advanced)).toBe(19);
    expect(availableFreePlayModes(advanced)).toEqual(["groove", "riff", "degree", "chord"]);
  });

  it("uses the baseline only to choose the first recommended unit", () => {
    const state = { ...DEFAULT_STATE, settings: { ...DEFAULT_STATE.settings, startingBaseline: "secure" as const } };
    expect(buildSession(state, new Date("2026-07-13T09:00:00Z")).unitId).toBe("unit-07");
    expect(state.evidence).toEqual([]);
  });

  it("requires two independent days and transfer for transfer-ready mastery", () => {
    const context = { key: "C", mode: "major" as const, instrument: "electric" as const };
    const first = createEvidence("a", ["ear:u1"], "production", "none", "successful", context, "2026-07-10T10:00:00Z");
    const assisted = createEvidence("b", ["ear:u1"], "production", "hint", "successful", context, "2026-07-11T10:00:00Z");
    expect(masteryFor("ear:u1", [...first, ...assisted]).state).toBe("practising");
    const transfer = createEvidence("c", ["ear:u1"], "transfer", "none", "successful", { ...context, key: "D" }, "2026-07-12T10:00:00Z");
    expect(masteryFor("ear:u1", [...first, ...assisted, ...transfer]).state).toBe("transfer-ready");
  });

  it("records retry and partial evidence without treating the activity as complete", () => {
    const retry = createEvidence("activity-1", ["sound:u1"], "performance", "none", "retry", {}, "2026-07-10T10:00:00Z");
    const partial = createEvidence("activity-1", ["sound:u1"], "performance", "hint", "partial", {}, "2026-07-11T10:00:00Z");
    expect(completedActivityIdsFromEvidence([...retry, ...partial])).toEqual([]);

    const assistedSuccess = createEvidence("activity-1", ["sound:u1"], "performance", "hint", "successful", {}, "2026-07-12T10:00:00Z");
    expect(completedActivityIdsFromEvidence([...retry, ...partial, ...assistedSuccess])).toEqual(["activity-1"]);
  });

  it("repairs completion flags from the durable evidence history", () => {
    const retry = createEvidence("not-yet-complete", ["sound:u1"], "performance", "none", "retry", {});
    const merged = mergeCloudSnapshot({ ...DEFAULT_STATE, completedActivityIds: ["not-yet-complete"], evidence: retry }, {});
    expect(merged.completedActivityIds).toEqual([]);

    const success = createEvidence("complete", ["sound:u2"], "performance", "none", "successful", {});
    expect(mergeCloudSnapshot(DEFAULT_STATE, { evidence: success }).completedActivityIds).toEqual(["complete"]);
  });

  it("chooses a Strengthen focus and activity from the selected skill evidence", () => {
    const evidenceState = {
      ...DEFAULT_STATE,
      evidence: [
        ...createEvidence("sound-baseline", ["sound:unit-01"], "performance", "none", "successful", {}, "2026-07-09T10:00:00Z"),
        ...createEvidence("sound-1", ["sound:unit-02"], "performance", "none", "retry", {}, "2026-07-10T10:00:00Z"),
        ...createEvidence("sound-2", ["sound:unit-02"], "performance", "none", "partial", {}, "2026-07-11T10:00:00Z"),
        ...createEvidence("rhythm-1", ["rhythm:unit-01"], "performance", "none", "successful", {}, "2026-07-10T10:00:00Z")
      ]
    };
    expect(recommendedPracticeStrand(evidenceState)).toBe("sound");

    const unitOne = CURRICULUM[0].activities.find((activity) => activity.kind === "technique")!;
    const unitTwo = CURRICULUM[1].activities.find((activity) => activity.kind === "technique")!;
    expect(recommendPractice([unitOne, unitTwo], evidenceState, ["sound"])?.unitId).toBe("unit-02");
  });

  it("describes chromatic pitches as relationships rather than errors", () => {
    const analysis = analyzeChromaticPitch(createContext("C", "major"), 1, 2);
    expect(analysis.relationship).toBe("chromatic-approach");
    expect(analysis.explanation).toContain("does not mean wrong");
  });

  it("transforms motifs and rhythms without mutating the source", () => {
    const motif = [{ pitch: 0, onset: 0, duration: 1 }, { pitch: 4, onset: 1, duration: 1 }];
    expect(transformMotif(motif, "invert").map((note) => note.pitch)).toEqual([0, 8]);
    const rhythm = { metre: "4/4" as const, subdivision: 2 as const, bars: 1, events: [{ beat: 0, duration: .5 }] };
    expect(validateRhythm(rhythm)).toEqual([]);
    expect(transformRhythm(rhythm, "rotate").events[0].beat).toBe(.5);
    expect(rhythm.events[0].beat).toBe(0);
  });

  it("labels generated shapes playable only after fingering assessment", () => {
    const chord = buildChords(createContext("C", "major"))[0];
    const shape = generateShapes(chord)[0];
    const assessment = assessFingering(shape);
    expect(assessment.assignments.length).toBeGreaterThan(0);
    expect(["high", "medium", "low"]).toContain(assessment.confidence);
  });

  it("merges append-only evidence and keeps the newest sketch without losing device recordings", () => {
    const local = {
      ...DEFAULT_STATE,
      updatedAt: "2026-07-13T10:00:00.000Z",
      evidence: createEvidence("local", ["ear:u1"], "production", "none", "successful", {}, "2026-07-13T09:00:00.000Z"),
      sketches: [{
        id: "sketch-1", name: "Local", intention: "", tags: [], tempo: 70, metre: "4/4" as const,
        key: "C", mode: "major" as const, chords: [], melody: [], rhythmPattern: "", bassMovement: "",
        sections: ["A"], notes: "old", ambiguityNotes: "", reflections: [], revisions: [], status: "capture" as const,
        takes: [{ id: "take-1", name: "Local take", createdAt: "2026-07-13T09:00:00.000Z", blobId: "blob-1", note: "" }],
        createdAt: "2026-07-13T08:00:00.000Z", updatedAt: "2026-07-13T09:00:00.000Z"
      }]
    };
    const remoteSketch = { ...local.sketches[0], name: "Remote revision", notes: "new", takes: [], updatedAt: "2026-07-13T11:00:00.000Z" };
    const remoteEvidence = createEvidence("remote", ["rhythm:u1"], "transfer", "none", "successful", {}, "2026-07-13T11:00:00.000Z");
    const merged = mergeCloudSnapshot(local, { sketches: [remoteSketch], evidence: remoteEvidence });
    expect(merged.evidence.map((item) => item.activityId)).toEqual(["local", "remote"]);
    expect(merged.sketches[0].name).toBe("Remote revision");
    expect(merged.sketches[0].takes).toHaveLength(1);
  });

  it("syncs only explicitly shared take metadata and never exposes a device blob id", () => {
    const sketch = { ...DEFAULT_STATE, sketches: [] };
    expect(cloudProfile(sketch).schemaVersion).toBe(1);
    const source = {
      id: "s", name: "Test", intention: "", tags: [], tempo: 70, metre: "4/4" as const, key: null, mode: null,
      chords: [], melody: [], rhythmPattern: "", bassMovement: "", sections: ["A"], notes: "", ambiguityNotes: "",
      takes: [
        { id: "private", name: "Private", createdAt: "now", blobId: "private", note: "" },
        { id: "shared", name: "Shared", createdAt: "now", blobId: "device-copy", note: "", cloud: { storagePath: "users/u/finished-takes/s/shared", contentType: "audio/webm", bytes: 42, uploadedAt: "now" } }
      ], revisions: [], reflections: [],
      status: "capture" as const, createdAt: "now", updatedAt: "now"
    };
    expect(cloudSketch(source).takes).toEqual([{ ...source.takes[1], blobId: undefined }]);
  });

  it("merges independently edited sketch fields instead of losing one device's change", () => {
    const base = {
      id: "field-merge", name: "Original", intention: "", tags: [], tempo: 70, metre: "4/4" as const,
      key: "C", mode: "major" as const, chords: [], melody: [], rhythmPattern: "", bassMovement: "",
      sections: ["A"], notes: "old", ambiguityNotes: "", reflections: [], revisions: [], takes: [],
      status: "capture" as const, createdAt: "2026-07-13T08:00:00.000Z", updatedAt: "2026-07-13T11:00:00.000Z"
    };
    const local = { ...base, name: "Laptop title", fieldUpdatedAt: { name: "2026-07-13T11:00:00.000Z", notes: "2026-07-13T09:00:00.000Z" } };
    const remote = { ...base, name: "Phone title", notes: "Phone arrangement note", updatedAt: "2026-07-13T12:00:00.000Z", fieldUpdatedAt: { name: "2026-07-13T10:00:00.000Z", notes: "2026-07-13T12:00:00.000Z" } };
    const merged = mergeCloudSnapshot({ ...DEFAULT_STATE, sketches: [local] }, { sketches: [remote] });
    expect(merged.sketches[0].name).toBe("Laptop title");
    expect(merged.sketches[0].notes).toBe("Phone arrangement note");
  });

  it("merges substantial append-only histories without dropping evidence", () => {
    const evidence = (prefix: string, count: number) => Array.from({ length: count }, (_, index) => ({
      id: `${prefix}-${index}`, competencyId: `rhythm:unit-${String(index % 48 + 1).padStart(2, "0")}`,
      source: "performance" as const, assistance: "none" as const, context: {}, outcome: "successful" as const,
      occurredAt: `2026-07-${String(index % 28 + 1).padStart(2, "0")}T10:00:00.000Z`, activityId: `${prefix}-activity-${index}`
    }));
    const merged = mergeCloudSnapshot({ ...DEFAULT_STATE, evidence: evidence("local", 750) }, { evidence: evidence("remote", 750) });
    expect(merged.evidence).toHaveLength(1500);
    expect(new Set(merged.evidence.map((item) => item.id)).size).toBe(1500);
  });

  it("uses deletion timestamps so an offline device cannot restore an old sketch", () => {
    const sketch = {
      id: "deleted", name: "Old idea", intention: "", tags: [], tempo: 70, metre: "4/4" as const, key: null, mode: null,
      chords: [], melody: [], rhythmPattern: "", bassMovement: "", sections: ["A"], notes: "", ambiguityNotes: "",
      takes: [], revisions: [], reflections: [], status: "capture" as const,
      createdAt: "2026-07-13T08:00:00.000Z", updatedAt: "2026-07-13T09:00:00.000Z"
    };
    const merged = mergeCloudSnapshot({ ...DEFAULT_STATE, deletedSketchIds: { deleted: "2026-07-13T10:00:00.000Z" } }, { sketches: [sketch] });
    expect(merged.sketches).toEqual([]);
  });
});
