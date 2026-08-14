import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it } from "vitest";
import { DEFAULT_STATE } from "./store";
import {
  accountWorkspaceId,
  loadBlob,
  loadPersistedState,
  moveWorkspace,
  saveBlob,
  savePersistedState,
  setActiveWorkspace,
  workspaceExists,
  workspaceHasLearningData
} from "./repository";

async function resetDatabase() {
  await new Promise<void>((resolve, reject) => {
    const request = indexedDB.deleteDatabase("guitar-academy-v8");
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
    request.onblocked = () => reject(new Error("Test database deletion was blocked."));
  });
  setActiveWorkspace("anonymous");
}

describe("account-scoped device workspaces", () => {
  beforeEach(resetDatabase);

  it("moves guest state and recordings into one account without leaving a guest copy", async () => {
    const guest = {
      ...DEFAULT_STATE,
      updatedAt: "2026-08-13T12:00:00.000Z",
      lastReflection: "private guest reflection"
    };
    await savePersistedState(guest, "anonymous");
    setActiveWorkspace("anonymous");
    await saveBlob("take-1", new Blob(["private audio"], { type: "audio/webm" }));

    const account = accountWorkspaceId("learner-a");
    expect(await workspaceHasLearningData("anonymous")).toBe(true);
    await moveWorkspace("anonymous", account);

    expect(await workspaceExists("anonymous")).toBe(false);
    expect((await loadPersistedState(account))?.lastReflection).toBe("private guest reflection");
    setActiveWorkspace(account);
    expect(await (await loadBlob("take-1"))?.text()).toBe("private audio");
    setActiveWorkspace("anonymous");
    expect(await loadBlob("take-1")).toBeNull();
  });

  it("keeps two signed-in account workspaces isolated", async () => {
    const accountA = accountWorkspaceId("learner-a");
    const accountB = accountWorkspaceId("learner-b");
    await savePersistedState({ ...DEFAULT_STATE, lastReflection: "A only" }, accountA);
    await savePersistedState({ ...DEFAULT_STATE, lastReflection: "B only" }, accountB);

    expect((await loadPersistedState(accountA))?.lastReflection).toBe("A only");
    expect((await loadPersistedState(accountB))?.lastReflection).toBe("B only");
  });
});
