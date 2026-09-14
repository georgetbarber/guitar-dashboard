import type { CloudProfile } from "./sync";
import type { CompetencyEvidence, LearnerSettings, Sketch, V8State } from "./types";
import { SKETCH_SYNC_FIELDS } from "./types";

const MODES = ["major", "minor", "dorian", "mixolydian", "blues"];
export const TONAL_ROOTS = ["C", "Db", "D", "Eb", "E", "F", "F#", "G", "Ab", "A", "Bb", "B"];
export const MODE_OPTIONS = [["major", "Major"], ["minor", "Natural minor"], ["dorian", "Dorian"], ["mixolydian", "Mixolydian"], ["blues", "Blues"]] as const;
const ROUTES = ["today", "path", "practice", "play", "create", "explore"];
type ObjectValue = Record<string, unknown>;
function fail(path: string): never { throw new Error(`Invalid learning data: ${path}. The existing workspace has not been replaced.`); }
function object(value: unknown, path: string): ObjectValue {
  if (!value || typeof value !== "object" || Array.isArray(value)) fail(path);
  return value as ObjectValue;
}
function str(value: unknown, path: string) { if (typeof value !== "string") fail(path); }
function id(value: unknown, path: string) { str(value, path); if (!value || (value as string).length > 160 || /[\/\u0000]/.test(value as string) || ["__proto__", "constructor", "prototype"].includes(value as string)) fail(path); }
function date(value: unknown, path: string) { str(value, path); if (!/^\d{4}-\d\d-\d\dT/.test(value as string) || !Number.isFinite(Date.parse(value as string))) fail(path); }
function number(value: unknown, path: string, min: number, max: number, integer = false) {
  if (typeof value !== "number" || !Number.isFinite(value) || value < min || value > max || (integer && !Number.isInteger(value))) fail(path);
}
function choice(value: unknown, options: readonly string[], path: string) { if (!options.includes(value as string)) fail(path); }
function list(value: unknown, path: string, check: (v: unknown, p: string) => void) {
  if (!Array.isArray(value)) fail(path);
  value.forEach((item, index) => check(item, `${path}[${index}]`));
}
function identifiedList(value: unknown, path: string, check: (v: unknown, p: string) => void) {
  const ids = new Set<unknown>();
  list(value, path, (v, p) => { check(v, p); const key = object(v, p).id; if (ids.has(key)) fail(`${p}.duplicate id`); ids.add(key); });
}
function nullable(value: unknown, check: (v: unknown, p: string) => void, path: string) { if (value !== null) check(value, path); }
function root(value: unknown, path: string) { if (typeof value !== "string" || !/^[A-G](?:b|#)?$/.test(value)) fail(path); }
function settings(value: unknown, path: string) {
  const v = object(value, path);
  choice(v.instrument, ["electric", "acoustic"], `${path}.instrument`);
  number(v.dailyMinutes, `${path}.dailyMinutes`, 10, 90, true);
  root(v.tonicName, `${path}.tonicName`); choice(v.mode, MODES, `${path}.mode`);
  choice(v.theme, ["light", "dark"], `${path}.theme`);
  choice(v.startingBaseline, ["repair", "some", "secure"], `${path}.startingBaseline`);
  for (const key of ["reducedMotion", "diagnosticComplete"]) if (typeof v[key] !== "boolean") fail(`${path}.${key}`);
}
function chord(value: unknown, path: string) {
  const v = object(value, path); id(v.id, `${path}.id`); str(v.symbol, `${path}.symbol`);
  number(v.beats, `${path}.beats`, .125, 16);
  if (!Array.isArray(v.voicing) || v.voicing.length !== 6) fail(`${path}.voicing`);
  list(v.voicing, `${path}.voicing`, (fret, p) => nullable(fret, (f, q) => number(f, q, 0, 36, true), p));
}
function melody(value: unknown, path: string) {
  const v = object(value, path); id(v.id, `${path}.id`);
  number(v.string, `${path}.string`, 0, 5, true); number(v.fret, `${path}.fret`, 0, 36, true);
  number(v.beat, `${path}.beat`, 0, 1e6); number(v.duration, `${path}.duration`, .001, 1e6);
}
function material(v: ObjectValue, path: string) {
  identifiedList(v.chords, `${path}.chords`, chord); identifiedList(v.melody, `${path}.melody`, melody);
  list(v.sections, `${path}.sections`, str); str(v.notes, `${path}.notes`); str(v.rhythmPattern, `${path}.rhythmPattern`);
}
function sketch(value: unknown, path: string) {
  const v = object(value, path); id(v.id, `${path}.id`);
  for (const key of ["name", "intention", "bassMovement", "ambiguityNotes"]) str(v[key], `${path}.${key}`);
  date(v.createdAt, `${path}.createdAt`); date(v.updatedAt, `${path}.updatedAt`);
  number(v.tempo, `${path}.tempo`, 20, 400);
  choice(v.metre, ["4/4", "3/4", "6/8"], `${path}.metre`);
  nullable(v.key, root, `${path}.key`); nullable(v.mode, (m, p) => choice(m, MODES, p), `${path}.mode`);
  choice(v.status, ["capture", "understand", "vary", "arrange", "record", "compare", "revise", "finished"], `${path}.status`);
  list(v.tags, `${path}.tags`, str); material(v, path);
  identifiedList(v.takes, `${path}.takes`, (t, p) => {
    const take = object(t, p); id(take.id, `${p}.id`); str(take.name, `${p}.name`); str(take.note, `${p}.note`); date(take.createdAt, `${p}.createdAt`);
    if (take.blobId !== undefined) id(take.blobId, `${p}.blobId`);
    if (take.cloud !== undefined) {
      const cloud = object(take.cloud, `${p}.cloud`); str(cloud.storagePath, `${p}.cloud.storagePath`);
      if (!/^users\/[^/]+\/finished-takes\/[^/]+\/[^/]+$/.test(cloud.storagePath as string)) fail(`${p}.cloud.storagePath`);
      str(cloud.contentType, `${p}.cloud.contentType`);
      if (!(cloud.contentType as string).startsWith("audio/")) fail(`${p}.cloud.contentType`);
      number(cloud.bytes, `${p}.cloud.bytes`, 0, 50 * 1024 * 1024, true); date(cloud.uploadedAt, `${p}.cloud.uploadedAt`);
    }
  });
  identifiedList(v.revisions, `${path}.revisions`, (r, p) => { const rev = object(r, p); id(rev.id, `${p}.id`); str(rev.summary, `${p}.summary`); date(rev.createdAt, `${p}.createdAt`); material(object(rev.snapshot, `${p}.snapshot`), `${p}.snapshot`); });
  identifiedList(v.reflections, `${path}.reflections`, (r, p) => { const ref = object(r, p); id(ref.id, `${p}.id`); str(ref.prompt, `${p}.prompt`); str(ref.response, `${p}.response`); date(ref.createdAt, `${p}.createdAt`); });
  if (v.fieldUpdatedAt !== undefined) for (const [key, time] of Object.entries(object(v.fieldUpdatedAt, `${path}.fieldUpdatedAt`))) { choice(key, SKETCH_SYNC_FIELDS, `${path}.fieldUpdatedAt key`); date(time, `${path}.${key} time`); }
}
function evidence(value: unknown, path: string) {
  const v = object(value, path);
  for (const key of ["id", "competencyId", "activityId"]) id(v[key], `${path}.${key}`);
  choice(v.source, ["recognition", "production", "performance", "transfer", "creation", "reflection"], `${path}.source`);
  choice(v.assistance, ["none", "hint", "reveal", "guided"], `${path}.assistance`);
  choice(v.outcome, ["successful", "partial", "retry"], `${path}.outcome`); date(v.occurredAt, `${path}.occurredAt`);
  // Absent on records written before the field existed; those are self-reported too.
  if (v.method !== undefined) choice(v.method, ["self-reported"], `${path}.method`);
  if (v.artifactId !== undefined) id(v.artifactId, `${path}.artifactId`);
  if (v.retracts !== undefined) id(v.retracts, `${path}.retracts`);
  const c = object(v.context, `${path}.context`);
  for (const key of Object.keys(c)) choice(key, ["key", "mode", "fretRegion", "tempo", "instrument"], `${path}.context key`);
  if (c.key !== undefined) root(c.key, `${path}.context.key`);
  if (c.mode !== undefined) choice(c.mode, MODES, `${path}.context.mode`);
  if (c.instrument !== undefined) choice(c.instrument, ["electric", "acoustic"], `${path}.context.instrument`);
  if (c.tempo !== undefined) number(c.tempo, `${path}.context.tempo`, 20, 400);
  if (c.fretRegion !== undefined) {
    if (!Array.isArray(c.fretRegion) || c.fretRegion.length !== 2) fail(`${path}.fretRegion`);
    list(c.fretRegion, `${path}.fretRegion`, (f, p) => number(f, p, 0, 36, true));
    if (c.fretRegion[0] > c.fretRegion[1]) fail(`${path}.fretRegion order`);
  }
}
function deletions(value: unknown, path: string) { for (const [key, time] of Object.entries(object(value, path))) { id(key, `${path} key`); date(time, `${path}.${key}`); } }
export function validateSketch(value: unknown): asserts value is Sketch { sketch(value, "sketch"); }
export function validateEvidence(value: unknown): asserts value is CompetencyEvidence { evidence(value, "observation"); }
export function validateSettings(value: unknown): asserts value is LearnerSettings { settings(value, "settings"); }
export function validateProfile(value: unknown): asserts value is CloudProfile {
  const v = object(value, "profile"); if (v.schemaVersion !== 1) fail("profile version");
  id(v.activeUnitId, "profile unit"); list(v.completedActivityIds, "profile completions", id); settings(v.settings, "profile settings");
  date(v.settingsUpdatedAt, "settings date"); date(v.updatedAt, "profile date"); str(v.lastReflection, "reflection"); deletions(v.deletedSketchIds, "deletions");
}
/** Structural validation preserves oversized legacy music. Cloud limits are separate. */
export function validateState(value: unknown): asserts value is V8State {
  const v = object(value, "workspace"); if (v.version !== 8 || v.syncVersion !== 1) fail("workspace version");
  settings(v.settings, "settings"); date(v.updatedAt, "workspace date"); date(v.settingsUpdatedAt, "settings date");
  choice(v.route, ROUTES, "route"); id(v.activeUnitId, "active unit");
  for (const key of ["activeActivityId", "resumeActivityId", "activeSketchId"]) nullable(v[key], id, key);
  // An older client wrote an empty activeActivityId when closing its overlay.
  if (v.activityOrigin != null) choice(v.activityOrigin, ROUTES, "activity origin");
  identifiedList(v.sketches, "sketches", sketch); identifiedList(v.evidence, "evidence", evidence);
  list(v.completedActivityIds, "completions", id); str(v.lastReflection, "reflection");
  if (v.deletedSketchIds !== undefined) deletions(v.deletedSketchIds, "deletions");
}
