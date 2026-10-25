/**
 * A COMPACT WAY TO WRITE SCORES.
 *
 * Course content is authored as text lines, one per voice, then compiled into
 * the canonical event list. The compiled score is what the validator checks
 * and what every view and the synthesiser read; this file is only a writing
 * convenience, and every error it raises names the voice, bar and token.
 *
 *   "q 1:0  q 1:3{G}  q 1:0  q r | h D:C  h U:Am[pm]"
 *
 * Event:    duration body [modifiers] — separated by spaces; "|" checks a bar line.
 * Duration: w h q e s (whole … sixteenth), "." dotted, "3" triplet (e3 = eighth triplet).
 * Body:     r                rest
 *           S:F              string S (1 = high E) at fret F; join with + for a double-stop or pinch
 *             …fN            fretting finger N   …@p / @i / @m / @a  plucking finger   …{Ab} spelling
 *           D:Chord U:Chord  down or up strum of a named voicing
 *           X  x             dead scratch, down or up (every string muted)
 *           -                tie: hold the previous event without a new attack
 * Modifiers, in brackets, comma-separated:
 *           >  accent    gh ghost     st staccato   lr let ring   pm palm mute
 *           h  hammer-on p  pull-off  sl slide      si/sa slide in from below/above
 *           b.5 b1 b1.5 b2  bend by semitones (add r to release: b1r)   ~ vibrato
 *           dn/up pick stroke   sh deliberate shift   tight/slow strum spread
 *           s1-3  strum only strings 1 to 3   +20ms/-15ms placement   #id explicit event id
 */
import type { ModeId } from "../music/types";
import { DURATION, metreInfo, type FeelId, type MetreId } from "./time";
import {
  SCORE_FORMAT,
  type Articulation,
  type ChangedDimension,
  type Fretted,
  type FrettingFinger,
  type PlayabilityRule,
  type Provenance,
  type Score,
  type ScoreEvent,
  type StringNumber,
  type Voicing,
} from "./types";

const BASE: Record<string, number> = {
  w: DURATION.whole,
  h: DURATION.half,
  q: DURATION.quarter,
  e: DURATION.eighth,
  s: DURATION.sixteenth,
};

function durationOf(token: string): number | null {
  const match = token.match(/^([whqes])(\.?)(3?)$/);
  if (!match) return null;
  let ticks = BASE[match[1]];
  if (match[2]) ticks = (ticks * 3) / 2;
  if (match[3]) ticks = (ticks * 2) / 3;
  return Number.isInteger(ticks) ? ticks : null;
}

function fail(voice: string, bar: number, token: string, why: string): never {
  throw new Error(`Score text, voice "${voice}", bar ${bar}, "${token}": ${why}`);
}

function parseNote(text: string, voice: string, bar: number, token: string): Fretted {
  const match = text.match(/^([1-6]):(\d{1,2})(?:f([1-4]))?(?:@([pima]))?(?:\{([A-G](?:#{1,2}|b{1,2})?)\})?$/);
  if (!match) fail(voice, bar, token, `cannot read the note "${text}"`);
  return {
    string: Number(match[1]) as StringNumber,
    fret: Number(match[2]),
    ...(match[3] ? { finger: Number(match[3]) as FrettingFinger } : {}),
    ...(match[4] ? { pluck: match[4] as Fretted["pluck"] } : {}),
    ...(match[5] ? { spell: match[5] } : {}),
  };
}

interface Modifiers {
  art: Articulation;
  stroke?: "down" | "up";
  spread?: "tight" | "normal" | "slow";
  strings?: { from: StringNumber; to: StringNumber };
  offsetMs?: number;
  id?: string;
}

function parseModifiers(list: string, voice: string, bar: number, token: string): Modifiers {
  const result: Modifiers = { art: {} };
  for (const raw of list
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)) {
    const bend = raw.match(/^b(\.5|1\.5|1|2)(r?)$/);
    const strings = raw.match(/^s([1-6])-([1-6])$/);
    const offset = raw.match(/^([+-]\d{1,2})ms$/);
    if (raw === ">") result.art.accent = true;
    else if (raw === "gh") result.art.ghost = true;
    else if (raw === "st") result.art.staccato = true;
    else if (raw === "lr") result.art.letRing = true;
    else if (raw === "pm") result.art.palmMute = true;
    else if (raw === "h") result.art.legato = "hammer-on";
    else if (raw === "p") result.art.legato = "pull-off";
    else if (raw === "sl") result.art.legato = "slide";
    else if (raw === "si") result.art.slideIn = "below";
    else if (raw === "sa") result.art.slideIn = "above";
    else if (raw === "~") result.art.vibrato = true;
    else if (raw === "sh") result.art.shift = true;
    else if (raw === "dn") result.stroke = "down";
    else if (raw === "up") result.stroke = "up";
    else if (raw === "tight" || raw === "slow") result.spread = raw;
    else if (bend)
      result.art.bend = {
        semitones: Number(bend[1] === ".5" ? 0.5 : bend[1]) as 0.5 | 1 | 1.5 | 2,
        ...(bend[2] ? { release: true } : {}),
      };
    else if (strings) {
      const a = Number(strings[1]) as StringNumber;
      const b = Number(strings[2]) as StringNumber;
      result.strings = { from: Math.min(a, b) as StringNumber, to: Math.max(a, b) as StringNumber };
    } else if (offset) result.offsetMs = Number(offset[1]);
    else if (/^#[a-z0-9-]{1,40}$/.test(raw)) result.id = raw.slice(1);
    else fail(voice, bar, token, `unknown modifier "${raw}"`);
  }
  return result;
}

/** Compile one voice's text into events, checking every bar line against the metre. */
export function parseVoice(voice: string, text: string, metre: MetreId, bars: number): ScoreEvent[] {
  const { ticksPerBar } = metreInfo(metre);
  const tokens = text.trim().split(/\s+/).filter(Boolean);
  const events: ScoreEvent[] = [];
  let at = 0;
  let bar = 1;
  for (let index = 0; index < tokens.length; index++) {
    const token = tokens[index];
    if (token === "|") {
      if (at !== bar * ticksPerBar)
        fail(voice, bar, token, `bar line arrives at tick ${at}, expected ${bar * ticksPerBar}`);
      bar++;
      continue;
    }
    const dur = durationOf(token);
    if (dur === null) fail(voice, bar, token, "expected a duration such as q, e, s, h., e3");
    const bodyToken = tokens[++index];
    if (bodyToken === undefined) fail(voice, bar, token, "a duration needs something to play or rest");
    const [, body, modifierText] =
      bodyToken.match(/^([^[]+)(?:\[([^\]]*)\])?$/) ?? fail(voice, bar, bodyToken, "unreadable event");
    const mods = parseModifiers(modifierText ?? "", voice, bar, bodyToken);
    const id = mods.id ?? `${voice}-${events.length + 1}`;
    const common = { id, voice, at, dur };
    const art = Object.keys(mods.art).length ? { art: mods.art } : {};
    const offset = mods.offsetMs !== undefined ? { offsetMs: mods.offsetMs } : {};
    if (body === "r") {
      if (Object.keys(mods.art).length || mods.stroke || mods.strings)
        fail(voice, bar, bodyToken, "a rest takes no modifiers");
      events.push({ ...common, kind: "rest" });
    } else if (body === "-") {
      const previous = events.at(-1);
      if (!previous || previous.kind === "rest") fail(voice, bar, bodyToken, "a tie needs a sounding event before it");
      const held = { ...common, art: { ...mods.art, tie: true } };
      events.push(
        previous.kind === "note"
          ? { ...held, kind: "note", notes: previous.notes }
          : {
              ...held,
              kind: "strum",
              direction: previous.direction,
              ...(previous.chord ? { chord: previous.chord } : {}),
              ...(previous.strings ? { strings: previous.strings } : {}),
            },
      );
    } else if (/^[DU]:/.test(body)) {
      events.push({
        ...common,
        kind: "strum",
        chord: body.slice(2),
        direction: body[0] === "D" ? "down" : "up",
        ...(mods.strings ? { strings: mods.strings } : {}),
        ...(mods.spread ? { spread: mods.spread } : {}),
        ...art,
        ...offset,
      });
    } else if (body === "X" || body === "x") {
      events.push({
        ...common,
        kind: "strum",
        direction: body === "X" ? "down" : "up",
        ...(mods.strings ? { strings: mods.strings } : {}),
        art: { ...mods.art, dead: true },
        ...offset,
      });
    } else {
      const notes = body.split("+").map((part) => parseNote(part, voice, bar, bodyToken));
      events.push({
        ...common,
        kind: "note",
        notes,
        ...(mods.stroke ? { stroke: mods.stroke } : {}),
        ...art,
        ...offset,
      });
    }
    at += dur;
  }
  if (at !== bars * ticksPerBar)
    throw new Error(`Score text, voice "${voice}": ends at tick ${at}, but ${bars} bar(s) need ${bars * ticksPerBar}.`);
  return events;
}

/** "x32010" or "x 10 12 12 11 x" (strings 6 to 1); fingers use the same order with x or - for none. */
export function parseShape(text: string): (number | null)[] {
  const parts = /[\s-]/.test(text.trim()) && text.trim().length > 6 ? text.trim().split(/[\s-]+/) : [...text.trim()];
  if (parts.length !== 6) throw new Error(`Shape "${text}" must name six strings, low E to high E.`);
  return parts.map((part) => {
    if (part === "x" || part === "X") return null;
    const fret = Number(part);
    if (!Number.isInteger(fret) || fret < 0 || fret > 24)
      throw new Error(`Shape "${text}" has an unreadable fret "${part}".`);
    return fret;
  });
}

function parseFingers(text: string): (FrettingFinger | null)[] {
  if (text.length !== 6) throw new Error(`Fingering "${text}" must name six strings, low E to high E.`);
  return [...text].map((char) => {
    if (char === "x" || char === "-" || char === "0") return null;
    const finger = Number(char);
    if (![1, 2, 3, 4].includes(finger)) throw new Error(`Fingering "${text}" has an unreadable finger "${char}".`);
    return finger as FrettingFinger;
  });
}

export interface VoicingText {
  symbol: string;
  shape: string;
  fingers?: string;
  barre?: readonly [fret: number, from: StringNumber, to: StringNumber, finger: FrettingFinger];
  inversion?: Voicing["inversion"];
}

export interface ScoreText {
  id: string;
  version: number;
  title: string;
  provenance: Provenance;
  key: `${string} ${ModeId}`;
  metre: MetreId;
  feel?: FeelId;
  bars: number;
  tempo: readonly [minimum: number, standard: number, maximum: number];
  /** Voicings by id; the id is what strums name (D:C). */
  voicings?: Record<string, VoicingText | string>;
  /** Voice id → label and text. Order is display order. */
  voices: Record<string, { label: string; text: string }>;
  /** [id, label, first bar, last bar], 1-based and inclusive. Defaults to one section, "whole". */
  sections?: readonly (readonly [id: string, label: string, fromBar: number, toBar: number])[];
  harmony?: readonly (readonly [bar: number, beat: number, symbol: string, roman?: string])[];
  derivedFrom?: { id: string; version: number; changed: readonly ChangedDimension[] };
  exceptions?: readonly { rule: PlayabilityRule; events?: readonly string[]; reason: string }[];
}

/** Compile authored text into a format-2 score. Validation is separate (validate.ts). */
export function score(text: ScoreText): Score {
  const [tonic, mode] = text.key.split(" ") as [string, ModeId];
  const info = metreInfo(text.metre);
  const voicings: Voicing[] = Object.entries(text.voicings ?? {}).map(([id, value]) => {
    const entry: VoicingText = typeof value === "string" ? { symbol: id, shape: value } : value;
    return {
      id,
      symbol: entry.symbol,
      frets: parseShape(entry.shape),
      ...(entry.fingers ? { fingers: parseFingers(entry.fingers) } : {}),
      ...(entry.barre
        ? { barre: { fret: entry.barre[0], from: entry.barre[1], to: entry.barre[2], finger: entry.barre[3] } }
        : {}),
      ...(entry.inversion ? { inversion: entry.inversion } : {}),
    };
  });
  const voices = Object.entries(text.voices).map(([id, voice]) => ({ id, label: voice.label }));
  const events = Object.entries(text.voices)
    .flatMap(([id, voice]) => parseVoice(id, voice.text, text.metre, text.bars))
    .sort(
      (a, b) => a.at - b.at || voices.findIndex((v) => v.id === a.voice) - voices.findIndex((v) => v.id === b.voice),
    );
  const sections = (text.sections ?? [["whole", "Whole study", 1, text.bars] as const]).map(
    ([id, label, from, to]) => ({
      id,
      label,
      from: (from - 1) * info.ticksPerBar,
      to: to * info.ticksPerBar,
    }),
  );
  return {
    format: SCORE_FORMAT,
    id: text.id,
    version: text.version,
    title: text.title,
    provenance: text.provenance,
    tuning: "standard",
    key: { tonic, mode },
    metre: text.metre,
    feel: text.feel ?? "straight",
    bars: text.bars,
    tempo: { minimum: text.tempo[0], default: text.tempo[1], maximum: text.tempo[2] },
    voices,
    voicings,
    ...(text.harmony
      ? {
          harmony: text.harmony.map(([bar, beat, symbol, roman]) => ({
            at: (bar - 1) * info.ticksPerBar + (beat - 1) * info.beatTicks,
            symbol,
            ...(roman ? { roman } : {}),
          })),
        }
      : {}),
    sections,
    events,
    ...(text.derivedFrom ? { derivedFrom: text.derivedFrom } : {}),
    ...(text.exceptions ? { exceptions: text.exceptions } : {}),
  };
}
