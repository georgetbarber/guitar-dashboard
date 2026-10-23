/**
 * WRITTEN CHORD SYMBOLS AS INTERVAL STRUCTURES.
 *
 * The key-based chord model in theory.ts builds seven qualities from a scale.
 * Authored guitar music also writes power chords, sixths, suspensions, ninths
 * and slash chords. This module reads those symbols as a root plus intervals,
 * reusing theory.ts's formulas for the seven shared qualities rather than
 * restating them, so a voicing can be checked against what its name promises.
 */
import { CHORD_FORMULAS, normalize, spellAboveRoot, spelledPitchClass } from "./theory";
import type { PitchClass } from "./types";

export interface ChordSymbolFormula {
  suffix: string;
  name: string;
  /** Semitones above the root, in stacking order. */
  intervals: readonly number[];
  /** Degree labels relative to the chord root, matching `intervals`. */
  labels: readonly string[];
  /** Intervals a guitar voicing may leave out without changing the chord's name. */
  optional: readonly number[];
}

const SHARED: Record<string, { quality: keyof typeof CHORD_FORMULAS; name: string; optional: readonly number[] }> = {
  "": { quality: "major", name: "major", optional: [] },
  m: { quality: "minor", name: "minor", optional: [] },
  dim: { quality: "diminished", name: "diminished", optional: [] },
  "7": { quality: "dominant7", name: "dominant seventh", optional: [7] },
  maj7: { quality: "major7", name: "major seventh", optional: [7] },
  m7: { quality: "minor7", name: "minor seventh", optional: [7] },
  m7b5: { quality: "half-diminished7", name: "half-diminished seventh", optional: [] },
};

const EXTENDED: readonly ChordSymbolFormula[] = [
  { suffix: "5", name: "power chord (root and fifth)", intervals: [0, 7], labels: ["1", "5"], optional: [] },
  { suffix: "6", name: "major sixth", intervals: [0, 4, 7, 9], labels: ["1", "3", "5", "6"], optional: [7] },
  { suffix: "m6", name: "minor sixth", intervals: [0, 3, 7, 9], labels: ["1", "b3", "5", "6"], optional: [7] },
  { suffix: "sus2", name: "suspended second", intervals: [0, 2, 7], labels: ["1", "2", "5"], optional: [] },
  { suffix: "sus4", name: "suspended fourth", intervals: [0, 5, 7], labels: ["1", "4", "5"], optional: [] },
  {
    suffix: "7sus4",
    name: "dominant seventh, suspended fourth",
    intervals: [0, 5, 7, 10],
    labels: ["1", "4", "5", "b7"],
    optional: [7],
  },
  {
    suffix: "dim7",
    name: "diminished seventh",
    intervals: [0, 3, 6, 9],
    labels: ["1", "b3", "b5", "bb7"],
    optional: [],
  },
  { suffix: "aug", name: "augmented", intervals: [0, 4, 8], labels: ["1", "3", "#5"], optional: [] },
  { suffix: "add9", name: "added ninth", intervals: [0, 4, 7, 14], labels: ["1", "3", "5", "9"], optional: [] },
  {
    suffix: "9",
    name: "dominant ninth",
    intervals: [0, 4, 7, 10, 14],
    labels: ["1", "3", "5", "b7", "9"],
    optional: [7],
  },
  {
    suffix: "m9",
    name: "minor ninth",
    intervals: [0, 3, 7, 10, 14],
    labels: ["1", "b3", "5", "b7", "9"],
    optional: [7],
  },
  {
    suffix: "7#9",
    name: "dominant seventh, sharp ninth",
    intervals: [0, 4, 7, 10, 15],
    labels: ["1", "3", "5", "b7", "#9"],
    optional: [7],
  },
  {
    suffix: "13",
    name: "dominant thirteenth",
    intervals: [0, 4, 7, 10, 14, 21],
    labels: ["1", "3", "5", "b7", "9", "13"],
    optional: [7, 14],
  },
];

export const CHORD_SYMBOL_FORMULAS: readonly ChordSymbolFormula[] = [
  ...Object.entries(SHARED).map(([suffix, entry]) => ({
    suffix,
    name: entry.name,
    intervals: CHORD_FORMULAS[entry.quality].intervals,
    labels: CHORD_FORMULAS[entry.quality].labels,
    optional: entry.optional,
  })),
  ...EXTENDED,
];

export interface ChordSymbolTone {
  pitchClass: PitchClass;
  name: string;
  interval: number;
  label: string;
  optional: boolean;
}

export interface ParsedChordSymbol {
  symbol: string;
  root: string;
  rootPitchClass: PitchClass;
  bass: string | null;
  bassPitchClass: PitchClass | null;
  formula: ChordSymbolFormula;
  tones: readonly ChordSymbolTone[];
}

const NOTE = /^[A-G](?:#|b)?/;

/** Parse "Am", "E7#9", "A5", "C/G" and similar. Unknown spellings return null rather than a guess. */
export function parseChordSymbol(symbol: string): ParsedChordSymbol | null {
  const root = symbol.match(NOTE)?.[0];
  if (!root) return null;
  const rest = symbol.slice(root.length);
  const [suffix, bass, extra] = rest.split("/");
  if (extra !== undefined) return null;
  const formula = CHORD_SYMBOL_FORMULAS.find((item) => item.suffix === suffix);
  const rootPitchClass = spelledPitchClass(root);
  if (!formula || rootPitchClass === null) return null;
  let bassPitchClass: PitchClass | null = null;
  if (bass !== undefined) {
    if (!/^[A-G](?:#|b)?$/.test(bass)) return null;
    bassPitchClass = spelledPitchClass(bass);
    if (bassPitchClass === null) return null;
  }
  const tones = formula.intervals.map((interval, index) => {
    const label = formula.labels[index];
    const degreeNumber = Number(label.match(/\d+/)?.[0] ?? 1);
    const pitchClass = normalize(rootPitchClass + interval);
    return {
      pitchClass,
      name: spellAboveRoot(root, degreeNumber, pitchClass),
      interval,
      label,
      optional: formula.optional.includes(interval),
    };
  });
  return { symbol, root, rootPitchClass, bass: bass ?? null, bassPitchClass, formula, tones };
}

export interface VoicingAnalysis {
  /** Sounding pitch classes that the symbol does not contain. */
  foreign: PitchClass[];
  /** Required chord tones that no string sounds. */
  missing: ChordSymbolTone[];
  /** Chord-tone label of the lowest sounding note, e.g. "1", "3", "5". */
  bassLabel: string | null;
}

/** Compare what the strings actually sound (MIDI, any order) with what the symbol names. */
export function analyseVoicing(parsed: ParsedChordSymbol, midis: readonly number[]): VoicingAnalysis {
  const sounding = new Set(midis.map((midi) => normalize(midi)));
  const chordPitches = new Set<number>(parsed.tones.map((tone) => tone.pitchClass));
  if (parsed.bassPitchClass !== null) chordPitches.add(parsed.bassPitchClass);
  const foreign = [...sounding].filter((pitch) => !chordPitches.has(pitch)).sort((a, b) => a - b);
  const missing = parsed.tones.filter((tone) => !tone.optional && !sounding.has(tone.pitchClass));
  const lowest = midis.length ? Math.min(...midis) : null;
  const bassTone = lowest === null ? undefined : parsed.tones.find((tone) => tone.pitchClass === normalize(lowest));
  return { foreign, missing, bassLabel: bassTone?.label ?? (lowest === null ? null : "slash") };
}
