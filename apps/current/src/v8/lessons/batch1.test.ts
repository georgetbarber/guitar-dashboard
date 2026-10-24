import { describe, expect, it } from "vitest";
import { positionMidi, strumPositions } from "../../core/score/validate";
import type { NoteEvent, Score } from "../../core/score/types";
import { CURRICULUM } from "../curriculum";
import { PIECES } from "../pieces/library";
import { scoreById, type Lesson } from "./format";
import { CONSTANT_MOTION_LESSON, ENDINGS_LESSON, LESSONS as STAGE_1, STABS_LESSON, THUMB_PULSE_LESSON } from "./stage1";
import {
  B_STRING_LESSON,
  COMPASS_LESSON,
  LESSONS as STAGE_2,
  OCTAVES_LESSON,
  POWER_CHORD_LESSON,
  TRANSPOSE_LESSON,
} from "./stage2";

/*
 * Batch 1 (docs/CURRICULUM_MAP.md §3, Units 1–12): the musical claims each
 * lesson's words make, checked against its notes. The validator already checks
 * spelling, voicings, playability and correspondence; these check that the
 * music is what the lesson says it is.
 */
const notes = (score: Score) =>
  score.events.filter((event): event is NoteEvent => event.kind === "note" && !event.art?.tie);
const pairs = (score: Score) => notes(score).map((event) => event.notes.map(positionMidi).sort((a, b) => a - b));
const span = ([low, high]: number[]) => high - low;

describe("Batch 1 lessons", () => {
  it("covers every unit of Stages 1 and 2 except the Unit 1 pilot, one lesson each", () => {
    const units = [...STAGE_1, ...STAGE_2].map((lesson) => lesson.unitId).sort();
    expect(units).toEqual(CURRICULUM.filter((unit) => unit.stage <= 2 && unit.order > 1).map((unit) => unit.id));
  });

  it("stands each lesson in for the activity the curriculum map names", () => {
    const standIn = (lesson: Lesson) => `${lesson.unitId}-${lesson.activityKind}`;
    expect([...STAGE_1, ...STAGE_2].map(standIn).sort()).toEqual(
      [
        "unit-02-technique",
        "unit-03-rhythm",
        "unit-04-rhythm",
        "unit-05-rhythm",
        "unit-06-rhythm",
        "unit-07-technique",
        "unit-08-technique",
        "unit-09-technique",
        "unit-10-technique",
        "unit-11-technique",
        "unit-12-technique",
      ].sort(),
    );
  });

  it("routes performances to pieces and parts that exist", () => {
    for (const lesson of [...STAGE_1, ...STAGE_2])
      if (lesson.performance.kind === "piece") {
        const { pieceId, partId } = lesson.performance;
        const piece = PIECES.find((item) => item.id === pieceId);
        expect(piece, lesson.id).toBeDefined();
        expect(
          piece!.parts.some((part) => part.id === partId),
          lesson.id,
        ).toBe(true);
      }
  });
});

describe("what each lesson says it plays", () => {
  it("Unit 2: one A rings, a fretted B is released, then palm-muted A; the transfer is the same on low E", () => {
    const [demo, chugs, transfer] = ENDINGS_LESSON.scores;
    expect(
      notes(demo).map((event) => [
        positionMidi(event.notes[0]),
        Boolean(event.art?.letRing),
        Boolean(event.art?.palmMute),
      ]),
    ).toEqual([
      [45, true, false],
      [47, false, false],
      [47, false, false],
      [45, false, true],
      [45, false, true],
      [45, false, true],
      [45, false, true],
    ]);
    expect(notes(chugs).every((event) => event.art?.palmMute && event.dur === 24)).toBe(true);
    expect(
      notes(chugs)
        .filter((event) => event.art?.accent)
        .map((event) => event.at % 192),
    ).toEqual([0, 96, 0, 96]);
    expect(notes(transfer).map((event) => positionMidi(event.notes[0]) + 5)).toEqual(
      notes(demo).map((event) => positionMidi(event.notes[0])),
    );
  });

  it("Unit 3: the thumb plays G, E, C and D, one per bar, then C and A in three", () => {
    const roots = scoreById(THUMB_PULSE_LESSON, "thumb-roots-g-em-c-d");
    expect(
      notes(roots)
        .filter((_, index) => index % 4 === 0)
        .map((event) => positionMidi(event.notes[0])),
    ).toEqual([43, 40, 48, 50]);
    expect(notes(roots).every((event) => event.notes[0].pluck === "p")).toBe(true);
    const waltz = scoreById(THUMB_PULSE_LESSON, "thumb-roots-c-am-waltz");
    expect(waltz.metre).toBe("3/4");
    expect(
      notes(waltz)
        .filter((_, index) => index % 3 === 0)
        .map((event) => positionMidi(event.notes[0])),
    ).toEqual([48, 45, 48, 45]);
  });

  it("Unit 4: Em7 is E B E G D E, struck down, down-up, miss, up, down-up", () => {
    const groove = scoreById(CONSTANT_MOTION_LESSON, "motion-em7-groove");
    const strums = groove.events.filter((event) => event.kind === "strum" && event.at < 192);
    expect(strums.map((event) => (event.kind === "strum" ? [event.at, event.direction] : null))).toEqual([
      [0, "down"],
      [48, "down"],
      [72, "up"],
      [120, "up"],
      [144, "down"],
      [168, "up"],
    ]);
    const first = strums[0];
    if (first.kind !== "strum") throw new Error("not a strum");
    expect(strumPositions(first, groove).map(positionMidi)).toEqual([40, 47, 52, 55, 62, 64]);
    const scratch = scoreById(CONSTANT_MOTION_LESSON, "motion-scratch-eighths");
    expect(scratch.events.every((event) => event.kind === "strum" && event.art?.dead)).toBe(true);
  });

  it("Unit 5: stabs on 1 and the “and” of 2, staccato; the transfer moves them one count later", () => {
    const stabs = scoreById(STABS_LESSON, "silence-em7-stabs");
    const hits = (score: Score) =>
      score.events.filter((event) => event.kind === "strum" && event.at < 192).map((event) => event.at);
    expect(hits(stabs)).toEqual([0, 72]);
    expect(stabs.events.filter((event) => event.kind === "strum").every((event) => event.art?.staccato)).toBe(true);
    expect(hits(scoreById(STABS_LESSON, "silence-em7-stabs-displaced"))).toEqual([48, 120]);
  });

  it("Unit 7: every pair is a unison, low to high, with the fourth fret on the G string", () => {
    const unisons = scoreById(COMPASS_LESSON, "compass-fifth-fret-unisons");
    expect(pairs(unisons).map(span)).toEqual([0, 0, 0, 0, 0]);
    expect(notes(unisons).map((event) => event.notes[0].fret)).toEqual([5, 5, 5, 4, 5]);
  });

  it("Unit 8: every shape is an octave, two frets up below the B string and three across it", () => {
    const shapes = scoreById(OCTAVES_LESSON, "octave-shapes-a-d");
    expect(pairs(shapes).map(span)).toEqual([12, 12, 12, 12]);
    expect(notes(shapes).map((event) => event.notes[1].fret - event.notes[0].fret)).toEqual([2, 2, 3, 3]);
    for (const id of ["octave-line-d-g-a", "octave-line-a-d-e"])
      expect(pairs(scoreById(OCTAVES_LESSON, id)).every((pair) => span(pair) === 12)).toBe(true);
  });

  it("Unit 9: every chord is a root and its fifth, A, C and D, and from E the same shape", () => {
    expect(pairs(scoreById(POWER_CHORD_LESSON, "power-shape-a-c-d")).map((pair) => [pair[0], span(pair)])).toEqual([
      [45, 7],
      [48, 7],
      [50, 7],
      [45, 7],
    ]);
    expect(pairs(scoreById(POWER_CHORD_LESSON, "power-shape-e-g-a")).map((pair) => [pair[0], span(pair)])).toEqual([
      [40, 7],
      [43, 7],
      [45, 7],
      [40, 7],
    ]);
  });

  it("Unit 11: a major then a minor third on G and B; sixths of 9, 8, 8, 9; the same thirds on D and G", () => {
    const thirds = scoreById(B_STRING_LESSON, "gb-thirds-a-minor");
    expect(pairs(thirds).slice(0, 2).map(span)).toEqual([4, 3]);
    expect(pairs(scoreById(B_STRING_LESSON, "gb-sixths-d")).slice(0, 4).map(span)).toEqual([9, 8, 8, 9]);
    const elsewhere = scoreById(B_STRING_LESSON, "dg-thirds-a-minor");
    expect(pairs(elsewhere).slice(0, 2).sort()).toEqual(pairs(thirds).slice(0, 2).sort());
    expect(
      notes(elsewhere)
        .slice(0, 2)
        .every((event) => event.notes.every((note) => note.string !== 2)),
    ).toBe(true);
  });

  it("Unit 12: the riff from E is every sound a fourth lower, from D a fourth higher, accents unmoved", () => {
    const sound = (id: string) =>
      notes(scoreById(TRANSPOSE_LESSON, id)).map((event) => ({
        at: event.at,
        accent: Boolean(event.art?.accent),
        midi: event.notes.map(positionMidi),
      }));
    const a = sound("transpose-riff-a");
    expect(sound("transpose-riff-e")).toEqual(a.map((item) => ({ ...item, midi: item.midi.map((m) => m - 5) })));
    expect(sound("transpose-riff-d")).toEqual(a.map((item) => ({ ...item, midi: item.midi.map((m) => m + 5) })));
    expect(a.filter((item) => item.accent).map((item) => item.at % 192)).toEqual([72, 168, 72, 168]);
  });
});
