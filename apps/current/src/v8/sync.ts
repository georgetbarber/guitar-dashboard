import { SKETCH_SYNC_FIELDS } from "./types";
import { completedActivityIdsFromEvidence } from "./learning";
import type { CompetencyEvidence, LearnerSettings, Sketch, SketchSyncField, V8State } from "./types";

export interface CloudProfile {
  schemaVersion: 1;
  activeUnitId: string;
  completedActivityIds: string[];
  settings: LearnerSettings;
  settingsUpdatedAt: string;
  lastReflection: string;
  deletedSketchIds: Record<string, string>;
  updatedAt: string;
}

export interface CloudSnapshot {
  profile?: CloudProfile | null;
  evidence?: CompetencyEvidence[];
  sketches?: Sketch[];
}

export function cloudProfile(state: V8State): CloudProfile {
  return {
    schemaVersion: 1,
    activeUnitId: state.activeUnitId,
    completedActivityIds: state.completedActivityIds,
    settings: state.settings,
    settingsUpdatedAt: state.settingsUpdatedAt,
    lastReflection: state.lastReflection,
    deletedSketchIds: state.deletedSketchIds,
    updatedAt: state.updatedAt
  };
}

export function cloudSketch(sketch: Sketch): Sketch {
  // Device blob ids remain private. Only metadata for takes the learner explicitly
  // selected from a finished project enters cloud sync.
  return {
    ...sketch,
    takes: sketch.takes.filter((take) => take.cloud).map((take) => ({ ...take, blobId: undefined }))
  };
}

function newestDate(a?: string, b?: string): string {
  return !a || (b && b > a) ? (b ?? a ?? "") : a;
}

function mergeDeletions(local: Record<string, string>, remote: Record<string, string> = {}) {
  const merged = { ...local };
  for (const [id, occurredAt] of Object.entries(remote)) merged[id] = newestDate(merged[id], occurredAt);
  return merged;
}

function mergeTakes(local: Sketch["takes"], remote: Sketch["takes"], remoteIsNewer: boolean) {
  const remoteById = new Map(remote.map((take) => [take.id, take]));
  const merged = remote.map((take) => {
    const deviceTake = local.find((item) => item.id === take.id);
    return deviceTake ? { ...take, ...deviceTake, cloud: newestDate(deviceTake.cloud?.uploadedAt, take.cloud?.uploadedAt) === take.cloud?.uploadedAt ? take.cloud : deviceTake.cloud } : take;
  });
  for (const take of local) {
    if (remoteById.has(take.id)) continue;
    // A newer cloud sketch omitting previously shared metadata means the cloud copy
    // was deliberately removed. Preserve only a private device copy, if one exists.
    if (remoteIsNewer && take.cloud) {
      if (take.blobId) merged.push({ ...take, cloud: undefined });
    } else {
      merged.push(take);
    }
  }
  return merged.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

function mergeRevisions(local: Sketch["revisions"], remote: Sketch["revisions"]) {
  const byId = new Map([...remote, ...local].map((revision) => [revision.id, revision]));
  return [...byId.values()].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

function fieldTime(sketch: Sketch, field: SketchSyncField): string {
  return sketch.fieldUpdatedAt?.[field] ?? sketch.updatedAt;
}

function mergeSketch(local: Sketch, remote: Sketch): Sketch {
  const remoteIsNewer = remote.updatedAt > local.updatedAt;
  const merged = { ...local } as Sketch;
  const fieldUpdatedAt: Sketch["fieldUpdatedAt"] = { ...local.fieldUpdatedAt };
  for (const field of SKETCH_SYNC_FIELDS) {
    const localTime = fieldTime(local, field);
    const remoteTime = fieldTime(remote, field);
    if (remoteTime > localTime) merged[field] = remote[field] as never;
    fieldUpdatedAt[field] = newestDate(localTime, remoteTime);
  }
  return {
    ...merged,
    createdAt: local.createdAt < remote.createdAt ? local.createdAt : remote.createdAt,
    updatedAt: newestDate(local.updatedAt, remote.updatedAt),
    fieldUpdatedAt,
    takes: mergeTakes(local.takes, remote.takes, remoteIsNewer),
    revisions: mergeRevisions(local.revisions, remote.revisions)
  };
}

export function mergeCloudSnapshot(state: V8State, incoming: CloudSnapshot): V8State {
  const profile = incoming.profile;
  const remoteIsNewer = Boolean(profile && profile.updatedAt > state.updatedAt);
  const remoteSettingsAreNewer = Boolean(profile && profile.settingsUpdatedAt > state.settingsUpdatedAt);
  const deletedSketchIds = mergeDeletions(state.deletedSketchIds, profile?.deletedSketchIds);
  const evidence = [...state.evidence];
  const evidenceIds = new Set(evidence.map((item) => item.id));
  for (const item of incoming.evidence ?? []) if (!evidenceIds.has(item.id)) evidence.push(item);

  const sketches = new Map(state.sketches.map((sketch) => [sketch.id, sketch]));
  for (const remote of incoming.sketches ?? []) {
    const local = sketches.get(remote.id);
    if (!local) sketches.set(remote.id, remote);
    else sketches.set(local.id, mergeSketch(local, remote));
  }
  const visibleSketches = [...sketches.values()].filter((sketch) => !deletedSketchIds[sketch.id] || deletedSketchIds[sketch.id] < sketch.updatedAt);
  const activeSketchId = visibleSketches.some((sketch) => sketch.id === state.activeSketchId) ? state.activeSketchId : null;

  return {
    ...state,
    activeUnitId: remoteIsNewer && profile ? profile.activeUnitId : state.activeUnitId,
    // Evidence is the durable source of truth. A profile can arrive before its
    // evidence snapshot, but uploads wait until all remote collections load.
    completedActivityIds: completedActivityIdsFromEvidence(evidence),
    settings: remoteSettingsAreNewer && profile ? profile.settings : state.settings,
    settingsUpdatedAt: remoteSettingsAreNewer && profile ? profile.settingsUpdatedAt : state.settingsUpdatedAt,
    lastReflection: remoteIsNewer && profile ? profile.lastReflection : state.lastReflection,
    deletedSketchIds,
    evidence: evidence.sort((a, b) => a.occurredAt.localeCompare(b.occurredAt)),
    sketches: visibleSketches.sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
    activeSketchId,
    updatedAt: newestDate(state.updatedAt, profile?.updatedAt)
  };
}
