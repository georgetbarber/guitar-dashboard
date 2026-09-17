import type { Sketch, V8State } from "./types";

/**
 * CLIENT-SIDE BOUNDS THAT MIRROR firestore.rules.
 *
 * The rules validate every field of a sketch and of the learner profile. A batch
 * commit is atomic, so a single out-of-range field does not fail its own write —
 * it fails the whole batch, taking every other sketch and every piece of
 * evidence in that batch with it, and the same rejected batch is retried on the
 * next state change. Once a value is out of range the learner's cloud sync stops
 * for good.
 *
 * These numbers must stay equal to the ones in apps/current/firestore.rules.
 * tests/firebaseRules.test.ts covers the rules; limits.test.ts covers this file.
 *
 * WHAT THESE BOUNDS DO, AND DELIBERATELY DO NOT DO.
 *
 * They do not truncate. An earlier version of this file silently cut every
 * over-length string back to the cap, on the argument that losing the overflow
 * beat losing sync. That argument is wrong in the one case it matters: the caps
 * are far above anything typed by hand, so in practice they are reached by
 * accumulated work, and quietly deleting a learner's accumulated work to make a
 * cloud document fit is the worst of the available outcomes.
 *
 * Instead the bounds are used three ways:
 *   - admitSketchEdit refuses an edit that would newly exceed a cap, so the
 *     interface can say so while the learner still has the text in hand;
 *   - material that is already over a cap is preserved untouched, because it is
 *     the learner's and a bound introduced later must not consume it;
 *   - uploadable() keeps an over-limit document out of the batch, so it cannot
 *     take unrelated work down with it, and sync continues for everything else.
 */
export const SKETCH_LIMITS = {
  tempoMin: 20,
  tempoMax: 400,
  tempoFallback: 72,
  name: 300,
  intention: 5000,
  rhythmPattern: 20000,
  bassMovement: 20000,
  notes: 200000,
  ambiguityNotes: 20000,
  tags: 100,
  chords: 512,
  melody: 4096,
  sections: 128,
  takes: 200,
  revisions: 500,
  reflections: 500
} as const;

export const PROFILE_LIMITS = {
  lastReflection: 20000,
  activeUnitId: 64,
  completedActivityIds: 5000,
  deletedSketchIds: 2000
} as const;

/**
 * Firestore refuses a document over 1 MiB outright, before any rule runs, and
 * the per-field caps above do not add up to a guarantee: 500 revisions each
 * carrying a snapshot of the music will pass every individual check and still
 * exceed the document limit.
 *
 * The budget leaves headroom for key names and Firestore's own encoding
 * overhead, neither of which JSON length accounts for.
 */
export const CLOUD_DOCUMENT_LIMIT_BYTES = 1_048_576;
export const CLOUD_DOCUMENT_BUDGET_BYTES = 900_000;

const TEXT_FIELDS = ["name", "intention", "rhythmPattern", "bassMovement", "notes", "ambiguityNotes"] as const;
const LIST_FIELDS = ["tags", "chords", "melody", "sections", "takes", "revisions", "reflections"] as const;

export interface Exceedance {
  field: string;
  size: number;
  limit: number;
  unit: "characters" | "entries" | "bytes";
}

export function estimateDocumentBytes(value: unknown): number {
  try { return new TextEncoder().encode(JSON.stringify(value)).length; }
  catch { return Number.POSITIVE_INFINITY; }
}

/** Everything about this sketch that the cloud would refuse. Empty means it can be uploaded. */
export function sketchExceedances(sketch: Sketch): Exceedance[] {
  const found: Exceedance[] = [];
  for (const field of TEXT_FIELDS) {
    const size = sketch[field]?.length ?? 0;
    if (size > SKETCH_LIMITS[field]) found.push({ field, size, limit: SKETCH_LIMITS[field], unit: "characters" });
  }
  for (const field of LIST_FIELDS) {
    const size = sketch[field]?.length ?? 0;
    if (size > SKETCH_LIMITS[field]) found.push({ field, size, limit: SKETCH_LIMITS[field], unit: "entries" });
  }
  const tempo = sketch.tempo;
  if (!Number.isFinite(tempo) || tempo < SKETCH_LIMITS.tempoMin || tempo > SKETCH_LIMITS.tempoMax) {
    found.push({ field: "tempo", size: Number.isFinite(tempo) ? tempo : 0, limit: SKETCH_LIMITS.tempoMax, unit: "entries" });
  }
  const bytes = estimateDocumentBytes(sketch);
  if (bytes > CLOUD_DOCUMENT_BUDGET_BYTES) found.push({ field: "the whole sketch", size: bytes, limit: CLOUD_DOCUMENT_BUDGET_BYTES, unit: "bytes" });
  return found;
}

/** Everything about the account profile that the cloud would refuse. */
export function profileExceedances(state: V8State): Exceedance[] {
  const found: Exceedance[] = [];
  if (state.lastReflection.length > PROFILE_LIMITS.lastReflection) {
    found.push({ field: "lastReflection", size: state.lastReflection.length, limit: PROFILE_LIMITS.lastReflection, unit: "characters" });
  }
  if (state.activeUnitId.length > PROFILE_LIMITS.activeUnitId) {
    found.push({ field: "activeUnitId", size: state.activeUnitId.length, limit: PROFILE_LIMITS.activeUnitId, unit: "characters" });
  }
  if (state.completedActivityIds.length > PROFILE_LIMITS.completedActivityIds) {
    found.push({ field: "completedActivityIds", size: state.completedActivityIds.length, limit: PROFILE_LIMITS.completedActivityIds, unit: "entries" });
  }
  /*
   * Deletion records are counted and reported, never pruned. Dropping one to fit
   * the cap lets a device that has been offline since before the deletion
   * resurrect the deleted sketch on its next sync, which is a far worse failure
   * than a profile that will not upload and says so.
   */
  const deletions = Object.keys(state.deletedSketchIds).length;
  if (deletions > PROFILE_LIMITS.deletedSketchIds) {
    found.push({ field: "deletedSketchIds", size: deletions, limit: PROFILE_LIMITS.deletedSketchIds, unit: "entries" });
  }
  return found;
}

const FIELD_NAMES: Record<string, string> = {
  name: "the title", intention: "what this music should do", rhythmPattern: "the rhythm identity",
  bassMovement: "the bass movement", notes: "the notes to your future self", ambiguityNotes: "the alternate readings",
  tags: "tags", chords: "chords", melody: "melody notes", sections: "sections", takes: "takes",
  revisions: "preserved revisions", reflections: "reflections", tempo: "the tempo",
  lastReflection: "your last reflection", activeUnitId: "the current unit",
  completedActivityIds: "completed activities", deletedSketchIds: "deletion records"
};

export function describeExceedance(exceedance: Exceedance): string {
  const name = FIELD_NAMES[exceedance.field] ?? exceedance.field;
  if (exceedance.unit === "bytes") return `${name} is ${Math.round(exceedance.size / 1024)} KB, over the ${Math.round(exceedance.limit / 1024)} KB a single cloud record can hold`;
  if (exceedance.field === "tempo") return `${name} is outside the ${SKETCH_LIMITS.tempoMin}–${SKETCH_LIMITS.tempoMax} range`;
  return `${name} has ${exceedance.size} ${exceedance.unit}, over the limit of ${exceedance.limit}`;
}

export function describeExceedances(exceedances: Exceedance[]): string {
  return exceedances.map(describeExceedance).join("; ");
}

/** Clamp to the permitted range; a cleared or non-finite field falls back rather than becoming 0. */
export function boundTempo(value: number): number {
  if (!Number.isFinite(value) || value <= 0) return SKETCH_LIMITS.tempoFallback;
  return Math.min(SKETCH_LIMITS.tempoMax, Math.max(SKETCH_LIMITS.tempoMin, Math.round(value)));
}

/**
 * The one value still clamped rather than refused. Tempo comes from a number
 * input, has no content to lose, and an out-of-range figure is a typo or an
 * empty box rather than work the learner did.
 */
export function clampSketchTempo(sketch: Sketch): Sketch {
  const tempo = boundTempo(sketch.tempo);
  return tempo === sketch.tempo ? sketch : { ...sketch, tempo };
}

export interface SketchEditDecision {
  /** What should actually be stored. */
  admitted: Sketch;
  /** Fields whose new value was refused, with the reason. Empty means the edit went through whole. */
  refused: Exceedance[];
}

/**
 * Admit an edit, refusing only the fields it would newly push over a cap.
 *
 * "Newly" is the important word. A field that is already over its cap — because
 * it was written before the cap existed, or arrived from another device — is
 * left alone as long as the edit does not make it larger. The learner keeps
 * working on their oversized sketch locally; only the cloud declines it, and
 * only visibly.
 */
export function admitSketchEdit(previous: Sketch | undefined, next: Sketch): SketchEditDecision {
  const candidate = clampSketchTempo(next);
  if (!previous) return { admitted: candidate, refused: [] };

  const before = new Map(sketchExceedances(previous).map((item) => [item.field, item]));
  const refused: Exceedance[] = [];
  const admitted = { ...candidate } as Sketch;

  for (const exceedance of sketchExceedances(candidate)) {
    if (exceedance.field === "the whole sketch" || exceedance.field === "tempo") continue;
    const existing = before.get(exceedance.field);
    if (existing && exceedance.size <= existing.size) continue;
    refused.push(exceedance);
    (admitted as unknown as Record<string, unknown>)[exceedance.field] = (previous as unknown as Record<string, unknown>)[exceedance.field];
  }
  return { admitted, refused };
}
