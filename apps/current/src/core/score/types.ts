/**
 * SCORE FORMAT 2: POLYPHONIC GUITAR MUSIC AS VERSIONED DATA.
 *
 * One score is the single source for everything a learner sees and hears:
 * tablature with technique marks, the count, chord diagrams, the fretboard and
 * the synthesised reference are all projections of `events`. Nothing is drawn
 * or sounded that is not in the data.
 *
 * Format 1 (`MusicalMaterial` in src/v8/structuredMusic.ts) is one monophonic
 * line in whole beats. It still loads: upgrade.ts turns it into format 2
 * without changing a note or a count, and its records keep their ids.
 *
 * Standard tuning only. A capo or drop D would need the fretboard, tab,
 * transposition and audio maths to agree; that is not built, so the format
 * cannot express it (decision A8).
 */
import type { ModeId } from "../music/types";
import type { FeelId, MetreId } from "./time";

export const SCORE_FORMAT = 2;

/** String 1 is the high E, string 6 the low E. */
export type StringNumber = 1 | 2 | 3 | 4 | 5 | 6;
export type FrettingFinger = 1 | 2 | 3 | 4;
/** Fingerstyle plucking hand: thumb, index, middle, ring. */
export type PluckingFinger = "p" | "i" | "m" | "a";

export interface Provenance {
  author: string;
  reviewer: string;
  reviewStatus: "draft" | "reviewed" | "trialled";
  reviewedAt: string | null;
}

export interface Fretted {
  string: StringNumber;
  fret: number;
  /** Fretting-hand finger, when the score teaches one. */
  finger?: FrettingFinger;
  /** Plucking-hand finger for fingerstyle; absent for a pick. */
  pluck?: PluckingFinger;
  /** Spelling when the key cannot imply it (a chromatic or blue note). */
  spell?: string;
  /** Scale-degree label relative to the key's tonic, checked by the validator. */
  degree?: string;
}

export interface Bend {
  /** Target, judged by pitch: 0.5 quarter, 1 half (one fret), 2 whole (two frets). */
  semitones: 0.5 | 1 | 1.5 | 2;
  release?: boolean;
}

export interface Articulation {
  accent?: boolean;
  ghost?: boolean;
  staccato?: boolean;
  letRing?: boolean;
  palmMute?: boolean;
  /** Fretting hand rests on the strings: a percussive scratch with no pitch. */
  dead?: boolean;
  /** Continues the previous event in this voice: no new attack. */
  tie?: boolean;
  /** Sounded by the fretting hand from the previous note on the same string. */
  legato?: "hammer-on" | "pull-off" | "slide";
  slideIn?: "below" | "above";
  bend?: Bend;
  vibrato?: boolean;
  /** A deliberate position shift the playability check should allow. */
  shift?: boolean;
}

interface Timed {
  id: string;
  voice: string;
  /** Notated start, in ticks from the beginning of the score. */
  at: number;
  /** Notated length in ticks. Within a voice, events tile the score exactly. */
  dur: number;
}

/** One or more fretted notes plucked together: a single note, a double-stop or a pinch. */
export interface NoteEvent extends Timed {
  kind: "note";
  notes: readonly Fretted[];
  /** Pick direction, when the score teaches it. */
  stroke?: "down" | "up";
  art?: Articulation;
  /** Laid-back (positive) or pushed (negative) placement, in milliseconds. */
  offsetMs?: number;
}

export interface StrumEvent extends Timed {
  kind: "strum";
  /** Voicing id. A dead scratch may omit it: every string is muted. */
  chord?: string;
  direction: "down" | "up";
  /** Only the strings in this range sound (inclusive). Defaults to every string the voicing uses. */
  strings?: { from: StringNumber; to: StringNumber };
  spread?: "tight" | "normal" | "slow";
  art?: Articulation;
  offsetMs?: number;
}

export interface RestEvent extends Timed {
  kind: "rest";
}

export type ScoreEvent = NoteEvent | StrumEvent | RestEvent;

export interface Voicing {
  id: string;
  /** Chord symbol the frets must sound, e.g. "C", "Am", "E7", "A5", "C/G". */
  symbol: string;
  /** Frets from string 6 (low E) to string 1 (high E); null is a muted or unplayed string. */
  frets: readonly (number | null)[];
  /** Fretting fingers in the same order, when taught. */
  fingers?: readonly (FrettingFinger | null)[];
  barre?: { fret: number; from: StringNumber; to: StringNumber; finger: FrettingFinger };
  /** Declared when the lowest note is not the root and the symbol has no slash bass. */
  inversion?: "first" | "second" | "third";
}

export interface ScoreVoice {
  id: string;
  label: string;
}

export interface Section {
  id: string;
  label: string;
  from: number;
  to: number;
}

/** A chord change under a melody, so chord-tone labels can be checked against it. */
export interface HarmonyMark {
  at: number;
  symbol: string;
  roman?: string;
}

export type PlayabilityRule =
  "fret-span" | "finger-count" | "fingering-order" | "string-skip" | "stretch" | "tempo-ceiling" | "change-time";

export type ChangedDimension =
  "pitch" | "rhythm" | "articulation" | "key" | "position" | "feel" | "texture" | "harmony";

export interface Score {
  format: 2;
  id: string;
  version: number;
  title: string;
  provenance: Provenance;
  tuning: "standard";
  key: { tonic: string; mode: ModeId };
  metre: MetreId;
  feel: FeelId;
  bars: number;
  tempo: { minimum: number; default: number; maximum: number };
  voices: readonly ScoreVoice[];
  voicings: readonly Voicing[];
  harmony?: readonly HarmonyMark[];
  sections: readonly Section[];
  events: readonly ScoreEvent[];
  derivedFrom?: { id: string; version: number; changed: readonly ChangedDimension[] };
  /** Documented exceptions to a playability rule, with the teaching reason. */
  exceptions?: readonly { rule: PlayabilityRule; events?: readonly string[]; reason: string }[];
}

export interface ScoreProblem {
  code: string;
  message: string;
  eventId?: string;
}
