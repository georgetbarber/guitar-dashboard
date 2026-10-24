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

/*
 * Layers 2 and 4 in shuffle (Units 27, 29 and 33): the same 12-bar with the
 * quick change (A7 in bar 2) and a turnaround to B7 in bar 12, then the
 * stop-time E5 ending. All three shuffle parts share this form, so any one can
 * play along with another.
 */
const SHUFFLE_FORM = ["E7", "A7", "E7", "E7", "A7", "A7", "E7", "E7", "B7", "A7", "E7", "B7"] as const;
const SHUFFLE = { ...FRONT_STEP, feel: "shuffle-8", bars: 14 } as const;
const SHUFFLE_HARMONY = SHUFFLE_FORM.map(
  (chord, index) => [index + 1, 1, chord, chord === "E7" ? "I7" : chord === "A7" ? "IV7" : "V7"] as const,
).concat([[13, 1, "E", "I"]] as const);
const SHUFFLE_SECTIONS = [
  ["line-1", "Line 1 · E7, quick change to A7", 1, 4],
  ["line-2", "Line 2 · A7 to E7", 5, 8],
  ["line-3", "Line 3 · B7, A7, E7, turnaround", 9, 12],
  ["ending", "Ending · stop together", 13, 14],
] as const;
const STOP_TIME = ["q 6:0+5:2[st] q r q 6:0+5:2[st] q r", "w 6:0+5:2"];

/** The boogie: root and fifth twice, root and sixth twice, on every beat pair. */
const BOOGIE = {
  E7: "e 6:0+5:2 e 6:0+5:2 e 6:0+5:4 e 6:0+5:4 e 6:0+5:2 e 6:0+5:2 e 6:0+5:4 e 6:0+5:4",
  A7: "e 5:0+4:2 e 5:0+4:2 e 5:0+4:4 e 5:0+4:4 e 5:0+4:2 e 5:0+4:2 e 5:0+4:4 e 5:0+4:4",
  B7: "e 5:2+4:4 e 5:2+4:4 e 5:2+4:6 e 5:2+4:6 e 5:2+4:4 e 5:2+4:4 e 5:2+4:6 e 5:2+4:6",
} as const;

const SEVENTHS = {
  E7: { symbol: "E7", shape: "020100", fingers: "-2-1--" },
  A7: { symbol: "A7", shape: "x02020", fingers: "x-2-3-" },
  B7: { symbol: "B7", shape: "x21202", fingers: "x213-4" },
};
/** A shuffled down, down-up, a short stab on 3, and a beat of space to change. */
const sevenths = (chord: string) => `q D:${chord} e D:${chord} e U:${chord} q D:${chord}[st] q r`;

const frontStepBoogie = score({
  ...SHUFFLE,
  id: "front-step-boogie",
  title: "Front Step: the boogie shuffle",
  tempo: [60, 76, 100],
  voices: {
    boogie: { label: "Boogie", text: [...SHUFFLE_FORM.map((chord) => BOOGIE[chord]), ...STOP_TIME].join(" | ") },
  },
  sections: SHUFFLE_SECTIONS,
  harmony: SHUFFLE_HARMONY,
  exceptions: [
    {
      rule: "fret-span",
      reason:
        "The sixth over B (A string fret 2 to D string fret 6) is the boogie's standard fourth-finger stretch; Unit 29 plays B as root and fifth until the stretch comes.",
    },
  ],
});

const frontStepSevenths = score({
  ...SHUFFLE,
  id: "front-step-sevenths",
  title: "Front Step: E7, A7 and B7 in shuffle",
  tempo: [60, 76, 100],
  voicings: SEVENTHS,
  voices: {
    chords: {
      label: "Chords",
      text: [...SHUFFLE_FORM.map(sevenths), "q D:E7[st] q r q D:E7[st] q r", "w D:E7"].join(" | "),
    },
  },
  sections: SHUFFLE_SECTIONS,
  harmony: SHUFFLE_HARMONY,
});

/*
 * Layer 4 (Units 27 and 29): a solo chorus in E minor pentatonic, open
 * position, with a bar of space in every four, whole-step bends that must reach
 * their note, vibrato on the long notes, one slide-in, the ♭3-to-3 move in bar
 * 11, and the stop-time ending.
 */
export const FRONT_STEP_SOLO_BARS = [
  "q r e 3:0 e 3:2 q 3:2[b2] q 2:0[~]",
  "h 2:0[~] h r",
  "q r e 2:3 e 2:0 q 3:2 q 3:0",
  "h 4:2[~] h r",
  "q 3:2[si] e 3:2 e 3:0 h 4:2",
  "q r q 2:3[b2] h 2:0[~]",
  "h 1:0[~] h r",
  "w r",
  "q r q 3:2[b2] h 2:0[~]",
  "q 2:0 q 3:2 h 3:0",
  "q 4:2 e 3:1{G#} e 3:0 h 4:2[~]",
  "q 5:2 q 4:1{D#} q 5:2 q r",
] as const;

const frontStepSolo = score({
  ...SHUFFLE,
  key: "E blues",
  id: "front-step-solo",
  title: "Front Step: a solo chorus",
  tempo: [60, 76, 100],
  voices: { lead: { label: "Solo", text: [...FRONT_STEP_SOLO_BARS, ...STOP_TIME].join(" | ") } },
  sections: SHUFFLE_SECTIONS,
  harmony: SHUFFLE_HARMONY,
});

export const FRONT_STEP_PIECE: Piece = {
  id: "piece-front-step",
  version: 3,
  provenance: DRAFT_BY_AGENT,
  title: "Front Step",
  styles: ["blues-rock"],
  description:
    "A blues in E built on a call and an answer: it starts with one open string and one low root, and grows into a shuffle with a solo chorus.",
  scores: [
    frontStepQuestion,
    frontStepRoots,
    frontStepBand,
    frontStepCalls,
    frontStepBoogie,
    frontStepSevenths,
    frontStepSolo,
  ],
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
    {
      id: "front-step-boogie",
      layer: 2,
      title: "The boogie shuffle",
      scoreId: frontStepBoogie.id,
      accompanimentIds: [frontStepSevenths.id],
      instruction:
        "Root and fifth twice, root and sixth twice, on every beat, in a long-short shuffle: E on the low E and A strings, A on the A and D strings, B one fret higher with the fourth finger stretching for the sixth. The quick change puts A in bar 2; the turnaround puts B in bar 12.",
      unitIds: ["unit-29"],
    },
    {
      id: "front-step-sevenths",
      layer: 2,
      title: "E7, A7 and B7 in shuffle",
      scoreId: frontStepSevenths.id,
      accompanimentIds: [frontStepBoogie.id],
      instruction:
        "Strum the open sevenths, E7 020100, A7 x02020 and B7 x21202: down, shuffled down-up, a short stab on 3, and beat 4 to change. Quick change in bar 2, turnaround to B7 in bar 12, then stop together.",
      unitIds: ["unit-33"],
    },
    {
      id: "front-step-solo",
      layer: 4,
      title: "A solo chorus",
      scoreId: frontStepSolo.id,
      accompanimentIds: [frontStepBoogie.id],
      instruction:
        "Twelve bars over the boogie in E minor pentatonic, open position, with space in every line: bend the A on the G string and the D on the B string a whole step until they reach B and E, shake the long notes, slide into A in bar 5, move from G♯ to G in bar 11, then stop with the band.",
      unitIds: ["unit-27", "unit-29"],
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
    {
      stage: 6,
      partIds: ["front-step-sevenths", "front-step-calls", "front-step-solo"],
      capability: {
        id: "piece.front-step.full",
        action: "playing",
        title: "Play Front Step in full",
        criterion:
          "Play three choruses in turn, the shuffle chords, the calls and answers, and the solo, with every bend reaching its note.",
      },
      criterion: "I played three choruses: rhythm, calls and answers, solo, and the bends reached their notes.",
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

/*
 * Layer 3 (Unit 25): the riff as single notes in A minor pentatonic at the 5th
 * position, locked to the power-chord riff: C on the "and" of 2 and D on the
 * "and" of 4 land with the C5 and D5 kicks. A pull-off (C to A) and a
 * hammer-on (D to E) keep it moving.
 */
export const LOW_SINGLE = {
  riff: "e 6:5 e 6:8 e 6:5[p] e 6:8[>] e 6:5 e 5:5 e 5:7[h] e 5:5[>]",
  turn: "e 6:5 e 6:8 e 6:5[p] e 6:8[>] h 5:5",
  /* Unit 28's changes, one dimension each, keeping the accents on the "and" of 2 and of 4. */
  newEnding: "e 6:5 e 6:8 e 6:5[p] e 6:8[>] e 6:5 e 5:5 e 4:5 e 4:7[>]",
  newRhythm: "q 6:5 e 6:5 e 6:8[>] q 6:5 e 5:7 e 5:5[>]",
  octaveUp: "e 4:7 e 4:10 e 4:7[p] e 4:10[>] e 4:7 e 3:7 e 3:9[h] e 3:7[>]",
} as const;

const lowRoadSingle = score({
  ...LOW_ROAD,
  id: "low-road-single-note",
  title: "Low Road: the riff as single notes",
  key: "A minor",
  bars: 4,
  tempo: [66, 84, 112],
  voices: {
    riff: {
      label: "Single-note riff",
      text: [LOW_SINGLE.riff, LOW_SINGLE.riff, LOW_SINGLE.riff, LOW_SINGLE.turn].join(" | "),
    },
  },
});

/* Layer 4 (Unit 28): A, A, A′ (a new ending that climbs to A), B (the riff an octave higher). */
const lowRoadDevelopment = score({
  ...LOW_ROAD,
  id: "low-road-development",
  title: "Low Road: the riff developed, A A A′ B",
  key: "A minor",
  bars: 4,
  tempo: [66, 84, 112],
  voices: {
    riff: {
      label: "Riff",
      text: [LOW_SINGLE.riff, LOW_SINGLE.riff, LOW_SINGLE.newEnding, LOW_SINGLE.octaveUp].join(" | "),
    },
  },
  sections: [
    ["a", "A", 1, 2],
    ["a-prime", "A′ · new ending", 3, 3],
    ["b", "B · an octave up", 4, 4],
  ],
});

const lowRoadBandA = bandFor("low-road-band-a", "A minor", A5);
const lowRoadBandE = bandFor("low-road-band-e", "E minor", E5);

export const LOW_ROAD_PIECE: Piece = {
  id: "piece-low-road",
  version: 2,
  provenance: DRAFT_BY_AGENT,
  title: "Low Road",
  styles: ["blues-rock"],
  description:
    "A driving riff in A: palm-muted root chugs with two power chords kicking on the off-beats, an octave fill and a double-stop tag, then the whole thing moved to E, and the riff as single notes, developed.",
  scores: [
    lowRoadChugs,
    lowRoadRiff,
    lowRoadBand,
    lowRoadInA,
    lowRoadInE,
    lowRoadBandA,
    lowRoadBandE,
    lowRoadSingle,
    lowRoadDevelopment,
  ],
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
    {
      id: "low-road-single-note",
      layer: 3,
      title: "The riff as single notes",
      scoreId: lowRoadSingle.id,
      accompanimentIds: [lowRoadRiff.id],
      instruction:
        "The same riff as single notes at the 5th position while the second guitar plays the power chords: your C lands with its C5 on the “and” of 2, your D with its D5 on the “and” of 4. Pull off from C to A, hammer from D to E.",
      unitIds: ["unit-25"],
    },
    {
      id: "low-road-development",
      layer: 4,
      title: "The riff developed: A A A′ B",
      scoreId: lowRoadDevelopment.id,
      accompanimentIds: [lowRoadBand.id],
      instruction:
        "Twice as it is, then with a new ending that climbs to A on the D string, then the whole riff an octave higher from that A. The accents stay on the “and” of 2 and of 4 throughout.",
      unitIds: ["unit-28"],
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

/** A down strum, then down-up, a missed beat 3 and an up strum that rings through 4; the hand changes at the very end of 4. */
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
        "Strum G, C, D, D, then Em, C, D and G under the melody: down, down-up, miss, up, letting the up-strum ring through count 4 and changing at the very end of it.",
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
      make: "Then make your answer: in a new sketch, write two bars that answer Lantern's first two bars and end on G, and save it. Come back to this capstone from the course map to report on both.",
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

/*
 * Layer 4 (Unit 31): I–IV–V–I with the thumb walking between the roots: G, D,
 * then A and B up into C; and from D, the walk C, B, A down home to G. The
 * fingers keep their off-beats above it.
 */
export const PORCH_WALK_THUMB = {
  G: "q 6:3@p q 4:0@p q 5:0@p q 5:2@p",
  C: "q 5:3@p q 4:2@p q 5:3@p q 4:2@p",
  D: "q 4:0@p q 5:3@p q 5:2@p q 5:0@p",
  home: "q 6:3@p q 4:0@p h 6:3@p",
} as const;

const porchWalks = score({
  ...PORCH,
  id: "porch-light-walks",
  title: "Porch Light: bass walks between I, IV and V",
  bars: 4,
  sections: [
    ["up", "Walk up to IV", 1, 2],
    ["home", "Walk home from V", 3, 4],
  ],
  harmony: [
    [1, 1, "G", "I"],
    [2, 1, "C", "IV"],
    [3, 1, "D", "V"],
    [4, 1, "G", "I"],
  ],
  voices: {
    fingers: {
      label: "Fingers",
      text: (["G", "C", "D", "G"] as const).map(fingersOffBeats).join(" | "),
    },
    thumb: {
      label: "Thumb",
      text: [PORCH_WALK_THUMB.G, PORCH_WALK_THUMB.C, PORCH_WALK_THUMB.D, PORCH_WALK_THUMB.home].join(" | "),
    },
  },
});

export const PORCH_LIGHT_PIECE: Piece = {
  id: "piece-porch-light",
  version: 2,
  provenance: DRAFT_BY_AGENT,
  title: "Porch Light",
  styles: ["folk"],
  description:
    "A fingerpicked tune in G: a thumb that keeps time on the bass strings and a melody pinched on top, from one note a beat to full Travis picking.",
  scores: [porchRoots, porchTravis, porchMelody, porchTune, porchWalks],
  parts: [
    {
      id: "porch-light-roots",
      layer: 1,
      title: "Thumb roots",
      scoreId: porchRoots.id,
      accompanimentIds: [porchTune.id],
      instruction:
        "Play each chord's root with your thumb on every count, G, E, C, D, G, E, D, then a long G, while the other guitar plays the tune.",
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
    {
      id: "porch-light-walks",
      layer: 4,
      title: "Bass walks between the chords",
      scoreId: porchWalks.id,
      accompanimentIds: [],
      instruction:
        "G, C, D and G with the Travis fingers on every “and”. In the G bar the thumb plays G and D, then walks A and B up into C; in the D bar it walks D, C, B and A down home to G.",
      unitIds: ["unit-31"],
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
  // The second finger keeps the D on the G string through the change (Units 19 and 20).
  D: { symbol: "D", shape: "xxx775", fingers: "xxx231" },
  G: { symbol: "G", shape: "xxx787", fingers: "xxx243", inversion: "second" as const },
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

/** Unit 19's move in the piece: each chord starts as a sus2 and the hammer-on on count 2 makes it major. */
const sundayShapes = score({
  ...SUNDAY,
  id: "sunday-glide-shapes",
  title: "Sunday Glide: sus2 into the chord",
  voices: {
    triads: {
      label: "Triads",
      text: [
        "q 3:7+2:5+1:5 q 2:7[h] h 3:7+2:7+1:5",
        "q 3:7+2:8+1:5 q 1:7[h] h 3:7+2:8+1:7",
        "q 3:7+2:5+1:5 q 2:7[h] h 3:7+2:7+1:5",
        "q 3:7+2:8+1:5 q 1:7[h] h 3:7+2:8+1:7",
      ].join(" | "),
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

/*
 * Layer 4 (Unit 36): the rhythm part with its hits on 1 and 3 slid into from a
 * fret below, and ghosted scratches on the "and" of 1, 3 and 4. Ghosts stay on
 * the long side of each swung pair, where the hand has time for them.
 */
const sundaySlideBar = (chord: "D" | "G") => {
  const shape = chord === "D" ? "3:7+2:7+1:5" : "3:7+2:8+1:7";
  return [
    `s ${shape}[si,>]`,
    "s r",
    "s X[gh]",
    `s U:${chord}`,
    "s r",
    "s r",
    `s D:${chord}`,
    "s r",
    `s ${shape}[si,>]`,
    "s r",
    "s X[gh]",
    `s U:${chord}`,
    "s r",
    "s r",
    "s X[gh]",
    "s r",
  ].join(" ");
};

const sundaySlides = score({
  ...SUNDAY,
  id: "sunday-glide-slides",
  title: "Sunday Glide: slide-ins and ghosts",
  voicings: TOP_STRING_D_G,
  voices: { hand: { label: "Strumming hand", text: (["D", "G", "D", "G"] as const).map(sundaySlideBar).join(" | ") } },
});

export const SUNDAY_GLIDE_PIECE: Piece = {
  id: "piece-sunday-glide",
  version: 2,
  provenance: DRAFT_BY_AGENT,
  title: "Sunday Glide",
  styles: ["soul-funk"],
  description:
    "A soul vamp in D, I to IV: octave roots, small chords on the top strings in swung sixteenths, and sixths that slide into the chord.",
  scores: [sundayRoots, sundayShapes, sundayRhythm, sundaySixths, sundaySlides],
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
      id: "sunday-glide-shapes",
      layer: 2,
      title: "Sus2 into the chord",
      scoreId: sundayShapes.id,
      accompanimentIds: [sundayRoots.id],
      instruction:
        "D and G as small shapes at the 7th fret, each struck as a sus2 on count 1 and turned major by a hammer-on on count 2, then held. The second guitar plays the octave roots.",
      unitIds: ["unit-19"],
    },
    {
      id: "sunday-glide-rhythm",
      layer: 2,
      title: "The rhythm part",
      scoreId: sundayRhythm.id,
      accompanimentIds: [sundayRoots.id],
      instruction:
        "Strum only the top three strings, D then G at the 7th fret. Keep the hand moving down-up in sixteenths and let it touch the strings on 1, the “a” of 1, the “and” of 2, 3 and the “a” of 3.",
      unitIds: ["unit-20"],
    },
    {
      id: "sunday-glide-sixths",
      layer: 3,
      title: "Sliding sixths",
      scoreId: sundaySixths.id,
      accompanimentIds: [sundayRhythm.id],
      instruction:
        "Slide into each sixth from a fret below on count 1, then pluck it again on the “a” of 2, just before count 3: A with F♯ over D, B with G over G.",
      unitIds: ["unit-23"],
    },
    {
      id: "sunday-glide-slides",
      layer: 4,
      title: "Slide-ins and ghosts",
      scoreId: sundaySlides.id,
      accompanimentIds: [sundayRoots.id],
      instruction:
        "The rhythm part with a twist: on 1 and 3 slide the whole small shape up into place from one fret below, and fill the “and” of 1, 3 and 4 with ghosted scratches, barely touching the muted strings.",
      unitIds: ["unit-36"],
    },
  ],
  capstones: [],
};

/* ------------------------------------------------------------------ */
/* NIGHT MARKET · a funk vamp in E, minor then Dorian                    */
/* ------------------------------------------------------------------ */

const NIGHT = {
  version: 1,
  provenance: DRAFT_BY_AGENT,
  metre: "4/4",
} as const;

/** The open Em7 of Units 4 and 5, and the small shapes of the sixteenth groove on the D, G and B strings. */
const NIGHT_OPEN = { Em7: { symbol: "Em7", shape: "022030", fingers: "-12-3-" } };
/*
 * Em7 (E, B, D, G) and A7 (E, A, C♯, G) on the top four strings: the E on the
 * D string and the G on the high E stay; B and D each step down to A and C♯.
 */
export const NIGHT_PARTIALS = {
  Em7: { symbol: "Em7", shape: "xx2433", fingers: "xx1423" },
  A7: {
    symbol: "A7",
    shape: "xx2223",
    fingers: "xx1113",
    barre: [2, 2, 4, 1] as const,
    inversion: "second" as const,
  },
};
const NIGHT_HARMONY = (bars: readonly ("Em7" | "A7")[]) =>
  bars.map((chord, index) => [index + 1, 1, chord, chord === "Em7" ? "i7" : "IV7"] as const);

/** Units 4 and 5: the bounce (down, down-up, miss, up, down-up), then two stabs and space. */
const nightBounce = "q D:Em7 e D:Em7 e U:Em7 e r e U:Em7 e D:Em7 e U:Em7";
const nightStabs = "e D:Em7[st] e r e r e D:Em7[st] h r";

/**
 * The sixteenth groove: the hand moves down and up on every sixteenth. Chords
 * on 1 (accented), the "a" of 1 and the "and" of 2 (accented); muted scratches
 * everywhere else, so the second half of the bar leaves room for the riff to
 * answer and for the hand to change chords.
 */
export const nightGroove = (chord: "Em7" | "A7") =>
  [
    `s D:${chord}[>]`,
    "s x[gh]",
    "s X[gh]",
    `s U:${chord}`,
    "s X[gh]",
    "s x[gh]",
    `s D:${chord}[>]`,
    "s x[gh]",
    "s X[gh]",
    "s x[gh]",
    "s X[gh]",
    "s x[gh]",
    "s X[gh]",
    "s x[gh]",
    "s X[gh]",
    "s x[gh]",
  ].join(" ");

/** The riff answers in the gap: four notes from the "and" of 3, the last one accented. */
export const NIGHT_RIFF = {
  Em7: "e r e r e r e r s 6:0 s 6:3[h] s 5:0 s r s 5:2[>] s r e r",
  A7: "e r e r e r e r s 5:0 s 5:4[h] s 4:2 s r s 4:5[>] s r e r",
} as const;

/** The second guitar's low line: the root three times, then a walk to the next root. */
const NIGHT_BASS = {
  Em7: "e 6:0 e r e r e 6:0 e r e 6:0 e 6:2 e 6:3",
  A7: "e 5:0 e r e r e 5:0 e r e 5:0 e 6:3 e 6:2",
} as const;

const VAMP = ["Em7", "A7", "Em7", "A7"] as const;

const nightScratch = score({
  ...NIGHT,
  id: "night-market-scratch",
  title: "Night Market: Em7, bounce and stabs",
  key: "E minor",
  bars: 4,
  tempo: [60, 80, 104],
  voicings: NIGHT_OPEN,
  voices: { hand: { label: "Strumming hand", text: [nightBounce, nightBounce, nightStabs, nightStabs].join(" | ") } },
});

const nightLowStraight = score({
  ...NIGHT,
  id: "night-market-low-straight",
  title: "Night Market: the second guitar's low line on E",
  key: "E minor",
  bars: 4,
  tempo: [60, 80, 104],
  voices: { bass: { label: "Second guitar", text: Array.from({ length: 4 }, () => NIGHT_BASS.Em7).join(" | ") } },
});

/* Straight sixteenths, as funk usually is; Sunday Glide carries the course's swung sixteenths. */
const nightSwing = { ...NIGHT, key: "E dorian" } as const;

const nightGrooveScore = score({
  ...nightSwing,
  id: "night-market-groove",
  title: "Night Market: the sixteenth groove",
  bars: 4,
  tempo: [60, 76, 96],
  voicings: NIGHT_PARTIALS,
  voices: { hand: { label: "Strumming hand", text: VAMP.map(nightGroove).join(" | ") } },
  harmony: NIGHT_HARMONY(VAMP),
});

const nightLow = score({
  ...nightSwing,
  id: "night-market-low",
  title: "Night Market: the second guitar's low line",
  bars: 4,
  tempo: [56, 76, 104],
  voices: { bass: { label: "Second guitar", text: VAMP.map((chord) => NIGHT_BASS[chord]).join(" | ") } },
  harmony: NIGHT_HARMONY(VAMP),
});

const nightRiff = score({
  ...nightSwing,
  id: "night-market-riff",
  title: "Night Market: the riff that answers",
  bars: 4,
  tempo: [60, 76, 96],
  voices: { riff: { label: "Riff", text: VAMP.map((chord) => NIGHT_RIFF[chord]).join(" | ") } },
  harmony: NIGHT_HARMONY(VAMP),
});

const nightGrooveBand = score({
  ...nightSwing,
  id: "night-market-groove-band",
  title: "Night Market: the second guitar's groove",
  bars: 4,
  tempo: [56, 76, 104],
  voicings: NIGHT_PARTIALS,
  voices: { hand: { label: "Second guitar", text: VAMP.map(nightGroove).join(" | ") } },
  harmony: NIGHT_HARMONY(VAMP),
});

/** Bars 5 and 6 are the break: two stabs, then one, with the band silent and the hand still moving. */
const BREAK_FORM = ["Em7", "A7", "Em7", "A7", "Em7", "Em7", "Em7", "Em7"] as const;
const nightWhole = score({
  ...nightSwing,
  id: "night-market-whole",
  title: "Night Market: groove, break and ending",
  bars: 8,
  tempo: [60, 76, 96],
  voicings: NIGHT_PARTIALS,
  voices: {
    hand: {
      label: "Strumming hand",
      text: [
        ...VAMP.map(nightGroove),
        "e D:Em7[>,st] e r e r e D:Em7[st] h r",
        "e D:Em7[>,st] e r q r h r",
        nightGroove("Em7"),
        "e D:Em7[>,st] e r q r h r",
      ].join(" | "),
    },
  },
  sections: [
    ["groove", "Groove", 1, 4],
    ["break", "Break · the band stops", 5, 6],
    ["return", "Groove and last hit", 7, 8],
  ],
  harmony: NIGHT_HARMONY(BREAK_FORM),
});

const nightWholeBand = score({
  ...nightSwing,
  id: "night-market-whole-band",
  title: "Night Market: riff and low line around the break",
  bars: 8,
  tempo: [56, 76, 104],
  voices: {
    riff: {
      label: "Second guitar, riff",
      text: [...VAMP.map((chord) => NIGHT_RIFF[chord]), "w r", NIGHT_RIFF.Em7, NIGHT_RIFF.Em7, "w r"].join(" | "),
    },
    bass: {
      label: "Second guitar, low line",
      text: [
        ...VAMP.map((chord) => NIGHT_BASS[chord]),
        "e 6:0[st] e r e r e 6:0[st] h r",
        "e 6:0[st] e r q r h r",
        NIGHT_BASS.Em7,
        "e 6:0[st] e r q r h r",
      ].join(" | "),
    },
  },
  harmony: NIGHT_HARMONY(BREAK_FORM),
});

/** Unit 36: each accented hit slides into its shape from a fret below; the scratches stay ghosted. */
const nightSlideBar = (chord: "Em7" | "A7") => {
  const shape = chord === "Em7" ? "4:2+3:4+2:3+1:3" : "4:2+3:2+2:2+1:3";
  return nightGroove(chord).replace(`s D:${chord}[>]`, `s ${shape}[si,>]`);
};
const nightSlides = score({
  ...nightSwing,
  id: "night-market-slides",
  title: "Night Market: slide-ins on the accents",
  bars: 4,
  tempo: [60, 76, 96],
  voicings: NIGHT_PARTIALS,
  voices: { hand: { label: "Strumming hand", text: VAMP.map(nightSlideBar).join(" | ") } },
  harmony: NIGHT_HARMONY(VAMP),
});

export const NIGHT_MARKET_PIECE: Piece = {
  id: "piece-night-market",
  version: 1,
  provenance: DRAFT_BY_AGENT,
  title: "Night Market",
  styles: ["soul-funk"],
  description:
    "A funk vamp in E: an Em7 bounce and stabs, then a sixteenth groove where A7 turns E minor into E Dorian, a riff that answers the chords, and a break where the band stops.",
  scores: [
    nightScratch,
    nightLowStraight,
    nightGrooveScore,
    nightLow,
    nightRiff,
    nightGrooveBand,
    nightWhole,
    nightWholeBand,
    nightSlides,
  ],
  parts: [
    {
      id: "night-market-scratch",
      layer: 1,
      title: "Em7 bounce and stabs",
      scoreId: nightScratch.id,
      accompanimentIds: [nightLowStraight.id],
      instruction:
        "Two bars of the Em7 bounce (down, down-up, miss, up, down-up), then two bars of stabs on 1 and the “and” of 2, stopped short, while the second guitar plays its low line.",
      unitIds: ["unit-04", "unit-05"],
    },
    {
      id: "night-market-groove",
      layer: 2,
      title: "The sixteenth groove",
      scoreId: nightGrooveScore.id,
      accompanimentIds: [nightLow.id],
      instruction:
        "The hand moves in sixteenths all the time. Em7 and A7 on the top four strings sound on 1, the “a” of 1 and the “and” of 2; everything else is a muted scratch, which leaves time to change. The E and the G stay put between the chords.",
      unitIds: ["unit-26"],
    },
    {
      id: "night-market-riff",
      layer: 3,
      title: "The riff that answers",
      scoreId: nightRiff.id,
      accompanimentIds: [nightGrooveBand.id],
      instruction:
        "Wait through the chords, then answer them from the “and” of 3: E, a hammer to G, A and an accented B over Em7; A, a hammer to C♯, E and an accented G over A7.",
      unitIds: ["unit-28"],
    },
    {
      id: "night-market-whole",
      layer: 2,
      title: "Groove, break and ending",
      scoreId: nightWhole.id,
      accompanimentIds: [nightWholeBand.id],
      instruction:
        "Four bars of groove, then the break: two stabs, then one, while the band stops and your hand keeps moving above the strings. Back into the groove for a bar, then one last hit.",
      unitIds: ["unit-05", "unit-26"],
    },
    {
      id: "night-market-slides",
      layer: 4,
      title: "Slide-ins on the accents",
      scoreId: nightSlides.id,
      accompanimentIds: [nightLow.id],
      instruction:
        "The same groove, but the accented hit on 1 slides into its shape from one fret below: the outside note arriving on the beat.",
      unitIds: ["unit-36"],
    },
  ],
  capstones: [
    {
      stage: 5,
      partIds: ["night-market-whole"],
      capability: {
        id: "piece.night-market.groove",
        action: "playing",
        title: "Play Night Market's groove and break",
        criterion:
          "Keep the hand moving in sixteenths through the groove and the break, with the accents on 1 and the “and” of 2.",
      },
      criterion: "My strumming hand never stopped and the accents landed where the groove puts them.",
    },
  ],
};

/* ------------------------------------------------------------------ */
/* TWO RIVERS · one root, two modes                                      */
/* ------------------------------------------------------------------ */

const RIVERS = { version: 1, provenance: DRAFT_BY_AGENT, metre: "4/4", bars: 4 } as const;
const RIVERS_MIXO = { ...RIVERS, key: "A mixolydian", tempo: [66, 80, 100] } as const;
const RIVERS_DORIAN = { ...RIVERS, key: "A dorian", feel: "swing-16", tempo: [66, 76, 92] } as const;

export const RIVERS_CHORDS = {
  A: { symbol: "A", shape: "x02220", fingers: "x-123-" },
  G: { symbol: "G", shape: "320003", fingers: "21---3" },
  Am7: { symbol: "Am7", shape: "x02010", fingers: "x-2-1-" },
  D: { symbol: "D", shape: "xx0232", fingers: "xx-132" },
};
/** Down, down-up, a missed beat, up, and beat 4 free to change. */
const riversStrum = (chord: string) => `q D:${chord} e D:${chord} e U:${chord} e r e U:${chord} q r`;
const MIXO_HARMONY = [
  [1, 1, "A", "I"],
  [2, 1, "G", "♭VII"],
  [3, 1, "A", "I"],
  [4, 1, "G", "♭VII"],
] as const;
const DORIAN_HARMONY = [
  [1, 1, "Am7", "i7"],
  [2, 1, "D", "IV"],
  [3, 1, "Am7", "i7"],
  [4, 1, "D", "IV"],
] as const;

const riversPulse = score({
  ...RIVERS_MIXO,
  id: "two-rivers-pulse",
  title: "Two Rivers: the A5–G5 pulse",
  voices: {
    pulse: {
      label: "Power chords",
      text: ["5:0+4:2", "6:3+5:5", "5:0+4:2", "6:3+5:5"]
        .map((chord) => Array.from({ length: 4 }, () => `q ${chord}`).join(" "))
        .join(" | "),
    },
  },
  harmony: MIXO_HARMONY,
});

const riversMixoChords = score({
  ...RIVERS_MIXO,
  id: "two-rivers-mixolydian-chords",
  title: "Two Rivers: A and G, the Mixolydian river",
  voicings: { A: RIVERS_CHORDS.A, G: RIVERS_CHORDS.G },
  voices: { chords: { label: "Chords", text: ["A", "G", "A", "G"].map(riversStrum).join(" | ") } },
  harmony: MIXO_HARMONY,
});

/** Leans on G, the ♭7, over the G chord, and ends on it. */
export const RIVERS_MIXO_MELODY = [
  "q 1:0 e 2:2 e 2:3 h 2:2",
  "q 1:3 e 1:2 e 1:0 h 1:3",
  "q 1:5 e 1:3 e 1:2 h 1:0",
  "q 2:3 e 1:0 e 1:2 h 1:3",
];
/** Leans on F♯, the natural 6, over the D chord. */
export const RIVERS_DORIAN_MELODY = [
  "q 1:0 e 2:1 e 2:3 h 1:0",
  "q 1:2 e 1:0 e 1:2 h 1:2",
  "q 1:3 e 1:2 e 1:0 h 2:1",
  "q 2:3 e 1:0 e 1:2 h 1:2",
];

const riversMixoMelody = score({
  ...RIVERS_MIXO,
  id: "two-rivers-mixolydian-melody",
  title: "Two Rivers: the melody that leans on ♭7",
  voices: { melody: { label: "Melody", text: RIVERS_MIXO_MELODY.join(" | ") } },
  harmony: MIXO_HARMONY,
});

const riversDorianChords = score({
  ...RIVERS_DORIAN,
  id: "two-rivers-dorian-chords",
  title: "Two Rivers: Am7 and D, the Dorian river",
  voicings: { Am7: RIVERS_CHORDS.Am7, D: RIVERS_CHORDS.D },
  voices: { chords: { label: "Chords", text: ["Am7", "D", "Am7", "D"].map(sixteenthGroove).join(" | ") } },
  harmony: DORIAN_HARMONY,
});

const riversDorianMelody = score({
  ...RIVERS_DORIAN,
  id: "two-rivers-dorian-melody",
  title: "Two Rivers: the melody that leans on the natural 6",
  voices: { melody: { label: "Melody", text: RIVERS_DORIAN_MELODY.join(" | ") } },
  harmony: DORIAN_HARMONY,
});

export const TWO_RIVERS_PIECE: Piece = {
  id: "piece-two-rivers",
  version: 1,
  provenance: DRAFT_BY_AGENT,
  title: "Two Rivers",
  styles: ["blues-rock", "soul-funk"],
  description:
    "One root, A, and two modes: a straight rock vamp from A to G with a melody that leans on the flat 7, then a swung soul vamp from Am7 to D with a melody that leans on the natural 6.",
  scores: [riversPulse, riversMixoChords, riversMixoMelody, riversDorianChords, riversDorianMelody],
  parts: [
    {
      id: "two-rivers-pulse",
      layer: 1,
      title: "The A5–G5 pulse",
      scoreId: riversPulse.id,
      accompanimentIds: [riversMixoChords.id],
      instruction:
        "A5 on the A string, then G5 on the low E string a bar each, a quarter note on every count, while the second guitar strums A and G.",
      unitIds: ["unit-12"],
    },
    {
      id: "two-rivers-mixolydian-chords",
      layer: 2,
      title: "A and G (Mixolydian)",
      scoreId: riversMixoChords.id,
      accompanimentIds: [riversMixoMelody.id],
      instruction:
        "Strum A and G a bar each, straight: down, down-up, miss, up, with beat 4 free to change. G is the ♭VII: the chord built on the note that makes A Mixolydian.",
      unitIds: ["unit-34"],
    },
    {
      id: "two-rivers-dorian-chords",
      layer: 2,
      title: "Am7 and D (Dorian)",
      scoreId: riversDorianChords.id,
      accompanimentIds: [riversDorianMelody.id],
      instruction:
        "Am7 and D a bar each in swung sixteenths, the Sunday Glide pattern: 1, the “a” of 1, the “and” of 2, 3 and the “a” of 3. D's F♯ is the note that makes A Dorian.",
      unitIds: ["unit-34"],
    },
    {
      id: "two-rivers-mixolydian-melody",
      layer: 3,
      title: "Melody leaning on ♭7",
      scoreId: riversMixoMelody.id,
      accompanimentIds: [riversMixoChords.id],
      instruction:
        "On the B and high E strings in open position, a melody that lands on G, the ♭7, over the G chord and ends on it.",
      unitIds: ["unit-34"],
    },
    {
      id: "two-rivers-dorian-melody",
      layer: 3,
      title: "Melody leaning on the natural 6",
      scoreId: riversDorianMelody.id,
      accompanimentIds: [riversDorianChords.id],
      instruction: "A melody that leans on F♯, the natural 6, every time the D chord comes round.",
      unitIds: ["unit-34"],
    },
  ],
  capstones: [],
};

/* ------------------------------------------------------------------ */
/* GLASSHOUSE · a soul ballad in C with a borrowed iv                   */
/* ------------------------------------------------------------------ */

const GLASS = {
  version: 1,
  provenance: DRAFT_BY_AGENT,
  key: "C major",
  metre: "4/4",
  bars: 4,
  tempo: [56, 66, 76],
  harmony: [
    [1, 1, "C", "I"],
    [2, 1, "Em", "iii"],
    [3, 1, "F", "IV"],
    [4, 1, "Fm", "iv"],
  ],
} as const;

/* C and Em as A-shape barres (3rd and 7th fret); F and Fm as small shapes in which only A becomes A♭. */
export const GLASS_CHORDS = {
  C: { symbol: "C", shape: "x35553", fingers: "x12341", barre: [3, 1, 5, 1] as const },
  Em: { symbol: "Em", shape: "x79987", fingers: "x13421", barre: [7, 1, 5, 1] as const },
  F: { symbol: "F", shape: "xx3211", fingers: "xx3211", barre: [1, 1, 2, 1] as const },
  Fm: { symbol: "Fm", shape: "xx3111", fingers: "xx3111", barre: [1, 1, 3, 1] as const },
};
const glassStrum = (chord: string) => `q D:${chord} e D:${chord} e U:${chord} h D:${chord}`;

const glassRoots = score({
  ...GLASS,
  id: "glasshouse-roots",
  title: "Glasshouse: the root pulse",
  voices: {
    roots: {
      label: "Roots",
      text: ["5:3", "6:0", "6:1", "6:1"]
        .map((root) => Array.from({ length: 4 }, () => `q ${root}`).join(" "))
        .join(" | "),
    },
  },
});

const glassChords = score({
  ...GLASS,
  id: "glasshouse-chords",
  title: "Glasshouse: C, Em, F, Fm",
  voicings: GLASS_CHORDS,
  voices: {
    chords: {
      label: "Chords",
      text: ["C", "Em", "F", "Fm"].map((chord) => glassStrum(chord)).join(" | "),
    },
  },
});

/** The same three-note climb over F and Fm; only its top note changes, A to A♭. */
export const GLASS_MELODY = ["q 1:0 q 1:3 h 1:0", "q 2:0 q 1:3 h 2:0", "q 1:1 q 1:3 h 1:5", "q 1:1 q 1:3 h 1:4{Ab}"];
const glassMelody = score({
  ...GLASS,
  id: "glasshouse-melody",
  title: "Glasshouse: the melody whose A becomes A♭",
  voices: { melody: { label: "Melody", text: GLASS_MELODY.join(" | ") } },
});

export const GLASSHOUSE_PIECE: Piece = {
  id: "piece-glasshouse",
  version: 1,
  provenance: DRAFT_BY_AGENT,
  title: "Glasshouse",
  styles: ["soul-funk"],
  description:
    "A slow soul ballad in C: C, Em, F, then F minor borrowed from C minor, with a melody whose A turns to A♭ for that one chord.",
  scores: [glassRoots, glassChords, glassMelody],
  parts: [
    {
      id: "glasshouse-roots",
      layer: 1,
      title: "The root pulse",
      scoreId: glassRoots.id,
      accompanimentIds: [glassChords.id],
      instruction: "C on the A string, then E, F and F on the low E string, a quarter note on every count.",
      unitIds: ["unit-32"],
    },
    {
      id: "glasshouse-chords",
      layer: 2,
      title: "C, Em, F, Fm",
      scoreId: glassChords.id,
      accompanimentIds: [glassMelody.id],
      instruction:
        "C and Em as A-shape barres at the 3rd and 7th frets, then F and Fm as small shapes at the 1st fret: down, down-up, and a long down on 3. From F to Fm only one note moves.",
      unitIds: ["unit-32", "unit-35"],
    },
    {
      id: "glasshouse-melody",
      layer: 3,
      title: "The melody whose A becomes A♭",
      scoreId: glassMelody.id,
      accompanimentIds: [glassChords.id],
      instruction:
        "On the high E and B strings: the same climb over F and Fm, F, G, then A over F and A♭ over Fm, the note the borrowed chord changes.",
      unitIds: ["unit-35"],
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
  NIGHT_MARKET_PIECE,
  TWO_RIVERS_PIECE,
  GLASSHOUSE_PIECE,
];
