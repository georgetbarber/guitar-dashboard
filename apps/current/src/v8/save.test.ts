import "fake-indexeddb/auto";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { newId } from "./identity";
import { createEvidence } from "./learning";
import { loadPersistedState, newSketch, savePersistedState, setActiveWorkspace } from "./repository";
import { DEFAULT_STATE } from "./store";
import { IDLE_SAVE, describeSaveFailure, failedFrom, runSave, savedFrom, savingFrom } from "./saveState";
import type { LocalSaveState } from "./saveState";
import type { SaveMedium } from "./repository";
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

/** Replace indexedDB.open so every store operation fails the way a blocked or full device does. */
function breakIndexedDb(name: string) {
  const original = indexedDB.open;
  indexedDB.open = () => { throw new DOMException("storage unavailable", name); };
  return () => { indexedDB.open = original; };
}

describe("stable identity for learner-created records (B28)", () => {
  it("does not repeat a sketch ID when the clock and the sketch count both repeat", () => {
    /*
     * The previous form was `sketch-${Date.now()}-${index}` with index taken from
     * sketches.length, so creating a sketch, deleting it and creating another
     * inside one millisecond produced the same ID twice — and the second sketch
     * overwrote the first in Firestore. Freezing the clock reproduces exactly
     * that, at the same index, many times over.
     */
    const ids = Array.from({ length: 500 }, () => newSketch(0).id);
    expect(new Set(ids).size).toBe(500);
  });

  it("gives every record kind its own unique ID under rapid creation", () => {
    for (const kind of ["sketch", "revision", "chord", "take", "evidence"]) {
      const ids = Array.from({ length: 2000 }, () => newId(kind));
      expect(new Set(ids).size).toBe(2000);
      expect(ids.every((id) => id.startsWith(`${kind}-`))).toBe(true);
    }
  });

  it("separates two identical observations recorded at the same instant", () => {
    const at = "2026-09-10T09:00:00.000Z";
    const first = createEvidence("activity-1", ["ear:u1", "ear:u2"], "production", "none", "successful", {}, at);
    const second = createEvidence("activity-1", ["ear:u1", "ear:u2"], "production", "none", "successful", {}, at);
    const ids = [...first, ...second].map((item) => item.id);
    expect(new Set(ids).size).toBe(4);
  });

  it("still produces unique IDs where randomUUID is unavailable, as on a LAN address", () => {
    const original = globalThis.crypto;
    Object.defineProperty(globalThis, "crypto", {
      configurable: true,
      value: { getRandomValues: original.getRandomValues.bind(original) }
    });
    try {
      const ids = Array.from({ length: 2000 }, () => newId("take"));
      expect(new Set(ids).size).toBe(2000);
    } finally {
      Object.defineProperty(globalThis, "crypto", { configurable: true, value: original });
    }
  });
});

describe("the local store reports what it actually did (B02)", () => {
  beforeEach(resetDatabase);
  afterEach(() => { delete (globalThis as { localStorage?: unknown }).localStorage; });

  const workspaceState = (reflection: string): V8State => ({ ...DEFAULT_STATE, lastReflection: reflection });

  it("reports the durable store when the write reaches IndexedDB", async () => {
    expect(await savePersistedState(workspaceState("durable"), "anonymous")).toBe("indexeddb");
  });

  it("distinguishes a compatibility-store write from a durable one", async () => {
    const entries = new Map<string, string>();
    (globalThis as { localStorage?: unknown }).localStorage = {
      getItem: (key: string) => entries.get(key) ?? null,
      setItem: (key: string, value: string) => { entries.set(key, value); },
      removeItem: (key: string) => { entries.delete(key); }
    };
    const restore = breakIndexedDb("UnknownError");
    try {
      // Reported separately because localStorage holds a few megabytes at best:
      // treating this as a plain success is how a learner trusts a store that is
      // about to start refusing a growing sketchbook.
      expect(await savePersistedState(workspaceState("fallback copy"), "anonymous")).toBe("fallback");
    } finally { restore(); }
  });

  it("rejects rather than reporting success when no store will accept the write", async () => {
    const restore = breakIndexedDb("QuotaExceededError");
    try {
      await expect(savePersistedState(workspaceState("never stored"), "anonymous")).rejects.toBeInstanceOf(DOMException);
    } finally { restore(); }
  });

  it("leaves the last durable workspace intact after a failed write", async () => {
    await savePersistedState(workspaceState("committed before the failure"), "anonymous");
    const restore = breakIndexedDb("QuotaExceededError");
    try {
      await expect(savePersistedState(workspaceState("lost in the failure"), "anonymous")).rejects.toThrow();
    } finally { restore(); }
    expect((await loadPersistedState("anonymous"))?.lastReflection).toBe("committed before the failure");
  });
});

describe("save state never overstates or understates what the device holds", () => {
  it("keeps the record of the last durable copy through a failure", () => {
    const saved = savedFrom(IDLE_SAVE, "indexeddb", "2026-09-10T09:00:00.000Z");
    const failed = failedFrom(saved, new DOMException("full", "QuotaExceededError"));
    expect(failed.status).toBe("failed");
    expect(failed.lastSavedAt).toBe("2026-09-10T09:00:00.000Z");
    expect(failed.medium).toBe("indexeddb");
    expect(failed.failedAttempts).toBe(1);
    expect(failedFrom(failed, new Error("again")).failedAttempts).toBe(2);
  });

  it("clears a stale failure once a write succeeds", () => {
    const failed = failedFrom(IDLE_SAVE, new Error("device refused the write"));
    const recovered = savedFrom(failed, "indexeddb", "2026-09-10T09:05:00.000Z");
    expect(recovered.status).toBe("saved");
    expect(recovered.error).toBeNull();
    expect(recovered.failedAttempts).toBe(0);
  });

  it("does not claim a save has happened merely because one is in flight", () => {
    const inFlight = savingFrom(IDLE_SAVE);
    expect(inFlight.status).toBe("saving");
    expect(inFlight.lastSavedAt).toBeNull();
    expect(inFlight.medium).toBeNull();
  });

  it("explains a failure in terms the learner can act on", () => {
    expect(describeSaveFailure(new DOMException("full", "QuotaExceededError"))).toContain("no storage space left");
    expect(describeSaveFailure(new DOMException("blocked", "SecurityError"))).toContain("private browsing");
    expect(describeSaveFailure(new Error("the object store was not found"))).toBe("the object store was not found");
    expect(describeSaveFailure("something odd")).toBe("This device would not store the change.");
  });
});

describe("a save outcome is always reported, never discarded (B02)", () => {
  /** Collects the states the interface would actually have shown, in order. */
  function recorder(current = IDLE_SAVE) {
    const shown: LocalSaveState[] = [];
    return {
      shown,
      apply: (transition: (state: LocalSaveState) => LocalSaveState) => {
        current = transition(current);
        shown.push(current);
      },
      get current() { return current; }
    };
  }

  it("surfaces a rejected write instead of swallowing it", async () => {
    const record = recorder();
    let released = false;
    await runSave(DEFAULT_STATE, "anonymous", {
      write: () => Promise.reject(new DOMException("full", "QuotaExceededError")),
      isCurrent: () => true,
      apply: record.apply,
      onDurable: () => { released = true; }
    });
    expect(record.shown.map((state) => state.status)).toEqual(["saving", "failed"]);
    expect(record.current.error).toContain("no storage space left");
    // The unsaved copy must stay held: releasing it here is what would lose the work.
    expect(released).toBe(false);
  });

  it("reports where a successful write landed and releases the unsaved copy", async () => {
    const record = recorder();
    let released = false;
    await runSave(DEFAULT_STATE, "anonymous", {
      write: () => Promise.resolve("fallback" as SaveMedium),
      isCurrent: () => true,
      apply: record.apply,
      onDurable: () => { released = true; },
      now: () => "2026-09-10T10:00:00.000Z"
    });
    expect(record.current).toMatchObject({ status: "saved", medium: "fallback", lastSavedAt: "2026-09-10T10:00:00.000Z" });
    expect(released).toBe(true);
  });

  it("stays silent when a newer save has superseded it", async () => {
    /*
     * Two saves in flight: the older one settles last. Reporting its failure
     * would contradict the newer save that has just succeeded with a superset of
     * the same edits, so the stale attempt must say nothing at all.
     */
    const record = recorder();
    let released = false;
    await runSave(DEFAULT_STATE, "anonymous", {
      write: () => Promise.reject(new Error("stale attempt")),
      isCurrent: () => false,
      apply: record.apply,
      onDurable: () => { released = true; }
    });
    expect(record.shown.map((state) => state.status)).toEqual(["saving"]);
    expect(released).toBe(false);
  });

  it("does not release the unsaved copy for a superseded success", async () => {
    const record = recorder();
    let released = false;
    await runSave(DEFAULT_STATE, "anonymous", {
      write: () => Promise.resolve("indexeddb" as SaveMedium),
      isCurrent: () => false,
      apply: record.apply,
      onDurable: () => { released = true; }
    });
    expect(released).toBe(false);
  });
});
