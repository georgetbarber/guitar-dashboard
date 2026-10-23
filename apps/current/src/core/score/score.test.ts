import { describe, expect, it } from "vitest";
import { parseShape, parseVoice, score, type ScoreText } from "./build";
import { performScore, pulses, tickAt } from "./perform";
import { playabilityProblems } from "./playability";
import { FEELS, notatedTick, performedTick } from "./time";
import type { Score } from "./types";
import { allPositions, barGrid, chordDiagram, describeEvent, fretboardAt, rhythmLane, tabCells } from "./views";
import { positionMidi, validateScore } from "./validate";

const DRAFT = { author: "agent-drafted", reviewer: "", reviewStatus: "draft" as const, reviewedAt: null };

const base = (overrides: Partial<ScoreText> = {}): Score =>
  score({
    id: "test-score",
    version: 1,
    title: "Test",
    provenance: DRAFT,
    key: "E major",
    metre: "4/4",
    bars: 1,
    tempo: [50, 60, 80],
    voices: { line: { label: "Line", text: "q 1:0 q 1:4 q 1:0 q r" } },
    ...overrides,
  });

const codes = (s: Score) => validateScore(s).map((problem) => problem.code);

describe("writing scores as text", () => {
  it("compiles durations, notes, strums, ties and modifiers into exact ticks", () => {
    const events = parseVoice("v", "e 3:2f2 e 3:4[h] q 2:3[b1r,~] e. 1:0 q -[~] s r | w D:C[>,s1-3,slow]", "4/4", 2);
    expect(events.map((event) => [event.at, event.dur, event.kind])).toEqual([
      [0, 24, "note"],
      [24, 24, "note"],
      [48, 48, "note"],
      [96, 36, "note"],
      [132, 48, "note"],
      [180, 12, "rest"],
      [192, 192, "strum"],
    ]);
    expect(events[1]).toMatchObject({ art: { legato: "hammer-on" } });
    expect(events[2]).toMatchObject({ art: { bend: { semitones: 1, release: true }, vibrato: true } });
    expect(events[4]).toMatchObject({ notes: [{ string: 1, fret: 0 }], art: { tie: true, vibrato: true } });
    expect(events[6]).toMatchObject({
      chord: "C",
      direction: "down",
      strings: { from: 1, to: 3 },
      spread: "slow",
      art: { accent: true },
    });
    expect(parseVoice("v", "e3 1:0 e3 1:2 e3 1:4 q. r e r", "3/4", 1).map((event) => event.dur)).toEqual([
      16, 16, 16, 72, 24,
    ]);
  });

  it("names the voice, bar and token when the text is wrong", () => {
    expect(() => parseVoice("bass", "q 6:0 q 6:0 q 6:0 | q 6:0", "4/4", 2)).toThrow(
      /voice "bass", bar 1.*bar line arrives at tick 144/,
    );
    expect(() => parseVoice("bass", "q 6:0[zz] h. r", "4/4", 1)).toThrow(/unknown modifier "zz"/);
    expect(() => parseVoice("bass", "6:0 w r", "4/4", 1)).toThrow(/expected a duration/);
    expect(() => parseVoice("bass", "h 6:0", "4/4", 1)).toThrow(/ends at tick 96/);
    expect(() => parseVoice("bass", "q - h. r", "4/4", 1)).toThrow(/tie needs a sounding event/);
  });

  it("reads chord shapes low E first, with spaced form for frets above nine", () => {
    expect(parseShape("x32010")).toEqual([null, 3, 2, 0, 1, 0]);
    expect(parseShape("x 10 12 12 11 x")).toEqual([null, 10, 12, 12, 11, null]);
    expect(() => parseShape("x3201")).toThrow(/six strings/);
  });
});

describe("score validation", () => {
  it("accepts a correct fingerpicking pattern with a thumb and fingers in separate voices", () => {
    const travis = base({
      key: "C major",
      voices: {
        thumb: { label: "Thumb", text: "q 5:3@p q 4:2@p q 5:3@p q 4:2@p" },
        fingers: { label: "Fingers", text: "e r e 2:1@i e r e 1:0@m e r e 2:1@i e r e 3:0@i" },
      },
    });
    expect(validateScore(travis)).toEqual([]);
    expect(playabilityProblems(travis)).toEqual([]);
  });

  it("finds gaps, wrong spellings, unspelled chromatic notes and wrong degree labels", () => {
    const s = base();
    expect(codes({ ...s, events: s.events.filter((event) => event.at !== 48) })).toContain("tiling");
    expect(codes(base({ voices: { line: { label: "L", text: "q 1:3 q 1:4 q 1:0 q r" } } }))).toContain("spelling");
    expect(codes(base({ voices: { line: { label: "L", text: "q 1:3{G} q 1:4{Ab} q 1:0 q r" } } }))).toEqual([
      "spelling",
    ]);
    const labelled = base();
    const wrong = {
      ...labelled,
      events: labelled.events.map((event) =>
        event.kind === "note" && event.at === 48 ? { ...event, notes: [{ ...event.notes[0], degree: "b3" }] } : event,
      ),
    };
    expect(validateScore(wrong).map((problem) => problem.message)).toEqual([expect.stringContaining("is 3, not b3")]);
  });

  it("checks chord frets against the symbol and the bass against the declared inversion", () => {
    const chords = (voicings: ScoreText["voicings"], text = "w D:X") =>
      base({ key: "C major", voicings, voices: { strum: { label: "Strum", text } } });
    expect(validateScore(chords({ X: { symbol: "C", shape: "x32010" } }))).toEqual([]);
    expect(validateScore(chords({ X: { symbol: "C", shape: "x02210" } })).map((p) => p.message)).toContainEqual(
      expect.stringContaining("not in C"),
    );
    expect(validateScore(chords({ X: { symbol: "C", shape: "xx2010" } })).map((p) => p.message)).toContainEqual(
      expect.stringContaining("first inversion"),
    );
    expect(validateScore(chords({ X: { symbol: "C", shape: "xx2010", inversion: "first" } }))).toEqual([]);
    expect(validateScore(chords({ X: { symbol: "C/G", shape: "332010" } }))).toEqual([]);
    expect(validateScore(chords({ X: { symbol: "G", shape: "x32010" } })).length).toBeGreaterThan(0);
    expect(codes(chords({ X: "x32010", Y: "x02210" }))).toContain("voicing");
  });

  it("checks technique notation against the string it acts on", () => {
    const line = (text: string) => base({ key: "A minor", voices: { line: { label: "L", text } } });
    expect(validateScore(line("e 3:2 e 3:4[h] e 3:4 e 3:2[p] h r"))).toEqual([]);
    expect(codes(line("e 3:4 e 3:2[h] h. r"))).toContain("legato");
    expect(codes(line("e 3:2 e 2:3[p] h. r"))).toContain("legato");
    expect(codes(line("e 3:2 e 3:0[sl] h. r"))).toContain("legato");
    expect(codes(line("q 2:1 q -[>] h r"))).toContain("tie");
    expect(codes(line("q 2:1 q 2:3[st,lr] h r"))).toContain("articulation");
    expect(codes(line("q 2:1+3:2[b1] q r h r"))).toContain("articulation");
  });

  it("refuses two voices on one string at once, events across a bar line, swing in compound time and mixed tuplets", () => {
    const clash = base({
      voices: { a: { label: "A", text: "h 1:0 h r" }, b: { label: "B", text: "q r q 1:4 h r" } },
    });
    expect(codes(clash)).toContain("string-clash");
    const s = base({ bars: 2, voices: { line: { label: "L", text: "h. r q 1:0 | q - h. r" } } });
    const crossing = {
      ...s,
      events: s.events
        .map((event) => (event.at === 144 ? { ...event, dur: 96 } : event))
        .filter((event) => event.at !== 192),
    };
    expect(codes(crossing)).toContain("timing");
    expect(
      codes(base({ metre: "6/8", feel: "swing-8", voices: { line: { label: "L", text: "q. 1:0 q. r" } } })),
    ).toContain("feel");
    expect(codes(base({ voices: { line: { label: "L", text: "e3 1:0 s 1:0 s 1:0 s3 r h. r" } } }))).toContain("rhythm");
  });
});

describe("playability", () => {
  it("allows open chords and a barre, and rejects spans and finger counts a hand cannot hold", () => {
    const chord = (shape: string, extra: object = {}) =>
      base({
        key: "F major",
        tempo: [40, 60, 72],
        voicings: { F: { symbol: "F", shape, ...extra } },
        voices: { s: { label: "S", text: "w D:F" } },
      });
    expect(playabilityProblems(chord("133211", { barre: [1, 1, 6, 1] }))).toEqual([]);
    expect(playabilityProblems(chord("133211")).map((p) => p.code)).toContain("finger-count");
    expect(playabilityProblems(chord("1x3x6x")).map((p) => p.code)).toContain("fret-span");
    expect(playabilityProblems(chord("xx3211", { fingers: "xx3211" }))).toEqual([]);
    expect(playabilityProblems(chord("xx3211", { fingers: "xx1234" })).map((p) => p.code)).toContain("fingering-order");
  });

  it("holds each technique to a beginner rate at the minimum tempo and an improving rate at the maximum", () => {
    const strums = (tempo: ScoreText["tempo"]) =>
      base({
        key: "E minor",
        tempo,
        voicings: { Em: "022000" },
        voices: { s: { label: "S", text: "s D:Em s U:Em s D:Em s U:Em s D:Em s U:Em s D:Em s U:Em h r" } },
      });
    expect(playabilityProblems(strums([60, 70, 90]))).toEqual([]);
    expect(playabilityProblems(strums([72, 80, 90])).map((p) => p.message)).toContainEqual(
      expect.stringContaining("beginner"),
    );
    expect(playabilityProblems(strums([60, 80, 130])).map((p) => p.message)).toContainEqual(
      expect.stringContaining("improving"),
    );
  });

  it("needs time to change chord shape, and a documented exception can waive a finding", () => {
    const changes = base({
      key: "C major",
      tempo: [90, 100, 110],
      voicings: { C: "x32010", G: "320003" },
      voices: { s: { label: "S", text: "e D:C e D:G e D:C e D:G h r" } },
    });
    expect(playabilityProblems(changes).some((p) => p.code === "change-time")).toBe(true);
    expect(
      playabilityProblems({
        ...changes,
        exceptions: [{ rule: "change-time", reason: "Deliberately quick: this is the hard part we name." }],
      }),
    ).toEqual([]);
  });

  it("flags string skips and unmarked jumps along the neck", () => {
    const line = (text: string, tempo: ScoreText["tempo"] = [60, 90, 120]) =>
      base({ key: "A minor", tempo, voices: { l: { label: "L", text } } });
    expect(playabilityProblems(line("s 6:5 s 1:5 s 6:5 s 1:5 h. r")).map((p) => p.code)).toContain("string-skip");
    expect(playabilityProblems(line("e 3:2 e 3:9 h. r")).map((p) => p.code)).toContain("stretch");
    expect(playabilityProblems(line("e 3:2 e 3:9[sh] h. r"))).toEqual([]);
  });
});

describe("performance", () => {
  it("keeps beats on the click while swinging and shuffling the off-beats, and can find its place again", () => {
    expect(performedTick(24, "straight")).toBe(24);
    expect(performedTick(24, "shuffle-8")).toBeCloseTo(32);
    expect(performedTick(24, "swing-8")).toBeCloseTo(29.76);
    expect(performedTick(12, "swing-16")).toBeCloseTo(13.92);
    expect(performedTick(48, "shuffle-8")).toBe(48);
    for (const feel of Object.keys(FEELS) as (keyof typeof FEELS)[])
      for (const tick of [0, 6, 12, 18, 24, 30, 36, 47, 96])
        expect(notatedTick(performedTick(tick, feel), feel)).toBeCloseTo(tick);
    const shuffle = base({
      feel: "shuffle-8",
      tempo: [60, 60, 60],
      voices: { l: { label: "L", text: "e 1:0 e 1:0 h. r" } },
    });
    expect(performScore(shuffle, { tempo: 60 }).map((sound) => sound.time)).toEqual([0, expect.closeTo(2 / 3)]);
    expect(tickAt(shuffle, 0, 2 / 3, 60)).toBeCloseTo(24);
  });

  it("strums across the strings in the stroke's direction and sounds exactly the voicing's pitches", () => {
    const strum = base({
      key: "C major",
      voicings: { C: "x32010" },
      voices: { s: { label: "S", text: "h D:C h U:C" } },
    });
    const sounds = performScore(strum, { tempo: 60 });
    expect(sounds.slice(0, 5).map((sound) => sound.string)).toEqual([5, 4, 3, 2, 1]);
    expect(sounds.slice(5).map((sound) => sound.string)).toEqual([1, 2, 3, 4, 5]);
    expect(sounds.slice(0, 5).map((sound) => sound.midi)).toEqual([48, 52, 55, 60, 64]);
    expect(sounds[1].time - sounds[0].time).toBeCloseTo(0.012);
  });

  it("sounds a hammer-on and a slide on the string already ringing, and bends to the target pitch", () => {
    const legato = base({
      key: "A minor",
      voices: { l: { label: "L", text: "e 3:2 e 3:4[h] e 3:4 e 3:7[sl] q 2:8[b1r] q r" } },
    });
    const sounds = performScore(legato, { tempo: 60 });
    expect(sounds.map((sound) => [sound.string, sound.midi])).toEqual([
      [3, 57],
      [3, 59],
      [2, 67],
    ]);
    expect(sounds[0].glides).toEqual([{ at: 0.5, to: 59, time: 0.008 }]);
    expect(sounds[1].glides[0].to).toBe(62);
    expect(sounds[1].glides[0].at + sounds[1].glides[0].time).toBeCloseTo(1.5);
    expect(sounds[2].glides.map((glide) => glide.to)).toEqual([68, 67]);
  });

  it("stops a string when it is struck again, lets marked notes ring, and keeps palm mutes short", () => {
    const ring = base({
      key: "C major",
      voices: { l: { label: "L", text: "e 5:3[lr] e 3:0[lr] e 5:3[lr] e 2:1 h 4:2[pm]" } },
    });
    const sounds = performScore(ring, { tempo: 60 });
    expect(sounds[0].duration).toBeCloseTo(1);
    expect(sounds[1].duration).toBeGreaterThan(3);
    expect(sounds.at(-1)).toMatchObject({ kind: "muted" });
    expect(sounds.at(-1)!.duration).toBeLessThanOrEqual(0.35);
  });

  it("moves sounds in time, never in pitch, when the tempo changes", () => {
    const s = base();
    const slow = performScore(s, { tempo: 50 });
    const fast = performScore(s, { tempo: 80 });
    expect(slow.map((sound) => sound.midi)).toEqual(fast.map((sound) => sound.midi));
    expect(slow[1].time / fast[1].time).toBeCloseTo(80 / 50);
    expect(pulses(s, { tempo: 60, fromTick: 0, toTick: 192 }).map((pulse) => [pulse.time, pulse.accented])).toEqual([
      [0, true],
      [1, false],
      [2, false],
      [3, false],
    ]);
  });
});

describe("views", () => {
  it("grids each bar as finely as its rhythm needs and labels the count", () => {
    expect(barGrid(base(), 1).labels).toEqual(["1", "2", "3", "4"]);
    const sixteenths = base({ voices: { l: { label: "L", text: "s 1:0 s r e r h. r" } } });
    expect(barGrid(sixteenths, 1).labels.slice(0, 4)).toEqual(["1", "e", "+", "a"]);
    const triplets = base({ voices: { l: { label: "L", text: "e3 1:0 e3 1:0 e3 1:0 h. r" } } });
    expect(barGrid(triplets, 1).labels.slice(0, 3)).toEqual(["1", "trip", "let"]);
    expect(
      barGrid(base({ metre: "6/8", voices: { l: { label: "L", text: "e 1:0 e 1:0 e 1:0 q. r" } } }), 1).labels,
    ).toEqual(["1", "+", "a", "2", "+", "a"]);
  });

  it("puts each attack's fret, technique and stroke where the event is, and describes it in words", () => {
    const s = base({
      key: "C major",
      voicings: { C: "x32010" },
      voices: { l: { label: "L", text: "e 3:2 e 3:4[h] q D:C[>] q X q r" } },
    });
    const fixed = { ...s, events: s.events };
    const grid = barGrid(fixed, 1);
    const cells = tabCells(fixed, grid);
    expect(cells.filter((cell) => cell.column === 1)).toEqual([
      expect.objectContaining({ string: 3, text: "4", marks: ["h"] }),
    ]);
    expect(cells.filter((cell) => cell.column === 2).map((cell) => `${cell.string}:${cell.text}`)).toEqual([
      "1:0",
      "2:1",
      "3:0",
      "4:2",
      "5:3",
    ]);
    expect(cells.filter((cell) => cell.column === 4).map((cell) => cell.text)).toEqual(["x", "x", "x", "x", "x", "x"]);
    expect(
      rhythmLane(fixed, grid, "l").map((span) => [span.fromColumn, span.toColumn, span.kind, span.stroke ?? ""]),
    ).toEqual([
      [0, 1, "attack", ""],
      [1, 2, "attack", ""],
      [2, 4, "attack", "down"],
      [4, 6, "attack", "down"],
      [6, 8, "rest", ""],
    ]);
    expect(describeEvent(fixed.events[1], fixed)).toBe("G string fret 4 (B), hammer-on");
    expect(describeEvent(fixed.events[2], fixed)).toBe("down strum, C, accented");
    expect(describeEvent(fixed.events[2], fixed, true)).toBe("down strum, chord, accented");
  });

  it("draws chord diagrams from the voicing and shows the hand's positions at any moment", () => {
    expect(chordDiagram({ id: "C", symbol: "C", frets: [null, 3, 2, 0, 1, 0] })).toMatchObject({
      baseFret: 1,
      frets: 4,
    });
    expect(chordDiagram({ id: "A", symbol: "A", frets: [5, 7, 7, 6, 5, 5] })).toMatchObject({ baseFret: 5 });
    const s = base({ key: "C major", voicings: { C: "x32010" }, voices: { s: { label: "S", text: "h D:C h r" } } });
    expect(fretboardAt(s, 50).map((position) => `${position.string}:${position.fret}:${position.name}`)).toEqual([
      "5:3:C",
      "4:2:E",
      "3:0:G",
      "2:1:C",
      "1:0:E",
    ]);
    expect(fretboardAt(s, 100)).toEqual([]);
    expect(allPositions(s).map((position) => position.midi)).toEqual(
      [1, 2, 3, 4, 5].map((string) => positionMidi({ string: string as 1, fret: [0, 1, 0, 2, 3][string - 1] })),
    );
  });
});
