import { describe, expect, it } from "vitest";
import { SKETCH_LIMITS, PROFILE_LIMITS } from "./limits";
import { newSketch } from "./repository";
import { DEFAULT_STATE } from "./store";
import { cloudProfile, commitIsolating, describeWithheld, isTransientCloudFailure, screenEvidence, screenProfile, screenSketch } from "./sync";
import type { PendingWrite, Withheld } from "./sync";
import { createEvidence } from "./learning";
import type { CompetencyEvidence, V8State } from "./types";

/** A Firestore-shaped rejection: what matters is the `code`, which decides retry or isolate. */
function cloudError(code: string, message = "the cloud refused this") {
  return Object.assign(new Error(message), { code });
}

describe("a document the cloud will not accept is withheld, not sent (B09)", () => {
  it("passes a sketch that is within every bound", () => {
    expect(screenSketch(newSketch(0)).withheld).toBeNull();
  });

  it("withholds an over-limit sketch with a reason the learner can act on", () => {
    const oversized = { ...newSketch(0), chords: new Array(SKETCH_LIMITS.chords + 1).fill({ id: "c", symbol: "C", beats: 4, voicing: [] }) };
    const { withheld } = screenSketch(oversized);
    expect(withheld?.kind).toBe("sketch");
    expect(withheld?.reason).toContain("chords");
  });

  it("withholds a structurally invalid sketch that no bound would catch", () => {
    const broken = { ...newSketch(0), metre: "7/8" } as unknown as ReturnType<typeof newSketch>;
    expect(screenSketch(broken).withheld?.reason).toContain("metre");
  });

  it("keeps device recordings out of the document it screens", () => {
    const withTake = {
      ...newSketch(0),
      takes: [{ id: "take-1", name: "Take 1", createdAt: "2026-01-01T00:00:00.000Z", blobId: "take-1", note: "" }]
    };
    // A private device recording has no place in a cloud document, screened or not.
    expect(screenSketch(withTake).document.takes).toEqual([]);
  });

  it("withholds an invalid observation", () => {
    const [good] = createEvidence("activity-1", ["ear:u1"], "production", "none", "successful", {}, "2026-09-14T09:00:00.000Z");
    expect(screenEvidence(good)).toBeNull();
    const bad = { ...good, assistance: "telepathy" } as unknown as CompetencyEvidence;
    expect(screenEvidence(bad)?.reason).toContain("assistance");
  });

  it("withholds a profile whose reflection outgrew the cloud", () => {
    const state: V8State = { ...DEFAULT_STATE, lastReflection: "r".repeat(PROFILE_LIMITS.lastReflection + 1) };
    expect(screenProfile(state, cloudProfile(state))?.reason).toContain("reflection");
  });

  it("withholds rather than prunes an over-full deletion record", () => {
    /*
     * Dropping a deletion record to make the profile fit lets a device that has
     * been offline since before the deletion resurrect the deleted sketch on its
     * next sync. A profile that will not upload and says so is the better
     * failure, so the record is reported and left whole.
     */
    const deletedSketchIds = Object.fromEntries(
      Array.from({ length: PROFILE_LIMITS.deletedSketchIds + 1 }, (_, index) => [`sketch-${index}`, "2026-01-01T00:00:00.000Z"])
    );
    const state: V8State = { ...DEFAULT_STATE, deletedSketchIds };
    expect(screenProfile(state, cloudProfile(state))?.reason).toContain("deletion records");
    expect(Object.keys(state.deletedSketchIds)).toHaveLength(PROFILE_LIMITS.deletedSketchIds + 1);
  });
});

describe("one refused document does not end the account's sync", () => {
  const write = (id: string, log: string[], fails?: Error): PendingWrite<{ commit: () => Promise<void> }> => ({
    kind: "sketch",
    id,
    apply: () => undefined,
    alone: async () => { if (fails) throw fails; log.push(id); }
  });

  it("isolates the offender and lets every other write through", async () => {
    const log: string[] = [];
    const withheld: Withheld[] = [];
    const writes = [
      write("sketch-a", log),
      write("sketch-b", log, cloudError("invalid-argument", "tempo is out of range")),
      write("sketch-c", log)
    ];
    await commitIsolating(writes, () => ({ commit: () => Promise.reject(cloudError("invalid-argument")) }), withheld);
    // Before this, the atomic batch took a and c down with b, and the identical
    // batch was rebuilt and refused again on every later change.
    expect(log).toEqual(["sketch-a", "sketch-c"]);
    expect(withheld).toEqual([{ kind: "sketch", id: "sketch-b", reason: "tempo is out of range" }]);
  });

  it("retries a transient failure as a batch instead of splitting it up", async () => {
    const log: string[] = [];
    const withheld: Withheld[] = [];
    const writes = [write("sketch-a", log), write("sketch-b", log)];
    await expect(
      commitIsolating(writes, () => ({ commit: () => Promise.reject(cloudError("unavailable")) }), withheld)
    ).rejects.toMatchObject({ code: "unavailable" });
    expect(log).toEqual([]);
    expect(withheld).toEqual([]);
  });

  it("writes nothing individually when the batch succeeds", async () => {
    const log: string[] = [];
    const withheld: Withheld[] = [];
    await commitIsolating([write("sketch-a", log)], () => ({ commit: () => Promise.resolve() }), withheld);
    expect(log).toEqual([]);
    expect(withheld).toEqual([]);
  });

  it("separates the codes worth retrying from the ones that will always fail", () => {
    for (const code of ["unavailable", "deadline-exceeded", "resource-exhausted", "aborted", "internal", "cancelled"]) {
      expect(isTransientCloudFailure(cloudError(code))).toBe(true);
    }
    for (const code of ["invalid-argument", "permission-denied", "failed-precondition", "unauthenticated"]) {
      expect(isTransientCloudFailure(cloudError(code))).toBe(false);
    }
    expect(isTransientCloudFailure(new Error("no code at all"))).toBe(false);
  });

  it("tells the learner what stayed behind and that the rest went through", () => {
    const message = describeWithheld([{ kind: "sketch", id: "s1", reason: "chords has 513 entries, over the limit of 512" }]);
    expect(message).toContain("1 sketch");
    expect(message).toContain("stayed on this device");
    expect(message).toContain("Everything else is up to date");
    expect(describeWithheld([])).toBe("");
  });
});
