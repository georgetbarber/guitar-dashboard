/**
 * THE REPERTOIRE: ORIGINAL PIECES THE COURSE RETURNS TO.
 *
 * Written for this course (docs/CURRICULUM_MAP.md §6), agent-drafted and not
 * yet played on a guitar. Nothing here copies an existing song, riff or
 * recording. Pieces grow by version as later batches add layers.
 *
 * Loaded only by the lazily loaded piece and lesson players, so it travels in
 * the per-stage lesson packs rather than the app shell.
 */
import { score } from "../../core/score/build";
import { DRAFT_BY_AGENT } from "../provenance";
import type { Piece } from "./format";

/* ------------------------------------------------------------------ */
/* FRONT STEP · blues-rock call and response in E                       */
/* ------------------------------------------------------------------ */

const FRONT_STEP = {
  version: 1,
  provenance: DRAFT_BY_AGENT,
  key: "E major",
  metre: "4/4",
  tempo: [60, 72, 90],
} as const;

/** Eight palm-muted eighths on one root. */
const chug = (note: string) => Array.from({ length: 8 }, () => `e ${note}[pm]`).join(" ");
const E = chug("6:0");
const A = chug("5:0");
const B = chug("5:2");
/** Bar 12 leaves the last beat free to lift the palm and reach the open high E for the break. */
const B_INTO_BREAK = `${Array.from({ length: 6 }, () => "e 5:2[pm]").join(" ")} q r`;
const QUESTION = "q 1:0 q r q 1:0 q r";
const ANSWER = "q 1:0 q 1:0 q r q 1:0";

const FORM_SECTIONS = [
  ["line-1", "Line 1 · E", 1, 4],
  ["line-2", "Line 2 · A to E", 5, 8],
  ["line-3", "Line 3 · B, A, E, B", 9, 12],
  ["break", "Break · question and answer", 13, 14],
  ["ending", "Ending · stop together", 15, 16],
] as const;

const FORM_HARMONY = [
  [1, 1, "E", "I"],
  [5, 1, "A", "IV"],
  [7, 1, "E", "I"],
  [9, 1, "B7", "V7"],
  [10, 1, "A", "IV"],
  [11, 1, "E", "I"],
  [12, 1, "B7", "V7"],
  [15, 1, "E", "I"],
] as const;

const frontStepQuestion = score({
  ...FRONT_STEP,
  id: "front-step-question-answer",
  title: "Front Step: the question and answer",
  bars: 2,
  voices: { lead: { label: "Open high E", text: `${QUESTION} | ${ANSWER}` } },
  sections: [
    ["question", "Question", 1, 1],
    ["answer", "Answer", 2, 2],
  ],
});

const frontStepRoots = score({
  ...FRONT_STEP,
  id: "front-step-one-finger",
  title: "Front Step: a 12-bar in E for one finger",
  bars: 16,
  voices: {
    roots: {
      label: "Roots, palm-muted",
      text: [
        E,
        E,
        E,
        E,
        A,
        A,
        E,
        E,
        B,
        A,
        E,
        B_INTO_BREAK,
        QUESTION,
        ANSWER,
        "q 6:0+5:2[st] q r q 6:0+5:2[st] q r",
        "w 6:0+5:2",
      ].join(" | "),
    },
  },
  sections: FORM_SECTIONS,
  harmony: FORM_HARMONY,
});

const FRONT_STEP_CHORDS = {
  E: { symbol: "E", shape: "022100", fingers: "-231--" },
  A: { symbol: "A", shape: "x02220", fingers: "x-123-" },
  B7: { symbol: "B7", shape: "x21202", fingers: "x213-4" },
};

const frontStepBand = score({
  ...FRONT_STEP,
  tempo: [50, 72, 100],
  id: "front-step-band",
  title: "Front Step: the second guitar's chords",
  bars: 16,
  voicings: FRONT_STEP_CHORDS,
  voices: {
    chords: {
      label: "Second guitar",
      text: [
        "h D:E h D:E",
        "h D:E h D:E",
        "h D:E h D:E",
        "h D:E h D:E",
        "h D:A h D:A",
        "h D:A h D:A",
        "h D:E h D:E",
        "h D:E h D:E",
        "h D:B7 h D:B7",
        "h D:A h D:A",
        "h D:E h D:E",
        "h D:B7 h D:B7",
        "w r",
        "w r",
        "q D:E[st] q r q D:E[st] q r",
        "w D:E",
      ].join(" | "),
    },
  },
  sections: FORM_SECTIONS,
  harmony: FORM_HARMONY,
});

export const FRONT_STEP_PIECE: Piece = {
  id: "piece-front-step",
  version: 1,
  provenance: DRAFT_BY_AGENT,
  title: "Front Step",
  styles: ["blues-rock"],
  description:
    "A blues in E built on a call and an answer: it starts with one open string and one low root, and grows into a shuffle with a solo chorus.",
  scores: [frontStepQuestion, frontStepRoots, frontStepBand],
  parts: [
    {
      id: "front-step-question-answer",
      layer: 1,
      title: "The question and answer",
      scoreId: frontStepQuestion.id,
      accompanimentIds: [],
      instruction:
        "Play the two bars on the open high E: the question on counts 1 and 3, the answer on 1, 2 and 4, stopping the string on every rest.",
      unitIds: ["unit-01"],
    },
    {
      id: "front-step-one-finger",
      layer: 1,
      title: "One finger through the 12-bar",
      scoreId: frontStepRoots.id,
      accompanimentIds: [frontStepBand.id],
      instruction:
        "Play the root of each bar as palm-muted eighths while the second guitar plays the chords: E for four bars, A for two, E for two, then B, A, E, B, leaving the last beat of bar 12 free to reach the high E. The second guitar stops for your question and answer, then you finish together on two short E5 hits and a long E5.",
      unitIds: ["unit-01", "unit-02", "unit-04", "unit-05"],
    },
  ],
  capstones: [
    {
      stage: 1,
      partIds: ["front-step-one-finger"],
      capability: {
        id: "piece.front-step.one-finger",
        action: "playing",
        title: "Play Front Step with one finger",
        criterion:
          "Keep the root eighths, the break and the ending in time with the second guitar through all sixteen bars.",
      },
      criterion:
        "I kept my place through the twelve bars, the break and the ending, and stopped together with the second guitar.",
    },
  ],
};

/* ------------------------------------------------------------------ */
/* LOW ROAD · a blues-rock riff in A, moved to E                         */
/* ------------------------------------------------------------------ */

const LOW_ROAD = {
  version: 1,
  provenance: DRAFT_BY_AGENT,
  metre: "4/4",
} as const;

/*
 * The riff's fingerprint: continuous palm-muted root chugs with the ♭3 and 4
 * power chords as accents on the "and" of 2 and the "and" of 4. No ♭5 passing
 * chord and no block chords with rests (decision A13).
 */
const riffBar = (root: string, flat3: string, four: string) =>
  `e ${root}[pm] e ${root}[pm] e ${root}[pm] e ${flat3}[>] e ${root}[pm] e ${root}[pm] e ${root}[pm] e ${four}[>]`;
const riffTurn = (root: string, flat3: string, four: string) =>
  `e ${root}[pm] e ${root}[pm] e ${root}[pm] e ${flat3}[>] h ${four}`;

const A5 = "5:0+4:2";
const C5 = "5:3+4:5";
const D5 = "5:5+4:7";
const E5 = "6:0+5:2";
const G5 = "6:3+5:5";
const A5_LOW = "6:5+5:7";

const lowRoadChugs = score({
  ...LOW_ROAD,
  id: "low-road-chugs",
  title: "Low Road: open-A chugs",
  key: "A minor",
  bars: 4,
  tempo: [66, 84, 112],
  voices: {
    chugs: { label: "Open A, palm-muted", text: [chug("5:0"), chug("5:0"), chug("5:0"), chug("5:0")].join(" | ") },
  },
});

const lowRoadRiff = score({
  ...LOW_ROAD,
  id: "low-road-riff",
  title: "Low Road: the riff",
  key: "A minor",
  bars: 4,
  tempo: [56, 84, 112],
  voices: {
    riff: {
      label: "Riff",
      text: [riffBar(A5, C5, D5), riffBar(A5, C5, D5), riffBar(A5, C5, D5), riffTurn(A5, C5, D5)].join(" | "),
    },
  },
});

const lowRoadBand = score({
  ...LOW_ROAD,
  id: "low-road-band",
  title: "Low Road: the second guitar",
  key: "A minor",
  bars: 4,
  tempo: [56, 84, 116],
  voices: {
    pad: { label: "Second guitar", text: [`w ${A5}`, `w ${A5}`, `w ${A5}`, `h ${A5} h ${D5}`].join(" | ") },
  },
});

const lowRoadWhole = (id: string, title: string, key: "A minor" | "E minor", text: string) =>
  score({
    ...LOW_ROAD,
    id,
    title,
    key,
    bars: 8,
    tempo: [66, 80, 104],
    voices: { guitar: { label: "Your part", text } },
    sections: [
      ["riff", "Riff", 1, 3],
      ["fill", "Octave fill", 4, 4],
      ["riff-again", "Riff again", 5, 7],
      ["tag", "Double-stop tag", 8, 8],
    ],
  });

const lowRoadInA = lowRoadWhole(
  "low-road-whole-a",
  "Low Road in A: riff, octave fill and tag",
  "A minor",
  [
    riffBar(A5, C5, D5),
    riffBar(A5, C5, D5),
    riffBar(A5, C5, D5),
    "q 5:3+3:5 q 5:5+3:7 h 5:0+3:2",
    riffBar(A5, C5, D5),
    riffBar(A5, C5, D5),
    riffBar(A5, C5, D5),
    "q 3:5+2:5 q 3:2+2:1 h 5:0+4:2",
  ].join(" | "),
);

const lowRoadInE = lowRoadWhole(
  "low-road-whole-e",
  "Low Road in E: the same intervals from the low E string",
  "E minor",
  [
    riffBar(E5, G5, A5_LOW),
    riffBar(E5, G5, A5_LOW),
    riffBar(E5, G5, A5_LOW),
    "q 6:3+4:5 q 6:5+4:7 h 6:0+4:2",
    riffBar(E5, G5, A5_LOW),
    riffBar(E5, G5, A5_LOW),
    riffBar(E5, G5, A5_LOW),
    "q 3:0+2:0 q 4:2+3:0 h 6:0+5:2",
  ].join(" | "),
);

const bandFor = (id: string, key: "A minor" | "E minor", one: string) =>
  score({
    ...LOW_ROAD,
    id,
    title: `Low Road: the second guitar in ${key.split(" ")[0]}`,
    key,
    bars: 8,
    tempo: [60, 80, 112],
    voices: {
      pad: {
        label: "Second guitar",
        text: [`w ${one}`, `w ${one}`, `w ${one}`, "w r", `w ${one}`, `w ${one}`, `w ${one}`, `w ${one}`].join(" | "),
      },
    },
  });

const lowRoadBandA = bandFor("low-road-band-a", "A minor", A5);
const lowRoadBandE = bandFor("low-road-band-e", "E minor", E5);

export const LOW_ROAD_PIECE: Piece = {
  id: "piece-low-road",
  version: 1,
  provenance: DRAFT_BY_AGENT,
  title: "Low Road",
  styles: ["blues-rock"],
  description:
    "A driving riff in A: palm-muted root chugs with two power chords kicking on the off-beats, an octave fill and a double-stop tag, then the whole thing moved to E.",
  scores: [lowRoadChugs, lowRoadRiff, lowRoadBand, lowRoadInA, lowRoadInE, lowRoadBandA, lowRoadBandE],
  parts: [
    {
      id: "low-road-chugs",
      layer: 1,
      title: "Open-A chugs",
      scoreId: lowRoadChugs.id,
      accompanimentIds: [lowRoadRiff.id],
      instruction:
        "Rest the edge of your picking hand on the A string by the bridge and play steady eighths while the other guitar plays the riff over you.",
      unitIds: ["unit-02"],
    },
    {
      id: "low-road-riff",
      layer: 2,
      title: "The riff",
      scoreId: lowRoadRiff.id,
      accompanimentIds: [lowRoadBand.id],
      instruction:
        "Keep the A chugs going and lift the palm for the two accents: C5 on the “and” of 2, D5 on the “and” of 4. The same root-and-fifth shape slides up the A string for both. In bar 4, D5 arrives on count 3 and holds.",
      unitIds: ["unit-09"],
    },
    {
      id: "low-road-whole-a",
      layer: 4,
      title: "Riff, octave fill and tag in A",
      scoreId: lowRoadInA.id,
      accompanimentIds: [lowRoadBandA.id],
      instruction:
        "Three bars of riff, a bar of octaves (C, D, A, with the D string left silent), three more bars, then the tag: C and E together, A and C together, and A5 to finish.",
      unitIds: ["unit-08", "unit-09", "unit-11"],
    },
    {
      id: "low-road-whole-e",
      layer: 4,
      title: "The same piece from E",
      scoreId: lowRoadInE.id,
      accompanimentIds: [lowRoadBandE.id],
      instruction:
        "Play everything a fourth lower from the low E string. The power-chord and octave shapes move unchanged. In the tag, the major third becomes the open G and B strings (same fret, still major); the minor third moves to the D and G strings: D-string fret 2 with the open G.",
      unitIds: ["unit-12"],
    },
  ],
  capstones: [
    {
      stage: 2,
      partIds: ["low-road-whole-a", "low-road-whole-e"],
      capability: {
        id: "piece.low-road.riff",
        action: "playing",
        title: "Play Low Road in two keys",
        criterion: "Keep the off-beat accents and the octave fill in time, in A and again from E.",
      },
      criterion: "I played the riff in A and in E without the tab.",
    },
  ],
};

export const PIECES: readonly Piece[] = [FRONT_STEP_PIECE, LOW_ROAD_PIECE];
