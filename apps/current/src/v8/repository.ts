import type { Sketch, V8State } from "./types";

const DB_NAME = "guitar-academy-v8";
const DB_VERSION = 2;
const STATE_STORE = "state";
const BLOB_STORE = "blobs";
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

function blobKey(workspaceId: WorkspaceId, id: string) {
  return `${workspaceId}${WORKSPACE_SEPARATOR}${id}`;
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

export async function loadPersistedState(workspaceId: WorkspaceId = activeWorkspace): Promise<V8State | null> {
  try {
    const database = await openDatabase();
    const transaction = database.transaction(STATE_STORE, "readonly");
    const value = await requestResult(transaction.objectStore(STATE_STORE).get(stateKey(workspaceId)));
    database.close();
    if (value) return value as V8State;
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
    return raw ? JSON.parse(raw) as V8State : null;
  } catch {
    return null;
  }
}

export async function savePersistedState(state: V8State, workspaceId: WorkspaceId = activeWorkspace): Promise<void> {
  if (deviceErased) return;
  try {
    const database = await openDatabase();
    const transaction = database.transaction(STATE_STORE, "readwrite");
    transaction.objectStore(STATE_STORE).put(state, stateKey(workspaceId));
    await new Promise<void>((resolve, reject) => {
      transaction.addEventListener("complete", () => resolve());
      transaction.addEventListener("error", () => reject(transaction.error));
    });
    database.close();
  } catch (error) {
    // localStorage is a compatibility fallback, not a duplicate primary store.
    // Large sketchbooks can exceed its small quota while remaining safe in IndexedDB.
    try { localStorage.setItem(fallbackKey(workspaceId), JSON.stringify(state)); }
    catch { throw error; }
  }
}

export async function workspaceExists(workspaceId: WorkspaceId): Promise<boolean> {
  return Boolean(await loadPersistedState(workspaceId));
}

export async function workspaceHasLearningData(workspaceId: WorkspaceId): Promise<boolean> {
  const state = await loadPersistedState(workspaceId);
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
  const sourceState = await loadPersistedState(source);
  if (!sourceState) return;
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

export async function importArchive(file: File): Promise<V8State> {
  const prefix = new Uint8Array(await file.slice(0, ARCHIVE_PREFIX_BYTES).arrayBuffer());
  const magic = new TextDecoder().decode(prefix.slice(0, ARCHIVE_MAGIC.length));
  if (magic === ARCHIVE_MAGIC) return importBinaryArchive(file, prefix);
  return importLegacyArchive(file);
}

async function importBinaryArchive(file: File, prefix: Uint8Array): Promise<V8State> {
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
  for (const recording of header.recordings) {
    const blob = file.slice(offset, offset + recording.size, recording.type);
    await saveBlob(recording.id, blob);
    offset += recording.size;
  }
  await savePersistedState(header.state);
  return header.state;
}

function validateArchiveHeader(header: ArchiveHeader) {
  if (header.format !== "guitar-academy" || header.archiveVersion !== 2 || header.stateVersion !== 8 || header.state?.version !== 8) {
    throw new Error("This is not a supported Guitar Academy V8 backup.");
  }
  if (!Array.isArray(header.state.sketches) || !Array.isArray(header.state.evidence) || !Array.isArray(header.recordings)) {
    throw new Error("This backup is missing required learning data.");
  }
  const ids = new Set<string>();
  for (const recording of header.recordings) {
    if (!recording.id || !Number.isSafeInteger(recording.size) || recording.size < 0 || ids.has(recording.id)) {
      throw new Error("This backup has an invalid recording index.");
    }
    ids.add(recording.id);
  }
  const referenced = new Set(header.state.sketches.flatMap((sketch) => sketch.takes.map((take) => take.blobId).filter(Boolean) as string[]));
  for (const id of referenced) if (!ids.has(id)) throw new Error("This backup is missing a retained recording.");
}

async function importLegacyArchive(file: File): Promise<V8State> {
  let archive: LegacyArchive;
  try { archive = JSON.parse(await file.text()) as LegacyArchive; }
  catch { throw new Error("This is not a supported Guitar Academy backup."); }
  if (archive?.format !== "guitar-academy" || archive.version !== 8 || archive.state?.version !== 8) {
    throw new Error("This is not a supported Guitar Academy V8 archive.");
  }
  for (const recording of archive.recordings ?? []) await saveBlob(recording.id, dataToBlob(recording.data));
  await savePersistedState(archive.state);
  return archive.state;
}

export function newSketch(index: number): Sketch {
  const now = new Date().toISOString();
  const sketch: Sketch = {
    id: `sketch-${Date.now()}-${index}`,
    name: `Untitled sketch ${index + 1}`,
    intention: "Explore one relationship and listen for what it wants to become.",
    tags: [], tempo: 72, metre: "4/4", key: "C", mode: "major",
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
