import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it } from "vitest";
import {
  activateRestore,
  cancelRestore,
  discardIncompleteStaging,
  exportArchive,
  loadBlob,
  loadWorkspace,
  newSketch,
  prepareRestore,
  saveBlob,
  savePersistedState,
  setActiveWorkspace
} from "./repository";
import { DEFAULT_STATE } from "./store";
import type { RecordedTake, Sketch, V8State } from "./types";

async function resetDatabase() {
  await new Promise<void>((resolve, reject) => {
    const request = indexedDB.deleteDatabase("guitar-academy-v8");
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
    request.onblocked = () => reject(new Error("Test database deletion was blocked."));
  });
  setActiveWorkspace("anonymous");
}

const take = (id: string): RecordedTake => ({ id, name: id, createdAt: "2026-01-01T00:00:00.000Z", blobId: id, note: "" });

function sketchWithTakes(index: number, takeIds: string[]): Sketch {
  return { ...newSketch(index), takes: takeIds.map(take) };
}

function stateWith(sketches: Sketch[], reflection: string): V8State {
  return { ...DEFAULT_STATE, sketches, lastReflection: reflection };
}

/** Build a real archive from whatever is currently in the active workspace. */
async function archiveOf(state: V8State): Promise<File> {
  return new File([await exportArchive(state)], "backup.guitar-academy");
}

describe("a restore is staged and activated, never written live (B04)", () => {
  beforeEach(resetDatabase);

  it("round-trips an exported backup, recordings and all", async () => {
    await saveBlob("take-a", new Blob(["first take"], { type: "audio/webm" }));
    const original = stateWith([sketchWithTakes(0, ["take-a"])], "before the restore");
    await savePersistedState(original, "anonymous");

    const archive = await archiveOf(original);
    await savePersistedState(stateWith([], "replaced since"), "anonymous");

    const preview = await prepareRestore(archive, "anonymous");
    const restored = await activateRestore(preview.operationId);

    expect(restored.lastReflection).toBe("before the restore");
    expect((await loadWorkspace("anonymous")).status).toBe("ok");
    expect(await (await loadBlob("take-a"))?.text()).toBe("first take");
  });

  it("changes nothing at all until the restore is activated", async () => {
    await saveBlob("take-current", new Blob(["current"], { type: "audio/webm" }));
    const current = stateWith([sketchWithTakes(0, ["take-current"])], "the work in progress");
    await savePersistedState(current, "anonymous");

    // An archive of a different workspace, carrying a recording this device lacks.
    setActiveWorkspace("account:other");
    await saveBlob("take-incoming", new Blob(["incoming"], { type: "audio/webm" }));
    const incoming = stateWith([sketchWithTakes(0, ["take-incoming"])], "the backup");
    const archive = await archiveOf(incoming);
    setActiveWorkspace("anonymous");

    await prepareRestore(archive, "anonymous");

    /*
     * Staging is the whole point: the previous workspace must be untouched and
     * fully usable while a restore sits prepared, so declining costs nothing.
     */
    const load = await loadWorkspace("anonymous");
    expect(load.status === "ok" && load.state.lastReflection).toBe("the work in progress");
    expect(await (await loadBlob("take-current"))?.text()).toBe("current");
    expect(await loadBlob("take-incoming")).toBeNull();
  });

  it("reports what will be restored and what it would supersede", async () => {
    await saveBlob("take-old", new Blob(["old"], { type: "audio/webm" }));
    await savePersistedState(stateWith([sketchWithTakes(0, ["take-old"])], "current"), "anonymous");

    setActiveWorkspace("account:other");
    await saveBlob("take-new", new Blob(["new"], { type: "audio/webm" }));
    const archive = await archiveOf(stateWith([sketchWithTakes(0, ["take-new"]), newSketch(1)], "from the backup"));
    setActiveWorkspace("anonymous");

    const preview = await prepareRestore(archive, "anonymous");
    expect(preview.workspaceId).toBe("anonymous");
    expect(preview.sketches).toBe(2);
    expect(preview.recordings).toBe(1);
    expect(preview.supersededRecordings).toBe(1);
  });

  it("leaves the workspace alone when the restore is cancelled", async () => {
    await savePersistedState(stateWith([], "keep me"), "anonymous");
    const archive = await archiveOf(stateWith([newSketch(0)], "the backup"));

    const preview = await prepareRestore(archive, "anonymous");
    await cancelRestore(preview.operationId);

    const load = await loadWorkspace("anonymous");
    expect(load.status === "ok" && load.state.lastReflection).toBe("keep me");
    // Cancelling clears the staging generation, so nothing is left to recover.
    expect(await discardIncompleteStaging()).toBe(0);
    await expect(activateRestore(preview.operationId)).rejects.toThrow(/no longer staged/);
  });

  it("clears a restore that was interrupted before activation", async () => {
    await saveBlob("take-current", new Blob(["current"], { type: "audio/webm" }));
    await savePersistedState(stateWith([sketchWithTakes(0, ["take-current"])], "survives the crash"), "anonymous");

    setActiveWorkspace("account:other");
    await saveBlob("take-staged", new Blob(["staged"], { type: "audio/webm" }));
    const archive = await archiveOf(stateWith([sketchWithTakes(0, ["take-staged"])], "never activated"));
    setActiveWorkspace("anonymous");

    const preview = await prepareRestore(archive, "anonymous");
    // The tab closes here. A manifest still present means activation never ran.
    expect(await discardIncompleteStaging()).toBe(1);

    const load = await loadWorkspace("anonymous");
    expect(load.status === "ok" && load.state.lastReflection).toBe("survives the crash");
    expect(await (await loadBlob("take-current"))?.text()).toBe("current");
    expect(await loadBlob("take-staged")).toBeNull();
    await expect(activateRestore(preview.operationId)).rejects.toThrow(/no longer staged/);
  });

  it("removes only the recordings this restore superseded", async () => {
    await saveBlob("take-kept", new Blob(["kept"], { type: "audio/webm" }));
    await saveBlob("take-superseded", new Blob(["superseded"], { type: "audio/webm" }));
    await savePersistedState(stateWith([sketchWithTakes(0, ["take-kept", "take-superseded"])], "current"), "anonymous");

    // The same id in another workspace must survive: a restore of one workspace
    // has no business deleting another's recordings.
    setActiveWorkspace("account:other");
    await saveBlob("take-superseded", new Blob(["another workspace's copy"], { type: "audio/webm" }));
    await saveBlob("take-kept", new Blob(["kept"], { type: "audio/webm" }));
    const archive = await archiveOf(stateWith([sketchWithTakes(0, ["take-kept"])], "from the backup"));
    setActiveWorkspace("anonymous");

    const preview = await prepareRestore(archive, "anonymous");
    await activateRestore(preview.operationId);

    expect(await loadBlob("take-kept")).not.toBeNull();
    expect(await loadBlob("take-superseded")).toBeNull();
    setActiveWorkspace("account:other");
    expect(await (await loadBlob("take-superseded"))?.text()).toBe("another workspace's copy");
  });

  it("refuses an archive that references a recording it does not carry", async () => {
    const orphaned = stateWith([sketchWithTakes(0, ["take-missing"])], "broken");
    // exportArchive drops takes whose blobs are absent, so the missing reference
    // is built by hand — which is what a hand-edited or truncated backup looks like.
    const archive = new File([JSON.stringify({
      format: "guitar-academy", version: 8, exportedAt: "2026-09-14T09:00:00.000Z",
      state: orphaned, recordings: []
    })], "backup.guitar-academy");
    await expect(prepareRestore(archive, "anonymous")).rejects.toThrow(/missing a retained recording/);
    expect(await discardIncompleteStaging()).toBe(0);
  });

  it("refuses a file that is not a backup, staging nothing", async () => {
    await expect(prepareRestore(new File(["not a backup at all"], "notes.txt"), "anonymous")).rejects.toThrow();
    expect(await discardIncompleteStaging()).toBe(0);
  });

  it("carries a substantial history through a restore intact", async () => {
    const many = Array.from({ length: 200 }, (_, index) => newSketch(index));
    const large = stateWith(many, "a long history");
    await savePersistedState(large, "anonymous");
    const archive = await archiveOf(large);
    await savePersistedState(stateWith([], "wiped"), "anonymous");

    const preview = await prepareRestore(archive, "anonymous");
    expect(preview.sketches).toBe(200);
    const restored = await activateRestore(preview.operationId);
    expect(restored.sketches).toHaveLength(200);
    expect(new Set(restored.sketches.map((sketch) => sketch.id)).size).toBe(200);
  });
});
