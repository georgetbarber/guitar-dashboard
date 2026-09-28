import { assessFingering } from "../core/instrument/fingering";
import { generateShapes, STANDARD_GUITAR } from "../core/instrument/guitar";
import { buildChords, createContext, noteName as spellPitchClass } from "../core/music/theory";
import type { Chord } from "../core/music/types";
import { newId } from "./identity";
import { TONAL_ROOTS } from "./validation";
import type { ChordEvent, MelodyEvent, Sketch } from "./types";

export const EXPERIMENTS = [
  { id: "harmony", title: "Change harmony, keep the time" },
  { id: "rhythm", title: "Change time, keep the pitches" },
  { id: "common-tone", title: "Hold a common tone" },
  { id: "interval", title: "Change one interval" },
  { id: "transpose", title: "Transpose the melody" },
  { id: "b-section", title: "Make a related B section" },
] as const;
export type ExperimentId = (typeof EXPERIMENTS)[number]["id"];
export type ExperimentResult =
  | { available: false; reason: string }
  | {
      available: true;
      id: ExperimentId;
      title: string;
      explanation: string;
      before: string;
      after: string;
      changes: Partial<Sketch>;
    };

const unavailable = (reason: string): ExperimentResult => ({ available: false, reason });
const tuning = STANDARD_GUITAR.openMidi;
const guidedFretLimit = 12;
const midi = (note: MelodyEvent) => tuning[note.string] + note.fret;
const noteName = (value: number, preferFlats: boolean) =>
  `${spellPitchClass(value % 12, preferFlats)
    .replace("#", "♯")
    .replace("b", "♭")}${Math.floor(value / 12) - 1}`;
const chordMidis = (event: ChordEvent) =>
  event.voicing.flatMap((fret, string) => (fret === null ? [] : [tuning[string] + fret]));
const picture = (sketch: Sketch) =>
  sketch.chords.length
    ? sketch.chords.map((chord) => `${chord.symbol} for ${chord.beats} beats`).join(" → ")
    : sketch.melody.length
      ? [...sketch.melody]
          .sort((a, b) => a.beat - b.beat)
          .map(
            (note) =>
              `${noteName(midi(note), Boolean(sketch.key?.includes("b")))} (string ${note.string + 1}, fret ${note.fret}) at count ${note.beat + 1}`,
          )
          .join(" · ")
      : sketch.rhythmPattern;

function playableVoicing(chord: Chord): ChordEvent["voicing"] | null {
  const shape = generateShapes(chord).find((candidate) => assessFingering(candidate).feasible);
  return shape
    ? Array.from(
        { length: 6 },
        (_, string) => shape.positions.find((position) => position.string === string)?.fret ?? null,
      )
    : null;
}

function diatonic(sketch: Sketch): Chord[] | null {
  return sketch.key && sketch.mode ? buildChords(createContext(sketch.key, sketch.mode)) : null;
}

function changedHarmony(sketch: Sketch): { chords: ChordEvent[]; explanation: string } | null {
  const available = diatonic(sketch);
  if (!available || !sketch.chords.length) return null;
  const alternative = available.find((chord) => chord.symbol !== sketch.chords[0].symbol && playableVoicing(chord));
  if (!alternative) return null;
  const voicing = playableVoicing(alternative)!;
  return {
    chords: sketch.chords.map((event, index) =>
      index === 0 ? { ...event, symbol: alternative.symbol, voicing } : event,
    ),
    explanation: `The first chord changes to ${alternative.symbol}. Every chord keeps its duration and position in time.`,
  };
}

function changedRhythm(sketch: Sketch): { changes: Partial<Sketch>; explanation: string } | null {
  if (sketch.melody.length >= 2) {
    const ordered = [...sketch.melody].sort((a, b) => a.beat - b.beat);
    const target = ordered.at(-1)!;
    const end = Math.ceil(Math.max(...ordered.map((note) => note.beat + note.duration)) / 4) * 4;
    const candidate = [target.beat + 0.5, target.beat - 0.5, target.beat + 1, target.beat - 1].find(
      (beat) =>
        beat >= 0 &&
        beat + target.duration <= end &&
        ordered.every(
          (note) =>
            note.id === target.id ||
            note.string !== target.string ||
            beat >= note.beat + note.duration ||
            beat + target.duration <= note.beat,
        ),
    );
    if (candidate === undefined) return null;
    return {
      changes: { melody: sketch.melody.map((note) => (note.id === target.id ? { ...note, beat: candidate } : note)) },
      explanation: `The last attack moves from beat ${target.beat + 1} to ${candidate + 1}. Every played pitch stays on the same string and fret.`,
    };
  }
  if (sketch.chords.length >= 2) {
    const [first, second] = sketch.chords;
    const delta = second.beats >= 2 && first.beats < 16 ? 1 : first.beats >= 2 && second.beats < 16 ? -1 : 0;
    if (!delta) return null;
    return {
      changes: {
        chords: sketch.chords.map((event, index) =>
          index === 0
            ? { ...event, beats: first.beats + delta }
            : index === 1
              ? { ...event, beats: second.beats - delta }
              : event,
        ),
      },
      explanation: `The first chord lasts ${first.beats + delta} beats and the second ${second.beats - delta}. Their pitches and the combined length stay the same.`,
    };
  }
  return null;
}

function heldCommonTone(sketch: Sketch): { chords: ChordEvent[]; explanation: string } | null {
  if (sketch.chords.length < 2) return null;
  const available = diatonic(sketch);
  if (!available) return null;
  const first = sketch.chords[0];
  const second = sketch.chords[1];
  for (const chord of [
    ...available.filter((item) => item.symbol === second.symbol),
    ...available.filter((item) => item.symbol !== second.symbol),
  ]) {
    for (const shape of generateShapes(chord)) {
      if (!assessFingering(shape).feasible) continue;
      const voicing = Array.from(
        { length: 6 },
        (_, string) => shape.positions.find((position) => position.string === string)?.fret ?? null,
      );
      const retained = first.voicing.findIndex((fret, string) => fret !== null && voicing[string] === fret);
      if (
        retained < 0 ||
        (chord.symbol === second.symbol && voicing.every((fret, string) => fret === second.voicing[string]))
      )
        continue;
      return {
        chords: sketch.chords.map((event, index) =>
          index === 1 ? { ...event, symbol: chord.symbol, voicing } : event,
        ),
        explanation: `String ${retained + 1}, fret ${first.voicing[retained]} sounds the same pitch in both chords. Other voices move; both chord durations stay put.`,
      };
    }
  }
  return null;
}

function changedInterval(sketch: Sketch): { melody: MelodyEvent[]; explanation: string } | null {
  if (sketch.melody.length < 2) return null;
  const ordered = [...sketch.melody].sort((a, b) => a.beat - b.beat);
  const last = ordered.at(-1)!;
  if (last.fret > guidedFretLimit) return null;
  const fret = last.fret < guidedFretLimit ? last.fret + 1 : last.fret - 1;
  return {
    melody: sketch.melody.map((note) => (note.id === last.id ? { ...note, fret } : note)),
    explanation: `The last note moves one fret, changing its interval from the preceding note by one semitone. Onsets and durations stay fixed.`,
  };
}

function transposed(sketch: Sketch): { changes: Partial<Sketch>; explanation: string } | null {
  if (!sketch.melody.length || sketch.chords.length) return null;
  const shift = sketch.melody.every((note) => note.fret <= guidedFretLimit - 2)
    ? 2
    : sketch.melody.every((note) => note.fret >= 2 && note.fret <= guidedFretLimit)
      ? -2
      : null;
  if (shift === null) return null;
  const keyIndex = sketch.key ? TONAL_ROOTS.indexOf(sketch.key) : -1;
  return {
    changes: {
      melody: sketch.melody.map((note) => ({ ...note, fret: note.fret + shift })),
      key: keyIndex >= 0 ? TONAL_ROOTS[(keyIndex + shift + 12) % 12] : sketch.key,
    },
    explanation: `Every pitch moves ${Math.abs(shift)} semitones ${shift > 0 ? "up" : "down"} on the same string; intervals and timing stay fixed. Open strings become fretted notes when shifted up. This checks guitar coordinates, not fingering comfort.`,
  };
}

function relatedB(sketch: Sketch): { changes: Partial<Sketch>; explanation: string } | null {
  if (sketch.sections.includes("B")) return null;
  if (sketch.melody.length) {
    const ordered = [...sketch.melody].sort((a, b) => a.beat - b.beat);
    const maxEnd = Math.max(...ordered.map((note) => note.beat + note.duration));
    const offset = Math.ceil(maxEnd / 4) * 4;
    if (offset + maxEnd > 1_000_000) return null;
    const lastId = ordered.at(-1)!.id;
    const appended = ordered.map((note) => ({
      ...note,
      id: newId("melody"),
      beat: note.beat + offset,
      fret: note.id === lastId ? (note.fret < guidedFretLimit ? note.fret + 1 : note.fret - 1) : note.fret,
    }));
    return {
      changes: { melody: [...sketch.melody, ...appended], sections: [...sketch.sections, "B"] },
      explanation: `B repeats the A rhythm and opening pitches after beat ${offset}, then changes its final pitch by one fret. A remains intact.`,
    };
  }
  const harmony = changedHarmony(sketch);
  if (harmony)
    return {
      changes: {
        chords: [
          ...sketch.chords,
          ...sketch.chords.map((event, index) => ({
            ...event,
            id: newId("chord"),
            ...(index === 0 ? { symbol: harmony.chords[0].symbol, voicing: harmony.chords[0].voicing } : {}),
          })),
        ],
        sections: [...sketch.sections, "B"],
      },
      explanation: `B repeats A's chord durations with a changed first chord. The original A remains intact.`,
    };
  return null;
}

export function previewExperiment(sketch: Sketch, id: ExperimentId): ExperimentResult {
  let changes: Partial<Sketch>;
  let explanation: string;
  if (id === "harmony") {
    const result = changedHarmony(sketch);
    if (!result)
      return unavailable(
        "Add a chord and declare a key and mode first; no playable harmonic alternative is available for this sketch yet.",
      );
    changes = { chords: result.chords };
    explanation = result.explanation;
  } else if (id === "rhythm") {
    const result = changedRhythm(sketch);
    if (!result)
      return unavailable(
        "This needs at least two melody notes or two chords with enough time to redistribute. Try adding a second event.",
      );
    changes = result.changes;
    explanation = result.explanation;
  } else if (id === "common-tone") {
    const result = heldCommonTone(sketch);
    if (!result)
      return unavailable(
        "Choose two chords in a declared key and mode. None of the checked voicings here keeps one exact string-and-fret pitch; try a different second chord.",
      );
    changes = { chords: result.chords };
    explanation = result.explanation;
  } else if (id === "interval") {
    const result = changedInterval(sketch);
    if (!result) return unavailable("Add at least two melody notes so an interval can change.");
    changes = { melody: result.melody };
    explanation = result.explanation;
  } else if (id === "transpose") {
    const result = transposed(sketch);
    if (!result)
      return unavailable(
        "Transpose is available for a melody without chord symbols when every note can move two frets within frets 0–12. Keep this sketch and try a melody-only version or find new string positions by hand.",
      );
    changes = result.changes;
    explanation = result.explanation;
  } else {
    const result = relatedB(sketch);
    if (!result)
      return unavailable(
        "Add melody or a chord progression with a playable alternative; a B section needs actual changed music, not an empty label.",
      );
    changes = result.changes;
    explanation = result.explanation;
  }
  const title = EXPERIMENTS.find((item) => item.id === id)!.title;
  return {
    available: true,
    id,
    title,
    explanation,
    before: picture(sketch),
    after: picture({ ...sketch, ...changes }),
    changes,
  };
}

/** Useful to verify an exact shared tone rather than merely a pitch-class name. */
export function sharedVoicedMidis(first: ChordEvent, second: ChordEvent): number[] {
  const secondMidis = new Set(chordMidis(second));
  return chordMidis(first).filter((pitch) => secondMidis.has(pitch));
}
