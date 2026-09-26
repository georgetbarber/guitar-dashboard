import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it } from "vitest";
import {
  activateRestore,
  loadBlob,
  loadWorkspace,
  moveWorkspace,
  newSketch,
  prepareRestore,
  savePersistedState,
  setActiveWorkspace,
  workspaceExists,
  workspaceHasLearningData
} from "./repository";
import { DEFAULT_STATE } from "./store";
import { acceptEvidence, acceptProfile, acceptSketches, cloudProfile, describeRejected } from "./sync";
import { createEvidence } from "./learning";
import { ONE_NOTE_ANSWER_SHIFT, ONE_NOTE_QUESTION_ANSWER, PILOT_EPISODE } from "./pilotEpisode";
import type { V8State } from "./types";

async function resetDatabase() {
  await new Promise<void>((resolve, reject) => {
    const request = indexedDB.deleteDatabase("guitar-academy-v8");
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
    request.onblocked = () => reject(new Error("Test database deletion was blocked."));
  });
  setActiveWorkspace("anonymous");
}

const validState = (): V8State => ({ ...DEFAULT_STATE, sketches: [newSketch(0)], evidence: [] });

/** Writes a value straight into the state store, bypassing every check, the way a damaged or older client would have left it. */
async function writeRaw(value: unknown, workspaceId = "anonymous") {
  const database: IDBDatabase = await new Promise((resolve, reject) => {
    const request = indexedDB.open("guitar-academy-v8", 2);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains("state")) request.result.createObjectStore("state");
      if (!request.result.objectStoreNames.contains("blobs")) request.result.createObjectStore("blobs");
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  const transaction = database.transaction("state", "readwrite");
  transaction.objectStore("state").put(value, workspaceId);
  await new Promise<void>((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
  database.close();
}

describe("the stored workspace is validated before it is trusted (B08)", () => {
  beforeEach(resetDatabase);

  it("loads a workspace this build can read", async () => {
    await savePersistedState(validState(), "anonymous");
    const load = await loadWorkspace("anonymous");
    expect(load.status).toBe("ok");
    expect(load.status === "ok" && load.state.sketches).toHaveLength(1);
  });

  it("keeps an older workspace readable and round-trips a versioned pilot cursor", async () => {
    const older = validState();
    delete older.pilotCursor; delete older.pilotAttempts; delete older.pilotVariations;
    await savePersistedState(older, "anonymous");
    expect((await loadWorkspace("anonymous")).status).toBe("ok");
    const state: V8State = { ...older,
      pilotCursor: { id: "cursor-one", episodeId: PILOT_EPISODE.id, episodeVersion: 1,
        materialId: ONE_NOTE_QUESTION_ANSWER.id, materialVersion: 1, step: "try",
        sectionId: "whole", tempo: 60, assistance: "reveal", updatedAt: "2026-09-26T10:00:00.000Z" },
      pilotAttempts: [{ id: "attempt-one", cursorId: "cursor-one", episodeId: PILOT_EPISODE.id,
        episodeVersion: 1, materialId: ONE_NOTE_QUESTION_ANSWER.id, materialVersion: 1,
        kind: "first-check", assistance: "reveal", method: "self-reported", tempo: 60,
        outcome: "partial", observation: "I lost the pulse on the last rest.", occurredAt: "2026-09-26T10:01:00.000Z" }],
      pilotVariations: [{ id: "variation-one", sourceMaterialId: ONE_NOTE_QUESTION_ANSWER.id,
        sourceVersion: 1, materialId: ONE_NOTE_ANSWER_SHIFT.id, materialVersion: 1,
        answerMiddleCount: 3, createdAt: "2026-09-26T10:02:00.000Z" }]
    };
    await savePersistedState(state, "anonymous");
    const load = await loadWorkspace("anonymous");
    expect(load.status).toBe("ok");
    if (load.status === "ok") expect(load.state).toMatchObject({ pilotCursor: state.pilotCursor,
      pilotAttempts: state.pilotAttempts, pilotVariations: state.pilotVariations });
  });

  it("quarantines an invalid pilot attempt without erasing the stored bytes", async () => {
    await writeRaw({ ...validState(), pilotAttempts: [{ id: "bad", outcome: "measured" }] });
    expect((await loadWorkspace("anonymous")).status).toBe("unreadable");
  });

  it("reports an empty workspace as empty rather than unreadable", async () => {
    expect((await loadWorkspace("anonymous")).status).toBe("empty");
  });

  it("refuses stored bytes that do not describe a workspace, and keeps them", async () => {
    await writeRaw({ version: 8, syncVersion: 1, settings: "not an object" });
    const load = await loadWorkspace("anonymous");
    expect(load.status).toBe("unreadable");
    // The raw value travels out so the learner can still be handed it for recovery.
    expect(load.status === "unreadable" && load.raw).toMatchObject({ settings: "not an object" });
  });

  it("rejects a workspace whose music is malformed, not merely one with a bad header", async () => {
    const state = validState();
    await writeRaw({ ...state, sketches: [{ ...state.sketches[0], chords: [{ id: "chord-1", symbol: "C", beats: 4, voicing: [0, 1] }] }] });
    expect((await loadWorkspace("anonymous")).status).toBe("unreadable");
  });

  it("treats an unreadable workspace as present, so signing in cannot quietly replace it", async () => {
    await writeRaw({ version: 8, syncVersion: 1, nonsense: true });
    expect(await workspaceExists("anonymous")).toBe(true);
    expect(await workspaceHasLearningData("anonymous")).toBe(true);
  });

  it("will not move a workspace it cannot read into an account", async () => {
    await writeRaw({ version: 8, syncVersion: 1, nonsense: true });
    await expect(moveWorkspace("anonymous", "account:learner-a")).rejects.toThrow(/could not be read/);
    // The only copy must still be where it was.
    expect((await loadWorkspace("anonymous")).status).toBe("unreadable");
  });
});

describe("an imported archive is validated before anything is written (B08, B04)", () => {
  beforeEach(resetDatabase);

  const legacyArchive = (state: unknown) => new File(
    [JSON.stringify({
      format: "guitar-academy",
      version: 8,
      exportedAt: "2026-09-14T09:00:00.000Z",
      state,
      recordings: [{ id: "take-from-archive", type: "audio/webm", data: "data:audio/webm;base64,QUJD" }]
    })],
    "backup.guitar-academy"
  );

  it("imports a sound archive", async () => {
    const preview = await prepareRestore(legacyArchive(validState()), "anonymous");
    const restored = await activateRestore(preview.operationId);
    expect(restored.sketches).toHaveLength(1);
    expect(await loadBlob("take-from-archive")).not.toBeNull();
  });

  it("rejects a malformed archive without writing its recordings", async () => {
    const state = { ...validState(), evidence: [{ id: "evidence-1", competencyId: "ear:u1", source: "made-up-source" }] };
    await expect(prepareRestore(legacyArchive(state), "anonymous")).rejects.toThrow(/Invalid learning data/);
    /*
     * The ordering is the point. Recordings used to be written before the state
     * was checked, so a rejected import left blobs behind with nothing
     * referencing them and no way to find them again.
     */
    expect(await loadBlob("take-from-archive")).toBeNull();
    expect((await loadWorkspace("anonymous")).status).toBe("empty");
  });
});

describe("one unreadable cloud record does not cost the learner the rest (B08)", () => {
  it("keeps the valid sketches and sets the broken one aside", () => {
    const good = newSketch(0);
    const alsoGood = newSketch(1);
    const intake = acceptSketches([
      { id: good.id, data: good },
      { id: "sketch-broken", data: { ...good, id: "sketch-broken", tempo: 9000 } },
      { id: alsoGood.id, data: alsoGood }
    ]);
    expect(intake.accepted.map((sketch) => sketch.id)).toEqual([good.id, alsoGood.id]);
    expect(intake.rejected).toHaveLength(1);
    expect(intake.rejected[0].id).toBe("sketch-broken");
    expect(intake.rejected[0].reason).toContain("tempo");
  });

  it("keeps the valid observations and sets the broken one aside", () => {
    const [observation] = createEvidence("activity-1", ["ear:u1"], "production", "none", "successful", {}, "2026-09-14T09:00:00.000Z");
    const intake = acceptEvidence([
      { id: observation.id, data: observation },
      { id: "evidence-broken", data: { ...observation, id: "evidence-broken", outcome: "brilliant" } }
    ]);
    expect(intake.accepted).toHaveLength(1);
    expect(intake.rejected.map((item) => item.id)).toEqual(["evidence-broken"]);
  });

  it("sets aside an unreadable account profile without throwing", () => {
    expect(acceptProfile(cloudProfile(validState())).profile).not.toBeNull();
    expect(acceptProfile(null).profile).toBeNull();
    const broken = acceptProfile({ ...cloudProfile(validState()), schemaVersion: 99 });
    expect(broken.profile).toBeNull();
    expect(broken.reason).toContain("profile version");
  });

  it("counts what it set aside in words the learner can read", () => {
    expect(describeRejected(1)).toContain("One record");
    expect(describeRejected(3)).toContain("3 records");
    expect(describeRejected(3)).toContain("Everything else synchronised");
  });
});


describe("device restore decision validation", () => {
  beforeEach(resetDatabase);
  it("accepts old workspaces without a decision and keeps the marker out of cloud profiles", async () => {
    await savePersistedState(validState());
    expect((await loadWorkspace()).status).toBe("ok");
    expect(cloudProfile({ ...validState(), pendingRestoreId: "restore-local" })).not.toHaveProperty("pendingRestoreId");
  });
  it.each([null, "", 42, {}])("refuses an invalid decision marker: %s", async (pendingRestoreId) => {
    await writeRaw({ ...validState(), pendingRestoreId });
    expect((await loadWorkspace()).status).toBe("unreadable");
  });
});
