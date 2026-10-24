import { describe, expect, it } from "vitest";
import { positionMidi, strumPositions } from "../../core/score/validate";
import type { NoteEvent, Score } from "../../core/score/types";
import { CURRICULUM } from "../curriculum";
import { pieceScore } from "../pieces/format";
import {
  FRONT_STEP_PIECE,
  HARBOUR_SONG_PIECE,
  LANTERN_PIECE,
  PIECES,
  PORCH_LIGHT_PIECE,
  SUNDAY_GLIDE_PIECE,
} from "../pieces/library";
import { scoreById, type Lesson } from "./format";
import {
  BY_EAR_LESSON,
  CALL_ANSWER_LESSON,
  ENDINGS_LESSON,
  HOME_LESSON,
  LESSONS as STAGE_3,
  MOTIF_LESSON,
  PENTATONIC_LESSON,
} from "./stage3";
import {
  COMMON_TONES_LESSON,
  HARMONISE_LESSON,
  INVERSIONS_LESSON,
  LESSONS as STAGE_4,
  SIXTHS_LESSON,
  TRAVIS_LESSON,
  TRIADS_LESSON,
} from "./stage4";

/*
 * Batch 2 (docs/CURRICULUM_MAP.md §3, Units 13–24): the musical claims each
 * lesson and piece makes in words, checked against its notes. The validator
 * already checks spelling, voicings, playability and correspondence.
 */
const notes = (score: Score, voice?: string) =>
  score.events.filter(
    (event): event is NoteEvent => event.kind === "note" && !event.art?.tie && (!voice || event.voice === voice),
  );
const midi = (score: Score, voice?: string) => notes(score, voice).map((event) => positionMidi(event.notes[0]));
const BAR = 192;
const barOf = (tick: number, ticks = BAR) => Math.floor(tick / ticks);
/** Notes grouped by bar, as MIDI numbers. */
const bars = (score: Score, voice?: string, ticks = BAR) => {
  const grouped: number[][] = [];
  for (const event of notes(score, voice)) (grouped[barOf(event.at, ticks)] ??= []).push(positionMidi(event.notes[0]));
  return grouped;
};
const DEGREE: Record<number, string> = { 0: "1", 2: "2", 3: "♭3", 4: "3", 5: "4", 7: "5", 9: "6", 10: "♭7", 11: "7" };
const degree = (note: number, tonic: number) => DEGREE[(((note - tonic) % 12) + 12) % 12] ?? "?";
const degrees = (list: number[], tonic: number) => list.map((note) => degree(note, tonic));
const G = 7;
const D = 2;
const C = 0;
const E = 4;
const pitchClasses = (list: number[]) => [...new Set(list.map((note) => note % 12))].sort((a, b) => a - b);
const span = (event: NoteEvent) => {
  const [low, high] = event.notes.map(positionMidi).sort((a, b) => a - b);
  return high - low;
};
const chordAt = (score: Score, bar: number, ticks = BAR) =>
  [...(score.harmony ?? [])].reverse().find((mark) => barOf(mark.at, ticks) <= bar)!.symbol;
const CHORD_TONES: Record<string, number[]> = {
  G: [7, 11, 2],
  C: [0, 4, 7],
  D: [2, 6, 9],
  Em: [4, 7, 11],
  Am: [9, 0, 4],
  A: [9, 1, 4],
  Fmaj7: [5, 9, 0, 4],
};

describe("Batch 2 lessons", () => {
  it("covers every unit of Stages 3 and 4, one lesson each", () => {
    expect([...STAGE_3, ...STAGE_4].map((lesson) => lesson.unitId).sort()).toEqual(
      CURRICULUM.filter((unit) => unit.stage === 3 || unit.stage === 4).map((unit) => unit.id),
    );
  });

  it("stands each lesson in for the activity the curriculum map names: technique, and creative for Unit 24", () => {
    const standIn = (lesson: Lesson) => `${lesson.unitId}-${lesson.activityKind}`;
    expect([...STAGE_3, ...STAGE_4].map(standIn)).toEqual([
      ...Array.from({ length: 11 }, (_, index) => `unit-${13 + index}-technique`),
      "unit-24-creative",
    ]);
    expect(HARMONISE_LESSON.checkKind).toBe("creating");
  });

  it("routes every performance to a piece part that exists and names the unit", () => {
    for (const lesson of [...STAGE_3, ...STAGE_4]) {
      expect(lesson.performance.kind, lesson.id).toBe("piece");
      if (lesson.performance.kind !== "piece") continue;
      const { pieceId, partId } = lesson.performance;
      const part = PIECES.find((piece) => piece.id === pieceId)?.parts.find((item) => item.id === partId);
      expect(part, lesson.id).toBeDefined();
      expect(part!.unitIds, lesson.id).toContain(lesson.unitId);
    }
  });
});

describe("what each Stage 3 lesson says it plays", () => {
  it("Unit 13: 1–2–3–1, 1–5–1 and 1–6–5 over a held low G, a phrase that lands home, the same from D", () => {
    const patterns = scoreById(HOME_LESSON, "home-degrees-g");
    expect(bars(patterns).map((bar) => degrees(bar, G))).toEqual([
      ["1", "2", "3", "1"],
      ["1", "5", "1"],
      ["1", "6", "5"],
      ["1"],
    ]);
    expect(pitchClasses(midi(scoreById(HOME_LESSON, "home-low-g-drone")))).toEqual([G]);
    expect(degree(midi(scoreById(HOME_LESSON, "home-phrase-g")).at(-1)!, G)).toBe("1");
    const fromD = scoreById(HOME_LESSON, "home-degrees-d");
    expect(bars(fromD).map((bar) => degrees(bar, D))).toEqual(bars(patterns).map((bar) => degrees(bar, G)));
    // "The 5 and the 6 now sit below it."
    const [, fifth, sixth] = bars(fromD);
    expect([fifth[1] < fifth[0], sixth[1] < sixth[0], sixth[2] < sixth[0]]).toEqual([true, true, true]);
    expect(pitchClasses(midi(scoreById(HOME_LESSON, "home-low-d-drone")))).toEqual([D]);
  });

  it("Unit 14: the shape is only 1 2 3 5 6 with both G roots; the 4 and 7 lean back; A is two frets up", () => {
    const shape = scoreById(PENTATONIC_LESSON, "pentatonic-g-shape");
    expect(new Set(degrees(midi(shape), G))).toEqual(new Set(["1", "2", "3", "5", "6"]));
    expect(midi(shape)).toEqual(expect.arrayContaining([43, 55]));
    expect([midi(shape)[0], midi(shape).at(-1)]).toEqual([43, 43]);
    const leaning = bars(scoreById(PENTATONIC_LESSON, "pentatonic-g-leaning"));
    expect(degrees(leaning[0], G)).toEqual(["3", "4", "3"]);
    expect(degrees(leaning[1], G)).toEqual(["1", "7", "1"]);
    const inA = notes(scoreById(PENTATONIC_LESSON, "pentatonic-a-shape"));
    expect(inA.map((event) => [event.notes[0].string, event.notes[0].fret - 2])).toEqual(
      notes(shape).map((event) => [event.notes[0].string, event.notes[0].fret]),
    );
  });

  it("Unit 15: the motif is B–A–G in its rhythm; one variation keeps the notes, the other the rhythm", () => {
    const onsets = (score: Score, bar: number) =>
      notes(score)
        .filter((event) => barOf(event.at) === bar)
        .map((event) => event.at - bar * BAR);
    const rhythmFirst = scoreById(MOTIF_LESSON, "motif-rhythm-then-notes");
    expect(onsets(rhythmFirst, 0)).toEqual([0, 24, 72]);
    expect(onsets(rhythmFirst, 1)).toEqual([0, 24, 72]);
    expect(bars(rhythmFirst)).toEqual([
      [55, 55, 55],
      [59, 57, 55],
    ]);
    const ways = scoreById(MOTIF_LESSON, "motif-three-ways");
    expect(bars(ways)[1]).toEqual(bars(ways)[0]);
    expect(onsets(ways, 1)).not.toEqual(onsets(ways, 0));
    expect(onsets(ways, 2)).toEqual(onsets(ways, 0));
    expect(degrees(bars(ways)[2], G)).toEqual(["3", "2", "5"]);
    const inD = scoreById(MOTIF_LESSON, "motif-in-d");
    expect(degrees(bars(inD)[0], D)).toEqual(["3", "2", "1"]);
    expect(onsets(inD, 0)).toEqual([0, 24, 72]);
    expect(bars(inD)[1].at(-1)).toBe(69);
  });

  it("Unit 16: phrase 1 stops on 2 over D and phrase 2 on 1 over G; the strum changes on count 1", () => {
    const melody = scoreById(ENDINGS_LESSON, "endings-lantern-melody");
    const melodyBars = bars(melody);
    expect([degree(melodyBars[3].at(-1)!, G), chordAt(melody, 3)]).toEqual(["2", "D"]);
    expect([degree(melodyBars[7].at(-1)!, G), chordAt(melody, 7)]).toEqual(["1", "G"]);
    const strum = scoreById(ENDINGS_LESSON, "strum-g-c-d-g");
    const firstChord = (bar: number) => {
      const event = strum.events.find((item) => item.kind === "strum" && item.at === bar * BAR);
      return event?.kind === "strum" ? event.chord : null;
    };
    expect([0, 1, 2, 3].map(firstChord)).toEqual(["G", "C", "D", "G"]);
    expect(strum.voicings.find((voicing) => voicing.symbol === "D")?.frets).toEqual([null, null, 0, 2, 3, 2]);
    const inD = scoreById(ENDINGS_LESSON, "endings-in-d");
    expect(bars(inD).map((bar) => degrees(bar, D))).toEqual([["3", "2", "1"], ["6", "5", "4"], ["7", "6", "5"], ["1"]]);
  });

  it("Unit 17: the shape is E minor pentatonic; the answer keeps the call's rhythm, starts lower and ends on E", () => {
    const shape = scoreById(CALL_ANSWER_LESSON, "pentatonic-e-open");
    expect(new Set(degrees(midi(shape), E))).toEqual(new Set(["1", "♭3", "4", "5", "♭7"]));
    expect([midi(shape)[0], midi(shape).at(-2)]).toEqual([40, 67]);
    const call = notes(scoreById(CALL_ANSWER_LESSON, "call-e-two-bars"));
    const answer = notes(scoreById(CALL_ANSWER_LESSON, "answer-e-two-bars"));
    expect(answer.map((event) => event.at - 2 * BAR)).toEqual(call.map((event) => event.at));
    expect(positionMidi(answer[0].notes[0])).toBeLessThan(positionMidi(call[0].notes[0]));
    expect(answer.at(-1)!.notes[0]).toEqual({ string: 4, fret: 2 });
    const curls = notes(scoreById(CALL_ANSWER_LESSON, "minor-third-curl")).filter((event) => event.art?.bend);
    expect(curls.map((event) => [positionMidi(event.notes[0]), event.art!.bend!.semitones])).toEqual([
      [67, 0.5],
      [67, 0.5],
    ]);
    const callA = notes(scoreById(CALL_ANSWER_LESSON, "answer-a-two-bars"));
    expect(callA.at(-1)!.notes[0]).toEqual({ string: 5, fret: 0 });
  });

  it("Unit 17's call and answer are Front Step's first line, which curls the G twice", () => {
    const calls = pieceScore(FRONT_STEP_PIECE, "front-step-calls");
    const exchange = [
      ...notes(scoreById(CALL_ANSWER_LESSON, "call-e-two-bars")),
      ...notes(scoreById(CALL_ANSWER_LESSON, "answer-e-two-bars")),
    ].map((event) => [event.at, positionMidi(event.notes[0])]);
    expect(
      notes(calls)
        .filter((event) => event.at < 4 * BAR)
        .map((event) => [event.at, positionMidi(event.notes[0])]),
    ).toEqual(exchange);
    expect(notes(calls).filter((event) => event.art?.bend?.semitones === 0.5)).toHaveLength(2);
  });

  it("Unit 18: the rhythm study is the melody's rhythm on the open high E; the melody stays on strings 1 and 2", () => {
    const melody = scoreById(BY_EAR_LESSON, "by-ear-harbour-melody");
    const rhythm = scoreById(BY_EAR_LESSON, "by-ear-harbour-rhythm");
    expect(melody.metre).toBe("3/4");
    expect(notes(rhythm).map((event) => event.at)).toEqual(notes(melody).map((event) => event.at));
    expect(new Set(midi(rhythm))).toEqual(new Set([64]));
    expect(notes(melody).every((event) => event.notes[0].string <= 2)).toBe(true);
    expect(degree(midi(melody).at(-1)!, C)).toBe("1");
    // "Two steps down means it is the 3, E": the first note is E, the 3 of C.
    expect(degree(midi(melody)[0], C)).toBe("3");
    const inG = scoreById(BY_EAR_LESSON, "by-ear-waltz-g");
    expect(notes(inG).every((event) => event.notes[0].string === 2 || event.notes[0].string === 3)).toBe(true);
    expect(notes(inG).at(-1)!.notes[0]).toEqual({ string: 3, fret: 0 });
  });
});

describe("what each Stage 4 lesson says it plays", () => {
  const stack = (event: NoteEvent) => event.notes.map(positionMidi).sort((a, b) => a - b);
  const chordsOf = (score: Score) => notes(score).filter((event) => event.notes.length === 3);

  it("Unit 19: D is root, 3 and 5 from the G string up; Dm lowers only the 3; sus2 hammers into the 3", () => {
    const [major, minor] = chordsOf(scoreById(TRIADS_LESSON, "triad-d-dm-top"));
    expect(stack(major).map((note) => degree(note, D))).toEqual(["1", "3", "5"]);
    expect(stack(minor).map((note) => degree(note, D))).toEqual(["1", "♭3", "5"]);
    expect(major.notes.filter((note, index) => note.fret !== minor.notes[index].fret)).toEqual([
      { string: 2, fret: 7 },
    ]);
    const hammer = notes(scoreById(TRIADS_LESSON, "triad-sus2-hammer"));
    expect(stack(hammer[0]).map((note) => degree(note, D))).toEqual(["1", "2", "5"]);
    expect([hammer[1].at, hammer[1].art?.legato, degree(positionMidi(hammer[1].notes[0]), D)]).toEqual([
      48,
      "hammer-on",
      "3",
    ]);
    expect(stack(hammer[3]).map((note) => degree(note, G))).toEqual(["5", "1", "2"]);
    expect(degree(positionMidi(hammer[4].notes[0]), G)).toBe("3");
    const inE = chordsOf(scoreById(TRIADS_LESSON, "triad-e-em-top"));
    expect(inE.map(stack)).toEqual(
      chordsOf(scoreById(TRIADS_LESSON, "triad-d-dm-top")).map((event) => stack(event).map((note) => note + 2)),
    );
  });

  it("Unit 20: three shapes of D with the top note rising; D to the nearest G moves two notes", () => {
    const shapes = chordsOf(scoreById(INVERSIONS_LESSON, "inversions-d-top")).slice(0, 3);
    for (const shape of shapes) expect(pitchClasses(stack(shape))).toEqual([D, 6, 9]);
    expect(shapes.map((shape) => stack(shape).at(-1))).toEqual([66, 69, 74]);
    const [d, g] = chordsOf(scoreById(INVERSIONS_LESSON, "d-g-nearest"));
    expect(pitchClasses(stack(g))).toEqual([D, G, 11]);
    expect(d.notes.filter((note, index) => note.fret === g.notes[index].fret)).toEqual([{ string: 3, fret: 7 }]);
    const groove = scoreById(INVERSIONS_LESSON, "d-g-sixteenths");
    expect(groove.feel).toBe("swing-16");
    expect(groove.events.filter((event) => event.kind === "strum" && event.at < BAR).map((event) => event.at)).toEqual([
      0, 36, 72, 96, 132,
    ]);
    const gShapes = chordsOf(scoreById(INVERSIONS_LESSON, "inversions-g-top")).slice(0, 3);
    for (const shape of gShapes) expect(pitchClasses(stack(shape))).toEqual([D, G, 11]);
    expect(gShapes.map((shape) => stack(shape).at(-1))).toEqual([67, 71, 74]);
  });

  it("Unit 21: bass on 1 and i-m-a-m-i in three; B-string fret 1 stays through C, Am and Fmaj7", () => {
    const waltz = scoreById(COMMON_TONES_LESSON, "waltz-c-am-f-g");
    const WALTZ_BAR = 144;
    expect(waltz.metre).toBe("3/4");
    expect(
      notes(waltz, "thumb").map((event) => [event.at % WALTZ_BAR, degree(positionMidi(event.notes[0]), 0)]),
    ).toEqual([
      [0, "1"],
      [0, "6"],
      [0, "4"],
      [0, "5"],
    ]);
    const fingers = notes(waltz, "fingers");
    expect(fingers.slice(0, 5).map((event) => [event.at, event.notes[0].pluck, event.notes[0].string])).toEqual([
      [24, "i", 3],
      [48, "m", 2],
      [72, "a", 1],
      [96, "m", 2],
      [120, "i", 3],
    ]);
    const hasPosition = (bar: number, string: number, fret: number) =>
      fingers.some(
        (event) =>
          barOf(event.at, WALTZ_BAR) === bar && event.notes[0].string === string && event.notes[0].fret === fret,
      );
    expect([0, 1, 2, 3].map((bar) => hasPosition(bar, 2, 1))).toEqual([true, true, true, false]);
    expect([0, 1, 2, 3].map((bar) => hasPosition(bar, 3, 2))).toEqual([false, true, true, false]);
    // Every plucked note belongs to its bar's chord, in both keys.
    for (const score of [waltz, scoreById(COMMON_TONES_LESSON, "waltz-g-em-c-d")])
      for (const event of notes(score))
        expect(CHORD_TONES[chordAt(score, barOf(event.at, WALTZ_BAR), WALTZ_BAR)]).toContain(
          positionMidi(event.notes[0]) % 12,
        );
  });

  it("Unit 22: the thumb alternates the strings the lesson names; fingers on every “and”; a pinch on each 1", () => {
    const thumbStrings = (score: Score) =>
      bars(score, "thumb").map((_, bar) =>
        notes(score, "thumb")
          .filter((event) => barOf(event.at) === bar)
          .map((event) => event.notes[0].string),
      );
    const expected = [
      [6, 4, 6, 4],
      [6, 4, 6, 4],
      [5, 4, 5, 4],
      [4, 3, 4, 3],
    ];
    for (const id of ["travis-thumb-only", "travis-thumb-and-finger", "travis-with-pinches"])
      expect(thumbStrings(scoreById(TRAVIS_LESSON, id)), id).toEqual(expected);
    const offBeats = scoreById(TRAVIS_LESSON, "travis-thumb-and-finger");
    expect(
      notes(offBeats, "fingers")
        .filter((event) => event.at < BAR)
        .map((event) => event.at),
    ).toEqual([24, 72, 120, 168]);
    const pinches = scoreById(TRAVIS_LESSON, "travis-with-pinches");
    for (let bar = 0; bar < 4; bar++) {
      const atOne = notes(pinches).filter((event) => event.at === bar * BAR);
      expect(atOne.map((event) => event.voice).sort()).toEqual(["fingers", "thumb"]);
      expect(atOne.find((event) => event.voice === "fingers")!.notes[0].pluck).toBe("m");
    }
    const inC = scoreById(TRAVIS_LESSON, "travis-c-am-f-g");
    expect(thumbStrings(inC)[2]).toEqual([4, 3, 4, 3]);
    for (const score of [pinches, inC])
      for (const event of notes(score))
        expect(CHORD_TONES[chordAt(score, barOf(event.at))]).toContain(positionMidi(event.notes[0]) % 12);
  });

  it("Unit 23: a major sixth on D's 5 and 3, a minor sixth on G's 3 and 1, slid in; the same in A", () => {
    const land = notes(scoreById(SIXTHS_LESSON, "sixths-land-d-g"));
    expect(land.slice(0, 2).map((event) => [span(event), ...event.notes.map((note) => note.string)])).toEqual([
      [9, 3, 1],
      [8, 3, 1],
    ]);
    expect(degrees(land[0].notes.map(positionMidi), D)).toEqual(["5", "3"]);
    expect(degrees(land[1].notes.map(positionMidi), G)).toEqual(["3", "1"]);
    const slides = notes(scoreById(SIXTHS_LESSON, "sixths-slide-d-g"));
    expect(slides.every((event) => event.art?.slideIn === "below")).toBe(true);
    expect(slides.map((event) => event.at % BAR)).toEqual([0, 96, 0, 96]);
    const inA = notes(scoreById(SIXTHS_LESSON, "sixths-land-a-d"));
    expect(inA.slice(0, 2).map(span)).toEqual([9, 8]);
    expect(degrees(inA[0].notes.map(positionMidi), 9)).toEqual(["5", "3"]);
    expect(degrees(inA[1].notes.map(positionMidi), D)).toEqual(["3", "1"]);
  });

  it("Unit 24: every chord the lesson chooses contains its bar's landing note; the making step is the bare tune", () => {
    const tune = scoreById(HARMONISE_LESSON, "harmonise-lantern-tune");
    const landing = (bar: number) => {
      const inBar = notes(tune).filter((event) => barOf(event.at) === bar);
      return positionMidi((inBar.find((event) => event.at % BAR === 72) ?? inBar[0]).notes[0]) % 12;
    };
    const firstChord = (score: Score, bar: number) => {
      const event = score.events.find((item) => item.kind === "strum" && item.at === bar * BAR);
      return event?.kind === "strum" ? score.voicings.find((voicing) => voicing.id === event.chord)!.symbol : null;
    };
    for (const id of ["harmonise-lantern-chords", "harmonise-lantern-plain"]) {
      const chords = scoreById(HARMONISE_LESSON, id);
      for (let bar = 0; bar < 8; bar++)
        expect(CHORD_TONES[firstChord(chords, bar)!], `${id} bar ${bar + 1}`).toContain(landing(bar));
    }
    expect(firstChord(scoreById(HARMONISE_LESSON, "harmonise-lantern-chords"), 4)).toBe("Em");
    expect(firstChord(scoreById(HARMONISE_LESSON, "harmonise-lantern-plain"), 4)).toBe("G");
    const making = HARMONISE_LESSON.cueFading.find((step) => step.phase === "try-unaided")!;
    expect(making.scoreId).toBe(tune.id);
    expect(scoreById(HARMONISE_LESSON, making.scoreId).voicings).toEqual([]);
    expect(HARMONISE_LESSON.accompaniment?.[tune.id]).toBeUndefined();
    const porch = scoreById(HARMONISE_LESSON, "harmonise-porch-chords");
    const porchTune = scoreById(HARMONISE_LESSON, "harmonise-porch-tune");
    for (const event of notes(porchTune))
      expect(CHORD_TONES[firstChord(porch, barOf(event.at))!]).toContain(positionMidi(event.notes[0]) % 12);
  });
});

describe("the Batch 2 pieces", () => {
  it("Lantern: the motif's rhythm opens every bar but the last; bars 2 and 3 are 6–5–4 and 7–6–5", () => {
    const melody = pieceScore(LANTERN_PIECE, "lantern-melody");
    const opening = (bar: number) =>
      notes(melody)
        .filter((event) => barOf(event.at) === bar)
        .slice(0, 3)
        .map((event) => event.at - bar * BAR);
    for (let bar = 0; bar < 7; bar++) expect(opening(bar), `bar ${bar + 1}`).toEqual([0, 24, 72]);
    const melodyBars = bars(melody);
    expect(degrees(melodyBars[0], G)).toEqual(["3", "2", "1"]);
    expect(degrees(melodyBars[1], G)).toEqual(["6", "5", "4"]);
    expect(degrees(melodyBars[2], G)).toEqual(["7", "6", "5"]);
    for (let bar = 0; bar < 7; bar++)
      expect(melodyBars[bar].every((note, index) => index === 0 || note < melodyBars[bar][index - 1])).toBe(true);
    const drone = pieceScore(LANTERN_PIECE, "lantern-drone");
    expect(notes(drone).map((event) => event.at % BAR)).toEqual(Array.from({ length: 8 }, () => [0, 96]).flat());
    expect(new Set(midi(drone))).toEqual(new Set([55]));
  });

  it("Porch Light: thumb roots G, E, C, D, G, E, D, G; Travis thumb on every count; melody pinched on 1 and 3", () => {
    const roots = pieceScore(PORCH_LIGHT_PIECE, "porch-light-roots");
    expect(
      notes(roots)
        .filter((event) => event.at % BAR === 0)
        .map((event) => positionMidi(event.notes[0]) % 12),
    ).toEqual([G, E, C, D, G, E, D, G]);
    const melody = pieceScore(PORCH_LIGHT_PIECE, "porch-light-melody");
    const thumbTicks = new Set(notes(melody, "thumb").map((event) => event.at));
    const tops = notes(melody, "melody").filter((event) => event.art?.legato !== "hammer-on");
    for (const event of tops) {
      expect(thumbTicks.has(event.at)).toBe(true);
      expect(event.notes[0].string).toBeLessThanOrEqual(2);
    }
    expect(tops.every((event) => event.at % 96 === 0)).toBe(true);
    const hammer = notes(melody, "melody").find((event) => event.art?.legato === "hammer-on")!;
    expect([barOf(hammer.at), hammer.notes[0]]).toEqual([2, { string: 2, fret: 1 }]);
    // Chord tones throughout, except the B that is hammered up to C (an approach note in the C bar).
    const approach = (event: NoteEvent) => event.at + event.dur === hammer.at && event.voice === hammer.voice;
    for (const event of notes(melody).filter((item) => !approach(item)))
      expect(CHORD_TONES[chordAt(melody, barOf(event.at))]).toContain(positionMidi(event.notes[0]) % 12);
  });

  it("Harbour Song: bass on each count 1, C, A, F, G, C, A, G, C; the melody's notes over its arpeggio", () => {
    const WALTZ_BAR = 144;
    const bass = pieceScore(HARBOUR_SONG_PIECE, "harbour-song-bass");
    expect(notes(bass).map((event) => [event.at % WALTZ_BAR, positionMidi(event.notes[0]) % 12])).toEqual(
      [C, 9, 5, G, C, 9, G, C].map((pc) => [0, pc]),
    );
    const arpeggio = pieceScore(HARBOUR_SONG_PIECE, "harbour-song-arpeggio");
    for (const event of notes(arpeggio))
      expect(CHORD_TONES[chordAt(arpeggio, barOf(event.at, WALTZ_BAR), WALTZ_BAR)]).toContain(
        positionMidi(event.notes[0]) % 12,
      );
    const melody = pieceScore(HARBOUR_SONG_PIECE, "harbour-song-melody");
    expect(notes(melody).every((event) => event.notes[0].string <= 2)).toBe(true);
  });

  it("Sunday Glide: octave roots D and G; hits on 1, a, &2, 3, a3; sixths slid in on 1 and re-plucked before 2", () => {
    const roots = notes(pieceScore(SUNDAY_GLIDE_PIECE, "sunday-glide-roots"));
    expect(roots.every((event) => span(event) === 12)).toBe(true);
    expect(roots.filter((event) => event.at % BAR === 0).map((event) => positionMidi(event.notes[0]) % 12)).toEqual([
      D,
      G,
      D,
      G,
    ]);
    const rhythm = pieceScore(SUNDAY_GLIDE_PIECE, "sunday-glide-rhythm");
    for (let bar = 0; bar < 4; bar++)
      expect(
        rhythm.events
          .filter((event) => event.kind === "strum" && barOf(event.at) === bar)
          .map((event) => event.at - bar * BAR),
      ).toEqual([0, 36, 72, 96, 132]);
    for (const event of rhythm.events)
      if (event.kind === "strum")
        expect(pitchClasses(strumPositions(event, rhythm).map(positionMidi))).toEqual(
          event.chord === "D" ? [D, 6, 9] : [D, G, 11],
        );
    const sixths = notes(pieceScore(SUNDAY_GLIDE_PIECE, "sunday-glide-sixths"));
    expect(sixths.map((event) => [event.at % BAR, Boolean(event.art?.slideIn), span(event)])).toEqual(
      [9, 8, 9, 8].flatMap((interval) => [
        [0, true, interval],
        [84, false, interval],
      ]),
    );
  });
});
