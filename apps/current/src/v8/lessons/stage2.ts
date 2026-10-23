/**
 * STAGE 2 · MOVABLE FRETBOARD MAP — authored lessons.
 *
 * Unit 10, "Thirds change colour": the E–G / E–G♯ one-fret comparison first
 * drafted on 30 September 2026 (src/v8/phase6Drafts.ts), re-written in score
 * format 2 with every id, pitch and count unchanged (tested against the
 * original draft). Agent-drafted; nobody has played it on a guitar yet.
 */
import { score } from "../../core/score/build";
import { DRAFT_BY_AGENT } from "../provenance";
import type { Lesson } from "./format";

const common = {
  version: 1,
  provenance: DRAFT_BY_AGENT,
  metre: "4/4",
  bars: 2,
  tempo: [50, 66, 84],
} as const;

const minorThenMajor = score({
  ...common,
  id: "third-colour-e-minor-major",
  title: "Minor third, then major third",
  key: "E major",
  voices: {
    line: {
      label: "High E string",
      text: [
        "q 1:0[#minor-root] q 1:3{G}[#minor-third] q 1:0[#minor-return] q r[#minor-space] |",
        "q 1:0[#major-root] q 1:4[#major-third] q 1:0[#major-return] q r[#major-space]",
      ].join(" "),
    },
  },
  sections: [
    ["minor", "Minor third", 1, 1],
    ["major", "Major third", 2, 2],
  ],
});

const majorThenMinor = score({
  ...common,
  id: "third-colour-e-major-minor",
  title: "The same thirds in reverse order",
  key: "E major",
  voices: {
    line: {
      label: "High E string",
      text: [
        "q 1:0[#major-root] q 1:4[#major-third] q 1:0[#major-return] q r[#major-space] |",
        "q 1:0[#minor-root] q 1:3{G}[#minor-third] q 1:0[#minor-return] q r[#minor-space]",
      ].join(" "),
    },
  },
  sections: [
    ["major", "Major third", 1, 1],
    ["minor", "Minor third", 2, 2],
  ],
  derivedFrom: { id: "third-colour-e-minor-major", version: 1, changed: ["pitch"] },
});

const fromF = score({
  ...common,
  id: "third-colour-f-minor-major",
  title: "Find the thirds again from F",
  key: "F major",
  voices: {
    line: {
      label: "High E string",
      text: [
        "q 1:1[#minor-root] q 1:4{Ab}[#minor-third] q 1:1[#minor-return] q r[#minor-space] |",
        "q 1:1[#major-root] q 1:5[#major-third] q 1:1[#major-return] q r[#major-space]",
      ].join(" "),
    },
  },
  sections: [
    ["minor", "Minor third", 1, 1],
    ["major", "Major third", 2, 2],
  ],
  derivedFrom: { id: "third-colour-e-minor-major", version: 1, changed: ["key", "position"] },
});

export const THIRD_COLOUR_LESSON: Lesson = {
  id: "lesson-unit-10-third-colour",
  version: 1,
  provenance: DRAFT_BY_AGENT,
  unitId: "unit-10",
  stage: 2,
  activityKind: "technique",
  title: "One fret changes the third",
  purpose:
    "Hear why one fret turns a sad sound bright, and find it under your finger instead of reading it from a chart.",
  destination:
    "Two short phrases on the high E string, one dark and one bright, that you can tell apart and play without looking.",
  variable: "Whether the middle note sits three frets or four frets above the root.",
  capabilities: [
    {
      id: "ear.third.compare",
      action: "listening",
      title: "Hear minor against major",
      criterion: "Say which of two thirds is wider before seeing the frets.",
    },
    {
      id: "interval.third.locate",
      action: "locating",
      title: "Find the third from a root",
      criterion: "Find the minor third three frets, and the major third four frets, above a root on one string.",
    },
    {
      id: "fretboard.one-string.locate",
      action: "locating",
      title: "Move along one string",
      criterion: "Land on frets 3 and 4 of the high E string with the pulse still going.",
    },
  ],
  scores: [minorThenMajor, majorThenMinor, fromF],
  demonstration: {
    scoreId: minorThenMajor.id,
    handGuidance: [
      "Play the open high E string with a down-stroke, then press fret 3 with your ring finger, just behind the fret wire, for the G.",
      "For the brighter G♯, use your little finger on fret 4, or slide the same finger one fret further from the nut. Keep your thumb relaxed behind the neck.",
      "Let each note sound for one count and stop the string on the rest by touching it lightly with your picking hand.",
    ],
    videoNeeded: [],
  },
  studies: [
    {
      id: "minor-then-major",
      scoreId: minorThenMajor.id,
      title: "Minor, then major",
      changes: "E–G–E, then E–G♯–E: only the middle fret moves, from 3 to 4.",
    },
    {
      id: "major-then-minor",
      scoreId: majorThenMinor.id,
      title: "Major, then minor",
      changes:
        "The same two thirds in the opposite order, so you have to hear them rather than remember which comes first.",
    },
  ],
  successCriteria: [
    "After the root, land on fret 3 for the minor third and fret 4 for the major third without looking at the chart.",
    "Say which third is wider when you hear them in either order, before seeing the answer.",
  ],
  likelyErrors: [
    {
      id: "cannot-hear",
      signal: "Both intervals sound the same to me.",
      repair:
        "Sing E then G several times; move only the second sound up one fret to G♯. Compare again before naming, then return to both bars.",
      scoreId: minorThenMajor.id,
      from: 0,
      to: 96,
    },
    {
      id: "cannot-land",
      signal: "I cannot land on the target fret.",
      repair:
        "Pause after E, find fret 3 by sight and touch, then move one fret to 4 before restoring the pulse across both bars.",
      scoreId: minorThenMajor.id,
      from: 0,
      to: 192,
    },
    {
      id: "name-first",
      signal: "I remember the label but cannot predict the sound.",
      repair:
        "Hide the labels, sing the narrower and wider answer, then check against the guitar before returning to both bars.",
      scoreId: minorThenMajor.id,
      from: 0,
      to: 192,
    },
  ],
  cueFading: [
    {
      id: "hear-contrast",
      phase: "learn",
      cues: "full",
      scoreId: minorThenMajor.id,
      instruction: "Hear E–G–E, then E–G♯–E. Keep the root and rhythm constant; only the middle fret moves.",
    },
    {
      id: "play-and-predict",
      phase: "practise",
      cues: "count-only",
      scoreId: minorThenMajor.id,
      instruction: "Sing the next middle note before playing it. Alternate fret 3 and fret 4 on the high E string.",
    },
    {
      id: "identify-and-play",
      phase: "try-unaided",
      cues: "none",
      scoreId: majorThenMinor.id,
      instruction: "Hear the order hidden, name the wider third, then play both versions without the note names.",
    },
  ],
  retrieval: {
    afterDays: 1,
    scoreId: majorThenMinor.id,
    tempo: 66,
    instruction: "On another day, hear the reversed order and name each third before seeing frets 3 and 4.",
  },
  transfer: {
    scoreId: fromF.id,
    instruction:
      "Start on F at high-E fret 1. Before seeing the answer, sing and find its narrower and wider thirds; explain the fret distances, then compare with the E example.",
    changed: ["key", "position"],
  },
  performance: {
    kind: "create",
    instruction:
      "In Create, write a two-bar answer phrase that ends on either the minor or the major third, and say which mood you chose.",
  },
};

export const LESSONS: readonly Lesson[] = [THIRD_COLOUR_LESSON];
