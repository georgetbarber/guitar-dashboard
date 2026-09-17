import { describe, expect, it } from "vitest";
import {
  CLOUD_DOCUMENT_BUDGET_BYTES,
  PROFILE_LIMITS,
  SKETCH_LIMITS,
  admitSketchEdit,
  boundTempo,
  clampSketchTempo,
  describeExceedances,
  estimateDocumentBytes,
  profileExceedances,
  sketchExceedances
} from "./limits";
import { DEFAULT_STATE } from "./store";
import type { Sketch } from "./types";

/**
 * These bounds exist to stop one bad field failing an entire atomic batch and
 * ending a learner's cloud sync permanently. They must do that without deleting
 * the learner's work to achieve it.
 */
const sketch = (overrides: Partial<Sketch>) => ({
  id: "s1", name: "Sketch", intention: "", tempo: 120, metre: "4/4", key: null, mode: null,
  tags: [], chords: [], melody: [], rhythmPattern: "", bassMovement: "", sections: [],
  notes: "", ambiguityNotes: "", takes: [], revisions: [], reflections: [], status: "capture",
  createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z",
  ...overrides,
} as unknown as Sketch);

describe("boundTempo", () => {
  it("returns the fallback for a cleared field rather than 0", () => {
    // Number("") is 0, and firestore.rules requires >= 20.
    expect(boundTempo(Number(""))).toBe(SKETCH_LIMITS.tempoFallback);
    expect(boundTempo(Number.NaN)).toBe(SKETCH_LIMITS.tempoFallback);
    expect(boundTempo(0)).toBe(SKETCH_LIMITS.tempoFallback);
    expect(boundTempo(-40)).toBe(SKETCH_LIMITS.tempoFallback);
  });

  it("clamps to the range the rules accept", () => {
    expect(boundTempo(5)).toBe(SKETCH_LIMITS.tempoMin);
    expect(boundTempo(5000)).toBe(SKETCH_LIMITS.tempoMax);
    expect(boundTempo(120)).toBe(120);
  });

  it("rounds, because the rules accept a number but the field is beats per minute", () => {
    expect(boundTempo(120.6)).toBe(121);
  });

  it("is still the one value clamped rather than refused", () => {
    expect(clampSketchTempo(sketch({ tempo: 9000 })).tempo).toBe(SKETCH_LIMITS.tempoMax);
    const ordinary = sketch({ tempo: 96 });
    expect(clampSketchTempo(ordinary)).toBe(ordinary);
  });
});

describe("every bound in firestore.rules has a client-side counterpart (B09)", () => {
  it("finds an over-length text field", () => {
    const found = sketchExceedances(sketch({ notes: "x".repeat(SKETCH_LIMITS.notes + 1) }));
    expect(found).toHaveLength(1);
    expect(found[0]).toMatchObject({ field: "notes", limit: SKETCH_LIMITS.notes, unit: "characters" });
  });

  it("finds an over-long list, which the previous bounds ignored entirely", () => {
    /*
     * chords, melody, sections, tags, takes, revisions and reflections were all
     * unbounded on the client while the rules capped every one of them, so any
     * of them could end the account's sync with no warning.
     */
    for (const [field, limit] of [
      ["tags", SKETCH_LIMITS.tags], ["chords", SKETCH_LIMITS.chords], ["melody", SKETCH_LIMITS.melody],
      ["sections", SKETCH_LIMITS.sections], ["takes", SKETCH_LIMITS.takes],
      ["revisions", SKETCH_LIMITS.revisions], ["reflections", SKETCH_LIMITS.reflections]
    ] as const) {
      const found = sketchExceedances(sketch({ [field]: new Array(limit + 1).fill({}) } as Partial<Sketch>));
      expect(found.map((item) => item.field)).toContain(field);
    }
  });

  it("catches a sketch that passes every field check and still cannot be one cloud record", () => {
    /*
     * The per-field caps do not add up to a guarantee. Exactly 500 revisions is
     * within the rules' cap, and each snapshot is ordinary, yet the document
     * they form is past the 1 MiB Firestore refuses outright — before any rule
     * runs, so the rules tests would never catch it.
     */
    const heavy = sketch({
      revisions: Array.from({ length: SKETCH_LIMITS.revisions }, (_, index) => ({
        id: `revision-${index}`,
        createdAt: "2026-01-01T00:00:00.000Z",
        summary: "Kept the rhythm; changed the harmony",
        snapshot: { chords: [], melody: [], rhythmPattern: "1 & 2 & 3 & 4 &", sections: ["A"], notes: "x".repeat(2000) }
      }))
    });
    const found = sketchExceedances(heavy);
    expect(found.map((item) => item.field)).toEqual(["the whole sketch"]);
    expect(estimateDocumentBytes(heavy)).toBeGreaterThan(CLOUD_DOCUMENT_BUDGET_BYTES);
  });

  it("passes a sketch that is within every bound", () => {
    expect(sketchExceedances(sketch({ notes: "Keep the bass" }))).toEqual([]);
  });

  it("reports an over-long reflection and an over-full deletion record on the profile", () => {
    const state = {
      ...DEFAULT_STATE,
      lastReflection: "r".repeat(PROFILE_LIMITS.lastReflection + 1),
      deletedSketchIds: Object.fromEntries(
        Array.from({ length: PROFILE_LIMITS.deletedSketchIds + 1 }, (_, index) => [`sketch-${index}`, "2026-01-01T00:00:00.000Z"])
      )
    };
    expect(profileExceedances(state).map((item) => item.field)).toEqual(["lastReflection", "deletedSketchIds"]);
  });

  it("explains an exceedance in words rather than field names", () => {
    const text = describeExceedances(sketchExceedances(sketch({ chords: new Array(SKETCH_LIMITS.chords + 1).fill({}) })));
    expect(text).toContain("chords");
    expect(text).toContain(String(SKETCH_LIMITS.chords));
  });
});

describe("an edit that would newly exceed a bound is refused, not silently trimmed", () => {
  it("keeps the previous value and names what was refused", () => {
    const before = sketch({ notes: "Keep the bass" });
    const decision = admitSketchEdit(before, { ...before, notes: "x".repeat(SKETCH_LIMITS.notes + 1) });
    // The learner's existing notes survive; the oversized replacement does not land.
    expect(decision.admitted.notes).toBe("Keep the bass");
    expect(decision.refused.map((item) => item.field)).toEqual(["notes"]);
  });

  it("does not consume material that was already over the bound", () => {
    /*
     * Material can exceed a cap because it predates the cap or arrived from
     * another device. A bound introduced later must not eat it: the learner goes
     * on working locally, and only the upload declines, visibly.
     */
    const legacy = sketch({ notes: "x".repeat(SKETCH_LIMITS.notes + 500), name: "Old" });
    const decision = admitSketchEdit(legacy, { ...legacy, name: "Renamed" });
    expect(decision.admitted.notes).toHaveLength(SKETCH_LIMITS.notes + 500);
    expect(decision.admitted.name).toBe("Renamed");
    expect(decision.refused).toEqual([]);
  });

  it("still refuses to make already-oversized material larger", () => {
    const legacy = sketch({ notes: "x".repeat(SKETCH_LIMITS.notes + 500) });
    const decision = admitSketchEdit(legacy, { ...legacy, notes: "x".repeat(SKETCH_LIMITS.notes + 600) });
    expect(decision.admitted.notes).toHaveLength(SKETCH_LIMITS.notes + 500);
    expect(decision.refused.map((item) => item.field)).toEqual(["notes"]);
  });

  it("lets an ordinary edit through untouched", () => {
    const before = sketch({ notes: "Keep the bass" });
    const next = { ...before, notes: "Keep the bass, drop the third" };
    expect(admitSketchEdit(before, next).admitted.notes).toBe("Keep the bass, drop the third");
    expect(admitSketchEdit(before, next).refused).toEqual([]);
  });

  it("admits a brand new sketch without a previous version to compare against", () => {
    const fresh = sketch({ id: "s2" });
    expect(admitSketchEdit(undefined, fresh).refused).toEqual([]);
  });
});
