/**
 * STAGE 2 · MOVABLE FRETBOARD MAP — authored lessons.
 *
 * Unit 10, "Thirds change colour": the E–G / E–G♯ one-fret comparison first
 * drafted on 30 September 2026 (src/v8/phase6Drafts.ts), re-written in score
 * format 2 with every id, pitch and count unchanged (tested against the
 * original draft).
 *
 * Units 7, 8, 9, 11 and 12 follow docs/CURRICULUM_MAP.md §3 (Batch 1,
 * 24 October 2026). All agent-drafted; nobody has played them on a guitar yet.
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
  checkKind: "playing",
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

const drafted = { version: 1, provenance: DRAFT_BY_AGENT, metre: "4/4" } as const;

/* ------------------------------------------------------------------ */
/* UNIT 7 · Open-string compass                                         */
/* ------------------------------------------------------------------ */

const unisons = score({
  ...drafted,
  id: "compass-fifth-fret-unisons",
  title: "Fifth-fret unisons, low to high",
  key: "D major",
  bars: 3,
  tempo: [48, 60, 72],
  voices: {
    pairs: { label: "Pairs", text: "h 6:5+5:0 h 5:5+4:0 | h 4:5+3:0 h 3:4+2:0 | w 2:5+1:0" },
  },
  sections: [
    ["low", "Low E to A, A to D", 1, 1],
    ["middle", "D to G, G to B (fourth fret)", 2, 2],
    ["high", "B to high E", 3, 3],
  ],
});

const droneMelody = score({
  ...drafted,
  id: "compass-melody-over-d",
  title: "A melody on the top strings over an open D",
  key: "D major",
  bars: 2,
  tempo: [56, 72, 88],
  voices: {
    melody: { label: "Melody", text: "q 2:0 q 2:3 q 1:0 q 1:2 | q 2:3 q 2:0 h 2:3" },
    drone: { label: "Drone", text: "w 4:0[lr] | w 4:0[lr]" },
  },
});

const droneMelodyInA = score({
  ...drafted,
  id: "compass-melody-over-a",
  title: "A new melody over an open A",
  key: "A major",
  bars: 2,
  tempo: [56, 72, 88],
  voices: {
    melody: { label: "Melody", text: "q 2:0 q 2:2 q 1:0 q 1:2 | q 2:2 q 2:0 h 1:0" },
    drone: { label: "Drone", text: "w 5:0[lr] | w 5:0[lr]" },
  },
  derivedFrom: { id: "compass-melody-over-d", version: 1, changed: ["key", "pitch"] },
});

export const COMPASS_LESSON: Lesson = {
  id: "lesson-unit-07-open-strings",
  version: 1,
  provenance: DRAFT_BY_AGENT,
  unitId: "unit-07",
  stage: 2,
  activityKind: "technique",
  checkKind: "playing",
  title: "Six landmarks and a drone",
  purpose: "Know the six open strings so well that you can tune by ear and find your way from them to any note.",
  destination: "Your guitar in tune by its own unisons, and a short melody singing over a ringing open D.",
  variable: "Which open string is the landmark: each pair checks one string against the next.",
  capabilities: [
    {
      id: "fretboard.open-strings.locate",
      action: "locating",
      title: "Name the open strings",
      criterion: "Name and find E, A, D, G, B and E, low to high, without looking them up.",
    },
    {
      id: "ear.unison.beating",
      action: "listening",
      title: "Hear a unison settle",
      criterion: "Hear two strings wobble against each other and the wobble slow as they come into tune.",
    },
    {
      id: "tune.fifth-fret.unison",
      action: "playing",
      title: "Tune by unisons",
      criterion: "Play each fifth-fret pair (fourth fret on the G string) and adjust until it stops wobbling.",
    },
  ],
  scores: [unisons, droneMelody, droneMelodyInA],
  demonstration: {
    scoreId: unisons.id,
    handGuidance: [
      "Each pair is the same pitch on two strings: fret 5 of one string matches the next open string, except the G string, where fret 4 matches the open B.",
      "Let both notes ring together. If they wobble, turn the higher string's peg a little one way; if the wobble speeds up, turn it back the other way.",
      "For the melody, let the open D ring under everything with the thumb, and pick the melody on the B and high E strings.",
    ],
    videoNeeded: [],
  },
  studies: [
    {
      id: "unisons",
      scoreId: unisons.id,
      title: "Fifth-fret unisons",
      changes: "Five pairs, low to high, each checking one string against the next.",
    },
    {
      id: "drone-melody",
      scoreId: droneMelody.id,
      title: "A melody over an open D",
      changes: "The open strings as music: the D rings while a melody moves on the top two strings.",
    },
  ],
  successCriteria: [
    "Play all five unison pairs and hear each one settle without a wobble.",
    "Name the six open strings, low to high, without looking.",
    "Play the melody with the open D ringing underneath the whole time.",
  ],
  likelyErrors: [
    {
      id: "cannot-hear-wobble",
      signal: "I can't hear whether the two notes match.",
      repair:
        "Play only the first pair and let it ring for a long time; listen for a slow pulsing. Turn the peg a tiny amount, listen again, then move to the next pair and finish all five.",
      scoreId: unisons.id,
      from: 0,
      to: 192,
    },
    {
      id: "drone-covers-melody",
      signal: "The drone drowns out the melody.",
      repair:
        "Pluck the drone softly with the thumb and the melody a little harder with a finger or pick. Loop the first bar until the melody sits on top, then play both bars.",
      scoreId: droneMelody.id,
      from: 0,
      to: 192,
    },
  ],
  cueFading: [
    {
      id: "hear-the-pairs",
      phase: "learn",
      cues: "full",
      scoreId: unisons.id,
      instruction: "Hear each unison pair, then play along, letting both notes ring and listening for the wobble.",
    },
    {
      id: "melody-with-count",
      phase: "practise",
      cues: "count-only",
      scoreId: droneMelody.id,
      instruction: "Play the melody over the open D beside the click alone.",
    },
    {
      id: "melody-unaided",
      phase: "try-unaided",
      cues: "none",
      scoreId: droneMelody.id,
      instruction: "Count in and play the melody and drone with the tab hidden, then name the strings you used.",
    },
  ],
  retrieval: {
    afterDays: 1,
    scoreId: unisons.id,
    tempo: 60,
    instruction: "On another day, tune with the unison pairs from memory, then name the six open strings.",
  },
  transfer: {
    scoreId: droneMelodyInA.id,
    instruction:
      "Let the open A ring instead of the D and play a new melody in A on the same two strings. The landmark changed, so the melody's home changed with it.",
    changed: ["key", "pitch"],
  },
  performance: {
    kind: "create",
    instruction: "Make a two-bar melody in Create over an open-string drone of your choice, and name the drone string.",
  },
};

/* ------------------------------------------------------------------ */
/* UNIT 8 · Octaves reveal the neck                                     */
/* ------------------------------------------------------------------ */

const octaveShapes = score({
  ...drafted,
  id: "octave-shapes-a-d",
  title: "Octave shapes on every string pair",
  key: "D major",
  bars: 2,
  tempo: [52, 66, 80],
  voices: { octaves: { label: "Octaves", text: "h 6:5+4:7 h 5:5+3:7 | h 4:7+2:10 h 3:7+1:10" } },
  sections: [
    ["two-frets", "Two strings, two frets up", 1, 1],
    ["three-frets", "Across the B string: three frets up", 2, 2],
  ],
});

const octaveLine = score({
  ...drafted,
  id: "octave-line-d-g-a",
  title: "Octave roots: D, G and A",
  key: "D major",
  feel: "swing-16",
  bars: 2,
  tempo: [56, 72, 88],
  voices: {
    octaves: { label: "Octaves", text: "q 5:5+3:7 q 5:5+3:7 q 6:3+4:5 q 6:3+4:5 | q 5:5+3:7 q 5:5+3:7 h 6:5+4:7" },
  },
});

const octaveLineInA = score({
  ...drafted,
  id: "octave-line-a-d-e",
  title: "Octave roots in A: A, D and E",
  key: "A major",
  feel: "swing-16",
  bars: 2,
  tempo: [56, 72, 88],
  voices: {
    octaves: { label: "Octaves", text: "q 5:0+3:2 q 5:0+3:2 q 5:5+3:7 q 5:5+3:7 | q 6:0+4:2 q 6:0+4:2 h 5:0+3:2" },
  },
  derivedFrom: { id: "octave-line-d-g-a", version: 1, changed: ["key", "pitch", "position"] },
});

export const OCTAVES_LESSON: Lesson = {
  id: "lesson-unit-08-octaves",
  version: 1,
  provenance: DRAFT_BY_AGENT,
  unitId: "unit-08",
  stage: 2,
  activityKind: "technique",
  checkKind: "playing",
  title: "The same note, higher up",
  purpose: "See the neck as repeating patterns: find any note again an octave higher with one fixed shape.",
  destination: "A short line of octave roots, D, G and A, in the soul style Sunday Glide will use.",
  variable: "Which pair of strings carries the octave, and so whether the shape is two frets or three.",
  capabilities: [
    {
      id: "fretboard.octave.locate",
      action: "locating",
      title: "Find the octave",
      criterion: "From any root on the low strings, put a finger on its octave two strings higher at once.",
    },
    {
      id: "ear.octave.same-name",
      action: "listening",
      title: "Hear the same note",
      criterion: "Hear that the two notes of an octave are one note, higher and lower.",
    },
    {
      id: "play.octaves.muted-string",
      action: "playing",
      title: "Clean octaves",
      criterion: "Play both notes together with the string between them silent.",
    },
  ],
  scores: [octaveShapes, octaveLine, octaveLineInA],
  demonstration: {
    scoreId: octaveShapes.id,
    handGuidance: [
      "First finger on the root, third or fourth finger two strings higher and two frets up. The first finger leans lightly on the string in between so it cannot ring.",
      "From the D string to the B string, and from the G string to the high E, the upper note is three frets up instead of two: the B string is tuned one fret lower than the pattern expects.",
      "Strum through all three strings or pluck the two notes with thumb and finger; either way only the octave should sound.",
    ],
    videoNeeded: ["muting"],
  },
  studies: [
    {
      id: "shapes",
      scoreId: octaveShapes.id,
      title: "The shapes",
      changes: "Four octaves, A and D on two string pairs each, showing the two-fret and three-fret shapes.",
    },
    {
      id: "octave-line",
      scoreId: octaveLine.id,
      title: "An octave line",
      changes: "The two-fret shape moved between roots in time: D, D, G, G, D, D, A.",
    },
  ],
  successCriteria: [
    "Play all four octave shapes with only the two octave notes sounding.",
    "Say why the shape is three frets wide across the B string.",
    "Play the octave line in time with each move landing on its count.",
  ],
  likelyErrors: [
    {
      id: "middle-string-rings",
      signal: "The string between the octave notes rings.",
      repair:
        "Flatten the first finger a little so its underside touches the string in between. Loop the first bar slowly until only octaves sound, then play both bars.",
      scoreId: octaveShapes.id,
      from: 0,
      to: 192,
    },
    {
      id: "wrong-across-b",
      signal: "Above the G string my octave comes out wrong.",
      repair:
        "Across the B string the upper note moves one fret further: three frets, not two. Loop the second bar slowly, checking each octave by ear, then play both bars.",
      scoreId: octaveShapes.id,
      from: 192,
      to: 384,
    },
  ],
  cueFading: [
    {
      id: "hear-the-shapes",
      phase: "learn",
      cues: "full",
      scoreId: octaveShapes.id,
      instruction: "Hear the four octaves, then play along, keeping the middle string silent.",
    },
    {
      id: "line-with-count",
      phase: "practise",
      cues: "count-only",
      scoreId: octaveLine.id,
      instruction: "Play the octave line beside the click alone, keeping the shape fixed as it moves.",
    },
    {
      id: "line-unaided",
      phase: "try-unaided",
      cues: "none",
      scoreId: octaveLine.id,
      instruction: "Count in and play the octave line with the tab hidden. Then name each root.",
    },
  ],
  retrieval: {
    afterDays: 1,
    scoreId: octaveLine.id,
    tempo: 66,
    instruction: "On another day, play the octave line from memory, then find the octave of any note you choose.",
  },
  transfer: {
    scoreId: octaveLineInA.id,
    instruction:
      "Play an octave line in A: A, A, D, D, E, E, A. The same shape, on new roots, including the open A and the open E.",
    changed: ["key", "pitch", "position"],
  },
  performance: {
    kind: "create",
    instruction: "Make a bass line of octave roots in Create under two chords of your choice.",
  },
};

/* ------------------------------------------------------------------ */
/* UNIT 9 · Root and fifth skeleton                                     */
/* ------------------------------------------------------------------ */

/** The Low Road fingerprint: muted root chugs, ♭3 and 4 accented on the "and" of 2 and of 4. */
const riffBar = (root: string, flat3: string, four: string) =>
  `e ${root}[pm] e ${root}[pm] e ${root}[pm] e ${flat3}[>] e ${root}[pm] e ${root}[pm] e ${root}[pm] e ${four}[>]`;

const powerShape = score({
  ...drafted,
  id: "power-shape-a-c-d",
  title: "One root-and-fifth shape: A5, C5, D5",
  key: "A minor",
  bars: 2,
  tempo: [56, 72, 96],
  voices: { power: { label: "Power chords", text: "h 5:0+4:2 h 5:3+4:5 | h 5:5+4:7 h 5:0+4:2" } },
});

const powerRiff = score({
  ...drafted,
  id: "power-riff-a",
  title: "The Low Road riff",
  key: "A minor",
  bars: 2,
  tempo: [66, 84, 112],
  voices: {
    riff: {
      label: "Riff",
      text: `${riffBar("5:0+4:2", "5:3+4:5", "5:5+4:7")} | ${riffBar("5:0+4:2", "5:3+4:5", "5:5+4:7")}`,
    },
  },
});

const powerShapeOnE = score({
  ...drafted,
  id: "power-shape-e-g-a",
  title: "The same shape from the low E: E5, G5, A5",
  key: "E minor",
  bars: 2,
  tempo: [56, 72, 96],
  voices: { power: { label: "Power chords", text: "h 6:0+5:2 h 6:3+5:5 | h 6:5+5:7 h 6:0+5:2" } },
  derivedFrom: { id: "power-shape-a-c-d", version: 1, changed: ["key", "position"] },
});

export const POWER_CHORD_LESSON: Lesson = {
  id: "lesson-unit-09-power-chords",
  version: 1,
  provenance: DRAFT_BY_AGENT,
  unitId: "unit-09",
  stage: 2,
  activityKind: "technique",
  checkKind: "playing",
  title: "Root and fifth, anywhere",
  purpose: "Carry one small shape, a root and the fifth above it, anywhere on the neck, and drive a riff with it.",
  destination: "The Low Road riff: palm-muted A chugs with C5 and D5 kicking on the off-beats.",
  variable: "Where the same root-and-fifth shape sits: its root moves along the A string.",
  capabilities: [
    {
      id: "fretboard.root-fifth.locate",
      action: "locating",
      title: "Place the shape on a root",
      criterion: "Put the shape on A, C and D on the A string without looking, root under the first finger.",
    },
    {
      id: "ear.fifth.hear",
      action: "listening",
      title: "Hear the fifth",
      criterion: "Hear the open, hollow sound of a root with its fifth, and tell it from a full chord.",
    },
    {
      id: "chord.power.change",
      action: "playing",
      title: "Move the shape in time",
      criterion: "Slide the shape between roots without the fingers rearranging, landing each on its count.",
    },
  ],
  scores: [powerShape, powerRiff, powerShapeOnE],
  demonstration: {
    scoreId: powerShape.id,
    handGuidance: [
      "A5 is the open A string with the D string at fret 2. For C5 and D5, put the first finger on the root on the A string and the third finger two frets higher on the D string.",
      "Keep the two fingers locked together and slide the whole shape; do not rebuild it at each root.",
      "In the riff, rest the edge of the strumming hand near the bridge for the chugs and lift it for the two accents so they ring out.",
    ],
    videoNeeded: ["muting"],
  },
  studies: [
    {
      id: "shape",
      scoreId: powerShape.id,
      title: "The shape on three roots",
      changes: "Half-note power chords on A, C and D: just the shape and its moves.",
    },
    {
      id: "riff",
      scoreId: powerRiff.id,
      title: "The riff",
      changes: "The same shapes in eighths: muted A chugs, with C5 and D5 accented on the off-beats.",
    },
  ],
  successCriteria: [
    "Play A5, C5 and D5 with the same locked shape, landing each on its count.",
    "Play two bars of the riff with the chugs muted and the two accents ringing on the “and” of 2 and of 4.",
    "Say which note in each power chord is the root and which the fifth.",
  ],
  likelyErrors: [
    {
      id: "shape-rebuilds",
      signal: "My fingers rearrange when the shape moves.",
      repair:
        "Lock the first and third fingers as one shape and slide it from C to D without lifting. Loop the first bar slowly, then the whole two bars.",
      scoreId: powerShape.id,
      from: 0,
      to: 192,
    },
    {
      id: "accents-late",
      signal: "The C5 and D5 accents come late.",
      repair:
        "Play the chugs alone and say “and” aloud where each accent belongs, then add the accents at a slower tempo. Return to the full riff.",
      scoreId: powerRiff.id,
      from: 0,
      to: 192,
    },
  ],
  cueFading: [
    {
      id: "hear-the-shape",
      phase: "learn",
      cues: "full",
      scoreId: powerShape.id,
      instruction: "Hear the three power chords, then play along with one locked shape.",
    },
    {
      id: "riff-with-count",
      phase: "practise",
      cues: "count-only",
      scoreId: powerRiff.id,
      instruction: "Play the riff beside the click alone, keeping the chugs even and the accents on the off-beats.",
    },
    {
      id: "riff-unaided",
      phase: "try-unaided",
      cues: "none",
      scoreId: powerRiff.id,
      instruction: "Count in and play the riff with the tab hidden. Then name the three roots.",
    },
  ],
  retrieval: {
    afterDays: 1,
    scoreId: powerRiff.id,
    tempo: 80,
    instruction: "On another day, play the riff from memory with both accents in place.",
  },
  transfer: {
    scoreId: powerShapeOnE.id,
    instruction:
      "Play the same shape with its root on the low E string: E5, G5, A5, E5. One string lower, the shape is unchanged.",
    changed: ["key", "position"],
  },
  performance: {
    kind: "piece",
    pieceId: "piece-low-road",
    partId: "low-road-riff",
    instruction: "Play the Low Road riff with the second guitar holding the chords under you.",
  },
};

/* ------------------------------------------------------------------ */
/* UNIT 11 · Crossing the B string                                      */
/* ------------------------------------------------------------------ */

const gbThirds = score({
  ...drafted,
  id: "gb-thirds-a-minor",
  title: "Thirds on the G and B strings",
  key: "A minor",
  bars: 2,
  tempo: [52, 66, 84],
  voices: { pairs: { label: "Double-stops", text: "h 3:5+2:5 h 3:2+2:1 | w 5:0+4:2" } },
});

const sixths = score({
  ...drafted,
  id: "gb-sixths-d",
  title: "Sixths on the G and high E strings",
  key: "D major",
  bars: 2,
  tempo: [52, 66, 84],
  voices: {
    pairs: { label: "Sixths", text: "q 3:2+1:2 q 3:4+1:3 q 3:6+1:5 q 3:7+1:7 | h 3:6+1:5 h 3:2+1:2" },
  },
});

const dgThirds = score({
  ...drafted,
  id: "dg-thirds-a-minor",
  title: "The same thirds on the D and G strings",
  key: "A minor",
  bars: 2,
  tempo: [52, 66, 84],
  voices: { pairs: { label: "Double-stops", text: "h 4:10+3:9 h 4:7+3:5 | w 5:0+4:2" } },
  derivedFrom: { id: "gb-thirds-a-minor", version: 1, changed: ["position"] },
});

export const B_STRING_LESSON: Lesson = {
  id: "lesson-unit-11-b-string",
  version: 1,
  provenance: DRAFT_BY_AGENT,
  unitId: "unit-11",
  stage: 2,
  activityKind: "technique",
  checkKind: "playing",
  title: "The B string's one-fret shift",
  purpose:
    "Play two notes at once, thirds and sixths, and know exactly how each shape bends where the B string breaks the pattern.",
  destination: "The double-stop tag that ends Low Road, and a run of sliding-ready sixths for Sunday Glide.",
  variable: "Which pair of strings carries the interval: across the B string the shape shifts by a fret.",
  capabilities: [
    {
      id: "fretboard.gb-boundary.adjust",
      action: "locating",
      title: "Adjust at the B string",
      criterion:
        "Know that on the G and B strings the same fret is a major third, and the B string one fret lower a minor third.",
    },
    {
      id: "play.double-stop.thirds",
      action: "playing",
      title: "Thirds as double-stops",
      criterion: "Play C with E, then A with C, both notes sounding equally.",
    },
    {
      id: "play.sixths.string-skip",
      action: "playing",
      title: "Sixths across a silent string",
      criterion: "Play the four sixths on the G and high E strings with the B string silent between them.",
    },
  ],
  scores: [gbThirds, sixths, dgThirds],
  demonstration: {
    scoreId: gbThirds.id,
    handGuidance: [
      "C with E: G string fret 5 and B string fret 5, barred with one finger or with two fingers side by side. Same fret on G and B is a major third.",
      "A with C: G string fret 2 and B string fret 1. The B string note is one fret lower, which makes the third minor.",
      "For the sixths, pluck the G and high E strings together, with the finger on the G string leaning slightly onto the B string so it cannot ring.",
    ],
    videoNeeded: ["muting"],
  },
  studies: [
    {
      id: "thirds",
      scoreId: gbThirds.id,
      title: "Thirds on G and B",
      changes: "A major third, then a minor third, then the A5 that ends the Low Road tag.",
    },
    {
      id: "sixths",
      scoreId: sixths.id,
      title: "Sixths on G and high E",
      changes: "Wider intervals across a skipped string, moving up and back down the key of D.",
    },
  ],
  successCriteria: [
    "Play both thirds with the two notes sounding together and evenly.",
    "Say why the minor third has the B-string note one fret lower.",
    "Play the four sixths with the B string silent.",
  ],
  likelyErrors: [
    {
      id: "third-wrong-quality",
      signal: "My minor third sounds major, or the other way round.",
      repair:
        "Check the rule: on the G and B strings, the same fret is a major third; the B string one fret lower is a minor third. Play each pair slowly and sing the lower note, then the upper. Return to both bars.",
      scoreId: gbThirds.id,
      from: 0,
      to: 192,
    },
    {
      id: "b-string-rings",
      signal: "The B string rings inside my sixths.",
      repair:
        "Let the finger on the G string lean just enough to touch the B string. Loop the first bar slowly until the B string is silent, then play both bars.",
      scoreId: sixths.id,
      from: 0,
      to: 192,
    },
  ],
  cueFading: [
    {
      id: "hear-the-thirds",
      phase: "learn",
      cues: "full",
      scoreId: gbThirds.id,
      instruction: "Hear the two thirds and the A5, then play along, listening for the major-to-minor change.",
    },
    {
      id: "sixths-with-count",
      phase: "practise",
      cues: "count-only",
      scoreId: sixths.id,
      instruction: "Play the sixths beside the click alone, keeping the B string silent.",
    },
    {
      id: "thirds-unaided",
      phase: "try-unaided",
      cues: "none",
      scoreId: gbThirds.id,
      instruction: "Count in and play the thirds and A5 with the tab hidden. Then say which third was minor.",
    },
  ],
  retrieval: {
    afterDays: 1,
    scoreId: gbThirds.id,
    tempo: 66,
    instruction: "On another day, play the two thirds from memory and explain the one-fret rule.",
  },
  transfer: {
    scoreId: dgThirds.id,
    instruction:
      "Play the same two thirds, C with E and A with C, on the D and G strings. They sound identical, but without the B string the shapes change: work out the new fret for each.",
    changed: ["position"],
  },
  performance: {
    kind: "piece",
    pieceId: "piece-low-road",
    partId: "low-road-whole-a",
    instruction: "Play Low Road in A, which ends with exactly this double-stop tag.",
  },
};

/* ------------------------------------------------------------------ */
/* UNIT 12 · Transpose without losing meaning                           */
/* ------------------------------------------------------------------ */

const riffInA = score({
  ...drafted,
  id: "transpose-riff-a",
  title: "The riff in A",
  key: "A minor",
  bars: 2,
  tempo: [66, 84, 104],
  voices: {
    riff: {
      label: "Riff",
      text: `${riffBar("5:0+4:2", "5:3+4:5", "5:5+4:7")} | ${riffBar("5:0+4:2", "5:3+4:5", "5:5+4:7")}`,
    },
  },
});

const riffFromE = score({
  ...drafted,
  id: "transpose-riff-e",
  title: "The riff from the low E",
  key: "E minor",
  bars: 2,
  tempo: [66, 84, 104],
  voices: {
    riff: {
      label: "Riff",
      text: `${riffBar("6:0+5:2", "6:3+5:5", "6:5+5:7")} | ${riffBar("6:0+5:2", "6:3+5:5", "6:5+5:7")}`,
    },
  },
  derivedFrom: { id: "transpose-riff-a", version: 1, changed: ["key", "position"] },
});

const riffFromD = score({
  ...drafted,
  id: "transpose-riff-d",
  title: "The riff from the open D",
  key: "D minor",
  bars: 2,
  tempo: [66, 84, 104],
  voices: {
    riff: {
      label: "Riff",
      text: `${riffBar("4:0+3:2", "4:3+3:5", "4:5+3:7")} | ${riffBar("4:0+3:2", "4:3+3:5", "4:5+3:7")}`,
    },
  },
  derivedFrom: { id: "transpose-riff-a", version: 1, changed: ["key", "position"] },
});

export const TRANSPOSE_LESSON: Lesson = {
  id: "lesson-unit-12-transpose",
  version: 1,
  provenance: DRAFT_BY_AGENT,
  unitId: "unit-12",
  stage: 2,
  activityKind: "technique",
  checkKind: "playing",
  title: "Move the riff, keep the meaning",
  purpose:
    "Take a riff to a new key and have it still be the same riff, because every interval and accent travels with it.",
  destination: "The Low Road riff from A, then from the low E, with the same off-beat kick in both.",
  variable: "The root the whole riff is built on.",
  capabilities: [
    {
      id: "fretboard.transpose.new-root",
      action: "locating",
      title: "Find the new root",
      criterion: "Find the new root first, then place the shape on it with the fifth on the next string.",
    },
    {
      id: "ear.same-riff.new-key",
      action: "listening",
      title: "Hear the same riff",
      criterion: "Hear that the riff in E is the same riff as in A, only lower.",
    },
    {
      id: "play.riff.transposed",
      action: "playing",
      title: "Play it in the new key",
      criterion: "Play the riff from E with the chugs muted and the accents on the “and” of 2 and of 4.",
    },
  ],
  scores: [riffInA, riffFromE, riffFromD],
  demonstration: {
    scoreId: riffInA.id,
    handGuidance: [
      "In A the root is the open A string; in E it is the open low E. Everything else moves with it: the ♭3 accent is three frets above the root, the 4 accent five frets above.",
      "Keep the same locked root-and-fifth shape from Unit 9; only the string it starts on changes.",
      "The riff's fingerprint is its rhythm: muted chugs on the root, the two accents on the off-beats. Keep that exactly.",
    ],
    videoNeeded: ["muting"],
  },
  studies: [
    {
      id: "in-a",
      scoreId: riffInA.id,
      title: "The riff in A",
      changes: "The riff where you learned it, from the open A.",
    },
    {
      id: "from-e",
      scoreId: riffFromE.id,
      title: "The riff from E",
      changes: "Every note a fourth lower, built on the open low E.",
    },
  ],
  successCriteria: [
    "Play the riff in A and then from E without the tab, keeping the accents on the off-beats.",
    "Name the three roots in each key: A, C, D and E, G, A.",
    "Say what stayed the same and what moved when the riff changed key.",
  ],
  likelyErrors: [
    {
      id: "fingerprint-lost",
      signal: "In the new key the accents drift off the off-beats.",
      repair:
        "Play only the open-string chugs from E, saying “1 & 2 & 3 & 4 &”, and put the accents back on the “&” after 2 and after 4. Loop one bar, then return to both.",
      scoreId: riffFromE.id,
      from: 0,
      to: 192,
    },
    {
      id: "wrong-string",
      signal: "I start the shape on the wrong string.",
      repair:
        "Name the new root and find it first: E is the open low E string. Put the shape's root on it, check the fifth on the next string, then play one bar slowly before both.",
      scoreId: riffFromE.id,
      from: 0,
      to: 192,
    },
  ],
  cueFading: [
    {
      id: "hear-both-keys",
      phase: "learn",
      cues: "full",
      scoreId: riffInA.id,
      instruction: "Hear the riff in A, then play along; listen for the off-beat kick you will carry to E.",
    },
    {
      id: "e-with-count",
      phase: "practise",
      cues: "count-only",
      scoreId: riffFromE.id,
      instruction: "Play the riff from E beside the click alone.",
    },
    {
      id: "e-unaided",
      phase: "try-unaided",
      cues: "none",
      scoreId: riffFromE.id,
      instruction: "Count in and play the riff from E with the tab hidden. Then name its three roots.",
    },
  ],
  retrieval: {
    afterDays: 1,
    scoreId: riffFromE.id,
    tempo: 80,
    instruction: "On another day, play the riff from E from memory, then from A.",
  },
  transfer: {
    scoreId: riffFromD.id,
    instruction:
      "Build the riff on the open D string: D5, with F5 and G5 as the accents. The D and G strings are tuned like the E and A strings, so the shape is unchanged.",
    changed: ["key", "position"],
  },
  performance: {
    kind: "piece",
    pieceId: "piece-low-road",
    partId: "low-road-whole-e",
    instruction: "Play the whole of Low Road from E, the second half of the Stage 2 capstone.",
  },
};

export const LESSONS: readonly Lesson[] = [
  COMPASS_LESSON,
  OCTAVES_LESSON,
  POWER_CHORD_LESSON,
  THIRD_COLOUR_LESSON,
  B_STRING_LESSON,
  TRANSPOSE_LESSON,
];
