import { describe, expect, it } from "vitest";
import { buildChords, createContext } from "../core/music/theory";
import { generateShapes } from "../core/instrument/guitar";
import { newSketch } from "./repository";
import { previewExperiment, sharedVoicedMidis } from "./creativeExperiments";
import type { ChordEvent, Sketch } from "./types";
import { validateSketch } from "./validation";

const melodySketch = (): Sketch => ({
  ...newSketch(0, { key: "E", mode: "major" }),
  chords: [],
  melody: [
    { id: "note-a", string: 0, fret: 0, beat: 0, duration: 1 },
    { id: "note-b", string: 0, fret: 4, beat: 1, duration: 1 },
    { id: "note-c", string: 0, fret: 0, beat: 4, duration: 1 },
  ],
});

function chordSketch(): Sketch {
  const chords = buildChords(createContext("C", "major"));
  const event = (symbol: string, id: string): ChordEvent => {
    const chord = chords.find((item) => item.symbol === symbol)!;
    const shape = generateShapes(chord)[0];
    return {
      id,
      symbol,
      beats: 4,
      voicing: Array.from(
        { length: 6 },
        (_, string) => shape.positions.find((position) => position.string === string)?.fret ?? null,
      ),
    };
  };
  return { ...newSketch(0), chords: [event("C", "chord-a"), event("Am", "chord-b")] };
}

function proposed(sketch: Sketch, id: Parameters<typeof previewExperiment>[1]): Sketch {
  const result = previewExperiment(sketch, id);
  if (!result.available) throw new Error(`${id}: ${result.reason}`);
  const candidate = { ...sketch, ...result.changes };
  validateSketch(candidate);
  expect(candidate).not.toBe(sketch);
  return candidate;
}

describe("Create experiments", () => {
  it("changes the time of an attack without changing pitches, then changes one interval without changing time", () => {
    const source = melodySketch();
    const timed = proposed(source, "rhythm");
    expect(timed.melody.map(({ string, fret }) => [string, fret])).toEqual(
      source.melody.map(({ string, fret }) => [string, fret]),
    );
    expect(timed.melody.map((note) => note.beat)).not.toEqual(source.melody.map((note) => note.beat));
    const pitched = proposed(source, "interval");
    expect(pitched.melody.map((note) => note.beat)).toEqual(source.melody.map((note) => note.beat));
    expect(pitched.melody.filter((note, index) => note.fret !== source.melody[index].fret)).toHaveLength(1);
    expect(source.melody[2].fret).toBe(0);
  });

  it("moves every melody pitch two frets and moves the declared key with it", () => {
    const source = melodySketch();
    const moved = proposed(source, "transpose");
    expect(moved.key).toBe("F#");
    expect(moved.melody.map((note) => note.fret)).toEqual(source.melody.map((note) => note.fret + 2));
    expect(moved.melody.map((note) => [note.beat, note.duration])).toEqual(
      source.melody.map((note) => [note.beat, note.duration]),
    );
  });

  it("offers another position when a two-fret move would leave the guided neck region", () => {
    const source = melodySketch();
    source.melody = source.melody.map((note, index) => ({ ...note, fret: index === 0 ? 0 : 11 }));
    const result = previewExperiment(source, "transpose");
    expect(result.available).toBe(false);
    if (!result.available) expect(result.reason).toMatch(/new string positions by hand/);
  });

  it("adds a B phrase with the A phrase and its IDs intact", () => {
    const source = melodySketch();
    const formed = proposed(source, "b-section");
    expect(formed.sections).toEqual(["A", "B"]);
    expect(formed.melody.slice(0, source.melody.length)).toEqual(source.melody);
    expect(formed.melody.slice(source.melody.length).map((note) => note.beat)).toEqual([8, 9, 12]);
    expect(new Set(formed.melody.map((note) => note.id)).size).toBe(formed.melody.length);
    expect(source.sections).toEqual(["A"]);
  });

  it("changes chord identity without changing durations, and changes durations without changing identities", () => {
    const source = chordSketch();
    const harmonised = proposed(source, "harmony");
    expect(harmonised.chords[0].symbol).not.toBe(source.chords[0].symbol);
    expect(harmonised.chords.map((chord) => chord.beats)).toEqual(source.chords.map((chord) => chord.beats));
    const timed = proposed(source, "rhythm");
    expect(timed.chords.map((chord) => [chord.symbol, chord.voicing])).toEqual(
      source.chords.map((chord) => [chord.symbol, chord.voicing]),
    );
    expect(timed.chords.map((chord) => chord.beats)).not.toEqual(source.chords.map((chord) => chord.beats));
  });

  it("keeps one exact sounding guitar pitch through the common-tone change", () => {
    const source = chordSketch();
    const result = previewExperiment(source, "common-tone");
    if (!result.available) {
      expect(result.reason).toMatch(/different second chord|two chords/i);
      return;
    }
    const changed = { ...source, ...result.changes };
    validateSketch(changed);
    expect(changed.chords[1]).not.toEqual(source.chords[1]);
    expect(sharedVoicedMidis(changed.chords[0], changed.chords[1]).length).toBeGreaterThan(0);
    expect(
      changed.chords[0].voicing.some((fret, string) => fret !== null && changed.chords[1].voicing[string] === fret),
    ).toBe(true);
  });

  it("explains unavailable domains without changing the source", () => {
    const empty = newSketch(0);
    for (const id of ["rhythm", "interval", "transpose", "b-section"] as const) {
      const result = previewExperiment(empty, id);
      expect(result.available).toBe(false);
      if (!result.available) expect(result.reason.length).toBeGreaterThan(20);
    }
    expect(empty.chords).toEqual([]);
    expect(empty.melody).toEqual([]);
  });
});
