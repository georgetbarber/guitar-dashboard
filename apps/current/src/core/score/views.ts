/**
 * WHAT THE LEARNER SEES, DERIVED FROM THE SAME EVENTS AS WHAT THEY HEAR.
 *
 * Tab cells with technique marks, the count and rhythm lanes, chord diagrams
 * and fretboard positions are pure functions of a score. Components only lay
 * these out; correspondence tests compare them with the events and with the
 * synthesised sounds.
 */
import { metreInfo } from "./time";
import type { Fretted, NoteEvent, Score, ScoreEvent, StringNumber, StrumEvent, Voicing } from "./types";
import { eventStrings, noteSpelling, positionMidi, strumPositions } from "./validate";

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}

export interface BarGrid {
  bar: number;
  from: number;
  to: number;
  /** Ticks per column. */
  step: number;
  columns: number;
  /** Count label for each column, e.g. "1", "e", "+", "a", "trip", "let". */
  labels: string[];
  /** Columns that begin a beat. */
  beatStarts: number[];
}

function subdivisionLabels(perBeat: number, compound: boolean): string[] {
  if (compound)
    return perBeat === 3 ? ["", "+", "a"] : perBeat === 6 ? ["", "e", "+", "e", "a", "e"] : Array(perBeat).fill("");
  if (perBeat === 2) return ["", "+"];
  if (perBeat === 3) return ["", "trip", "let"];
  if (perBeat === 4) return ["", "e", "+", "a"];
  return Array(perBeat).fill("");
}

/** The finest grid any event in the bar needs, but never coarser than one column per beat. */
export function barGrid(score: Pick<Score, "metre" | "events">, bar: number): BarGrid {
  const info = metreInfo(score.metre);
  const from = (bar - 1) * info.ticksPerBar;
  const to = from + info.ticksPerBar;
  let step = info.compound ? info.beatTicks / 3 : info.beatTicks;
  for (const event of score.events) {
    if (event.at < from || event.at >= to) continue;
    step = gcd(step, event.at - from);
    if (event.at + event.dur < to) step = gcd(step, event.at + event.dur - from);
  }
  step = Math.max(4, step);
  const columns = info.ticksPerBar / step;
  const perBeat = info.beatTicks / step;
  const sub = subdivisionLabels(perBeat, info.compound);
  const labels = Array.from({ length: columns }, (_, column) => {
    const beat = Math.floor(column / perBeat);
    const within = column % perBeat;
    return within === 0 ? String(beat + 1) : (sub[within] ?? "");
  });
  return {
    bar,
    from,
    to,
    step,
    columns,
    labels,
    beatStarts: Array.from({ length: info.beatsPerBar }, (_, beat) => beat * perBeat),
  };
}

export type TechniqueMark = "h" | "p" | "sl" | "si" | "sa" | "b" | "br" | "~" | "pm" | "lr" | ">" | "gh" | "st";

export interface TabCell {
  eventId: string;
  voice: string;
  string: StringNumber;
  column: number;
  /** Fret number, "x" for a dead note, "(5)" for a held note. */
  text: string;
  fret: number | null;
  marks: TechniqueMark[];
  bend?: number;
}

function marksFor(event: NoteEvent | StrumEvent): TechniqueMark[] {
  const art = event.art ?? {};
  const marks: TechniqueMark[] = [];
  if (art.legato === "hammer-on") marks.push("h");
  if (art.legato === "pull-off") marks.push("p");
  if (art.legato === "slide") marks.push("sl");
  if (art.slideIn === "below") marks.push("si");
  if (art.slideIn === "above") marks.push("sa");
  if (art.bend) marks.push(art.bend.release ? "br" : "b");
  if (art.vibrato) marks.push("~");
  if (art.palmMute) marks.push("pm");
  if (art.letRing) marks.push("lr");
  if (art.accent) marks.push(">");
  if (art.ghost) marks.push("gh");
  if (art.staccato) marks.push("st");
  return marks;
}

/** Every string position each event in the bar puts on the tab, in column order. */
export function tabCells(score: Score, grid: BarGrid): TabCell[] {
  const cells: TabCell[] = [];
  for (const event of score.events) {
    if (event.kind === "rest" || event.at < grid.from || event.at >= grid.to) continue;
    const column = (event.at - grid.from) / grid.step;
    const marks = marksFor(event);
    const held = Boolean(event.art?.tie);
    const dead = Boolean(event.art?.dead);
    const positions: { string: StringNumber; fret: number | null }[] =
      event.kind === "note"
        ? event.notes.map((note) => ({ string: note.string, fret: note.fret }))
        : dead
          ? eventStrings(event, score).map((string) => ({ string, fret: null }))
          : strumPositions(event, score);
    for (const position of positions)
      cells.push({
        eventId: event.id,
        voice: event.voice,
        string: position.string,
        column,
        text: dead || position.fret === null ? "x" : held ? `(${position.fret})` : String(position.fret),
        fret: dead ? null : position.fret,
        marks,
        ...(event.kind === "note" && event.art?.bend ? { bend: event.art.bend.semitones } : {}),
      });
  }
  return cells.sort((a, b) => a.column - b.column || a.string - b.string);
}

export interface RhythmSpan {
  eventId: string;
  fromColumn: number;
  /** Exclusive. */
  toColumn: number;
  kind: "attack" | "held" | "rest";
  stroke?: "down" | "up";
  accent?: boolean;
  ghost?: boolean;
  dead?: boolean;
}

/** One lane per voice: where each sound starts, how long it lasts, and each written silence. */
export function rhythmLane(score: Score, grid: BarGrid, voice: string): RhythmSpan[] {
  return score.events
    .filter((event) => event.voice === voice && event.at >= grid.from && event.at < grid.to)
    .sort((a, b) => a.at - b.at)
    .map((event) => {
      const fromColumn = (event.at - grid.from) / grid.step;
      const toColumn = (Math.min(event.at + event.dur, grid.to) - grid.from) / grid.step;
      if (event.kind === "rest") return { eventId: event.id, fromColumn, toColumn, kind: "rest" as const };
      const stroke = event.kind === "strum" ? event.direction : event.stroke;
      return {
        eventId: event.id,
        fromColumn,
        toColumn,
        kind: event.art?.tie ? ("held" as const) : ("attack" as const),
        ...(stroke ? { stroke } : {}),
        ...(event.art?.accent ? { accent: true } : {}),
        ...(event.art?.ghost ? { ghost: true } : {}),
        ...(event.art?.dead ? { dead: true } : {}),
      };
    });
}

export interface ChordDiagram {
  symbol: string;
  /** Lowest fret shown; 1 means the nut is drawn. */
  baseFret: number;
  frets: number;
  strings: { string: StringNumber; fret: number | null; finger: number | null }[];
  barre?: Voicing["barre"];
}

export function chordDiagram(voicing: Voicing): ChordDiagram {
  const pressed = voicing.frets.filter((fret): fret is number => fret !== null && fret > 0);
  const high = pressed.length ? Math.max(...pressed) : 0;
  const low = pressed.length ? Math.min(...pressed) : 1;
  const baseFret = high <= 4 ? 1 : low;
  return {
    symbol: voicing.symbol,
    baseFret,
    frets: Math.max(4, high - baseFret + 1),
    strings: voicing.frets.map((fret, index) => ({
      string: (6 - index) as StringNumber,
      fret,
      finger: voicing.fingers?.[index] ?? null,
    })),
    ...(voicing.barre ? { barre: voicing.barre } : {}),
  };
}

export interface BoardPosition {
  string: StringNumber;
  fret: number;
  eventId: string;
  name: string | null;
  midi: number;
}

function sounding(event: ScoreEvent, score: Score): Fretted[] {
  if (event.kind === "rest" || event.art?.dead) return [];
  return event.kind === "note" ? [...event.notes] : strumPositions(event, score);
}

/** What the fretting hand holds at a tick: every position of every event covering it. */
export function fretboardAt(score: Score, tick: number): BoardPosition[] {
  return score.events
    .filter((event) => event.at <= tick && tick < event.at + event.dur)
    .flatMap((event) =>
      sounding(event, score).map((position) => ({
        string: position.string,
        fret: position.fret,
        eventId: event.id,
        name: noteSpelling(position, score.key),
        midi: positionMidi(position),
      })),
    );
}

/** Every position the score uses, once each, for an at-rest map of the hand's territory. */
export function allPositions(score: Score): BoardPosition[] {
  const seen = new Map<string, BoardPosition>();
  for (const event of score.events)
    for (const position of sounding(event, score)) {
      const key = `${position.string}:${position.fret}`;
      if (!seen.has(key))
        seen.set(key, {
          string: position.string,
          fret: position.fret,
          eventId: event.id,
          name: noteSpelling(position, score.key),
          midi: positionMidi(position),
        });
    }
  return [...seen.values()].sort((a, b) => a.string - b.string || a.fret - b.fret);
}

const STRING_NAMES: Record<StringNumber, string> = { 1: "high E", 2: "B", 3: "G", 4: "D", 5: "A", 6: "low E" };

export function stringName(string: StringNumber): string {
  return STRING_NAMES[string];
}

const MARK_WORDS: Record<TechniqueMark, string> = {
  h: "hammer-on",
  p: "pull-off",
  sl: "slide",
  si: "slide in from below",
  sa: "slide in from above",
  b: "bend",
  br: "bend and release",
  "~": "vibrato",
  pm: "palm-muted",
  lr: "let ring",
  ">": "accented",
  gh: "ghosted",
  st: "short",
};

/** A sentence a screen reader can speak for one event, matching what the tab and audio show. */
export function describeEvent(event: ScoreEvent, score: Score, conceal = false): string {
  if (event.kind === "rest") return "rest";
  const marks = marksFor(event).map((mark) => MARK_WORDS[mark]);
  const bend =
    event.kind === "note" && event.art?.bend
      ? ` up ${event.art.bend.semitones === 0.5 ? "a quarter tone" : event.art.bend.semitones === 1 ? "a half step" : event.art.bend.semitones === 2 ? "a whole step" : "a step and a half"}`
      : "";
  const extra = [...marks.map((word) => (word === "bend" || word === "bend and release" ? `${word}${bend}` : word))];
  if (event.art?.tie) return ["hold", ...extra].join(", ");
  if (event.kind === "strum") {
    const what = event.art?.dead
      ? "muted scratch"
      : conceal
        ? "chord"
        : (score.voicings.find((v) => v.id === event.chord)?.symbol ?? "chord");
    return [`${event.direction} strum, ${what}`, ...extra].join(", ");
  }
  const notes = conceal
    ? `${event.notes.length === 1 ? "a note" : `${event.notes.length} notes`}`
    : event.notes
        .map((note) => {
          const name = noteSpelling(note, score.key);
          const where = note.fret === 0 ? "open" : `fret ${note.fret}`;
          return `${stringName(note.string)} string ${where}${name && !event.art?.dead ? ` (${name})` : ""}${note.pluck ? `, ${note.pluck === "p" ? "thumb" : note.pluck === "i" ? "index" : note.pluck === "m" ? "middle" : "ring"} finger` : ""}`;
        })
        .join(" with ");
  return [event.art?.dead ? `muted ${notes}` : notes, ...extra].join(", ");
}
