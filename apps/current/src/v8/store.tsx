import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, useState } from "react";
import { CURRICULUM } from "./curriculum";
import { completedActivityIdsFromEvidence } from "./learning";
import { activateRestore, activeWorkspaceId, confirmRestoreMerge, discardIncompleteStaging, exportArchive, loadWorkspace, moveWorkspace, newSketch, savePersistedState, setActiveWorkspace } from "./repository";
import type { WorkspaceId } from "./repository";
import { IDLE_SAVE, runSave } from "./saveState";
import type { LocalSaveState } from "./saveState";
import { holdUpdates } from "./updates";
import { clampSketchTempo } from "./limits";
import { mergeCloudSnapshot } from "./sync";
import type { CloudSnapshot } from "./sync";
import { SKETCH_SYNC_FIELDS } from "./types";
import type { CompetencyEvidence, LearnerSettings, RecordedTake, RouteId, Sketch, V8State } from "./types";

const ROUTES: RouteId[] = ["today", "path", "practice", "play", "create", "explore"];
const ROUTE_PATHS: Record<RouteId, string> = {
  today: "/learn",
  path: "/learn/course",
  practice: "/learn/strengthen",
  play: "/play",
  create: "/create",
  explore: "/explore"
};
const BASELINE_UNITS: Record<LearnerSettings["startingBaseline"], string> = {
  repair: "unit-01",
  some: "unit-03",
  secure: "unit-07"
};

function routeFromLocation(): RouteId {
  const segments = location.pathname.split("/").filter(Boolean);
  if (segments[0] === "learn") {
    if (segments[1] === "course") return "path";
    if (segments[1] === "strengthen") return "practice";
    return "today";
  }
  const candidate = segments[0] as RouteId | undefined;
  return candidate && ROUTES.includes(candidate) ? candidate : "today";
}

function replaceLegacyLocation(route: RouteId) {
  const canonical = ROUTE_PATHS[route];
  if (location.pathname === canonical) return;
  history.replaceState(history.state, "", `${canonical}${location.search}${location.hash}`);
}

export const DEFAULT_STATE: V8State = {
  version: 8,
  syncVersion: 1,
  updatedAt: "2026-07-13T00:00:00.000Z",
  settingsUpdatedAt: "2026-07-13T00:00:00.000Z",
  route: typeof location === "undefined" ? "today" : routeFromLocation(),
  activeUnitId: CURRICULUM[0].id,
  activeActivityId: null,
  activityOrigin: null,
  resumeActivityId: null,
  completedActivityIds: [],
  evidence: [],
  settings: {
    instrument: "electric", dailyMinutes: 25, tonicName: "C", mode: "major", theme: "light",
    reducedMotion: false, diagnosticComplete: false, startingBaseline: "repair"
  },
  sketches: [], deletedSketchIds: {}, activeSketchId: null, lastReflection: ""
};

type Action =
  | { type: "hydrate"; state: V8State }
  | { type: "navigate"; route: RouteId; push?: boolean }
  | { type: "openUnit"; unitId: string }
  | { type: "openActivity"; activityId: string }
  | { type: "suspendActivity"; route: RouteId }
  | { type: "resumeActivity" }
  | { type: "recordActivity"; activityId: string; evidence: CompetencyEvidence[]; reflection?: string }
  | { type: "updateSettings"; settings: Partial<LearnerSettings> }
  | { type: "createSketch" }
  | { type: "updateSketch"; sketch: Sketch }
  | { type: "setTakeCloud"; sketchId: string; takeId: string; cloud: RecordedTake["cloud"] | null; note: string }
  | { type: "deleteSketch"; id: string }
  | { type: "clearRecordings" }
  | { type: "setActiveSketch"; id: string }
  | { type: "mergeCloud"; snapshot: CloudSnapshot }
  | { type: "setRestoreDecision"; id?: string }
  | { type: "confirmRestoreDecision"; id: string }
  | { type: "replaceState"; state: V8State };

function withSketchFieldTimes(state: V8State): V8State {
  return {
    ...state,
    sketches: state.sketches.map((sketch) => ({
      ...sketch,
      fieldUpdatedAt: Object.fromEntries(SKETCH_SYNC_FIELDS.map((field) => [field, sketch.fieldUpdatedAt?.[field] ?? sketch.updatedAt]))
    }))
  };
}

function withEvidenceBackedCompletions(state: V8State): V8State {
  return { ...state, completedActivityIds: completedActivityIdsFromEvidence(state.evidence) };
}

function preparePersistedState(state: V8State): V8State {
  return withSketchFieldTimes(withEvidenceBackedCompletions(state));
}

function reducer(state: V8State, action: Action): V8State {
  const changedAt = new Date().toISOString();
  switch (action.type) {
    case "hydrate": return preparePersistedState({ ...DEFAULT_STATE, ...action.state, deletedSketchIds: action.state.deletedSketchIds ?? {}, route: routeFromLocation() });
    case "replaceState": return preparePersistedState({ ...DEFAULT_STATE, ...action.state, deletedSketchIds: action.state.deletedSketchIds ?? {}, route: routeFromLocation(), updatedAt: changedAt });
    case "mergeCloud": return state.pendingRestoreId ? state : withSketchFieldTimes(mergeCloudSnapshot(state, action.snapshot));
    case "setRestoreDecision": {
      const next = { ...state, pendingRestoreId: action.id };
      if (!action.id) delete next.pendingRestoreId;
      return next;
    }
    case "confirmRestoreDecision": {
      if (state.pendingRestoreId !== action.id) return state;
      const next = { ...state };
      delete next.pendingRestoreId;
      return next;
    }
    case "navigate": return { ...state, route: action.route, activeActivityId: null };
    case "openUnit": return { ...state, route: "path", activeUnitId: action.unitId, activeActivityId: null, updatedAt: changedAt };
    case "openActivity": return {
      ...state,
      activeActivityId: action.activityId,
      activityOrigin: action.activityId ? (state.activeActivityId ? state.activityOrigin ?? state.route : state.route) : null
    };
    case "suspendActivity": return { ...state, route: action.route, resumeActivityId: state.activeActivityId, activeActivityId: null };
    case "resumeActivity": return { ...state, activeActivityId: state.resumeActivityId, resumeActivityId: null };
    case "recordActivity": {
      const evidence = [...state.evidence, ...action.evidence];
      return {
        ...state,
        // activeActivityId is intentionally kept so the player can show the
        // recorded outcome and either offer a retry or continue after success.
        resumeActivityId: null,
        completedActivityIds: completedActivityIdsFromEvidence(evidence),
        evidence,
        // Not truncated. An over-length reflection is withheld from the profile
        // upload with an explanation (see ./sync.ts screenProfile) rather than
        // being silently cut back to fit a cloud document.
        lastReflection: action.reflection || state.lastReflection,
        updatedAt: changedAt
      };
    }
    case "updateSettings": {
      const settings = { ...state.settings, ...action.settings };
      return {
        ...state,
        settings,
        activeUnitId: action.settings.diagnosticComplete && action.settings.startingBaseline
          ? BASELINE_UNITS[action.settings.startingBaseline]
          : state.activeUnitId,
        settingsUpdatedAt: changedAt,
        updatedAt: changedAt
      };
    }
    case "createSketch": {
      const sketch = newSketch(state.sketches.length, { key: state.settings.tonicName, mode: state.settings.mode });
      return { ...state, sketches: [...state.sketches, sketch], activeSketchId: sketch.id, route: "create", updatedAt: changedAt };
    }
    /*
     * Tempo is clamped here because every sketch write passes through this case
     * and an out-of-range figure is a typo rather than work. Nothing else is
     * altered: over-limit material is the learner's, is kept locally, and is
     * withheld from the cloud visibly instead. Create refuses the edit that
     * would newly exceed a cap, while the learner still has the text in hand.
     */
    case "updateSketch": return {
      ...state,
      sketches: state.sketches.map((sketch) => sketch.id === action.sketch.id ? clampSketchTempo(action.sketch) : sketch),
      activeSketchId: action.sketch.id,
      updatedAt: changedAt
    };
    case "setTakeCloud": return {
      ...state,
      sketches: state.sketches.map((sketch) => sketch.id === action.sketchId ? {
        ...sketch,
        takes: sketch.takes.map((take) => take.id === action.takeId ? { ...take, cloud: action.cloud ?? undefined, note: action.note } : take),
        updatedAt: changedAt
      } : sketch),
      updatedAt: changedAt
    };
    case "deleteSketch": return {
      ...state,
      sketches: state.sketches.filter((sketch) => sketch.id !== action.id),
      deletedSketchIds: { ...state.deletedSketchIds, [action.id]: changedAt },
      activeSketchId: state.activeSketchId === action.id ? null : state.activeSketchId,
      updatedAt: changedAt
    };
    case "clearRecordings": return {
      ...state,
      sketches: state.sketches.map((sketch) => sketch.takes.some((take) => take.blobId) ? {
        ...sketch,
        takes: sketch.takes.flatMap((take) => take.cloud ? [{ ...take, blobId: undefined }] : []),
        updatedAt: changedAt
      } : sketch),
      updatedAt: changedAt
    };
    case "setActiveSketch": return { ...state, activeSketchId: action.id, route: "create" };
  }
}

interface StoreValue {
  state: V8State;
  dispatch: React.Dispatch<Action>;
  hydrated: boolean;
  workspaceId: WorkspaceId;
  switchWorkspace: (workspaceId: WorkspaceId, options?: { moveAnonymousHistory?: boolean }) => Promise<void>;
  save: LocalSaveState;
  /** Retry the state that failed to save, not whatever is current, so nothing queues behind a stuck write. */
  retrySave: () => Promise<void>;
  /** Escape hatch when the store will not accept writes: hand the learner a file they can restore. */
  downloadRecoveryArchive: () => Promise<void>;
  /** Set when this device holds stored bytes that do not describe a workspace. Saving is suspended while it is set. */
  workspaceIssue: { reason: string } | null;
  /** Hand the learner the unreadable bytes so a later build, or a person, can recover something from them. */
  downloadUnreadableWorkspace: () => void;
  /** Deliberately abandon the unreadable copy and begin a fresh workspace on this device. */
  discardUnreadableWorkspace: () => void;
  /** True while a local restore is waiting for the learner to say whether it should reach their account. Uploading is paused. */
  restoreHold: boolean;
  restoreWorkspace: (operationId: string) => Promise<V8State>;
  /** Persist this decision before allowing normal account merging to resume. */
  releaseRestoreToAccount: () => Promise<void>;
  /**
   * True only once a write containing every one of these observations has
   * completed in the current workspace. A superseded write does not count, so
   * this can say "not yet" about something that is in fact stored, never the
   * reverse.
   */
  isEvidenceSaved: (evidenceIds: readonly string[]) => boolean;
}
const Store = createContext<StoreValue | null>(null);

export function V8StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, DEFAULT_STATE);
  const [hydrated, setHydrated] = useState(false);
  const [workspaceId, setWorkspaceId] = useState<WorkspaceId>("anonymous");
  const [save, setSave] = useState<LocalSaveState>(IDLE_SAVE);
  const [durable, setDurable] = useState<{ workspace: WorkspaceId; evidenceIds: ReadonlySet<string> } | null>(null);
  const [workspaceIssue, setWorkspaceIssue] = useState<{ reason: string } | null>(null);
  const unreadableRef = useRef<unknown>(null);
  const restoreHold = Boolean(state.pendingRestoreId);
  const restoringRef = useRef(false);
  const [restoring, setRestoring] = useState(false);
  const pendingSavesRef = useRef(new Set<Promise<void>>());
  const switchingRef = useRef(false);
  const switchQueueRef = useRef(Promise.resolve());
  /*
   * A save that is superseded before it settles must not report anything: its
   * successor carries the same edits plus later ones, so only the newest
   * attempt's outcome is true of what the learner can currently see.
   */
  const saveRevisionRef = useRef(0);
  /* The exact state that has not reached the device, so a retry resends it rather than a newer partial. */
  const unsavedRef = useRef<V8State | null>(null);
  const saveUpdateHoldRef = useRef<(() => void) | null>(null);
  const stateRef = useRef(state);
  const workspaceRef = useRef(workspaceId);
  useEffect(() => { stateRef.current = state; }, [state]);
  useEffect(() => { workspaceRef.current = workspaceId; }, [workspaceId]);

  const persist = useCallback(async (next: V8State, workspace: WorkspaceId) => {
    const revision = ++saveRevisionRef.current;
    // Acquire this at the write boundary, before React renders "saving". A
    // kept take releases its temporary hold in the same render; relying on the
    // later status render leaves a gap where a queued update can lose its link.
    const previousHold = saveUpdateHoldRef.current;
    saveUpdateHoldRef.current = holdUpdates("your work to finish saving");
    previousHold?.();
    // Held before the write starts, so a failure leaves the learner's edits in
    // hand rather than only on screen: nothing durable is lost, and the retry
    // resends exactly this state.
    unsavedRef.current = next;
    const operation = runSave(next, workspace, {
      write: savePersistedState,
      isCurrent: () => revision === saveRevisionRef.current,
      apply: setSave,
      onDurable: () => {
        setDurable({ workspace, evidenceIds: new Set(next.evidence.map((item) => item.id)) });
        unsavedRef.current = null;
        saveUpdateHoldRef.current?.();
        saveUpdateHoldRef.current = null;
      }
    });
    pendingSavesRef.current.add(operation);
    try { await operation; } finally { pendingSavesRef.current.delete(operation); }
  }, []);

  useEffect(() => () => {
    saveRevisionRef.current += 1;
    saveUpdateHoldRef.current?.();
    saveUpdateHoldRef.current = null;
  }, []);

  const retrySave = useCallback(async () => {
    await persist(unsavedRef.current ?? stateRef.current, workspaceRef.current);
  }, [persist]);

  const downloadUnreadableWorkspace = useCallback(() => {
    const blob = new Blob([JSON.stringify(unreadableRef.current, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    try {
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `guitar-academy-unreadable-workspace-${new Date().toISOString().slice(0, 10)}.json`;
      anchor.click();
    } finally {
      URL.revokeObjectURL(url);
    }
  }, []);

  /*
   * A backup restored on this device is a local operation. Left alone, the
   * ordinary upload loop would push the restored workspace straight into the
   * signed-in account and overwrite whatever history was there — silently, and
   * with no way back. So uploading pauses until the learner says which they
   * meant.
   */
  const restoreWorkspace = useCallback(async (operationId: string) => {
    if (restoringRef.current || switchingRef.current) throw new Error("Wait for the current workspace operation to finish.");
    const workspace = workspaceRef.current;
    const previousDecision = stateRef.current.pendingRestoreId;
    restoringRef.current = true;
    setRestoring(true);
    dispatch({ type: "setRestoreDecision", id: operationId });
    const releaseUpdate = holdUpdates("a backup you are restoring");
    try {
      // Otherwise an older autosave could finish after activation and replace it.
      await Promise.all(pendingSavesRef.current);
      const restored = await activateRestore(operationId, workspace);
      unreadableRef.current = null;
      setWorkspaceIssue(null);
      dispatch({ type: "replaceState", state: restored });
      return restored;
    } catch (error) {
      dispatch({ type: "setRestoreDecision", id: previousDecision });
      throw error;
    } finally {
      restoringRef.current = false;
      setRestoring(false);
      releaseUpdate();
    }
  }, []);

  const releaseRestoreToAccount = useCallback(async () => {
    const operationId = stateRef.current.pendingRestoreId;
    if (!operationId) return;
    if (restoringRef.current || switchingRef.current) throw new Error("Wait for the current workspace operation to finish.");
    restoringRef.current = true;
    setRestoring(true);
    try {
      await Promise.all(pendingSavesRef.current);
      await confirmRestoreMerge(workspaceRef.current, operationId);
      dispatch({ type: "confirmRestoreDecision", id: operationId });
    } finally {
      restoringRef.current = false;
      setRestoring(false);
    }
  }, []);

  const discardUnreadableWorkspace = useCallback(() => {
    unreadableRef.current = null;
    setWorkspaceIssue(null);
  }, []);

  const downloadRecoveryArchive = useCallback(async () => {
    const blob = await exportArchive(unsavedRef.current ?? stateRef.current);
    const url = URL.createObjectURL(blob);
    try {
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `guitar-academy-recovery-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-")}.guitar-academy`;
      anchor.click();
    } finally {
      URL.revokeObjectURL(url);
    }
  }, []);
  useEffect(() => {
    setActiveWorkspace("anonymous");
    /*
     * A staging generation that survived a reload belongs to a restore that never
     * activated — activation deletes its manifest in the same transaction that
     * moves the data — so whatever it holds is incomplete and is cleared before
     * the workspace opens.
     */
    void discardIncompleteStaging().catch(() => undefined);
    void loadWorkspace("anonymous").then((load) => {
      if (load.status === "ok") dispatch({ type: "hydrate", state: load.state });
      else if (load.status === "unreadable") {
        unreadableRef.current = load.raw;
        setWorkspaceIssue({ reason: load.reason });
      }
      setHydrated(true);
    });
  }, []);
  useEffect(() => {
    if (!hydrated || switchingRef.current || restoringRef.current) return;
    /*
     * Saving is suspended while a workspace is unreadable. The default state is
     * what is on screen, and writing it would overwrite the only copy of the
     * learner's work with an empty one — turning a parsing problem into real
     * data loss. The learner chooses: export the bytes, or discard them.
     */
    if (workspaceIssue) {
      document.documentElement.dataset.theme = state.settings.theme;
      return;
    }
    document.documentElement.dataset.theme = state.settings.theme;
    document.documentElement.dataset.motion = state.settings.reducedMotion ? "reduced" : "full";
    void persist(state, workspaceId);
  }, [state, hydrated, workspaceId, persist, workspaceIssue, restoring]);
  useEffect(() => {
    replaceLegacyLocation(routeFromLocation());
    const listener = () => {
      const route = routeFromLocation();
      replaceLegacyLocation(route);
      dispatch({ type: "navigate", route });
    };
    addEventListener("popstate", listener);
    return () => removeEventListener("popstate", listener);
  }, []);
  const switchWorkspace = useCallback(async (nextWorkspace: WorkspaceId, options?: { moveAnonymousHistory?: boolean }) => {
    const operation = switchQueueRef.current.then(async () => {
      if (restoringRef.current) throw new Error("Wait for the backup operation to finish before changing workspace.");
      if (!options?.moveAnonymousHistory && activeWorkspaceId() === nextWorkspace) return;
      switchingRef.current = true;
      setHydrated(false);
      try {
        if (options?.moveAnonymousHistory) await moveWorkspace("anonymous", nextWorkspace);
        setActiveWorkspace(nextWorkspace);
        const load = await loadWorkspace(nextWorkspace);
        dispatch({ type: "hydrate", state: load.status === "ok" ? load.state : DEFAULT_STATE });
        unreadableRef.current = load.status === "unreadable" ? load.raw : null;
        setWorkspaceIssue(load.status === "unreadable" ? { reason: load.reason } : null);
        setWorkspaceId(nextWorkspace);
        /*
         * Retire any save still in flight for the workspace being left, so its
         * result cannot be reported against the one now on screen, and drop the
         * unsaved copy with it — retrying it here would write one workspace's
         * work into another.
         */
        saveRevisionRef.current += 1;
        unsavedRef.current = null;
        saveUpdateHoldRef.current?.();
        saveUpdateHoldRef.current = null;
        setSave(IDLE_SAVE);
      } finally {
        switchingRef.current = false;
        setHydrated(true);
      }
    });
    switchQueueRef.current = operation.catch(() => undefined);
    return operation;
  }, []);
  const isEvidenceSaved = useCallback((evidenceIds: readonly string[]) =>
    Boolean(durable && durable.workspace === workspaceId && evidenceIds.every((id) => durable.evidenceIds.has(id))),
  [durable, workspaceId]);
  const value = useMemo(
    () => ({
      state, dispatch, hydrated, workspaceId, switchWorkspace, save, retrySave, downloadRecoveryArchive,
      workspaceIssue, downloadUnreadableWorkspace, discardUnreadableWorkspace,
      restoreHold, restoreWorkspace, releaseRestoreToAccount, isEvidenceSaved
    }),
    [state, hydrated, workspaceId, switchWorkspace, save, retrySave, downloadRecoveryArchive, workspaceIssue,
     downloadUnreadableWorkspace, discardUnreadableWorkspace, restoreHold, restoreWorkspace, releaseRestoreToAccount, isEvidenceSaved]
  );
  return <Store.Provider value={value}>{children}</Store.Provider>;
}

export function useV8Store() {
  const value = useContext(Store);
  if (!value) throw new Error("useV8Store must be used inside V8StoreProvider");
  const navigate = (route: RouteId) => {
    history.pushState({}, "", ROUTE_PATHS[route]);
    value.dispatch({ type: "navigate", route });
  };
  return { ...value, navigate };
}
