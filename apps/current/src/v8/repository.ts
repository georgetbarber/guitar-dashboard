import { newId } from "./identity";
import type { ModeId } from "../core/music/types";
import type { Sketch, V8State } from "./types";
import { validateState } from "./validation";

const DB_NAME = "guitar-academy-v8";
const DB_VERSION = 3;
const STATE_STORE = "state";
const BLOB_STORE = "blobs";
const STAGING_STORE = "staging";
const LEGACY_STATE_KEY = "learner";
const LOCAL_FALLBACK = "guitar-academy-v8-fallback";
const ANONYMOUS_WORKSPACE = "anonymous";
const WORKSPACE_SEPARATOR = "\u0000";

export type WorkspaceId = "anonymous" | `account:${string}`;

let activeWorkspace: WorkspaceId = ANONYMOUS_WORKSPACE;
let deviceErased = false;

export function accountWorkspaceId(uid: string): WorkspaceId {
  return `account:${uid}`;
}

export function setActiveWorkspace(workspaceId: WorkspaceId) {
  activeWorkspace = workspaceId;
}

export function activeWorkspaceId() {
  return activeWorkspace;
}

function stateKey(workspaceId: WorkspaceId) {
  return workspaceId;
}

/** Namespaced so a staging generation's recordings cannot be mistaken for a workspace's own. */
function blobKey(namespace: string, id: string) {
  return `${namespace}${WORKSPACE_SEPARATOR}${id}`;
}

function stagingNamespace(operationId: string) {
  return `staging${WORKSPACE_SEPARATOR}${operationId}`;
}

function fallbackKey(workspaceId: WorkspaceId) {
  return `${LOCAL_FALLBACK}:${workspaceId}`;
}

function requestResult<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.addEventListener("success", () => resolve(request.result));
    request.addEventListener("error", () => reject(request.error));
  });
}

async function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.addEventListener("upgradeneeded", (event) => {
      const database = request.result;
      if (!database.objectStoreNames.contains(STATE_STORE)) database.createObjectStore(STATE_STORE);
      if (!database.objectStoreNames.contains(BLOB_STORE)) database.createObjectStore(BLOB_STORE);
      if (!database.objectStoreNames.contains(STAGING_STORE)) database.createObjectStore(STAGING_STORE);
      if ((event as IDBVersionChangeEvent).oldVersion < 2) {
        const transaction = request.transaction;
        if (!transaction) return;
        const states = transaction.objectStore(STATE_STORE);
        const legacyState = states.get(LEGACY_STATE_KEY);
        legacyState.addEventListener("success", () => {
          if (!legacyState.result) return;
          states.put(legacyState.result, stateKey(ANONYMOUS_WORKSPACE));
          states.delete(LEGACY_STATE_KEY);
        });
        const blobs = transaction.objectStore(BLOB_STORE);
        const cursorRequest = blobs.openCursor();
        cursorRequest.addEventListener("success", () => {
          const cursor = cursorRequest.result;
          if (!cursor) return;
          if (typeof cursor.key === "string" && !cursor.key.includes(WORKSPACE_SEPARATOR)) {
            blobs.put(cursor.value, blobKey(ANONYMOUS_WORKSPACE, cursor.key));
            cursor.delete();
          }
          cursor.continue();
        });
      }
    });
    request.addEventListener("success", () => resolve(request.result));
    request.addEventListener("error", () => reject(request.error));
  });
}

/**
 * What this device holds for a workspace.
 *
 * "unreadable" is the case that matters and that the previous code could not
 * express: stored bytes exist but do not describe a workspace. Returning null
 * for that — which casting straight to V8State effectively did — starts the
 * learner in an empty app that looks exactly like total data loss, and the first
 * autosave then writes the empty workspace over the only copy of their work.
 * The raw value is carried out so it can still be exported for recovery.
 */
export type WorkspaceLoad =
  | { status: "empty" }
  | { status: "ok"; state: V8State }
  | { status: "unreadable"; reason: string; raw: unknown };

async function readStoredWorkspace(workspaceId: WorkspaceId): Promise<unknown> {
  try {
    const database = await openDatabase();
    const transaction = database.transaction(STATE_STORE, "readonly");
    const value = await requestResult(transaction.objectStore(STATE_STORE).get(stateKey(workspaceId)));
    database.close();
    if (value !== undefined && value !== null) return value;
  } catch {
    // Fall through to the compatibility copy below.
  }
  try {
    const scoped = localStorage.getItem(fallbackKey(workspaceId));
    const raw = scoped ?? (workspaceId === ANONYMOUS_WORKSPACE ? localStorage.getItem(LOCAL_FALLBACK) : null);
    if (!scoped && raw && workspaceId === ANONYMOUS_WORKSPACE) {
      localStorage.setItem(fallbackKey(workspaceId), raw);
      localStorage.removeItem(LOCAL_FALLBACK);
    }
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export async function loadWorkspace(workspaceId: WorkspaceId = activeWorkspace): Promise<WorkspaceLoad> {
  const value = await readStoredWorkspace(workspaceId);
  if (value === null || value === undefined) return { status: "empty" };
  try {
    validateState(value);
    return { status: "ok", state: value };
  } catch (error) {
    return { status: "unreadable", reason: error instanceof Error ? error.message : "This workspace could not be read.", raw: value };
  }
}

/** The validated state, or null for a workspace that is empty *or* unreadable. Prefer loadWorkspace where the difference matters. */
export async function loadPersistedState(workspaceId: WorkspaceId = activeWorkspace): Promise<V8State | null> {
  const load = await loadWorkspace(workspaceId);
  return load.status === "ok" ? load.state : null;
}

/**
 * Where a successful write actually landed. The caller needs this because the
 * two are not equivalent: "fallback" means IndexedDB refused the write and the
 * state is sitting in localStorage, which holds a few megabytes at best and will
 * start refusing a growing sketchbook. Reporting both as a plain success is how
 * a learner ends up trusting a store that is about to fail.
 */
export type SaveMedium = "indexeddb" | "fallback" | "erased";

export async function savePersistedState(state: V8State, workspaceId: WorkspaceId = activeWorkspace): Promise<SaveMedium> {
  if (deviceErased) return "erased";
  try {
    const database = await openDatabase();
    const transaction = database.transaction(STATE_STORE, "readwrite");
    transaction.objectStore(STATE_STORE).put(state, stateKey(workspaceId));
    await new Promise<void>((resolve, reject) => {
      transaction.addEventListener("complete", () => resolve());
      transaction.addEventListener("error", () => reject(transaction.error));
    });
    database.close();
    return "indexeddb";
  } catch (error) {
    // localStorage is a compatibility fallback, not a duplicate primary store.
    // Large sketchbooks can exceed its small quota while remaining safe in IndexedDB.
    try { localStorage.setItem(fallbackKey(workspaceId), JSON.stringify(state)); }
    catch { throw error; }
    return "fallback";
  }
}

export async function workspaceExists(workspaceId: WorkspaceId): Promise<boolean> {
  // Unreadable counts as present. Reporting "no workspace here" is what would let
  // a sign-in move or overwrite a stored workspace this build merely cannot parse.
  return (await loadWorkspace(workspaceId)).status !== "empty";
}

export async function workspaceHasLearningData(workspaceId: WorkspaceId): Promise<boolean> {
  const load = await loadWorkspace(workspaceId);
  if (load.status === "unreadable") return true;
  const state = load.status === "ok" ? load.state : null;
  return Boolean(state && (
    state.settings.diagnosticComplete
    || state.completedActivityIds.length
    || state.evidence.length
    || state.sketches.length
    || state.lastReflection.trim()
    || state.updatedAt !== "2026-07-13T00:00:00.000Z"
  ));
}

export async function moveWorkspace(source: WorkspaceId, target: WorkspaceId): Promise<void> {
  if (source === target) return;
  const sourceLoad = await loadWorkspace(source);
  if (sourceLoad.status === "empty") return;
  if (sourceLoad.status === "unreadable") {
    // Moving it would rewrite it under a new key and lose the only copy that can
    // still be exported for recovery.
    throw new Error("This device's guest workspace could not be read, so it was not moved. Export it from the recovery notice first.");
  }
  const sourceState = sourceLoad.state;
  if (await workspaceExists(target)) throw new Error("That account already has a workspace on this device.");

  const database = await openDatabase();
  const transaction = database.transaction([STATE_STORE, BLOB_STORE], "readwrite");
  const states = transaction.objectStore(STATE_STORE);
  states.put(sourceState, stateKey(target));
  states.delete(stateKey(source));

  const blobs = transaction.objectStore(BLOB_STORE);
  const prefix = `${source}${WORKSPACE_SEPARATOR}`;
  const cursorRequest = blobs.openCursor(IDBKeyRange.bound(prefix, `${prefix}\uffff`));
  cursorRequest.addEventListener("success", () => {
    const cursor = cursorRequest.result;
    if (!cursor) return;
    const id = String(cursor.key).slice(prefix.length);
    blobs.put(cursor.value, blobKey(target, id));
    cursor.delete();
    cursor.continue();
  });
  await new Promise<void>((resolve, reject) => {
    transaction.addEventListener("complete", () => resolve());
    transaction.addEventListener("error", () => reject(transaction.error));
    transaction.addEventListener("abort", () => reject(transaction.error));
  });
  database.close();

  try {
    const fallback = localStorage.getItem(fallbackKey(source));
    if (fallback) localStorage.setItem(fallbackKey(target), fallback);
    localStorage.removeItem(fallbackKey(source));
  } catch {
    // IndexedDB remains the authoritative copy.
  }
}

export async function eraseAllDeviceData(): Promise<void> {
  deviceErased = true;
  await new Promise<void>((resolve, reject) => {
    const request = indexedDB.deleteDatabase(DB_NAME);
    request.addEventListener("success", () => resolve());
    request.addEventListener("error", () => reject(request.error));
    request.addEventListener("blocked", () => reject(new Error("Close other Guitar Academy tabs, then try erasing this device again.")));
  });
  try {
    for (let index = localStorage.length - 1; index >= 0; index -= 1) {
      const key = localStorage.key(index);
      if (key?.startsWith("guitar-academy")) localStorage.removeItem(key);
    }
  } catch {
    // Some privacy modes expose IndexedDB but disable localStorage.
  }
}

export async function saveBlob(id: string, blob: Blob): Promise<void> {
  if (deviceErased) throw new Error("This device workspace was erased. Reload before saving another recording.");
  const database = await openDatabase();
  const transaction = database.transaction(BLOB_STORE, "readwrite");
  transaction.objectStore(BLOB_STORE).put(blob, blobKey(activeWorkspace, id));
  await new Promise<void>((resolve, reject) => {
    transaction.addEventListener("complete", () => resolve());
    transaction.addEventListener("error", () => reject(transaction.error));
  });
  database.close();
}

export async function loadBlob(id: string): Promise<Blob | null> {
  try {
    const database = await openDatabase();
    const transaction = database.transaction(BLOB_STORE, "readonly");
    const value = await requestResult(transaction.objectStore(BLOB_STORE).get(blobKey(activeWorkspace, id)));
    database.close();
    return value ? value as Blob : null;
  } catch {
    return null;
  }
}

export async function retainedRecordingBytes(state: V8State): Promise<number> {
  const ids = new Set(state.sketches.flatMap((sketch) => sketch.takes.map((take) => take.blobId).filter(Boolean) as string[]));
  let bytes = 0;
  for (const id of ids) bytes += (await loadBlob(id))?.size ?? 0;
  return bytes;
}

export async function clearStoredRecordings(state: V8State): Promise<void> {
  const ids = new Set(state.sketches.flatMap((sketch) => sketch.takes.map((take) => take.blobId).filter(Boolean) as string[]));
  if (!ids.size) return;
  const database = await openDatabase();
  const transaction = database.transaction(BLOB_STORE, "readwrite");
  for (const id of ids) transaction.objectStore(BLOB_STORE).delete(blobKey(activeWorkspace, id));
  await new Promise<void>((resolve, reject) => {
    transaction.addEventListener("complete", () => resolve());
    transaction.addEventListener("error", () => reject(transaction.error));
  });
  database.close();
}

export async function clearSketchRecordings(sketch: Sketch): Promise<void> {
  const ids = sketch.takes.map((take) => take.blobId).filter(Boolean) as string[];
  if (!ids.length) return;
  const database = await openDatabase();
  const transaction = database.transaction(BLOB_STORE, "readwrite");
  for (const id of ids) transaction.objectStore(BLOB_STORE).delete(blobKey(activeWorkspace, id));
  await new Promise<void>((resolve, reject) => {
    transaction.addEventListener("complete", () => resolve());
    transaction.addEventListener("error", () => reject(transaction.error));
  });
  database.close();
}

export async function storageEstimate(): Promise<{ usage: number; quota: number } | null> {
  if (!navigator.storage?.estimate) return null;
  const estimate = await navigator.storage.estimate();
  return { usage: estimate.usage ?? 0, quota: estimate.quota ?? 0 };
}

export async function storagePersistenceStatus(): Promise<boolean | null> {
  if (!navigator.storage?.persisted) return null;
  return navigator.storage.persisted();
}

export async function requestPersistentStorage(): Promise<boolean | null> {
  if (!navigator.storage?.persist) return null;
  return navigator.storage.persist();
}

interface LegacyArchive {
  format: "guitar-academy";
  version: 8;
  exportedAt: string;
  state: V8State;
  recordings: Array<{ id: string; type: string; data: string }>;
}

interface ArchiveHeader {
  format: "guitar-academy";
  archiveVersion: 2;
  stateVersion: 8;
  exportedAt: string;
  state: V8State;
  recordings: Array<{ id: string; type: string; size: number }>;
}

const ARCHIVE_MAGIC = "GA8ARCH2";
const ARCHIVE_PREFIX_BYTES = 12;
const MAX_HEADER_BYTES = 128 * 1024 * 1024;

function dataToBlob(data: string): Blob {
  const [header, body] = data.split(",");
  const type = /data:(.*?);/.exec(header)?.[1] ?? "application/octet-stream";
  const bytes = Uint8Array.from(atob(body), (value) => value.charCodeAt(0));
  return new Blob([bytes], { type });
}

export async function exportArchive(state: V8State): Promise<Blob> {
  const ids = new Set(state.sketches.flatMap((sketch) => sketch.takes.map((take) => take.blobId).filter(Boolean) as string[]));
  const recordings: Array<{ id: string; blob: Blob }> = [];
  for (const id of ids) {
    const blob = await loadBlob(id);
    if (blob) recordings.push({ id, blob });
  }
  const includedIds = new Set(recordings.map((recording) => recording.id));
  const exportState: V8State = {
    ...state,
    sketches: state.sketches.map((sketch) => ({
      ...sketch,
      takes: sketch.takes.flatMap((take) => {
        if (!take.blobId || includedIds.has(take.blobId)) return [take];
        return take.cloud ? [{ ...take, blobId: undefined }] : [];
      })
    }))
  };
  delete exportState.pendingRestoreId;
  const header: ArchiveHeader = {
    format: "guitar-academy",
    archiveVersion: 2,
    stateVersion: 8,
    exportedAt: new Date().toISOString(),
    state: exportState,
    recordings: recordings.map(({ id, blob }) => ({ id, type: blob.type || "application/octet-stream", size: blob.size }))
  };
  const encoder = new TextEncoder();
  const magic = encoder.encode(ARCHIVE_MAGIC);
  const headerBytes = encoder.encode(JSON.stringify(header));
  const headerLength = new Uint8Array(4);
  new DataView(headerLength.buffer).setUint32(0, headerBytes.byteLength, true);
  return new Blob([magic, headerLength, headerBytes, ...recordings.map((recording) => recording.blob)], { type: "application/vnd.guitar-academy" });
}

/**
 * A RESTORE IS STAGED, THEN ACTIVATED. IT IS NEVER A SEQUENCE OF LIVE WRITES.
 *
 * The previous implementation wrote each recording straight into the active
 * workspace and then replaced the state. Every step of that was live: an
 * interruption between the first blob and the final state left new recordings
 * sitting against the old workspace with nothing referencing them, and a failure
 * on the state write left them there permanently with no way to find them again.
 * There was also no point at which the learner could see what they were about to
 * replace, or into which workspace.
 *
 * Now the archive is validated whole, written into an inactive generation, and
 * only then moved into place inside a single IndexedDB transaction — which is
 * atomic, so the workspace either becomes the restored one or stays exactly as
 * it was. Nothing in the previous workspace is touched before that transaction
 * commits, so a cancellation, a crash or a quota failure at any earlier stage
 * costs the learner nothing.
 */
export interface RestorePreview {
  operationId: string;
  /** The workspace this restore will replace. Shown to the learner before they confirm. */
  workspaceId: WorkspaceId;
  exportedAt: string;
  sketches: number;
  evidence: number;
  recordings: number;
  recordingBytes: number;
  /** Recordings currently on this device that this restore would supersede. */
  supersededRecordings: number;
}

interface StagingManifest {
  id: string;
  workspaceId: WorkspaceId;
  createdAt: string;
  /** "ready" means every staged recording is durable and activation may proceed. */
  status: "staging" | "ready";
  state: V8State;
  recordingIds: string[];
}

function referencedBlobIds(state: V8State): Set<string> {
  return new Set(state.sketches.flatMap((sketch) => sketch.takes.map((take) => take.blobId).filter(Boolean) as string[]));
}

async function readManifest(operationId: string): Promise<StagingManifest | null> {
  const database = await openDatabase();
  const transaction = database.transaction(STAGING_STORE, "readonly");
  const value = await requestResult(transaction.objectStore(STAGING_STORE).get(operationId));
  database.close();
  return (value as StagingManifest) ?? null;
}

async function writeManifest(manifest: StagingManifest): Promise<void> {
  const database = await openDatabase();
  const transaction = database.transaction(STAGING_STORE, "readwrite");
  transaction.objectStore(STAGING_STORE).put(manifest, manifest.id);
  await new Promise<void>((resolve, reject) => {
    transaction.addEventListener("complete", () => resolve());
    transaction.addEventListener("error", () => reject(transaction.error));
  });
  database.close();
}

async function removeStaging(operationId: string): Promise<void> {
  const database = await openDatabase();
  const transaction = database.transaction([BLOB_STORE, STAGING_STORE], "readwrite");
  const prefix = `${stagingNamespace(operationId)}${WORKSPACE_SEPARATOR}`;
  const cursorRequest = transaction.objectStore(BLOB_STORE).openCursor(IDBKeyRange.bound(prefix, `${prefix}\uffff`));
  cursorRequest.addEventListener("success", () => {
    const cursor = cursorRequest.result;
    if (!cursor) return;
    cursor.delete();
    cursor.continue();
  });
  transaction.objectStore(STAGING_STORE).delete(operationId);
  await new Promise<void>((resolve, reject) => {
    transaction.addEventListener("complete", () => resolve());
    transaction.addEventListener("error", () => reject(transaction.error));
    transaction.addEventListener("abort", () => reject(transaction.error));
  });
  database.close();
}

/** Abandon a prepared restore. The active workspace has not been touched, so there is nothing to undo. */
export async function cancelRestore(operationId: string): Promise<void> {
  await removeStaging(operationId);
}

/**
 * Called at startup. A manifest that still exists means its restore never
 * activated — activation deletes the manifest in the same transaction that
 * moves the data — so whatever it staged is incomplete and is removed.
 */
export async function discardIncompleteStaging(): Promise<number> {
  const database = await openDatabase();
  const transaction = database.transaction(STAGING_STORE, "readonly");
  const keys = await requestResult(transaction.objectStore(STAGING_STORE).getAllKeys());
  database.close();
  for (const key of keys) await removeStaging(String(key));
  return keys.length;
}

async function stageRecording(operationId: string, id: string, blob: Blob): Promise<void> {
  const database = await openDatabase();
  const transaction = database.transaction(BLOB_STORE, "readwrite");
  transaction.objectStore(BLOB_STORE).put(blob, blobKey(stagingNamespace(operationId), id));
  await new Promise<void>((resolve, reject) => {
    transaction.addEventListener("complete", () => resolve());
    transaction.addEventListener("error", () => reject(transaction.error));
  });
  database.close();
}

/**
 * Validate an archive in full and stage it. Nothing in the active workspace
 * changes here, so the returned preview can be shown and declined freely.
 */
export async function prepareRestore(file: File, workspaceId: WorkspaceId = activeWorkspace): Promise<RestorePreview> {
  if (deviceErased) throw new Error("This device workspace was erased. Reload before restoring a backup.");
  const prefix = new Uint8Array(await file.slice(0, ARCHIVE_PREFIX_BYTES).arrayBuffer());
  const magic = new TextDecoder().decode(prefix.slice(0, ARCHIVE_MAGIC.length));
  const parsed = magic === ARCHIVE_MAGIC ? await readBinaryArchive(file, prefix) : await readLegacyArchive(file);

  const operationId = newId("restore");
  const manifest: StagingManifest = {
    id: operationId,
    workspaceId,
    createdAt: new Date().toISOString(),
    status: "staging",
    state: parsed.state,
    recordingIds: parsed.recordings.map((recording) => recording.id)
  };
  await writeManifest(manifest);

  try {
    for (const recording of parsed.recordings) await stageRecording(operationId, recording.id, recording.blob);
    // Only once every recording is durable does the manifest become activatable.
    await writeManifest({ ...manifest, status: "ready" });
  } catch (error) {
    await removeStaging(operationId).catch(() => undefined);
    throw error;
  }

  const existing = await loadWorkspace(workspaceId);
  const previous = existing.status === "ok" ? referencedBlobIds(existing.state) : new Set<string>();
  const incoming = referencedBlobIds(parsed.state);
  return {
    operationId,
    workspaceId,
    exportedAt: parsed.exportedAt,
    sketches: parsed.state.sketches.length,
    evidence: parsed.state.evidence.length,
    recordings: parsed.recordings.length,
    recordingBytes: parsed.recordings.reduce((sum, recording) => sum + recording.blob.size, 0),
    supersededRecordings: [...previous].filter((id) => !incoming.has(id)).length
  };
}

/**
 * Move a staged restore into place. One transaction covers re-keying every
 * staged recording, replacing the state and deleting the staging generation, so
 * the workspace either becomes the restored one or is left entirely untouched.
 */
export async function activateRestore(operationId: string, expectedWorkspace?: WorkspaceId): Promise<V8State> {
  const manifest = await readManifest(operationId);
  if (!manifest) throw new Error("That restore is no longer staged on this device. Prepare it again.");
  if (manifest.status !== "ready") throw new Error("That restore did not finish staging. Prepare it again.");
  if (expectedWorkspace && manifest.workspaceId !== expectedWorkspace) throw new Error("This backup was prepared for another workspace. Prepare it again here.");
  const restored: V8State = { ...manifest.state, pendingRestoreId: operationId };

  const existing = await loadWorkspace(manifest.workspaceId);
  const superseded = existing.status === "ok" ? referencedBlobIds(existing.state) : new Set<string>();

  const database = await openDatabase();
  const transaction = database.transaction([STATE_STORE, BLOB_STORE, STAGING_STORE], "readwrite");
  const blobs = transaction.objectStore(BLOB_STORE);
  const prefix = `${stagingNamespace(operationId)}${WORKSPACE_SEPARATOR}`;
  const cursorRequest = blobs.openCursor(IDBKeyRange.bound(prefix, `${prefix}\uffff`));
  cursorRequest.addEventListener("success", () => {
    const cursor = cursorRequest.result;
    if (!cursor) return;
    const id = String(cursor.key).slice(prefix.length);
    blobs.put(cursor.value, blobKey(manifest.workspaceId, id));
    cursor.delete();
    cursor.continue();
  });
  transaction.objectStore(STATE_STORE).put(restored, stateKey(manifest.workspaceId));
  transaction.objectStore(STAGING_STORE).delete(operationId);
  await new Promise<void>((resolve, reject) => {
    transaction.addEventListener("complete", () => resolve());
    transaction.addEventListener("error", () => reject(transaction.error));
    transaction.addEventListener("abort", () => reject(transaction.error));
  });
  database.close();

  /*
   * Superseded recordings go only after activation has committed, and only the
   * ones the previous workspace referenced and the restored one does not. A blob
   * the restored state still points at, or one belonging to another workspace,
   * is never a candidate — so a shared or externally referenced recording cannot
   * be removed by a restore.
   */
  const stillReferenced = referencedBlobIds(manifest.state);
  const removable = [...superseded].filter((id) => !stillReferenced.has(id));
  if (removable.length) await deleteWorkspaceBlobs(manifest.workspaceId, removable).catch(() => undefined);

  return restored;
}

/** A choice is durable before cloud sync resumes; stale confirmations fail closed. */
export async function confirmRestoreMerge(workspaceId: WorkspaceId, operationId: string): Promise<void> {
  const database = await openDatabase();
  try {
    const transaction = database.transaction(STATE_STORE, "readwrite");
    await new Promise<void>((resolve, reject) => {
      let failure: unknown;
      transaction.addEventListener("complete", () => resolve());
      transaction.addEventListener("abort", () => reject(failure ?? transaction.error ?? new Error("The restore choice could not be saved.")));
      transaction.addEventListener("error", () => reject(transaction.error));
      const states = transaction.objectStore(STATE_STORE);
      const request = states.get(stateKey(workspaceId));
      request.addEventListener("success", () => {
        try {
          validateState(request.result);
          if (request.result.pendingRestoreId !== operationId) throw new Error("The restored workspace changed. Reopen it before choosing whether to sync.");
          const next = { ...request.result };
          delete next.pendingRestoreId;
          states.put(next, stateKey(workspaceId));
        } catch (error) { failure = error; transaction.abort(); }
      });
    });
  } finally { database.close(); }
}

async function deleteWorkspaceBlobs(workspaceId: WorkspaceId, ids: string[]): Promise<void> {
  const database = await openDatabase();
  const transaction = database.transaction(BLOB_STORE, "readwrite");
  for (const id of ids) transaction.objectStore(BLOB_STORE).delete(blobKey(workspaceId, id));
  await new Promise<void>((resolve, reject) => {
    transaction.addEventListener("complete", () => resolve());
    transaction.addEventListener("error", () => reject(transaction.error));
  });
  database.close();
}

interface ParsedArchive {
  state: V8State;
  exportedAt: string;
  recordings: Array<{ id: string; blob: Blob }>;
}

async function readBinaryArchive(file: File, prefix: Uint8Array): Promise<ParsedArchive> {
  if (prefix.byteLength < ARCHIVE_PREFIX_BYTES) throw new Error("This backup is incomplete.");
  const headerLength = new DataView(prefix.buffer, prefix.byteOffset + ARCHIVE_MAGIC.length, 4).getUint32(0, true);
  if (!headerLength || headerLength > MAX_HEADER_BYTES || ARCHIVE_PREFIX_BYTES + headerLength > file.size) {
    throw new Error("This backup has an invalid header.");
  }
  let header: ArchiveHeader;
  try {
    header = JSON.parse(await file.slice(ARCHIVE_PREFIX_BYTES, ARCHIVE_PREFIX_BYTES + headerLength).text()) as ArchiveHeader;
  } catch {
    throw new Error("This backup's index could not be read.");
  }
  validateArchiveHeader(header);
  const recordingBytes = header.recordings.reduce((sum, recording) => sum + recording.size, 0);
  const estimate = await storageEstimate();
  if (estimate && estimate.quota - estimate.usage < recordingBytes) {
    throw new Error("This device does not currently have enough storage for the backup's retained recordings.");
  }
  const expectedSize = ARCHIVE_PREFIX_BYTES + headerLength + recordingBytes;
  if (expectedSize !== file.size) throw new Error("This backup is incomplete or contains unexpected data.");
  let offset = ARCHIVE_PREFIX_BYTES + headerLength;
  const recordings = header.recordings.map((recording) => {
    const blob = file.slice(offset, offset + recording.size, recording.type);
    offset += recording.size;
    return { id: recording.id, blob };
  });
  return { state: header.state, exportedAt: header.exportedAt, recordings };
}

function validateArchiveHeader(header: ArchiveHeader) {
  if (header.format !== "guitar-academy" || header.archiveVersion !== 2 || header.stateVersion !== 8 || header.state?.version !== 8) {
    throw new Error("This file is not a Guitar Academy backup this version can read.");
  }
  if (!Array.isArray(header.recordings)) throw new Error("This backup is missing its recording index.");
  /*
   * The workspace itself is validated here, before anything is staged. Checking
   * only that sketches and evidence were arrays let an archive carrying
   * malformed music through to savePersistedState, where it became this device's
   * workspace.
   */
  validateState(header.state);
  const ids = new Set<string>();
  for (const recording of header.recordings) {
    if (!recording.id || !Number.isSafeInteger(recording.size) || recording.size < 0 || ids.has(recording.id)) {
      throw new Error("This backup has an invalid recording index.");
    }
    ids.add(recording.id);
  }
  const referenced = referencedBlobIds(header.state);
  for (const id of referenced) if (!ids.has(id)) throw new Error("This backup is missing a retained recording.");
}

async function readLegacyArchive(file: File): Promise<ParsedArchive> {
  let archive: LegacyArchive;
  try { archive = JSON.parse(await file.text()) as LegacyArchive; }
  catch { throw new Error("This file is not a Guitar Academy backup this version can read."); }
  if (archive?.format !== "guitar-academy" || archive.version !== 8 || archive.state?.version !== 8) {
    throw new Error("This file is not a Guitar Academy backup this version can read.");
  }
  validateState(archive.state);
  const recordings = (archive.recordings ?? []).map((recording) => ({ id: recording.id, blob: dataToBlob(recording.data) }));
  const available = new Set(recordings.map((recording) => recording.id));
  for (const id of referencedBlobIds(archive.state)) {
    if (!available.has(id)) throw new Error("This backup is missing a retained recording.");
  }
  return { state: archive.state, exportedAt: archive.exportedAt, recordings };
}

/**
 * A sketch starts in the music the learner is actually working in.
 *
 * It used to be born in C major whatever the rest of the app was set to, so a
 * learner practising in E minor opened a new sketch and was handed the wrong
 * key, the wrong chord choices and the wrong relationships — and the Explore
 * and Create panels then disagreed with each other about what "home" was.
 */
export function newSketch(index: number, context?: { key: string; mode: ModeId }): Sketch {
  const now = new Date().toISOString();
  const sketch: Sketch = {
    id: newId("sketch"),
    name: `Untitled sketch ${index + 1}`,
    intention: "Explore one relationship and listen for what it wants to become.",
    tags: [], tempo: 72, metre: "4/4", key: context?.key ?? "C", mode: context?.mode ?? "major",
    chords: [], melody: [], rhythmPattern: "1 & 2 & 3 & 4 &", bassMovement: "",
    sections: ["A"], notes: "", ambiguityNotes: "", takes: [], revisions: [], reflections: [],
    status: "capture", createdAt: now, updatedAt: now
  };
  sketch.fieldUpdatedAt = {
    name: now, intention: now, tags: now, tempo: now, metre: now, key: now, mode: now,
    chords: now, melody: now, rhythmPattern: now, bassMovement: now, sections: now,
    notes: now, ambiguityNotes: now, reflections: now, status: now
  };
  return sketch;
}
