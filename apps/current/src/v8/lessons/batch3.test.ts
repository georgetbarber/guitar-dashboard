import { describe, expect, it } from "vitest";
import { positionMidi, strumPositions } from "../../core/score/validate";
import type { NoteEvent, Score, StrumEvent } from "../../core/score/types";
import { CURRICULUM } from "../curriculum";
import { pieceScore } from "../pieces/format";
import {
  FRONT_STEP_PIECE,
  GLASSHOUSE_PIECE,
  LOW_ROAD_PIECE,
  NIGHT_MARKET_PIECE,
  PIECES,
  TWO_RIVERS_PIECE,
} from "../pieces/library";
import { scoreById, type Lesson } from "./format";
import {
  BENDS_LESSON,
  DEVELOP_LESSON,
  FEELS_LESSON,
  IMPROVISE_LESSON,
  LESSONS as STAGE_5,
  SINGLE_RIFF_LESSON,
  SIXTEENTHS_LESSON,
} from "./stage5";
import {
  APPROACH_LESSON,
  BARRES_LESSON,
  BORROWED_LESSON,
  LESSONS as STAGE_6,
  MODES_LESSON,
  SEVENTHS_LESSON,
  WALKS_LESSON,
} from "./stage6";

/*
 * Batch 3 (docs/CURRICULUM_MAP.md §3, Units 25–36): the musical claims each
 * lesson and piece makes in words, checked against its notes.
 */
const BAR = 192;
const barOf = (tick: number) => Math.floor(tick / BAR);
const notes = (score: Score, voice?: string) =>
  score.events.filter(
    (event): event is NoteEvent => event.kind === "note" && !event.art?.tie && (!voice || event.voice === voice),
  );
const strums = (score: Score) => score.events.filter((event): event is StrumEvent => event.kind === "strum");
const low = (event: NoteEvent) => Math.min(...event.notes.map(positionMidi));
const pc = (midi: number) => ((midi % 12) + 12) % 12;
const inBar = <T extends { at: number }>(events: T[], bar: number) => events.filter((event) => barOf(event.at) === bar);
const sounding = (score: Score, strum: StrumEvent) => strumPositions(strum, score).map(positionMidi);
const shape = (score: Score, symbol: string) => score.voicings.find((voicing) => voicing.symbol === symbol)!.frets;

describe("Batch 3 lessons", () => {
  it("covers every unit of Stages 5 and 6, one lesson each", () => {
    expect([...STAGE_5, ...STAGE_6].map((lesson) => lesson.unitId).sort()).toEqual(
      CURRICULUM.filter((unit) => unit.stage === 5 || unit.stage === 6).map((unit) => unit.id),
    );
  });

  it("stands each lesson in for the activity the map names; Units 30 and 34 are listening checks", () => {
    const standIn = (lesson: Lesson) => `${lesson.unitId}-${lesson.activityKind}`;
    expect([...STAGE_5, ...STAGE_6].map(standIn)).toEqual([
      "unit-25-technique",
      "unit-26-rhythm",
      "unit-27-technique",
      "unit-28-variation",
      "unit-29-technique",
      "unit-30-listen-compare",
      "unit-31-technique",
      "unit-32-technique",
      "unit-33-technique",
      "unit-34-listen-compare",
      "unit-35-technique",
      "unit-36-technique",
    ]);
    expect([FEELS_LESSON.checkKind, MODES_LESSON.checkKind]).toEqual(["listening", "listening"]);
  });

  it("routes every piece performance to a part that names the unit", () => {
    for (const lesson of [...STAGE_5, ...STAGE_6]) {
      if (lesson.performance.kind !== "piece") continue;
      const { pieceId, partId } = lesson.performance;
      const part = PIECES.find((piece) => piece.id === pieceId)?.parts.find((item) => item.id === partId);
      expect(part, lesson.id).toBeDefined();
      expect(part!.unitIds, lesson.id).toContain(lesson.unitId);
    }
  });
});

describe("what each Stage 5 lesson says it plays", () => {
  it("Unit 25: C and D land with the C5 and D5 kicks; C pulls off to A, D hammers to E; from E, a fourth lower", () => {
    const riff = scoreById(SINGLE_RIFF_LESSON, "single-riff-a");
    const band = scoreById(SINGLE_RIFF_LESSON, "single-riff-power");
    for (const bar of [0, 1, 2]) {
      const accents = inBar(notes(riff), bar).filter((event) => event.art?.accent);
      const kicks = inBar(notes(band), bar).filter((event) => event.art?.accent);
      expect(accents.map((event) => event.at)).toEqual(kicks.map((event) => event.at));
      expect(accents.map((event) => pc(low(event)))).toEqual(kicks.map((event) => pc(low(event))));
      expect(accents.map((event) => pc(low(event)))).toEqual([0, 2]);
    }
    const bar1 = inBar(notes(riff), 0);
    const pull = bar1.find((event) => event.art?.legato === "pull-off")!;
    const hammer = bar1.find((event) => event.art?.legato === "hammer-on")!;
    expect([pc(low(pull)), pc(low(hammer))]).toEqual([9, 4]);
    const fromE = scoreById(SINGLE_RIFF_LESSON, "single-riff-e");
    expect(notes(fromE).map((event) => [event.at, low(event) + 5, event.art ?? {}])).toEqual(
      notes(riff).map((event) => [event.at, low(event), event.art ?? {}]),
    );
  });

  it("Unit 26: chords on 1, the a of 1 and the and of 2; ghosted scratches elsewhere; E and G stay from Em7 to A7", () => {
    const groove = scoreById(SIXTEENTHS_LESSON, "groove-em7-a7");
    for (let bar = 0; bar < 4; bar++) {
      const hits = inBar(strums(groove), bar);
      expect(hits.filter((event) => event.chord).map((event) => event.at - bar * BAR)).toEqual([0, 36, 72]);
      expect(hits.filter((event) => !event.chord).every((event) => event.art?.dead && event.art.ghost)).toBe(true);
      expect(hits).toHaveLength(16);
    }
    const [em7, a7] = [shape(groove, "Em7"), shape(groove, "A7")];
    expect([em7[2], a7[2], em7[5], a7[5]]).toEqual([2, 2, 3, 3]);
    expect([em7[3]! - a7[3]!, em7[4]! - a7[4]!]).toEqual([2, 1]);
    const inA = scoreById(SIXTEENTHS_LESSON, "groove-am7-d7");
    expect(shape(inA, "Am7").map((fret) => (fret === null ? null : fret - 5))).toEqual(em7);
    expect(shape(inA, "D7").map((fret) => (fret === null ? null : fret - 5))).toEqual(a7);
  });

  it("Unit 27: bends taught at the 7th fret first; each reaches its fretted target; vibrato only on fretted notes", () => {
    const tonic = { "bend-targets": 9, "bend-targets-open": 4 } as const;
    for (const id of ["bend-targets", "bend-targets-open"] as const) {
      const targets = notes(scoreById(BENDS_LESSON, id));
      for (let pair = 0; pair < targets.length; pair += 2) {
        const [target, bend] = [targets[pair], targets[pair + 1]];
        expect(low(bend) + bend.art!.bend!.semitones, id).toBe(low(target));
      }
      // The half-step bend is ♭3 up to 3 in both keys; the whole step is 4 up to 5.
      expect(
        targets.filter((event) => event.art?.bend).map((event) => pc(low(event) - tonic[id])),
        id,
      ).toEqual([5, 3]);
    }
    const frets = (id: string) => notes(scoreById(BENDS_LESSON, id)).flatMap((event) => event.notes.map((n) => n.fret));
    expect(Math.min(...frets("bend-targets"))).toBeGreaterThanOrEqual(7);
    expect(Math.max(...frets("bend-targets-open"))).toBeLessThanOrEqual(4);
    expect(BENDS_LESSON.studies.map((study) => study.scoreId).slice(1)).toEqual(["bend-targets", "bend-targets-open"]);
    const phrase = notes(scoreById(BENDS_LESSON, "bend-phrase"));
    const held = phrase.filter((event) => event.art?.vibrato);
    expect(held.every((event) => pc(low(event)) === 11 && event.notes[0].fret > 0)).toBe(true);
    const phraseA = notes(scoreById(BENDS_LESSON, "bend-phrase-a"));
    expect(phraseA.filter((event) => event.art?.vibrato).every((event) => pc(low(event)) === 4)).toBe(true);
    const touch = notes(scoreById(BENDS_LESSON, "phrase-touch"));
    expect(inBar(touch, 2).every((event) => event.art?.staccato)).toBe(true);
    expect(inBar(touch, 0).some((event) => event.art?.staccato)).toBe(false);
  });

  it("Unit 28: every version keeps the accents; A′ changes the ending, B is an octave up; Night Market's riff moves a sixteenth early", () => {
    const versions = notes(scoreById(DEVELOP_LESSON, "develop-low-road"));
    for (let bar = 0; bar < 4; bar++)
      expect(
        inBar(versions, bar)
          .filter((event) => event.art?.accent)
          .map((event) => event.at - bar * BAR),
      ).toEqual([72, 168]);
    const shape = (bar: number) => inBar(versions, bar).map((event) => [event.at - bar * BAR, low(event)]);
    expect(shape(1).slice(0, 6)).toEqual(shape(0).slice(0, 6));
    expect(shape(1).slice(6)).not.toEqual(shape(0).slice(6));
    expect(shape(3)).toEqual(shape(0).map(([at, midi]) => [at, midi + 12]));
    const night = notes(scoreById(DEVELOP_LESSON, "develop-night-riff"));
    const riffOf = (bar: number) => inBar(night, bar).map((event) => [event.at - bar * BAR, low(event)]);
    expect(riffOf(2)).toEqual(riffOf(0).map(([at, midi]) => [at - 12, midi]));
    expect(riffOf(3)).toEqual(riffOf(0).map(([at, midi]) => [at, midi + 12]));
  });

  it("Unit 29: the boogie is root-fifth then root-sixth on every beat, in shuffle; the answers keep to their notes and leave bar 4 empty", () => {
    const boogie = scoreById(IMPROVISE_LESSON, "boogie-line-1");
    expect(boogie.feel).toBe("shuffle-8");
    for (const event of notes(boogie)) {
      const [root, top] = event.notes.map(positionMidi).sort((a, b) => a - b);
      expect(top - root).toBe(event.at % 48 === 0 ? (Math.floor(event.at / 48) % 2 ? 9 : 7) : top - root);
    }
    expect(
      inBar(notes(boogie), 0).map((event) => {
        const [root, top] = event.notes.map(positionMidi).sort((a, b) => a - b);
        return top - root;
      }),
    ).toEqual([7, 7, 9, 9, 7, 7, 9, 9]);
    const three = notes(scoreById(IMPROVISE_LESSON, "improv-three-notes"));
    expect(new Set(three.map((event) => pc(low(event))))).toEqual(new Set([4, 7, 9]));
    expect(inBar(three, 3)).toEqual([]);
    const blues = notes(scoreById(IMPROVISE_LESSON, "improv-blues-note"));
    expect(
      [...new Set(blues.map((event) => pc(low(event))))].filter((note) => ![4, 7, 9, 11, 2].includes(note)),
    ).toEqual([10]);
  });

  it("Unit 30: the studies and examples are one motif; only the feel differs, and the examples cover all three feels", () => {
    const motif = (score: Score) => notes(score).map((event) => [event.at, low(event)]);
    const straight = scoreById(FEELS_LESSON, "feel-straight");
    for (const id of ["feel-shuffle", "feel-swung-sixteenths"])
      expect(motif(scoreById(FEELS_LESSON, id))).toEqual(motif(straight));
    const examples = FEELS_LESSON.listening!.questions.map((question) => scoreById(FEELS_LESSON, question.scoreId));
    // The examples share one motif, every note picked (a hammer-on has no attack to hear), with six sixteenth pairs.
    for (const example of examples) expect(motif(example)).toEqual(motif(examples[0]));
    expect(notes(examples[0]).some((event) => event.art?.legato)).toBe(false);
    const sixteenths = notes(examples[0]).filter((event) => event.dur === 12);
    expect(sixteenths.filter((event) => event.at % 24 === 0)).toHaveLength(6);
    expect(new Set(examples.map((example) => example.feel))).toEqual(new Set(["straight", "shuffle-8", "swing-16"]));
    expect(examples.every((example) => example.tempo.default === 60)).toBe(true);
    for (const [index, question] of FEELS_LESSON.listening!.questions.entries())
      expect(question.answer).toBe(
        { straight: question.choices[0], "shuffle-8": question.choices[1], "swing-16": question.choices[2] }[
          examples[index].feel as "straight"
        ],
      );
  });
});

describe("what each Stage 6 lesson says it plays", () => {
  it("Unit 31: the thumb walks G A B up to C and D C B A home to G; in A, A B C♯ to D and E D C♯ B to A", () => {
    const thumb = (id: string) => notes(scoreById(WALKS_LESSON, id), "thumb").map((event) => low(event));
    expect(thumb("walks-g-c-d-g").slice(0, 5)).toEqual([43, 50, 45, 47, 48]);
    expect(thumb("walks-g-c-d-g").slice(8, 13)).toEqual([50, 48, 47, 45, 43]);
    expect(thumb("walks-a-d-e-a").slice(0, 5)).toEqual([45, 52, 47, 49, 50]);
    expect(thumb("walks-a-d-e-a").slice(8, 13)).toEqual([52, 50, 49, 47, 45]);
  });

  it("Unit 32: G is built from G5, its octave and its third; the loop from vi is the same four chords rotated", () => {
    const build = scoreById(BARRES_LESSON, "barre-from-power-chord");
    const steps = notes(build).map((event) => event.notes.map(positionMidi).sort((a, b) => a - b));
    expect(steps).toEqual([
      [43, 50],
      [43, 50, 55],
      [43, 50, 55, 59],
    ]);
    const barre = sounding(build, strums(build)[0]);
    for (const step of steps) expect(barre).toEqual(expect.arrayContaining(step));
    const chordsOf = (id: string) =>
      [0, 1, 2, 3].map((bar) => inBar(strums(scoreById(BARRES_LESSON, id)), bar)[0].chord);
    expect(chordsOf("loop-em-c-d-g")).toEqual([...chordsOf("loop-g-em-c-d").slice(1), chordsOf("loop-g-em-c-d")[0]]);
    expect(shape(scoreById(BARRES_LESSON, "loop-g-em-c-d"), "C")).toEqual([null, 3, 5, 5, 5, 3]);
  });

  it("Unit 33: major pentatonic over E7, minor over A7, the curl over E7", () => {
    const licks = notes(scoreById(SEVENTHS_LESSON, "major-minor-licks"));
    expect(new Set(inBar(licks, 0).map((event) => pc(low(event))))).toEqual(new Set([4, 6, 8, 11]));
    expect(inBar(licks, 1).every((event) => [4, 7, 9, 11, 2].includes(pc(low(event))))).toBe(true);
    expect(inBar(licks, 1).some((event) => pc(low(event)) === 7)).toBe(true);
    expect(inBar(licks, 2).find((event) => event.art?.bend)!.art!.bend!.semitones).toBe(0.5);
    expect(shape(scoreById(SEVENTHS_LESSON, "sevenths-line-3"), "B7")).toEqual([null, 2, 1, 2, 0, 2]);
  });

  it("Unit 34: each example's melody holds the note its answer names, over the chord that carries it", () => {
    for (const question of MODES_LESSON.listening!.questions) {
      const example = scoreById(MODES_LESSON, question.scoreId);
      const tonic = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"].indexOf(example.key.tonic);
      const degrees = new Set(notes(example).map((event) => pc(low(event) - tonic)));
      // Mixolydian holds the ♭7 and never the 7; major the reverse; Dorian the 6 and never the ♭6; natural minor the reverse.
      const [has, lacks] = question.answer.startsWith("Mixolydian")
        ? [10, 11]
        : question.answer.startsWith("Major")
          ? [11, 10]
          : question.answer.startsWith("Dorian")
            ? [9, 8]
            : [8, 9];
      expect([degrees.has(has), degrees.has(lacks)], question.id).toEqual([true, false]);
      // The second chord carries that note too, and the home chord's third matches the mode.
      const backing = scoreById(MODES_LESSON, `${question.scoreId}-chords`);
      const [home, second] = [0, 1].map((bar) =>
        sounding(backing, inBar(strums(backing), bar)[0]).map((midi) => pc(midi - tonic)),
      );
      expect(second, question.id).toContain(has);
      expect(home, question.id).toContain(/Major|Mixolydian/.test(question.answer) ? 4 : 3);
    }
    expect(MODES_LESSON.listening!.questions[0].choices).toHaveLength(4);
    // Examples come in pairs on one home that differ in that one note only.
    const melody = (id: string) => notes(scoreById(MODES_LESSON, id)).map((event) => low(event));
    for (const [a, b] of [
      ["mode-example-1", "mode-example-5"],
      ["mode-example-2", "mode-example-4"],
      ["mode-example-3", "mode-example-6"],
    ]) {
      const differ = new Set(
        melody(a).flatMap((midi, index) => (midi === melody(b)[index] ? [] : [`${midi}/${melody(b)[index]}`])),
      );
      expect(differ.size, `${a} ${b}`).toBeLessThanOrEqual(2);
      for (const pair of differ) {
        const [x, y] = pair.split("/").map(Number);
        expect(Math.abs(x - y)).toBe(1);
      }
    }
  });

  it("Unit 35: F to Fm moves one string one fret, A to A♭; the melody's last note falls a half step", () => {
    const study = scoreById(BORROWED_LESSON, "f-to-fm");
    const [f, fm] = [shape(study, "F"), shape(study, "Fm")];
    const moved = f.flatMap((fret, string) => (fret === fm[string] ? [] : [[6 - string, fret, fm[string]]]));
    expect(moved).toEqual([[3, 2, 1]]);
    const melody = notes(scoreById(BORROWED_LESSON, "borrowed-melody"));
    const bar = (index: number) => inBar(melody, index).map((event) => low(event));
    expect(bar(3).slice(0, -1)).toEqual(bar(2).slice(0, -1));
    expect([pc(bar(2).at(-1)!), pc(bar(3).at(-1)!)]).toEqual([9, 8]);
  });

  it("Unit 36: every slide-in starts a fret below its shape; the passing note sits between A and B", () => {
    const slides = notes(scoreById(APPROACH_LESSON, "approach-slide-shapes"));
    expect(slides.every((event) => event.art?.slideIn === "below")).toBe(true);
    const passing = notes(scoreById(APPROACH_LESSON, "approach-passing-tones")).map((event) => low(event));
    const sharp = passing.indexOf(46);
    expect([passing[sharp - 1], passing[sharp], passing[sharp + 1]]).toEqual([45, 46, 47]);
    const flat = passing.lastIndexOf(46);
    expect([passing[flat - 1], passing[flat], passing[flat + 1]]).toEqual([47, 46, 45]);
    // Night Market's version slides both accents of each bar, on 1 and the "and" of 2.
    const night = notes(scoreById(APPROACH_LESSON, "approach-night-slides"));
    for (const bar of [0, 1])
      expect(
        inBar(night, bar)
          .filter((event) => event.art?.slideIn)
          .map((event) => event.at - bar * BAR),
      ).toEqual([0, 72]);
  });
});

describe("the Batch 3 pieces", () => {
  it("Night Market: the riff answers in the groove's gap, never on a chord hit", () => {
    const groove = pieceScore(NIGHT_MARKET_PIECE, "night-market-groove");
    const riff = pieceScore(NIGHT_MARKET_PIECE, "night-market-riff");
    const chordTicks = new Set(
      strums(groove)
        .filter((event) => event.chord)
        .map((event) => event.at),
    );
    expect(notes(riff).every((event) => !chordTicks.has(event.at))).toBe(true);
    expect(notes(riff).every((event) => event.at % BAR >= 96)).toBe(true);
    // Every riff note is in E Dorian, and over A7 it outlines the chord: A, C♯, E, G.
    for (const event of notes(riff)) expect([4, 6, 7, 9, 11, 1, 2]).toContain(pc(low(event)));
    expect(inBar(notes(riff), 1).map((event) => pc(low(event)))).toEqual([9, 1, 4, 7]);
  });

  it("Night Market: the break stops the band but for its stabs, and the capstone is groove, break and ending", () => {
    const band = pieceScore(NIGHT_MARKET_PIECE, "night-market-whole-band");
    for (const bar of [4, 5]) {
      expect(inBar(notes(band, "riff"), bar)).toEqual([]);
      expect(inBar(notes(band, "bass"), bar).every((event) => event.art?.staccato)).toBe(true);
    }
    expect(NIGHT_MARKET_PIECE.capstones.map((capstone) => [capstone.stage, capstone.partIds])).toEqual([
      [5, ["night-market-whole"]],
    ]);
  });

  it("Front Step: the shuffle form has the quick change and turnaround, and the solo's bends reach B and E", () => {
    const chords = pieceScore(FRONT_STEP_PIECE, "front-step-sevenths");
    expect(chords.feel).toBe("shuffle-8");
    expect(Array.from({ length: 12 }, (_, bar) => inBar(strums(chords), bar)[0].chord)).toEqual([
      "E7",
      "A7",
      "E7",
      "E7",
      "A7",
      "A7",
      "E7",
      "E7",
      "B7",
      "A7",
      "E7",
      "B7",
    ]);
    const bends = notes(pieceScore(FRONT_STEP_PIECE, "front-step-solo")).filter((event) => event.art?.bend);
    expect(bends.map((event) => pc(low(event) + event.art!.bend!.semitones))).toEqual([11, 4, 11]);
    expect(FRONT_STEP_PIECE.capstones.find((capstone) => capstone.stage === 6)!.partIds).toEqual([
      "front-step-sevenths",
      "front-step-calls-shuffle",
      "front-step-solo",
    ]);
    // The capstone's three choruses are one shuffle on one form: the calls are Unit 17's, in shuffle.
    const capstone = ["front-step-sevenths", "front-step-calls-shuffle", "front-step-solo"].map((id) =>
      pieceScore(FRONT_STEP_PIECE, id),
    );
    expect(capstone.map((score) => [score.feel, score.bars])).toEqual(Array(3).fill(["shuffle-8", 14]));
    const callsOf = (id: string) =>
      notes(pieceScore(FRONT_STEP_PIECE, id))
        .filter((event) => event.at < 12 * BAR)
        .map((event) => [event.at, low(event)]);
    expect(callsOf("front-step-calls-shuffle")).toEqual(callsOf("front-step-calls"));
    const solo = notes(pieceScore(FRONT_STEP_PIECE, "front-step-solo"));
    expect(solo.filter((event) => event.art?.vibrato).every((event) => event.notes.every((n) => n.fret > 0))).toBe(
      true,
    );
  });

  it("Low Road: the single notes lock to the power-chord riff's accents", () => {
    const single = pieceScore(LOW_ROAD_PIECE, "low-road-single-note");
    const chords = pieceScore(LOW_ROAD_PIECE, "low-road-riff");
    const accentTicks = (score: Score) =>
      notes(score)
        .filter((event) => event.art?.accent)
        .map((event) => event.at);
    expect(accentTicks(single)).toEqual(accentTicks(chords));
  });

  it("Two Rivers and Glasshouse: each melody leans on the note its part names", () => {
    const mixo = notes(pieceScore(TWO_RIVERS_PIECE, "two-rivers-mixolydian-melody"));
    expect(inBar(mixo, 1).at(-1) && pc(low(inBar(mixo, 1).at(-1)!))).toBe(7);
    const dorian = notes(pieceScore(TWO_RIVERS_PIECE, "two-rivers-dorian-melody"));
    expect(pc(low(inBar(dorian, 1).at(-1)!))).toBe(6);
    const glass = notes(pieceScore(GLASSHOUSE_PIECE, "glasshouse-melody"));
    expect([pc(low(inBar(glass, 2).at(-1)!)), pc(low(inBar(glass, 3).at(-1)!))]).toEqual([9, 8]);
  });
});
