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

/*
 * Layer 3 (Unit 17): two-bar calls and two-bar answers in E minor
 * pentatonic, open position, over the same 12-bar; the ♭3 (G on the high E,
 * fret 3) curls a quarter-tone toward the major third twice. Then the Unit 1
 * break and the E5 ending, so it fits the second guitar's 16 bars.
 */
const frontStepCalls = score({
  ...FRONT_STEP,
  id: "front-step-calls",
  title: "Front Step: calls and answers",
  bars: 16,
  voices: {
    lead: {
      label: "Calls and answers",
      text: [
        "q r e 2:3{D} e 1:0 q 1:3{G}[b.5] q 1:0",
        "h 2:0 h r",
        "q r e 3:2 e 3:0{G} q 2:0 q 3:2",
        "h 4:2 h r",
        "q r e 2:3{D} e 1:0 q 2:3{D} q 2:0",
        "h 3:2 h r",
        "q r e 2:0 e 2:3{D} q 1:0 q 2:3{D}",
        "h 1:0 h r",
        "q r e 2:3{D} e 2:0 q 3:2 q 3:0{G}",
        "h 3:2 h r",
        "q r e 1:3{G}[b.5] e 1:0 q 2:0 q 4:2",
        "h 2:0 h r",
        QUESTION,
        ANSWER,
        "q 6:0+5:2[st] q r q 6:0+5:2[st] q r",
        "w 6:0+5:2",
      ].join(" | "),
    },
  },
  sections: [
    ["line-1", "Line 1 · call, answer", 1, 4],
    ["line-2", "Line 2 · call, answer", 5, 8],
    ["line-3", "Line 3 · call, answer", 9, 12],
    ["break", "Break · question and answer", 13, 14],
    ["ending", "Ending · stop together", 15, 16],
  ],
  harmony: FORM_HARMONY,
});

export const FRONT_STEP_PIECE: Piece = {
  id: "piece-front-step",
  version: 2,
  provenance: DRAFT_BY_AGENT,
  title: "Front Step",
  styles: ["blues-rock"],
  description:
    "A blues in E built on a call and an answer: it starts with one open string and one low root, and grows into a shuffle with a solo chorus.",
  scores: [frontStepQuestion, frontStepRoots, frontStepBand, frontStepCalls],
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
    {
      id: "front-step-calls",
      layer: 3,
      title: "Calls and answers",
      scoreId: frontStepCalls.id,
      accompanimentIds: [frontStepBand.id],
      instruction:
        "Each line of the 12-bar is a two-bar call and a two-bar answer in E minor pentatonic, open position, with a beat of space before each. Curl the G on the high E a little sharp where it is marked, then play the break and the ending as before.",
      unitIds: ["unit-17"],
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

/* ------------------------------------------------------------------ */
/* LANTERN · a melody in G with two endings                              */
/* ------------------------------------------------------------------ */

const LANTERN = {
  version: 1,
  provenance: DRAFT_BY_AGENT,
  key: "G major",
  metre: "4/4",
  bars: 8,
  tempo: [60, 72, 88],
  sections: [
    ["phrase-1", "Phrase 1 · open ending", 1, 4],
    ["phrase-2", "Phrase 2 · settled ending", 5, 8],
  ],
  harmony: [
    [1, 1, "G", "I"],
    [2, 1, "C", "IV"],
    [3, 1, "D", "V"],
    [5, 1, "Em", "vi"],
    [6, 1, "C", "IV"],
    [7, 1, "D", "V"],
    [8, 1, "G", "I"],
  ],
} as const;

/** The open-position shapes the course has taught by Stage 3 (G, C and Em in Unit 6, D in Unit 16). */
export const OPEN_G_C_D_EM = {
  G: { symbol: "G", shape: "320003", fingers: "21---3" },
  C: { symbol: "C", shape: "x32010", fingers: "x32-1-" },
  D: { symbol: "D", shape: "xx0232", fingers: "xx-132" },
  Em: { symbol: "Em", shape: "022000", fingers: "-12---" },
};

/*
 * The motif is 3–2–1 (B, A, G) with its own rhythm: a short note on 1, a
 * longer one on the "and" of 1, the landing held from the "and" of 2, and a
 * rest. Bars 2 and 3 move the same rhythm up through 6–5–4 and 7–6–5.
 * Phrase 1 stops on 2 (A) over D, open; phrase 2 comes home to 1 (G).
 */
export const LANTERN_MELODY_BARS = [
  "e 2:0 q 3:2 q. 3:0 q r",
  "e 1:0 q 2:3 q. 2:1 q r",
  "e 1:2 q 1:0 q. 2:3 q r",
  "e 2:3 q 2:0 q. 3:2 q r",
  "e 2:0 q 3:2 q. 3:0 q r",
  "e 1:0 q 2:3 q. 2:1 q r",
  "e 1:2 q 1:0 q. 2:3 e 2:0 e 3:2",
  "w 3:0",
];

/** A down strum, then down-up, a missed beat 3 and an up strum that rings through 4 while the hand changes. */
export const lanternStrum = (chord: string) => `q D:${chord} e D:${chord} e U:${chord} e r q. U:${chord}`;
const LANTERN_CHORD_BARS = ["G", "C", "D", "D", "Em", "C", "D"].map(lanternStrum).concat("w D:G");

const lanternMelody = score({
  ...LANTERN,
  id: "lantern-melody",
  title: "Lantern: the melody",
  voices: { melody: { label: "Melody", text: LANTERN_MELODY_BARS.join(" | ") } },
});

const lanternChords = score({
  ...LANTERN,
  id: "lantern-chords",
  title: "Lantern: the chords",
  voicings: OPEN_G_C_D_EM,
  voices: { chords: { label: "Chords", text: LANTERN_CHORD_BARS.join(" | ") } },
});

const lanternDrone = score({
  ...LANTERN,
  id: "lantern-drone",
  title: "Lantern: the open-G drone",
  voices: { drone: { label: "Open G", text: Array.from({ length: 8 }, () => "h 3:0[lr] h 3:0[lr]").join(" | ") } },
});

export const LANTERN_PIECE: Piece = {
  id: "piece-lantern",
  version: 1,
  provenance: DRAFT_BY_AGENT,
  title: "Lantern",
  styles: ["melody"],
  description:
    "An eight-bar melody in G built from one three-note motif: the first phrase stops open, the second comes home.",
  scores: [lanternMelody, lanternChords, lanternDrone],
  parts: [
    {
      id: "lantern-drone",
      layer: 1,
      title: "The open-G drone",
      scoreId: lanternDrone.id,
      accompanimentIds: [lanternMelody.id, lanternChords.id],
      instruction:
        "Pluck the open G string on counts 1 and 3 and let it ring while the melody and chords move above it. Notice where the melody leans away from your G and where it comes back to it.",
      unitIds: ["unit-13"],
    },
    {
      id: "lantern-chords",
      layer: 2,
      title: "The chords",
      scoreId: lanternChords.id,
      accompanimentIds: [lanternMelody.id],
      instruction:
        "Strum G, C, D, D, then Em, C, D and G under the melody: down, down-up, miss, up, letting the last up-strum ring while you change.",
      unitIds: ["unit-16", "unit-24"],
    },
    {
      id: "lantern-melody",
      layer: 3,
      title: "The melody",
      scoreId: lanternMelody.id,
      accompanimentIds: [lanternChords.id],
      instruction:
        "Play the melody on the top three strings while the second guitar strums. Phrase 1 stops on A, open; phrase 2 comes home to G.",
      unitIds: ["unit-14", "unit-15", "unit-16"],
    },
  ],
  capstones: [
    {
      stage: 3,
      partIds: ["lantern-melody"],
      capability: {
        id: "piece.lantern.melody",
        action: "playing",
        title: "Play Lantern's melody",
        criterion:
          "Play both phrases in time with the chords, the first stopping open on A and the second coming home to G, and save a two-bar answer of your own in Create.",
      },
      criterion: "I played the melody with both endings and saved an answer of my own.",
      make: "Then make your answer: in a new sketch, write a two-bar phrase that answers Lantern's first phrase and ends on G, and save it. Come back here to report on both.",
    },
  ],
};

/* ------------------------------------------------------------------ */
/* PORCH LIGHT · Travis picking in G                                     */
/* ------------------------------------------------------------------ */

const PORCH = {
  version: 1,
  provenance: DRAFT_BY_AGENT,
  key: "G major",
  metre: "4/4",
  bars: 8,
  tempo: [56, 72, 90],
  sections: [
    ["first", "G, Em, C, D", 1, 4],
    ["second", "G, Em, D, G", 5, 8],
  ],
  harmony: [
    [1, 1, "G", "I"],
    [2, 1, "Em", "vi"],
    [3, 1, "C", "IV"],
    [4, 1, "D", "V"],
    [5, 1, "G", "I"],
    [6, 1, "Em", "vi"],
    [7, 1, "D", "V"],
    [8, 1, "G", "I"],
  ],
} as const;

/** Per chord: the thumb's root and second bass note, and the strings the index and middle fingers take. */
export const TRAVIS = {
  G: { root: "6:3", alt: "4:0", i: "3:0", m: "2:0" },
  Em: { root: "6:0", alt: "4:2", i: "3:0", m: "2:0" },
  C: { root: "5:3", alt: "4:2", i: "3:0", m: "2:1" },
  D: { root: "4:0", alt: "3:2", i: "2:3", m: "1:2" },
} as const;
export type TravisChord = keyof typeof TRAVIS;
const PORCH_CHORDS: TravisChord[] = ["G", "Em", "C", "D", "G", "Em", "D"];

export const thumbAlternating = (chord: TravisChord) => {
  const { root, alt } = TRAVIS[chord];
  return `q ${root}@p q ${alt}@p q ${root}@p q ${alt}@p`;
};
export const fingersOffBeats = (chord: TravisChord) => {
  const { i, m } = TRAVIS[chord];
  return `e r e ${i}@i e r e ${m}@m e r e ${i}@i e r e ${m}@m`;
};

/** The top line, pinched with the thumb on beats 1 and 3; bar 3 hammers B up to C inside the C shape. */
const PORCH_MELODY_BARS = [
  "h 1:3@m h 2:0@i",
  "h 1:0@m h 2:0@i",
  "h 1:0@m e 2:0@i e 2:1[h] q r",
  "h 1:2@m h 2:3@i",
  "h 1:3@m h 2:0@i",
  "h 1:0@m h 1:3@m",
  "h 1:2@m h 2:3@i",
  "w 1:3@m",
];

const porchRoots = score({
  ...PORCH,
  id: "porch-light-roots",
  title: "Porch Light: thumb roots",
  voices: {
    thumb: {
      label: "Thumb",
      text: PORCH_CHORDS.map((chord) => Array.from({ length: 4 }, () => `q ${TRAVIS[chord].root}@p`).join(" "))
        .concat("w 6:3@p")
        .join(" | "),
    },
  },
});

const porchTravis = score({
  ...PORCH,
  id: "porch-light-travis",
  title: "Porch Light: Travis picking",
  voices: {
    fingers: { label: "Fingers", text: PORCH_CHORDS.map(fingersOffBeats).concat("w 1:3@m").join(" | ") },
    thumb: { label: "Thumb", text: PORCH_CHORDS.map(thumbAlternating).concat("w 6:3@p").join(" | ") },
  },
});

const porchMelody = score({
  ...PORCH,
  id: "porch-light-melody",
  title: "Porch Light: melody over the thumb",
  voices: {
    melody: { label: "Melody", text: PORCH_MELODY_BARS.join(" | ") },
    thumb: { label: "Thumb", text: PORCH_CHORDS.map(thumbAlternating).concat("w 6:3@p").join(" | ") },
  },
});

const porchTune = score({
  ...PORCH,
  id: "porch-light-tune",
  title: "Porch Light: the tune alone",
  voices: { melody: { label: "Tune", text: PORCH_MELODY_BARS.join(" | ") } },
});

export const PORCH_LIGHT_PIECE: Piece = {
  id: "piece-porch-light",
  version: 1,
  provenance: DRAFT_BY_AGENT,
  title: "Porch Light",
  styles: ["folk"],
  description:
    "A fingerpicked tune in G: a thumb that keeps time on the bass strings and a melody pinched on top, from one note a beat to full Travis picking.",
  scores: [porchRoots, porchTravis, porchMelody, porchTune],
  parts: [
    {
      id: "porch-light-roots",
      layer: 1,
      title: "Thumb roots",
      scoreId: porchRoots.id,
      accompanimentIds: [porchMelody.id],
      instruction:
        "Play each chord's root with your thumb on every count, G, E, C, D, G, E, D, then a long G, while the other guitar plays the whole arrangement.",
      unitIds: ["unit-03"],
    },
    {
      id: "porch-light-travis",
      layer: 2,
      title: "Travis picking",
      scoreId: porchTravis.id,
      accompanimentIds: [porchTune.id],
      instruction:
        "The thumb alternates root and second bass note on every count; the index and middle fingers answer on the off-beats. The other guitar plays the tune.",
      unitIds: ["unit-22"],
    },
    {
      id: "porch-light-melody",
      layer: 3,
      title: "Melody over the thumb",
      scoreId: porchMelody.id,
      accompanimentIds: [],
      instruction:
        "Keep the thumb alternating and pinch the melody with it on counts 1 and 3. In bar 3, hammer the B string from open to fret 1 inside the C shape.",
      unitIds: ["unit-14", "unit-19", "unit-22"],
    },
  ],
  capstones: [
    {
      stage: 4,
      partIds: ["porch-light-melody"],
      capability: {
        id: "piece.porch-light.travis",
        action: "playing",
        title: "Play Porch Light, thumb and melody",
        criterion: "Keep the thumb alternating through all eight bars while the melody sounds on counts 1 and 3.",
      },
      criterion: "The bass kept alternating while the melody sang on top.",
    },
  ],
};

/* ------------------------------------------------------------------ */
/* HARBOUR SONG · a fingerpicked waltz in C                              */
/* ------------------------------------------------------------------ */

const HARBOUR = {
  version: 1,
  provenance: DRAFT_BY_AGENT,
  key: "C major",
  metre: "3/4",
  bars: 8,
  tempo: [60, 72, 90],
  sections: [
    ["first", "C, Am, Fmaj7, G", 1, 4],
    ["second", "C, Am, G, C", 5, 8],
  ],
  harmony: [
    [1, 1, "C", "I"],
    [2, 1, "Am", "vi"],
    [3, 1, "Fmaj7", "IVmaj7"],
    [4, 1, "G", "V"],
    [5, 1, "C", "I"],
    [6, 1, "Am", "vi"],
    [7, 1, "G", "V"],
    [8, 1, "C", "I"],
  ],
} as const;

/** Per chord: the thumb's bass, and the G, B and high E string notes for i, m and a. */
export const WALTZ = {
  C: { bass: "5:3", i: "3:0", m: "2:1", a: "1:0" },
  Am: { bass: "5:0", i: "3:2", m: "2:1", a: "1:0" },
  Fmaj7: { bass: "4:3", i: "3:2", m: "2:1", a: "1:0" },
  G: { bass: "6:3", i: "3:0", m: "2:0", a: "1:3" },
} as const;
export type WaltzChord = keyof typeof WALTZ;
const HARBOUR_CHORDS: WaltzChord[] = ["C", "Am", "Fmaj7", "G", "C", "Am", "G"];

/** Thumb on 1, then index, middle, ring, middle, index: six eighths that keep ringing. */
export const waltzFingers = (chord: WaltzChord) => {
  const { i, m, a } = WALTZ[chord];
  return `e r e ${i}@i[lr] e ${m}@m[lr] e ${a}@a[lr] e ${m}@m[lr] e ${i}@i[lr]`;
};
export const waltzBass = (chord: WaltzChord) => `h. ${WALTZ[chord].bass}@p`;

export const HARBOUR_MELODY_BARS = [
  "h 1:0 q 2:3",
  "q 2:1 q 1:0 q 1:5",
  "h 1:5 q 1:3",
  "h. 2:3",
  "h 1:0 q 2:3",
  "q 2:1 q 1:0 q 1:5",
  "q 1:3 q 1:1 q 2:3",
  "h. 2:1",
];

const harbourBass = score({
  ...HARBOUR,
  id: "harbour-song-bass",
  title: "Harbour Song: bass on one",
  voices: { thumb: { label: "Thumb", text: HARBOUR_CHORDS.map(waltzBass).concat("h. 5:3@p").join(" | ") } },
});

const harbourArpeggio = score({
  ...HARBOUR,
  id: "harbour-song-arpeggio",
  title: "Harbour Song: the waltz arpeggio",
  voices: {
    fingers: {
      label: "Fingers",
      text: HARBOUR_CHORDS.map(waltzFingers).concat("e r e 3:0@i[lr] e 2:1@m[lr] q. 1:0@a").join(" | "),
    },
    thumb: { label: "Thumb", text: HARBOUR_CHORDS.map(waltzBass).concat("h. 5:3@p").join(" | ") },
  },
});

const harbourMelody = score({
  ...HARBOUR,
  id: "harbour-song-melody",
  title: "Harbour Song: the melody",
  voices: { melody: { label: "Melody", text: HARBOUR_MELODY_BARS.join(" | ") } },
});

export const HARBOUR_SONG_PIECE: Piece = {
  id: "piece-harbour-song",
  version: 1,
  provenance: DRAFT_BY_AGENT,
  title: "Harbour Song",
  styles: ["folk"],
  description:
    "A slow waltz in C: a thumb on the bass, a ringing p-i-m-a arpeggio, and a melody you find by ear before you see it.",
  scores: [harbourBass, harbourArpeggio, harbourMelody],
  parts: [
    {
      id: "harbour-song-bass",
      layer: 1,
      title: "Bass on one",
      scoreId: harbourBass.id,
      accompanimentIds: [harbourMelody.id],
      instruction:
        "Pluck each bar's bass note with the thumb on count 1 and let it ring for all three counts: C, A, F, G, C, A, G, C.",
      unitIds: ["unit-06", "unit-21"],
    },
    {
      id: "harbour-song-arpeggio",
      layer: 2,
      title: "The waltz arpeggio",
      scoreId: harbourArpeggio.id,
      accompanimentIds: [harbourMelody.id],
      instruction:
        "Thumb on the bass on 1, then index, middle, ring, middle, index across the G, B and high E strings, letting everything ring. The B string's fret 1 stays down from C through Am to Fmaj7.",
      unitIds: ["unit-21"],
    },
    {
      id: "harbour-song-melody",
      layer: 3,
      title: "The melody",
      scoreId: harbourMelody.id,
      accompanimentIds: [harbourArpeggio.id],
      instruction:
        "Play the melody on the B and high E strings while the other guitar plays the arpeggio. It counts in three.",
      unitIds: ["unit-18"],
    },
  ],
  capstones: [],
};

/* ------------------------------------------------------------------ */
/* SUNDAY GLIDE · a soul vamp in D                                       */
/* ------------------------------------------------------------------ */

const SUNDAY = {
  version: 1,
  provenance: DRAFT_BY_AGENT,
  key: "D major",
  metre: "4/4",
  feel: "swing-16",
  bars: 4,
  tempo: [60, 72, 88],
  harmony: [
    [1, 1, "D", "I"],
    [2, 1, "G", "IV"],
    [3, 1, "D", "I"],
    [4, 1, "G", "IV"],
  ],
} as const;

/** D in root position and G in second inversion on the top three strings at the 7th fret: I to IV by one or two frets. */
export const TOP_STRING_D_G = {
  D: { symbol: "D", shape: "xxx775", fingers: "xxx341" },
  G: { symbol: "G", shape: "xxx787", fingers: "xxx121", inversion: "second" as const },
};

/** Hits on 1, the "a" of 1, the "and" of 2, 3 and the "a" of 3; the hand keeps moving in sixteenths through the gaps. */
export const sixteenthGroove = (chord: string) =>
  `s D:${chord}[>] s r s r s U:${chord} s r s r s D:${chord} s r s D:${chord}[>] s r s r s U:${chord} s r s r s r s r`;

const sundayRoots = score({
  ...SUNDAY,
  id: "sunday-glide-roots",
  title: "Sunday Glide: octave roots",
  voices: {
    octaves: {
      label: "Octaves",
      text: ["5:5+3:7", "6:3+4:5", "5:5+3:7", "6:3+4:5"]
        .map((octave) => Array.from({ length: 4 }, () => `q ${octave}`).join(" "))
        .join(" | "),
    },
  },
});

const sundayRhythm = score({
  ...SUNDAY,
  id: "sunday-glide-rhythm",
  title: "Sunday Glide: the rhythm part",
  voicings: TOP_STRING_D_G,
  voices: { hand: { label: "Strumming hand", text: ["D", "G", "D", "G"].map(sixteenthGroove).join(" | ") } },
});

const sundaySixths = score({
  ...SUNDAY,
  id: "sunday-glide-sixths",
  title: "Sunday Glide: sliding sixths",
  voices: {
    sixths: {
      label: "Sixths",
      text: [
        "q 3:2@p+1:2@m[si] e. r s 3:2@p+1:2@m h r",
        "q 3:4@p+1:3@m[si] e. r s 3:4@p+1:3@m h r",
        "q 3:2@p+1:2@m[si] e. r s 3:2@p+1:2@m h r",
        "q 3:4@p+1:3@m[si] e. r s 3:4@p+1:3@m h r",
      ].join(" | "),
    },
  },
});

export const SUNDAY_GLIDE_PIECE: Piece = {
  id: "piece-sunday-glide",
  version: 1,
  provenance: DRAFT_BY_AGENT,
  title: "Sunday Glide",
  styles: ["soul-funk"],
  description:
    "A soul vamp in D, I to IV: octave roots, small chords on the top strings in swung sixteenths, and sixths that slide into the chord.",
  scores: [sundayRoots, sundayRhythm, sundaySixths],
  parts: [
    {
      id: "sunday-glide-roots",
      layer: 1,
      title: "Octave roots",
      scoreId: sundayRoots.id,
      accompanimentIds: [sundayRhythm.id],
      instruction:
        "Play D and G as octaves in quarter notes, D from the A string, G from the low E, with the string between them muted.",
      unitIds: ["unit-08"],
    },
    {
      id: "sunday-glide-rhythm",
      layer: 2,
      title: "The rhythm part",
      scoreId: sundayRhythm.id,
      accompanimentIds: [sundayRoots.id],
      instruction:
        "Strum only the top three strings, D then G at the 7th fret. Keep the hand moving down-up in sixteenths and let it touch the strings on 1, the “a” of 1, the “and” of 2, 3 and the “a” of 3.",
      unitIds: ["unit-19", "unit-20"],
    },
    {
      id: "sunday-glide-sixths",
      layer: 3,
      title: "Sliding sixths",
      scoreId: sundaySixths.id,
      accompanimentIds: [sundayRhythm.id],
      instruction:
        "Slide into each sixth from a fret below on count 1, then pluck it again just before count 2: A with F♯ over D, B with G over G.",
      unitIds: ["unit-23"],
    },
  ],
  capstones: [],
};

export const PIECES: readonly Piece[] = [
  FRONT_STEP_PIECE,
  LOW_ROAD_PIECE,
  LANTERN_PIECE,
  PORCH_LIGHT_PIECE,
  HARBOUR_SONG_PIECE,
  SUNDAY_GLIDE_PIECE,
];
