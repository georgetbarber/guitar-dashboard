/**
 * OPTIONAL STAFF NOTATION, FROM THE SAME EVENTS AS THE TAB AND THE SOUND.
 *
 * Guitar music is written in treble clef an octave above where it sounds, so
 * the open low E (E2) is written E3, below the staff. Each note is placed by
 * its spelled name, so a note is never shown under a different letter from
 * the one the score names. Accidentals follow the usual rule: the key
 * signature applies throughout, and an accidental lasts to the end of its bar
 * at that staff position.
 *
 * The staff is optional in the app and nothing ever requires reading it
 * (docs/CURRICULUM_MAP.md §10 item 7).
 */
import { buildScale, createContext } from "../music/theory";
import type { BarGrid } from "./views";
import type { Fretted, Score, ScoreEvent } from "./types";
import { noteSpelling, positionMidi, strumPositions } from "./validate";

const LETTERS = ["C", "D", "E", "F", "G", "A", "B"] as const;
const NATURAL_PC: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
const SHARP_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

/** Staff positions as diatonic steps: C4 is 28, and the treble staff's lines are E4 30, G4 32, B4 34, D5 36, F5 38. */
export const STAFF_LINES = [30, 32, 34, 36, 38] as const;
export const MIDDLE_LINE = 34;

export type Accidental = "sharp" | "flat" | "natural" | "double-sharp" | "double-flat";
export type NoteValue = "whole" | "half" | "quarter" | "eighth" | "sixteenth";

export interface StaffHead {
  /** Diatonic step of the written pitch (see STAFF_LINES). */
  step: number;
  /** Shown only where the key signature and earlier notes in the bar do not already imply it. */
  accidental?: Accidental;
  /** A dead or muted note: an x notehead. */
  dead?: boolean;
}

export interface StaffSymbol {
  eventId: string;
  voice: string;
  /** Grid column where the event starts, and how many it spans. */
  column: number;
  span: number;
  rest: boolean;
  /** Low to high. Empty for a rest. */
  heads: StaffHead[];
  value: NoteValue | null;
  dotted: boolean;
  triplet: boolean;
  /** Held over from the previous event: no new attack. */
  tie: boolean;
  stem: "up" | "down";
}

export interface KeySignature {
  kind: "sharp" | "flat" | "none";
  /** Staff steps where the signature's sharps or flats are drawn, in the conventional order. */
  steps: number[];
}

function alteration(accidentals: string): number {
  if (accidentals === "#") return 1;
  if (accidentals === "##") return 2;
  if (accidentals === "b") return -1;
  if (accidentals === "bb") return -2;
  return 0;
}

const ACCIDENTAL_OF: Record<number, Accidental> = {
  [-2]: "double-flat",
  [-1]: "flat",
  0: "natural",
  1: "sharp",
  2: "double-sharp",
};

/** Each letter's alteration in the key, from the key's own spelled scale. */
function keyAlterations(key: Score["key"]): Record<string, number> {
  const out: Record<string, number> = { C: 0, D: 0, E: 0, F: 0, G: 0, A: 0, B: 0 };
  for (const tone of buildScale(createContext(key.tonic, key.mode))) out[tone.name[0]] = alteration(tone.name.slice(1));
  return out;
}

/** Sharps F C G D A E B and flats B E A D G C F, at their usual treble-clef heights. */
const SHARP_ORDER: readonly [string, number][] = [
  ["F", 38],
  ["C", 35],
  ["G", 39],
  ["D", 36],
  ["A", 33],
  ["E", 37],
  ["B", 34],
];
const FLAT_ORDER: readonly [string, number][] = [
  ["B", 34],
  ["E", 37],
  ["A", 33],
  ["D", 36],
  ["G", 32],
  ["C", 35],
  ["F", 31],
];

export function keySignature(key: Score["key"]): KeySignature {
  const altered = keyAlterations(key);
  const sharps = SHARP_ORDER.filter(([letter]) => altered[letter] > 0);
  const flats = FLAT_ORDER.filter(([letter]) => altered[letter] < 0);
  // A key signature is all sharps or all flats, and always a prefix of the conventional order.
  if (sharps.length && !flats.length && sharps.every((entry, index) => entry === SHARP_ORDER[index]))
    return { kind: "sharp", steps: sharps.map(([, step]) => step) };
  if (flats.length && !sharps.length && flats.every((entry, index) => entry === FLAT_ORDER[index]))
    return { kind: "flat", steps: flats.map(([, step]) => step) };
  return { kind: "none", steps: [] };
}

/** The written pitch of a fretted note: its letter, alteration and diatonic step, an octave above the sound. */
export function writtenPitch(note: Fretted, key: Score["key"]): { step: number; letter: string; alter: number } {
  const written = positionMidi(note) + 12;
  const name = noteSpelling(note, key) ?? SHARP_NAMES[written % 12];
  const letter = name[0];
  const alter = alteration(name.slice(1));
  const natural = written - alter;
  const octave = Math.floor((natural - NATURAL_PC[letter]) / 12) - 1;
  return { step: octave * 7 + LETTERS.indexOf(letter as (typeof LETTERS)[number]), letter, alter };
}

const VALUES: readonly [number, NoteValue][] = [
  [192, "whole"],
  [96, "half"],
  [48, "quarter"],
  [24, "eighth"],
  [12, "sixteenth"],
];

/** A duration in ticks (48 per quarter) as a written value, dotted or in a triplet. */
export function noteValue(ticks: number): { value: NoteValue | null; dotted: boolean; triplet: boolean } {
  for (const [base, value] of VALUES) {
    if (ticks === base) return { value, dotted: false, triplet: false };
    if (ticks === (base * 3) / 2) return { value, dotted: true, triplet: false };
    if (ticks === (base * 2) / 3) return { value, dotted: false, triplet: true };
  }
  return { value: null, dotted: false, triplet: false };
}

function positionsOf(event: ScoreEvent, score: Score): { notes: readonly Fretted[]; dead: boolean } {
  if (event.kind === "note") return { notes: event.notes, dead: Boolean(event.art?.dead) };
  if (event.kind === "strum") return { notes: strumPositions(event, score), dead: Boolean(event.art?.dead) };
  return { notes: [], dead: false };
}

/** Everything one bar's staff shows, with accidentals worked out in time order across every voice. */
export function staffSymbols(score: Score, grid: BarGrid): StaffSymbol[] {
  const signature = keyAlterations(score.key);
  const inBar = new Map<number, number>();
  const voiceOrder = score.voices.map((voice) => voice.id);
  const events = score.events
    .filter((event) => event.at >= grid.from && event.at < grid.to)
    .sort((a, b) => a.at - b.at || voiceOrder.indexOf(a.voice) - voiceOrder.indexOf(b.voice));
  return events.map((event) => {
    const { value, dotted, triplet } = noteValue(event.dur);
    const column = (event.at - grid.from) / grid.step;
    const span = Math.max(1, Math.round(Math.min(event.dur, grid.to - event.at) / grid.step));
    const { notes, dead } = positionsOf(event, score);
    const tie = event.kind !== "rest" && Boolean(event.art?.tie);
    let heads: StaffHead[];
    if (event.kind === "strum" && dead && !notes.length) heads = [{ step: MIDDLE_LINE, dead: true }];
    else
      heads = notes
        .map((note) => {
          const pitch = writtenPitch(note, score.key);
          const expected = inBar.get(pitch.step) ?? signature[pitch.letter];
          const head: StaffHead = { step: pitch.step };
          if (dead) head.dead = true;
          else if (pitch.alter !== expected && !tie) head.accidental = ACCIDENTAL_OF[pitch.alter];
          if (!dead) inBar.set(pitch.step, pitch.alter);
          return head;
        })
        .sort((a, b) => a.step - b.step);
    const stem: StaffSymbol["stem"] =
      voiceOrder.length > 1
        ? voiceOrder.indexOf(event.voice) === 0
          ? "up"
          : "down"
        : heads.length && heads.reduce((sum, head) => sum + head.step, 0) / heads.length >= MIDDLE_LINE
          ? "down"
          : "up";
    return {
      eventId: event.id,
      voice: event.voice,
      column,
      span,
      rest: event.kind === "rest",
      heads,
      value,
      dotted,
      triplet,
      tie,
      stem,
    };
  });
}

/** Ledger lines a head needs: every line position between it and the staff. */
export function ledgerSteps(step: number): number[] {
  const lines: number[] = [];
  for (let line = 28; line >= step; line -= 2) lines.push(line);
  for (let line = 40; line <= step; line += 2) lines.push(line);
  return lines;
}
