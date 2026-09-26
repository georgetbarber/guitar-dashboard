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
function id(value: unknown, path: string) {
  str(value, path);
  const text = value as string;
  if (!text || text.length > 160 || text.includes("/") || text.includes("\u0000") || ["__proto__", "constructor", "prototype"].includes(text)) fail(path);
}
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
function pilotIdentity(v: ObjectValue, path: string) {
  id(v.episodeId, `${path}.episodeId`); id(v.materialId, `${path}.materialId`);
  number(v.episodeVersion, `${path}.episodeVersion`, 1, 1000, true);
  number(v.materialVersion, `${path}.materialVersion`, 1, 1000, true);
}
function pilotCursor(value: unknown, path: string) {
  const v = object(value, path); id(v.id, `${path}.id`); pilotIdentity(v, path);
  choice(v.step, ["learn", "practise", "try", "repair", "vary", "return"], `${path}.step`);
  choice(v.sectionId, ["whole", "question", "answer"], `${path}.sectionId`);
  choice(v.assistance, ["none", "hint", "reveal", "guided"], `${path}.assistance`);
  if (v.attemptId !== undefined) id(v.attemptId, `${path}.attemptId`);
  number(v.tempo, `${path}.tempo`, 20, 400, true);
  if (v.repairId !== undefined) id(v.repairId, `${path}.repairId`);
  date(v.updatedAt, `${path}.updatedAt`);
}
function pilotAttempt(value: unknown, path: string) {
  const v = object(value, path); id(v.id, `${path}.id`); id(v.cursorId, `${path}.cursorId`); pilotIdentity(v, path);
  choice(v.kind, ["first-check", "later-check"], `${path}.kind`);
  choice(v.assistance, ["none", "hint", "reveal", "guided"], `${path}.assistance`);
  choice(v.method, ["self-reported"], `${path}.method`);
  choice(v.outcome, ["successful", "partial", "retry"], `${path}.outcome`);
  number(v.tempo, `${path}.tempo`, 20, 400, true);
  str(v.observation, `${path}.observation`); if ((v.observation as string).length > 1000) fail(`${path}.observation length`);
  date(v.occurredAt, `${path}.occurredAt`);
}
function pilotVariation(value: unknown, path: string) {
  const v = object(value, path); id(v.id, `${path}.id`);
  id(v.sourceMaterialId, `${path}.sourceMaterialId`); id(v.materialId, `${path}.materialId`);
  number(v.sourceVersion, `${path}.sourceVersion`, 1, 1000, true);
  number(v.materialVersion, `${path}.materialVersion`, 1, 1000, true);
  if (v.answerMiddleCount !== 3) fail(`${path}.answerMiddleCount`);
  date(v.createdAt, `${path}.createdAt`);
}
function sessionPlan(value: unknown, path: string) {
  const v = object(value, path);
  id(v.id, `${path}.id`); id(v.unitId, `${path}.unitId`);
  str(v.title, `${path}.title`); str(v.purpose, `${path}.purpose`);
  date(v.generatedAt, `${path}.generatedAt`);
  if (v.kind !== undefined) choice(v.kind, ["full", "return"], `${path}.kind`);
  number(v.totalMinutes, `${path}.totalMinutes`, 1, 90, true);
  let minutes = 0;
  if (!Array.isArray(v.items) || v.items.length < 1 || v.items.length > 8) fail(`${path}.items`);
  for (const [index, item] of v.items.entries()) {
    const entry = object(item, `${path}.items[${index}]`);
    id(entry.activityId, `${path}.items[${index}].activityId`);
    str(entry.title, `${path}.items[${index}].title`);
    str(entry.purpose, `${path}.items[${index}].purpose`);
    choice(entry.kind, ["listen-compare", "sing-predict", "technique", "rhythm", "relationship", "play-reveal", "variation", "creative", "transfer", "reflection"], `${path}.items[${index}].kind`);
    number(entry.minutes, `${path}.items[${index}].minutes`, 1, 90, true);
    minutes += entry.minutes as number;
  }
  if (minutes !== v.totalMinutes) fail(`${path}.totalMinutes`);
}
function exploreFocus(value: unknown, path: string) {
  const v = object(value, path);
  id(v.materialId, `${path}.materialId`); id(v.returnActivityId, `${path}.returnActivityId`);
  number(v.materialVersion, `${path}.materialVersion`, 1, 1000, true);
  number(v.tempo, `${path}.tempo`, 20, 400, true);
  choice(v.sectionId, ["whole", "question", "answer"], `${path}.sectionId`);
  choice(v.returnRoute, ROUTES, `${path}.returnRoute`);
  date(v.openedAt, `${path}.openedAt`);
}
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
  if (v.pendingRestoreId !== undefined) id(v.pendingRestoreId, "pending restore");
  if (v.pilotCursor != null) pilotCursor(v.pilotCursor, "pilot cursor");
  if (v.pilotAttempts !== undefined) identifiedList(v.pilotAttempts, "pilot attempts", pilotAttempt);
  if (v.pilotVariations !== undefined) identifiedList(v.pilotVariations, "pilot variations", pilotVariation);
  if (v.sessionPlan != null) sessionPlan(v.sessionPlan, "session plan");
  if (v.sessionCursor !== undefined) number(v.sessionCursor, "session cursor", 0, 8, true);
  if (v.personalGoal !== undefined) { str(v.personalGoal, "personal goal"); if ((v.personalGoal as string).length > 160) fail("personal goal length"); }
  if (v.exploreFocus != null) exploreFocus(v.exploreFocus, "explore focus");
  settings(v.settings, "settings"); date(v.updatedAt, "workspace date"); date(v.settingsUpdatedAt, "settings date");
  choice(v.route, ROUTES, "route"); id(v.activeUnitId, "active unit");
  for (const key of ["activeActivityId", "resumeActivityId", "activeSketchId"]) nullable(v[key], id, key);
  // An older client wrote an empty activeActivityId when closing its overlay.
  if (v.activityOrigin != null) choice(v.activityOrigin, ROUTES, "activity origin");
  identifiedList(v.sketches, "sketches", sketch); identifiedList(v.evidence, "evidence", evidence);
  list(v.completedActivityIds, "completions", id); str(v.lastReflection, "reflection");
  if (v.deletedSketchIds !== undefined) deletions(v.deletedSketchIds, "deletions");
}
