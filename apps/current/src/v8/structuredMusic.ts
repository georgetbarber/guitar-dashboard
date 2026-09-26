import { normalize, spelledPitchClass } from "../core/music/theory";

/** Standard tuning is stored low E to high E; string 1 is the high E. */
export const STANDARD_TUNING_MIDI = [40, 45, 50, 55, 59, 64] as const;
export type GuitarString = 1 | 2 | 3 | 4 | 5 | 6;

export interface GuitarPosition {
  string: GuitarString;
  fret: number;
}

export type MaterialEvent =
  | {
      id: string;
      kind: "note";
      atBeat: number;
      beats: number;
      midi: number;
      spelling: string;
      position: GuitarPosition;
      articulation: "full-value" | "short";
    }
  | { id: string; kind: "rest"; atBeat: number; beats: number };

export interface MusicalMaterial {
  id: string;
  version: number;
  title: string;
  review: { status: "draft" } | { status: "reviewed"; reviewer: string; reviewedAt: string };
  tuningMidi: readonly [number, number, number, number, number, number];
  tonalCenter: { name: string; midi: number };
  metre: { numerator: 4; denominator: 4 };
  bars: number;
  tempo: { minimum: number; default: number; maximum: number };
  sections: readonly { id: string; label: string; fromBeat: number; toBeat: number }[];
  events: readonly MaterialEvent[];
  derivedFrom?: { id: string; version: number; changedDimension: "rhythm" | "pitch" | "articulation" };
}

/** A human-played reference is a separate asset, linked to an exact material version. */
export interface PerformanceReference {
  id: string;
  materialId: string;
  materialVersion: number;
  assetPath: string;
  reviewedBy: string;
  reviewedAt: string;
}

export function positionMidi(tuning: MusicalMaterial["tuningMidi"], position: GuitarPosition): number {
  return tuning[6 - position.string] + position.fret;
}

/** Full coverage makes count, notation and audio use the same timeline. */
export function validateMaterial(material: MusicalMaterial): string[] {
  const errors: string[] = [];
  const totalBeats = material.bars * material.metre.numerator;
  if (!material.id || !Number.isInteger(material.version) || material.version < 1)
    errors.push("Material needs a stable ID and positive version.");
  if (
    material.review.status === "reviewed" &&
    (!material.review.reviewer || !Number.isFinite(Date.parse(material.review.reviewedAt)))
  )
    errors.push("Reviewed material needs a reviewer and date.");
  if (!Number.isInteger(material.bars) || material.bars < 1 || material.bars > 16)
    errors.push("Material has an invalid bar count.");
  if (material.tuningMidi.some((midi) => !Number.isInteger(midi) || midi < 0 || midi > 127))
    errors.push("Tuning contains an invalid MIDI pitch.");
  if (!(
    material.tempo.minimum >= 30 &&
    material.tempo.minimum <= material.tempo.default &&
    material.tempo.default <= material.tempo.maximum &&
    material.tempo.maximum <= 240
  ))
    errors.push("Tempo range is invalid.");
  if (
    !Number.isInteger(material.tonalCenter.midi) ||
    material.tonalCenter.midi < 0 ||
    material.tonalCenter.midi > 127 ||
    spelledPitchClass(material.tonalCenter.name) !== normalize(material.tonalCenter.midi)
  )
    errors.push("Tonal centre spelling and pitch disagree.");

  let nextBeat = 0;
  const ids = new Set<string>();
  for (const event of material.events) {
    if (!event.id || ids.has(event.id)) errors.push(`Duplicate or empty event ID: ${event.id}`);
    ids.add(event.id);
    if (
      !Number.isFinite(event.atBeat) ||
      !Number.isFinite(event.beats) ||
      event.beats <= 0 ||
      event.atBeat !== nextBeat
    )
      errors.push(`Gap, overlap or invalid duration at ${event.id}.`);
    nextBeat = event.atBeat + event.beats;
    if (event.kind === "note") {
      if (!Number.isInteger(event.midi) || event.midi < 0 || event.midi > 127)
        errors.push(`Invalid MIDI pitch at ${event.id}.`);
      if (
        !Number.isInteger(event.position.fret) ||
        event.position.fret < 0 ||
        event.position.fret > 24 ||
        !Number.isInteger(event.position.string) ||
        event.position.string < 1 ||
        event.position.string > 6
      )
        errors.push(`Unplayable position at ${event.id}.`);
      else if (event.midi !== positionMidi(material.tuningMidi, event.position))
        errors.push(`Pitch and guitar position disagree at ${event.id}.`);
      if (spelledPitchClass(event.spelling) !== normalize(event.midi))
        errors.push(`Pitch spelling disagrees at ${event.id}.`);
    }
  }
  if (nextBeat !== totalBeats) errors.push(`Events end at beat ${nextBeat}, expected ${totalBeats}.`);

  let nextSection = 0;
  const sectionIds = new Set<string>();
  for (const section of material.sections) {
    if (!section.id || sectionIds.has(section.id)) errors.push(`Duplicate or empty section ID: ${section.id}`);
    sectionIds.add(section.id);
    if (section.fromBeat !== nextSection || section.toBeat <= section.fromBeat || section.toBeat > totalBeats)
      errors.push(`Sections do not join at ${section.id}.`);
    nextSection = section.toBeat;
  }
  if (nextSection !== totalBeats) errors.push("Sections do not cover the complete study.");
  return errors;
}
