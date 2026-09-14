import type { SaveMedium, WorkspaceId } from "./repository";
import type { V8State } from "./types";

/**
 * LOCAL SAVE STATE, KEPT SEPARATE FROM CLOUD SYNC STATE.
 *
 * These answer one question only: is this device holding the learner's work?
 * Cloud status answers a different question and lives in ./cloud.tsx. The two
 * were previously conflated by having neither — the save promise's rejection was
 * discarded in the store, so a device that could store nothing looked identical
 * to one that had just saved, while the interface went on saying "changes save
 * automatically on this device".
 *
 * The transitions live here as pure functions rather than inside the provider so
 * that the invariants the learner depends on can be asserted directly: a failure
 * never erases the record of the last durable copy, and a success never leaves a
 * stale error behind.
 */
export type LocalSaveStatus = "idle" | "saving" | "saved" | "failed";

export interface LocalSaveState {
  status: LocalSaveStatus;
  /** Where the last successful write landed; null before the first one. */
  medium: SaveMedium | null;
  /** When this device last held the workspace durably. */
  lastSavedAt: string | null;
  /** Set only while status is "failed". */
  error: string | null;
  /** Consecutive failures for the currently unsaved state. */
  failedAttempts: number;
}

export const IDLE_SAVE: LocalSaveState = { status: "idle", medium: null, lastSavedAt: null, error: null, failedAttempts: 0 };

export function savingFrom(current: LocalSaveState): LocalSaveState {
  return { ...current, status: "saving" };
}

export function savedFrom(current: LocalSaveState, medium: SaveMedium, at: string): LocalSaveState {
  return { status: "saved", medium, lastSavedAt: at, error: null, failedAttempts: 0 };
}

/**
 * `medium` and `lastSavedAt` deliberately survive a failure. They describe the
 * copy already on the device, which a failed write does not touch, and the
 * interface uses them to tell the learner what they still have rather than only
 * what they have just lost.
 */
export function failedFrom(current: LocalSaveState, error: unknown): LocalSaveState {
  return {
    status: "failed",
    medium: current.medium,
    lastSavedAt: current.lastSavedAt,
    error: describeSaveFailure(error),
    failedAttempts: current.failedAttempts + 1
  };
}

export function describeSaveFailure(error: unknown): string {
  const name = error instanceof DOMException ? error.name : "";
  if (name === "QuotaExceededError") return "This device has no storage space left for Guitar Academy, so the change could not be written.";
  if (name === "InvalidStateError" || name === "UnknownError" || name === "SecurityError") {
    return "This browser is blocking Guitar Academy's storage, which private browsing windows commonly do.";
  }
  return error instanceof Error && error.message ? error.message : "This device would not store the change.";
}

export interface SaveRunner {
  /** The write itself. Resolves with where it landed, or rejects. */
  write: (state: V8State, workspace: WorkspaceId) => Promise<SaveMedium>;
  /** False once a newer save has superseded this one. */
  isCurrent: () => boolean;
  /** Applies a transition to the save state the interface is showing. */
  apply: (transition: (current: LocalSaveState) => LocalSaveState) => void;
  /** Called only once the write is durable, so the caller can release its unsaved copy. */
  onDurable: () => void;
  now?: () => string;
}

/**
 * The one path by which a save may report its outcome.
 *
 * Every branch here either reports or deliberately stays silent, and silence is
 * only ever because a newer save has superseded this one and will report the
 * truth for the same edits plus later ones. There is no branch that discards a
 * rejection — which is precisely what `void savePersistedState(...).catch(() =>
 * undefined)` used to do, leaving a device that could store nothing
 * indistinguishable from one that had just saved.
 */
export async function runSave(state: V8State, workspace: WorkspaceId, runner: SaveRunner): Promise<void> {
  runner.apply(savingFrom);
  try {
    const medium = await runner.write(state, workspace);
    if (!runner.isCurrent()) return;
    runner.onDurable();
    runner.apply((current) => savedFrom(current, medium, (runner.now ?? (() => new Date().toISOString()))()));
  } catch (error) {
    if (!runner.isCurrent()) return;
    runner.apply((current) => failedFrom(current, error));
  }
}
