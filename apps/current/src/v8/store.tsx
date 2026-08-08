import { createContext, useContext, useEffect, useMemo, useReducer, useState } from "react";
import { CURRICULUM } from "./curriculum";
import { completedActivityIdsFromEvidence } from "./learning";
import { loadPersistedState, newSketch, savePersistedState } from "./repository";
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
    case "mergeCloud": return withSketchFieldTimes(mergeCloudSnapshot(state, action.snapshot));
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
      const sketch = newSketch(state.sketches.length);
      return { ...state, sketches: [...state.sketches, sketch], activeSketchId: sketch.id, route: "create", updatedAt: changedAt };
    }
    case "updateSketch": return {
      ...state,
      sketches: state.sketches.map((sketch) => sketch.id === action.sketch.id ? action.sketch : sketch),
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

interface StoreValue { state: V8State; dispatch: React.Dispatch<Action>; hydrated: boolean }
const Store = createContext<StoreValue | null>(null);

export function V8StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, DEFAULT_STATE);
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    void loadPersistedState().then((persisted) => {
      if (persisted?.version === 8) dispatch({ type: "hydrate", state: persisted });
      setHydrated(true);
    });
  }, []);
  useEffect(() => {
    if (!hydrated) return;
    document.documentElement.dataset.theme = state.settings.theme;
    document.documentElement.dataset.motion = state.settings.reducedMotion ? "reduced" : "full";
    void savePersistedState(state).catch(() => undefined);
  }, [state, hydrated]);
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
  const value = useMemo(() => ({ state, dispatch, hydrated }), [state, hydrated]);
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
