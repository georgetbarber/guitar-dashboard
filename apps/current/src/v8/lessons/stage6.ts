/**
 * STAGE 6 · FUNCTIONAL AND MODAL HARMONY — authored lessons.
 *
 * Units 31–36 follow docs/CURRICULUM_MAP.md §3 (Batch 3). All agent-drafted;
 * nobody has played them on a guitar yet. Their music feeds Porch Light's
 * bass walks (Unit 31), Glasshouse (32, 35), Front Step's shuffle chords (33),
 * Two Rivers (34) and Sunday Glide's slide-ins (36).
 */
import { score } from "../../core/score/build";
import {
  BOOGIE,
  GLASS_CHORDS,
  GLASS_MELODY,
  NIGHT_PARTIALS,
  PORCH_WALK_THUMB,
  RIVERS_CHORDS,
  RIVERS_DORIAN_MELODY,
  RIVERS_MIXO_MELODY,
  SEVENTHS,
  TOP_STRING_D_G,
  fingersOffBeats,
  glassStrum,
  nightSlideBar,
  riversStrum,
  sevenths,
  sixteenthGroove,
  sundaySlideBar,
} from "../pieces/library";
import { DRAFT_BY_AGENT } from "../provenance";
import type { Lesson } from "./format";

const drafted = { version: 1, provenance: DRAFT_BY_AGENT, metre: "4/4" } as const;

/* ------------------------------------------------------------------ */
/* UNIT 31 · Departure, tension, return                                 */
/* ------------------------------------------------------------------ */

const I_IV_V_I = (one: string, four: string, five: string) =>
  [
    [1, 1, one, "I"],
    [2, 1, four, "IV"],
    [3, 1, five, "V"],
    [4, 1, one, "I"],
  ] as const;

const walksG = score({
  ...drafted,
  id: "walks-g-c-d-g",
  title: "I, IV, V, I in G with the bass walking",
  key: "G major",
  bars: 4,
  tempo: [56, 66, 84],
  voices: {
    fingers: { label: "Fingers", text: (["G", "C", "D", "G"] as const).map(fingersOffBeats).join(" | ") },
    thumb: {
      label: "Thumb",
      text: [PORCH_WALK_THUMB.G, PORCH_WALK_THUMB.C, PORCH_WALK_THUMB.D, PORCH_WALK_THUMB.home].join(" | "),
    },
  },
  harmony: I_IV_V_I("G", "C", "D"),
});

const walksThumb = score({
  ...drafted,
  id: "walks-thumb-only",
  title: "The thumb alone: roots and walks",
  key: "G major",
  bars: 4,
  tempo: [56, 66, 84],
  voices: {
    thumb: {
      label: "Thumb",
      text: [PORCH_WALK_THUMB.G, PORCH_WALK_THUMB.C, PORCH_WALK_THUMB.D, PORCH_WALK_THUMB.home].join(" | "),
    },
  },
  harmony: I_IV_V_I("G", "C", "D"),
});

/** In A: A, D and E, the course's first open A and E chords; per chord the index and middle strings. */
const IN_A_FINGERS = {
  A: ["3:2", "2:2"],
  D: ["2:3", "1:2"],
  E: ["3:1", "2:0"],
} as const;
const fingersInA = (chord: keyof typeof IN_A_FINGERS) => {
  const [i, m] = IN_A_FINGERS[chord];
  return `e r e ${i}@i e r e ${m}@m e r e ${i}@i e r e ${m}@m`;
};
const walksA = score({
  ...drafted,
  id: "walks-a-d-e-a",
  title: "The same walks in A: A, D, E, A",
  key: "A major",
  bars: 4,
  tempo: [56, 66, 84],
  voices: {
    fingers: { label: "Fingers", text: (["A", "D", "E", "A"] as const).map(fingersInA).join(" | ") },
    thumb: {
      label: "Thumb",
      text: [
        "q 5:0@p q 4:2@p q 5:2@p q 5:4@p",
        "q 4:0@p q 3:2@p q 4:0@p q 3:2@p",
        "q 4:2@p q 4:0@p q 5:4@p q 5:2@p",
        "q 5:0@p q 4:2@p h 5:0@p",
      ].join(" | "),
    },
  },
  harmony: I_IV_V_I("A", "D", "E"),
  derivedFrom: { id: "walks-g-c-d-g", version: 1, changed: ["key", "position"] },
});

export const WALKS_LESSON: Lesson = {
  id: "lesson-unit-31-walks",
  version: 1,
  provenance: DRAFT_BY_AGENT,
  unitId: "unit-31",
  stage: 6,
  activityKind: "technique",
  checkKind: "playing",
  title: "Walk the bass home",
  purpose: "Hear chords as home, away and the pull back, and let the thumb walk from one to the next.",
  destination:
    "I, IV, V and I in G with the thumb walking up to IV and down home from V, the fingers keeping their off-beats.",
  variable: "Where the thumb goes between roots: straight to the next, or walking there.",
  capabilities: [
    {
      id: "ear.function.hear",
      action: "listening",
      title: "Hear home and away",
      criterion: "Hear IV lift away from home and V pull back towards it.",
    },
    {
      id: "harmony.roman.i-iv-v.name",
      action: "naming",
      title: "Name I, IV and V",
      criterion: "Say I, IV or V for each bar in G and in A.",
    },
    {
      id: "play.bass-walk.connect",
      action: "playing",
      title: "Walk the bass",
      criterion:
        "Walk the thumb up from G to C and down from D to G in time, with the fingers still on their off-beats.",
    },
  ],
  scores: [walksG, walksThumb, walksA],
  demonstration: {
    scoreId: walksG.id,
    handGuidance: [
      "I, IV and V in G are G, C and D: home, away, and the chord that wants to come home. The thumb plays each root on count 1.",
      "Walking up to IV: after G and D on counts 1 and 2, the thumb plays A (open A string) and B (A string fret 2) on 3 and 4 and arrives on C at fret 3. Walking home from V: D, then C, B and A on the A string, arriving on G.",
      "The fingers keep their off-beats through the walks: index on the G string, middle on the B string (for D, the B and high E strings).",
    ],
    videoNeeded: ["fingerpicking hand"],
  },
  studies: [
    {
      id: "thumb",
      scoreId: walksThumb.id,
      title: "The thumb alone",
      changes: "Only the bass: the roots and the two walks.",
    },
    {
      id: "walks",
      scoreId: walksG.id,
      title: "Thumb and fingers",
      changes: "The same bass with the index and middle fingers on every “and”.",
    },
  ],
  successCriteria: [
    "Play the four bars with the walks in time and the fingers still on the off-beats.",
    "Name each bar I, IV or V.",
    "Hear the walk from D lead the ear home before G arrives.",
  ],
  likelyErrors: [
    {
      id: "walk-rushes",
      signal: "The walk rushes into the next chord.",
      repair:
        "Play the thumb alone and say the counts, “3, 4, ONE”, landing on C exactly on ONE. Loop bar 1, then all four.",
      scoreId: walksThumb.id,
      from: 0,
      to: 192,
    },
    {
      id: "fingers-stop",
      signal: "My fingers stop while the thumb walks.",
      repair:
        "Slow right down and play bar 3 with the fingers only, then add the thumb's walk under them one note at a time. Loop bar 3, then all four.",
      scoreId: walksG.id,
      from: 384,
      to: 576,
    },
  ],
  cueFading: [
    {
      id: "hear-the-walks",
      phase: "learn",
      cues: "full",
      scoreId: walksG.id,
      instruction: "Hear the four bars and say I, IV, V, I as each arrives; then play along.",
    },
    {
      id: "thumb-with-count",
      phase: "practise",
      cues: "count-only",
      scoreId: walksThumb.id,
      instruction: "Play the thumb's roots and walks beside the click alone.",
    },
    {
      id: "walks-unaided",
      phase: "try-unaided",
      cues: "none",
      scoreId: walksG.id,
      instruction: "Count in and play the four bars with the tab hidden; name the chord of each bar.",
    },
  ],
  retrieval: {
    afterDays: 1,
    scoreId: walksG.id,
    tempo: 66,
    instruction: "On another day, play the walks from memory and name each chord I, IV or V.",
  },
  transfer: {
    scoreId: walksA.id,
    instruction:
      "In A: A (x02220), D (xx0232) and E (022100), the course's first open A and E. The thumb walks A, E, B, C♯ up to D, and E, D, C♯, B down home to A.",
    changed: ["key", "position"],
  },
  performance: {
    kind: "piece",
    pieceId: "piece-porch-light",
    partId: "porch-light-walks",
    instruction: "Play Porch Light's bass walks: the thumb walks while the fingers keep the off-beats.",
  },
};

/* ------------------------------------------------------------------ */
/* UNIT 32 · Loops tell different stories                               */
/* ------------------------------------------------------------------ */

const LOOP_SHAPES = {
  G: { symbol: "G", shape: "355433", fingers: "134211", barre: [3, 1, 6, 1] as const },
  Em: { symbol: "Em", shape: "022000", fingers: "-23---" },
  C: GLASS_CHORDS.C,
  D: { symbol: "D", shape: "x57775", fingers: "x12341", barre: [5, 1, 5, 1] as const },
};
const loopStrum = (chord: string) => `q D:${chord} e D:${chord} e U:${chord} h D:${chord}`;

const loopG = score({
  ...drafted,
  id: "loop-g-em-c-d",
  title: "The soul loop: I, vi, IV, V",
  key: "G major",
  bars: 4,
  tempo: [56, 66, 80],
  voicings: LOOP_SHAPES,
  voices: { chords: { label: "Chords", text: ["G", "Em", "C", "D"].map(loopStrum).join(" | ") } },
  harmony: [
    [1, 1, "G", "I"],
    [2, 1, "Em", "vi"],
    [3, 1, "C", "IV"],
    [4, 1, "D", "V"],
  ],
});

const loopRotated = score({
  ...drafted,
  id: "loop-em-c-d-g",
  title: "The same loop from vi: vi, IV, V, I",
  key: "G major",
  bars: 4,
  tempo: [56, 66, 80],
  voicings: LOOP_SHAPES,
  voices: { chords: { label: "Chords", text: ["Em", "C", "D", "G"].map(loopStrum).join(" | ") } },
  harmony: [
    [1, 1, "Em", "vi"],
    [2, 1, "C", "IV"],
    [3, 1, "D", "V"],
    [4, 1, "G", "I"],
  ],
});

const buildE = score({
  ...drafted,
  id: "barre-from-power-chord",
  title: "From power chord to E-shape barre",
  key: "G major",
  bars: 4,
  tempo: [56, 66, 80],
  voicings: { G: LOOP_SHAPES.G },
  voices: { chords: { label: "Chords", text: "w 6:3+5:5 | w 6:3+5:5+4:5 | w 6:3+5:5+4:5+3:4 | w D:G" } },
  sections: [
    ["power", "Root and fifth", 1, 1],
    ["octave", "Add the octave", 2, 2],
    ["third", "Add the third", 3, 3],
    ["barre", "The whole barre", 4, 4],
  ],
});

const buildA = score({
  ...drafted,
  id: "barre-from-open-a",
  title: "From open A to the A-shape barre",
  key: "C major",
  bars: 4,
  tempo: [56, 66, 80],
  voicings: { A: RIVERS_CHORDS.A, C: GLASS_CHORDS.C },
  voices: {
    chords: { label: "Chords", text: ["A", "C", "A", "C"].map((chord) => `h D:${chord} h D:${chord}`).join(" | ") },
  },
});

const loopA = score({
  ...drafted,
  id: "loop-a-fsm-d-e",
  title: "The loop in A, all barres",
  key: "A major",
  bars: 4,
  tempo: [56, 66, 80],
  voicings: {
    A: { symbol: "A", shape: "577655", fingers: "134211", barre: [5, 1, 6, 1] as const },
    "F#m": { symbol: "F#m", shape: "244222", fingers: "134111", barre: [2, 1, 6, 1] as const },
    D: LOOP_SHAPES.D,
    E: { symbol: "E", shape: "x79997", fingers: "x12341", barre: [7, 1, 5, 1] as const },
  },
  voices: { chords: { label: "Chords", text: ["A", "F#m", "D", "E"].map(loopStrum).join(" | ") } },
  harmony: [
    [1, 1, "A", "I"],
    [2, 1, "F#m", "vi"],
    [3, 1, "D", "IV"],
    [4, 1, "E", "V"],
  ],
  derivedFrom: { id: "loop-g-em-c-d", version: 1, changed: ["key", "position"] },
});

export const BARRES_LESSON: Lesson = {
  id: "lesson-unit-32-barres",
  version: 1,
  provenance: DRAFT_BY_AGENT,
  unitId: "unit-32",
  stage: 6,
  activityKind: "technique",
  checkKind: "playing",
  title: "Barres that carry a loop anywhere",
  purpose: "Build two movable chord shapes from things you already know, so any loop can move to any key.",
  destination:
    "The soul loop I–vi–IV–V in G with E-shape and A-shape barres, then the same four chords starting from vi.",
  variable: "Where the loop starts: on I, or on vi.",
  capabilities: [
    {
      id: "chord.barre.e-shape",
      action: "playing",
      title: "The E-shape barre",
      criterion:
        "Build G at the 3rd fret from the power chord, its octave and its third, with all six strings ringing.",
    },
    {
      id: "chord.barre.a-shape",
      action: "playing",
      title: "The A-shape barre",
      criterion: "Play C and D as A-shape barres at the 3rd and 5th frets, with the low E string silent.",
    },
    {
      id: "ear.loop.start-point",
      action: "listening",
      title: "Hear where a loop starts",
      criterion: "Hear whether a loop starts at home (I) or away (vi) and where it arrives.",
    },
  ],
  scores: [loopG, buildE, buildA, loopRotated, loopA],
  demonstration: {
    scoreId: loopG.id,
    handGuidance: [
      "The E-shape: the Unit 9 power chord (G5, low E fret 3 and A string fret 5), plus its octave (D string fret 5), plus its third (G string fret 4). Lay the first finger across all six strings at fret 3 and you have G: the open E chord moved up.",
      "The A-shape: open A (x02220) moved up with the first finger as the nut. C is x35553 at the 3rd fret, D is x57775 at the 5th. The low E string stays silent under the tip of the first finger.",
      "I–vi–IV–V starts at home and leaves; vi–IV–V–I is the same four chords starting away and arriving home. Listen for where the loop seems to begin.",
    ],
    videoNeeded: ["fretting hand"],
  },
  studies: [
    {
      id: "e-shape",
      scoreId: buildE.id,
      title: "Build the E-shape",
      changes: "G5, then its octave, then its third, then the whole barre: a bar each.",
    },
    {
      id: "a-shape",
      scoreId: buildA.id,
      title: "Move the A shape",
      changes: "Open A, then the same shape three frets up as C, with the first finger barring.",
    },
    {
      id: "rotated",
      scoreId: loopRotated.id,
      title: "The loop from vi",
      changes: "Em, C, D, G: the same chords, starting away and arriving home.",
    },
  ],
  successCriteria: [
    "Play G, C and D as barres with every string that should ring ringing.",
    "Play the loop in time with each change on count 1.",
    "Say whether a loop starts at home or away.",
  ],
  likelyErrors: [
    {
      id: "barre-buzzes",
      signal: "Some strings of the barre buzz or are dead.",
      repair:
        "Roll the first finger slightly onto its bony side, keep it just behind the fret, and drop the thumb lower behind the neck; pick each string to find the dead one. Loop the barre bar, then the whole study.",
      scoreId: buildE.id,
      from: 576,
      to: 768,
    },
    {
      id: "change-late",
      signal: "The barre arrives after count 1.",
      repair:
        "Start moving on count 4: the last strum of the bar can ring open while the hand travels. Loop bars 2 and 3, then all four.",
      scoreId: loopG.id,
      from: 192,
      to: 576,
    },
  ],
  cueFading: [
    {
      id: "hear-the-loop",
      phase: "learn",
      cues: "full",
      scoreId: loopG.id,
      instruction: "Hear the loop, then play along, building each barre from the study first if it does not ring.",
    },
    {
      id: "rotated-with-count",
      phase: "practise",
      cues: "count-only",
      scoreId: loopRotated.id,
      instruction: "Play the loop from vi beside the click alone, and hear it arrive home in bar 4.",
    },
    {
      id: "loop-unaided",
      phase: "try-unaided",
      cues: "none",
      scoreId: loopG.id,
      instruction: "Count in and play the loop from I with the tab hidden.",
    },
  ],
  retrieval: {
    afterDays: 1,
    scoreId: loopG.id,
    tempo: 66,
    instruction: "On another day, build each barre from memory and play the loop.",
  },
  transfer: {
    scoreId: loopA.id,
    instruction:
      "Move the loop to A with the same two shapes: A (E-shape, 5th fret), F♯m (E-shape minor, 2nd fret), D (A-shape, 5th fret), E (A-shape, 7th fret).",
    changed: ["key", "position"],
  },
  performance: {
    kind: "piece",
    pieceId: "piece-glasshouse",
    partId: "glasshouse-chords",
    instruction:
      "Play Glasshouse's chords: C and Em are this unit's A-shape barres; F and Fm are small shapes you can read from the tab, explained in Unit 35.",
  },
};

/* ------------------------------------------------------------------ */
/* UNIT 33 · Blues bends the categories                                 */
/* ------------------------------------------------------------------ */

const shuffle = { ...drafted, feel: "shuffle-8" } as const;
const LINE_1 = ["E7", "A7", "E7", "E7"] as const;
const LINE_3 = ["B7", "A7", "E7", "B7"] as const;
const roman = (chord: string) => (chord === "E7" ? "I7" : chord === "A7" ? "IV7" : "V7");
const linesHarmony = (line: readonly string[]) =>
  line.map((chord, index) => [index + 1, 1, chord, roman(chord)] as const);

const seventhsLine1 = score({
  ...shuffle,
  id: "sevenths-line-1",
  title: "E7, A7, E7, E7: the quick change",
  key: "E major",
  bars: 4,
  tempo: [60, 72, 100],
  voicings: { E7: SEVENTHS.E7, A7: SEVENTHS.A7 },
  voices: { chords: { label: "Chords", text: LINE_1.map(sevenths).join(" | ") } },
  harmony: linesHarmony(LINE_1),
});

const seventhsLine3 = score({
  ...shuffle,
  id: "sevenths-line-3",
  title: "B7, A7, E7, B7: the turnaround",
  key: "E major",
  bars: 4,
  tempo: [60, 72, 100],
  voicings: SEVENTHS,
  voices: { chords: { label: "Chords", text: LINE_3.map(sevenths).join(" | ") } },
  harmony: linesHarmony(LINE_3),
});

const seventhsBoogie = score({
  ...shuffle,
  id: "sevenths-boogie-band",
  title: "The second guitar's boogie, line 1",
  key: "E major",
  bars: 4,
  tempo: [56, 72, 104],
  voices: { boogie: { label: "Second guitar", text: LINE_1.map((chord) => BOOGIE[chord]).join(" | ") } },
});

const seventhsBoogie3 = score({
  ...shuffle,
  id: "sevenths-boogie-band-3",
  title: "The second guitar's boogie, line 3",
  key: "E major",
  bars: 4,
  tempo: [56, 72, 104],
  voices: { boogie: { label: "Second guitar", text: LINE_3.map((chord) => BOOGIE[chord]).join(" | ") } },
  exceptions: [{ rule: "fret-span", reason: "The second guitar's B6 is the boogie's standard fourth-finger stretch." }],
});

const majorMinorLicks = score({
  ...shuffle,
  id: "major-minor-licks",
  title: "Major pentatonic over E7, minor over A7",
  key: "E major",
  bars: 4,
  tempo: [60, 72, 96],
  voices: {
    lead: {
      label: "Your part",
      text: "q 4:2 e 4:4 e 3:1 h 2:0 | q 2:3{D} e 2:0 e 3:2 h 3:0{G} | q 4:2 q 1:3{G}[b.5] h 1:0 | w 4:2[~]",
    },
  },
  harmony: linesHarmony(LINE_1),
});

const licksBand = score({
  ...shuffle,
  id: "licks-sevenths-band",
  title: "The second guitar's sevenths",
  key: "E major",
  bars: 4,
  tempo: [56, 72, 104],
  voicings: { E7: SEVENTHS.E7, A7: SEVENTHS.A7 },
  voices: { chords: { label: "Second guitar", text: LINE_1.map(sevenths).join(" | ") } },
});

const seventhsInA = score({
  ...shuffle,
  id: "sevenths-in-a",
  title: "The quick change in A: A7, D7, A7, A7",
  key: "A major",
  bars: 4,
  tempo: [60, 72, 100],
  voicings: { A7: SEVENTHS.A7, D7: { symbol: "D7", shape: "xx0212", fingers: "xx-213" } },
  voices: { chords: { label: "Chords", text: ["A7", "D7", "A7", "A7"].map(sevenths).join(" | ") } },
  harmony: [
    [1, 1, "A7", "I7"],
    [2, 1, "D7", "IV7"],
    [3, 1, "A7", "I7"],
  ],
  derivedFrom: { id: "sevenths-line-1", version: 1, changed: ["key", "harmony"] },
});

export const SEVENTHS_LESSON: Lesson = {
  id: "lesson-unit-33-sevenths",
  version: 1,
  provenance: DRAFT_BY_AGENT,
  unitId: "unit-33",
  stage: 6,
  activityKind: "technique",
  checkKind: "playing",
  title: "Blues sevenths, major and minor",
  purpose:
    "Hear why the blues sounds both happy and sad: dominant sevenths under you, major and minor pentatonic over them.",
  destination:
    "Front Step's shuffle chords, E7, A7 and B7 with the quick change and the turnaround, and licks that move from major to minor.",
  variable: "Which pentatonic you play over which chord: major over E7, minor over A7.",
  capabilities: [
    {
      id: "chord.dominant7.open",
      action: "playing",
      title: "E7, A7 and B7",
      criterion: "Play E7, A7 and B7 in open position, changing on count 1 in shuffle.",
    },
    {
      id: "ear.major-minor-blues.hear",
      action: "listening",
      title: "Hear major and minor in the blues",
      criterion: "Hear the sweet major pentatonic over E7 and the bluer minor over A7, and the curl where they meet.",
    },
    {
      id: "play.pentatonic.major-over-i7",
      action: "playing",
      title: "Major over I7",
      criterion: "Play E, F♯, G♯ and B over E7, then the minor lick over A7, in time.",
    },
  ],
  scores: [seventhsLine1, seventhsLine3, majorMinorLicks, seventhsInA, seventhsBoogie, seventhsBoogie3, licksBand],
  accompaniment: {
    [seventhsLine1.id]: [seventhsBoogie.id],
    [seventhsLine3.id]: [seventhsBoogie3.id],
    [majorMinorLicks.id]: [licksBand.id],
  },
  demonstration: {
    scoreId: seventhsLine1.id,
    handGuidance: [
      "E7 is the open E with the D string left open: 020100. A7 is open A with the G string left open: x02020. B7 is x21202: second finger on the A string at fret 2, first on the D string at fret 1, third on the G string at fret 2, fourth on the high E at fret 2.",
      "The quick change puts A7 in bar 2 and comes straight back to E7. The turnaround puts B7 in bar 12, so the form goes round again.",
      "Over E7 the major pentatonic, E, F♯, G♯, B and C♯, sounds sweet; over A7 the minor pentatonic's G is A7's ♭7 and sounds right. Where they meet, curl the G toward G♯.",
    ],
    videoNeeded: ["bends", "vibrato"],
  },
  studies: [
    {
      id: "line-1",
      scoreId: seventhsLine1.id,
      title: "Line 1 with the quick change",
      changes: "E7, A7, E7, E7 over the second guitar's boogie.",
    },
    {
      id: "line-3",
      scoreId: seventhsLine3.id,
      title: "Line 3 with the turnaround",
      changes: "B7, A7, E7, B7: the last line, ending on the turnaround.",
    },
    {
      id: "licks",
      scoreId: majorMinorLicks.id,
      title: "Major, then minor",
      changes: "A major-pentatonic lick over E7, a minor one over A7, then the curl.",
    },
  ],
  successCriteria: [
    "Play line 1 and line 3 in shuffle, every change on count 1.",
    "Play the major lick over E7 and the minor lick over A7, and hear the difference.",
    "Curl the G toward G♯ over E7 without a full bend.",
  ],
  likelyErrors: [
    {
      id: "b7-late",
      signal: "B7 arrives late.",
      repair:
        "Place B7's second finger first, on the A string, and let the rest follow; use beat 4's rest to move. Loop bar 1 of line 3, then the whole line.",
      scoreId: seventhsLine3.id,
      from: 0,
      to: 192,
    },
    {
      id: "licks-same",
      signal: "The major and minor licks sound the same to me.",
      repair:
        "Play only G♯ over E7, then only G over A7, and hear the third change colour. Loop bars 1 and 2, then all four.",
      scoreId: majorMinorLicks.id,
      from: 0,
      to: 384,
    },
  ],
  cueFading: [
    {
      id: "hear-line-1",
      phase: "learn",
      cues: "full",
      scoreId: seventhsLine1.id,
      instruction: "Hear line 1 with the boogie, then play along.",
    },
    {
      id: "line-3-with-count",
      phase: "practise",
      cues: "count-only",
      scoreId: seventhsLine3.id,
      instruction: "Play line 3 beside the click and the boogie, landing B7 on count 1.",
    },
    {
      id: "line-1-unaided",
      phase: "try-unaided",
      cues: "none",
      scoreId: seventhsLine1.id,
      instruction: "Count in and play line 1 with the tab hidden.",
    },
  ],
  retrieval: {
    afterDays: 1,
    scoreId: seventhsLine1.id,
    tempo: 72,
    instruction: "On another day, play line 1 and line 3 from memory.",
  },
  transfer: {
    scoreId: seventhsInA.id,
    instruction:
      "Play the quick change in A: A7 (x02020), D7 (xx0212), back to A7. The form is the same; I and IV moved.",
    changed: ["key", "harmony"],
  },
  performance: {
    kind: "piece",
    pieceId: "piece-front-step",
    partId: "front-step-sevenths",
    instruction: "Play Front Step's whole shuffle in sevenths, with the boogie under you.",
  },
};

/* ------------------------------------------------------------------ */
/* UNIT 34 · Modes keep a different light                               */
/* ------------------------------------------------------------------ */

const mixo = { ...drafted, key: "A mixolydian", bars: 4, tempo: [66, 76, 92] } as const;
const dorian = { ...drafted, key: "A dorian", feel: "swing-16", bars: 4, tempo: [66, 76, 92] } as const;

const modesMixoMelody = score({
  ...mixo,
  id: "modes-mixolydian-melody",
  title: "The Mixolydian melody",
  voices: { melody: { label: "Your part", text: RIVERS_MIXO_MELODY.join(" | ") } },
});
const modesMixoChords = score({
  ...mixo,
  id: "modes-mixolydian-chords",
  title: "A and G",
  voicings: { A: RIVERS_CHORDS.A, G: RIVERS_CHORDS.G },
  voices: { chords: { label: "Second guitar", text: ["A", "G", "A", "G"].map(riversStrum).join(" | ") } },
});
const modesDorianMelody = score({
  ...dorian,
  id: "modes-dorian-melody",
  title: "The Dorian melody",
  voices: { melody: { label: "Your part", text: RIVERS_DORIAN_MELODY.join(" | ") } },
});
const modesDorianChords = score({
  ...dorian,
  id: "modes-dorian-chords",
  title: "Am7 and D",
  voicings: { Am7: RIVERS_CHORDS.Am7, D: RIVERS_CHORDS.D },
  voices: { chords: { label: "Second guitar", text: ["Am7", "D", "Am7", "D"].map(sixteenthGroove).join(" | ") } },
});

const OPEN = {
  D: { symbol: "D", shape: "xx0232", fingers: "xx-132" },
  C: { symbol: "C", shape: "x32010", fingers: "x32-1-" },
  Em: { symbol: "Em", shape: "022000", fingers: "-23---" },
  A: RIVERS_CHORDS.A,
  G: RIVERS_CHORDS.G,
  F: GLASS_CHORDS.F,
  Dm: { symbol: "Dm", shape: "xx0231", fingers: "xx-231" },
};
type ModeKey = "D mixolydian" | "E dorian" | "G mixolydian" | "D dorian" | "C major";
/** A listening example: a melody that leans on the mode's own note, and two chords a bar each under it. */
const modeExample = (
  number: number,
  key: ModeKey,
  chords: readonly [keyof typeof OPEN, keyof typeof OPEN],
  melody: readonly [string, string],
) => {
  const example = score({
    ...drafted,
    id: `mode-example-${number}`,
    title: `Example ${number}`,
    key,
    bars: 4,
    tempo: [66, 76, 92],
    voices: { melody: { label: "Melody", text: [melody[0], melody[1], melody[0], melody[1]].join(" | ") } },
  });
  const backing = score({
    ...drafted,
    id: `mode-example-${number}-chords`,
    title: `Example ${number}: chords`,
    key,
    bars: 4,
    tempo: [66, 76, 92],
    voicings: { [chords[0]]: OPEN[chords[0]], [chords[1]]: OPEN[chords[1]] },
    voices: {
      chords: {
        label: "Chords",
        text: [chords[0], chords[1], chords[0], chords[1]].map((chord) => `h D:${chord} h D:${chord}`).join(" | "),
      },
    },
  });
  return { example, backing };
};

const modePairs = [
  modeExample(1, "D mixolydian", ["D", "C"], ["q 1:2 e 1:3 e 1:5 h 1:2", "q 2:1 e 2:3 e 1:0 h 2:1"]),
  modeExample(2, "E dorian", ["Em", "A"], ["q 1:0 e 2:3 e 2:0 h 1:0", "q 2:2 e 2:3 e 1:0 h 2:2"]),
  modeExample(3, "G mixolydian", ["G", "F"], ["q 2:0 e 2:1 e 2:3 h 2:0", "q 1:1 e 1:3 e 1:5 h 1:1"]),
  modeExample(4, "D dorian", ["Dm", "G"], ["q 1:1 e 1:0 e 2:3 h 1:1", "q 2:0 e 2:1 e 2:3 h 2:0"]),
  modeExample(5, "C major", ["C", "G"], ["q 2:1 e 2:0 e 2:1 h 2:0", "q 2:3 e 2:0 e 2:3 h 1:3"]),
];
const modeExamples = modePairs.map((pair) => pair.example);
const MODES = [
  "Mixolydian: major 3rd, flat 7th",
  "Dorian: minor 3rd, natural 6th",
  "Major: major 3rd, major 7th",
] as const;
const MODE_ANSWERS = [
  [MODES[0], "C natural over the C chord is D's flat 7th, with F♯, a major 3rd, in the D chord: D Mixolydian."],
  [MODES[1], "C♯ in the A chord is E's natural 6th over a minor E chord: E Dorian, like Night Market."],
  [MODES[0], "F natural in the F chord is G's flat 7th, with B, a major 3rd, in the G chord: G Mixolydian."],
  [MODES[1], "B natural in the G chord is D's natural 6th over a minor D chord: D Dorian."],
  [MODES[2], "B against the C chord is a major 7th, and the 3rd is major: plain C major."],
] as const;

const mixoInD = score({
  ...drafted,
  id: "modes-d-mixolydian-chords",
  title: "The Mixolydian vamp in D: D and C",
  key: "D mixolydian",
  bars: 4,
  tempo: [66, 76, 92],
  voicings: { D: OPEN.D, C: OPEN.C },
  voices: { chords: { label: "Your part", text: ["D", "C", "D", "C"].map(riversStrum).join(" | ") } },
  harmony: [
    [1, 1, "D", "I"],
    [2, 1, "C", "♭VII"],
    [3, 1, "D", "I"],
    [4, 1, "C", "♭VII"],
  ],
  derivedFrom: { id: "modes-mixolydian-melody", version: 1, changed: ["key", "harmony"] },
});

export const MODES_LESSON: Lesson = {
  id: "lesson-unit-34-modes",
  version: 1,
  provenance: DRAFT_BY_AGENT,
  unitId: "unit-34",
  stage: 6,
  activityKind: "listen-compare",
  checkKind: "listening",
  title: "One root, two lights",
  purpose:
    "Hear how one changed note gives the same root a different light: the flat 7 of Mixolydian, the natural 6 of Dorian.",
  destination: "Two Rivers' two melodies from A, and the ear to name a mode from its one characteristic note.",
  variable: "The mode's characteristic note: the ♭7 in Mixolydian, the natural 6 in Dorian.",
  capabilities: [
    {
      id: "ear.mode.characteristic",
      action: "listening",
      title: "Hear the mode",
      criterion: "Hear an example and say whether it is Mixolydian, Dorian or major.",
    },
    {
      id: "mode.degree.name",
      action: "naming",
      title: "Name the changed note",
      criterion: "Name the note that makes each mode: G in A Mixolydian, F♯ in A Dorian, C♯ in E Dorian.",
    },
    {
      id: "play.modal-vamp",
      action: "playing",
      title: "Play a modal vamp",
      criterion: "Play the Mixolydian melody over A and G, and the Dorian melody over Am7 and D.",
    },
  ],
  scores: [
    modesMixoMelody,
    modesDorianMelody,
    modesMixoChords,
    modesDorianChords,
    ...modePairs.flatMap((pair) => [pair.example, pair.backing]),
    mixoInD,
  ],
  accompaniment: {
    [modesMixoMelody.id]: [modesMixoChords.id],
    [modesDorianMelody.id]: [modesDorianChords.id],
    ...Object.fromEntries(modePairs.map((pair) => [pair.example.id, [pair.backing.id]])),
  },
  demonstration: {
    scoreId: modesMixoMelody.id,
    handGuidance: [
      "Both melodies start from A on the B and high E strings in open position. Mixolydian is A major with its 7th lowered to G: the chords are A and G. Dorian is A minor with its 6th raised to F♯: the chords are Am7 and D.",
      "Each melody leans on the mode's own note: G (high E fret 3) over the G chord, F♯ (high E fret 2) over the D chord. Sing that note when it comes round.",
      "Night Market has been Dorian since A7 arrived: E minor with C♯, the natural 6, sounding inside the A7 chord.",
    ],
    videoNeeded: [],
  },
  studies: [
    {
      id: "mixolydian",
      scoreId: modesMixoMelody.id,
      title: "Mixolydian",
      changes: "A major's notes with G instead of G♯, over A and G.",
    },
    {
      id: "dorian",
      scoreId: modesDorianMelody.id,
      title: "Dorian",
      changes: "A minor's notes with F♯ instead of F, over Am7 and D, in swung sixteenths.",
    },
  ],
  successCriteria: [
    "Name the mode of each example before the answer is shown.",
    "Name the note that makes each mode.",
    "Play both melodies over their chords.",
  ],
  likelyErrors: [
    {
      id: "mixo-or-major",
      signal: "Mixolydian sounds like plain major to me.",
      repair:
        "Listen only for the note over the G chord: G is a whole step below A, not the half step of a major key's G♯. Loop bar 2 of the Mixolydian melody, then all four.",
      scoreId: modesMixoMelody.id,
      from: 192,
      to: 384,
    },
    {
      id: "natural-6",
      signal: "I can't hear what the natural 6 does.",
      repair:
        "Sing F♯ over the D chord, then F, and hear F♯ brighten the minor key. Loop bar 2 of the Dorian melody, then all four.",
      scoreId: modesDorianMelody.id,
      from: 192,
      to: 384,
    },
  ],
  cueFading: [
    {
      id: "hear-mixolydian",
      phase: "learn",
      cues: "full",
      scoreId: modesMixoMelody.id,
      instruction: "Hear the Mixolydian melody over A and G, then the Dorian one; sing each mode's own note.",
    },
    {
      id: "dorian-with-count",
      phase: "practise",
      cues: "count-only",
      scoreId: modesDorianMelody.id,
      instruction: "Play the Dorian melody beside the click and the chords.",
    },
    {
      id: "name-the-mode",
      phase: "try-unaided",
      cues: "none",
      scoreId: modeExamples[0].id,
      instruction: "Hear each example, with no notes shown, and choose its mode.",
    },
  ],
  listening: {
    questions: modeExamples.map((example, index) => ({
      id: `example-${index + 1}`,
      version: 2,
      scoreId: example.id,
      prompt: "Which mode is this? Listen for the note the melody leans on over the second chord.",
      choices: MODES,
      answer: MODE_ANSWERS[index][0],
      explanation: MODE_ANSWERS[index][1],
    })),
  },
  retrieval: {
    afterDays: 1,
    scoreId: modesMixoMelody.id,
    tempo: 76,
    instruction: "On another day, name the mode of each example again, without the lesson's melodies first.",
  },
  transfer: {
    scoreId: mixoInD.id,
    instruction: "Strum the Mixolydian vamp in D: D, then C, the chord on D's flat 7th. Sing the C over it.",
    changed: ["key", "harmony"],
  },
  performance: {
    kind: "piece",
    pieceId: "piece-two-rivers",
    partId: "two-rivers-mixolydian-chords",
    instruction: "Play Two Rivers' Mixolydian chords while the second guitar plays the melody that leans on G.",
  },
};

/* ------------------------------------------------------------------ */
/* UNIT 35 · Borrow colour deliberately                                 */
/* ------------------------------------------------------------------ */

const glass = { ...drafted, key: "C major", bars: 4, tempo: [56, 66, 76] } as const;
const GLASS_HARMONY = [
  [1, 1, "C", "I"],
  [2, 1, "Em", "iii"],
  [3, 1, "F", "IV"],
  [4, 1, "Fm", "iv"],
] as const;

const borrowedChords = score({
  ...glass,
  id: "borrowed-c-em-f-fm",
  title: "C, Em, F, Fm",
  voicings: GLASS_CHORDS,
  voices: { chords: { label: "Your part", text: ["C", "Em", "F", "Fm"].map(glassStrum).join(" | ") } },
  harmony: GLASS_HARMONY,
});

const borrowedMelody = score({
  ...glass,
  id: "borrowed-melody",
  title: "The melody whose A becomes A♭",
  voices: { melody: { label: "Your part", text: GLASS_MELODY.join(" | ") } },
  harmony: GLASS_HARMONY,
});

const fToFm = score({
  ...drafted,
  id: "f-to-fm",
  title: "F to Fm: one note moves",
  key: "C major",
  bars: 2,
  tempo: [56, 66, 76],
  voicings: { F: GLASS_CHORDS.F, Fm: GLASS_CHORDS.Fm },
  voices: { chords: { label: "Your part", text: "h D:F h D:Fm | h D:F h D:Fm" } },
});

const borrowedMelodyBand = score({
  ...glass,
  id: "borrowed-chords-band",
  title: "The second guitar's chords",
  tempo: [52, 66, 80],
  voicings: GLASS_CHORDS,
  voices: { chords: { label: "Second guitar", text: ["C", "Em", "F", "Fm"].map(glassStrum).join(" | ") } },
});

const minorLeading = score({
  ...drafted,
  id: "minor-leading-tone",
  title: "A minor's borrowed V: Am and E7",
  key: "A minor",
  bars: 4,
  tempo: [56, 66, 76],
  voicings: { Am: { symbol: "Am", shape: "x02210", fingers: "x-231-" }, E7: SEVENTHS.E7 },
  voices: { chords: { label: "Your part", text: ["Am", "E7", "Am", "E7"].map(glassStrum).join(" | ") } },
  harmony: [
    [1, 1, "Am", "i"],
    [2, 1, "E7", "V7"],
    [3, 1, "Am", "i"],
    [4, 1, "E7", "V7"],
  ],
  derivedFrom: { id: "borrowed-c-em-f-fm", version: 1, changed: ["key", "harmony"] },
});

export const BORROWED_LESSON: Lesson = {
  id: "lesson-unit-35-borrowed",
  version: 1,
  provenance: DRAFT_BY_AGENT,
  unitId: "unit-35",
  stage: 6,
  activityKind: "technique",
  checkKind: "playing",
  title: "One borrowed note",
  purpose: "Make a progression ache on purpose by borrowing one chord, and know the single note that does it.",
  destination: "Glasshouse's C, Em, F and Fm, with the melody's A falling to A♭ as F turns minor.",
  variable: "One note: A or A♭.",
  capabilities: [
    {
      id: "ear.borrowed-iv.hear",
      action: "listening",
      title: "Hear the borrowed chord",
      criterion: "Hear Fm darken the progression after F.",
    },
    {
      id: "harmony.changing-note.name",
      action: "naming",
      title: "Name the note that changes",
      criterion: "Say that A becomes A♭ from F to Fm, and that G becomes G♯ in A minor's E7.",
    },
    {
      id: "chord.f-fm.small-shape",
      action: "playing",
      title: "Small F and Fm",
      criterion: "Play F (xx3211) and Fm (xx3111) with every string ringing, changing by one finger.",
    },
  ],
  scores: [borrowedChords, fToFm, borrowedMelody, minorLeading, borrowedMelodyBand],
  accompaniment: { [borrowedChords.id]: [borrowedMelody.id], [borrowedMelody.id]: [borrowedMelodyBand.id] },
  demonstration: {
    scoreId: borrowedChords.id,
    handGuidance: [
      "Small F (xx3211): third finger on the D string at fret 3, second on the G string at fret 2, first finger across the B and high E at fret 1. For Fm (xx3111) lift the second finger and let the first finger cover the G string too: A becomes A♭.",
      "C, Em and F all come from C major; Fm is borrowed from C minor, and its one changed note, A♭, is what makes it ache.",
      "C and Em are the Unit 32 A-shape barres at the 3rd and 7th frets; the jump down to F is a shift: look at fret 1 before you move.",
    ],
    videoNeeded: ["fretting hand"],
  },
  studies: [
    {
      id: "f-fm",
      scoreId: fToFm.id,
      title: "F to Fm",
      changes: "Only F and Fm, a half note each: one finger lifts, one note falls.",
    },
    {
      id: "melody",
      scoreId: borrowedMelody.id,
      title: "The melody",
      changes: "The same climb over F and Fm, ending on A, then on A♭.",
    },
  ],
  successCriteria: [
    "Change F to Fm by lifting one finger, with every string ringing.",
    "Play the four chords in time with the melody over them.",
    "Name the note that changes: A to A♭.",
  ],
  likelyErrors: [
    {
      id: "small-f-buzzes",
      signal: "The small F buzzes on the top strings.",
      repair:
        "Roll the first finger slightly onto its side so its edge presses both strings at fret 1, and arch the third finger clear of the G string. Loop bar 1, then both.",
      scoreId: fToFm.id,
      from: 0,
      to: 192,
    },
    {
      id: "fm-not-heard",
      signal: "I can't hear Fm darken.",
      repair:
        "Sing the melody's last note over F, then over Fm, and hear A drop to A♭. Loop bars 3 and 4, then all four.",
      scoreId: borrowedMelody.id,
      from: 384,
      to: 768,
    },
  ],
  cueFading: [
    {
      id: "hear-glasshouse",
      phase: "learn",
      cues: "full",
      scoreId: borrowedChords.id,
      instruction: "Hear the four chords with the melody over them, and listen for bar 4.",
    },
    {
      id: "f-fm-with-count",
      phase: "practise",
      cues: "count-only",
      scoreId: fToFm.id,
      instruction: "Change F to Fm beside the click alone, lifting one finger.",
    },
    {
      id: "chords-unaided",
      phase: "try-unaided",
      cues: "none",
      scoreId: borrowedChords.id,
      instruction: "Count in and play C, Em, F and Fm with the tab hidden.",
    },
  ],
  retrieval: {
    afterDays: 1,
    scoreId: borrowedChords.id,
    tempo: 66,
    instruction: "On another day, play the progression from memory and name the note that changes.",
  },
  transfer: {
    scoreId: minorLeading.id,
    instruction:
      "Borrowing the other way: in A minor, the V chord borrows G♯ from A major. Play Am (x02210) and E7 (020100) and hear G♯ lead up to A.",
    changed: ["key", "harmony"],
  },
  performance: {
    kind: "piece",
    pieceId: "piece-glasshouse",
    partId: "glasshouse-melody",
    instruction: "Play Glasshouse's melody while the second guitar plays C, Em, F and Fm under it.",
  },
};

/* ------------------------------------------------------------------ */
/* UNIT 36 · Outside is not wrong                                       */
/* ------------------------------------------------------------------ */

const sunday = { ...drafted, key: "D major", feel: "swing-16", bars: 4, tempo: [60, 72, 88] } as const;

const approachSlides = score({
  ...sunday,
  id: "approach-slides",
  title: "Slide-ins and ghosts",
  voicings: TOP_STRING_D_G,
  voices: { hand: { label: "Your part", text: (["D", "G", "D", "G"] as const).map(sundaySlideBar).join(" | ") } },
});

const approachRoots = score({
  ...sunday,
  id: "approach-roots",
  title: "The second guitar's octave roots",
  tempo: [56, 72, 92],
  voices: {
    octaves: {
      label: "Second guitar",
      text: ["5:5+3:7", "6:3+4:5", "5:5+3:7", "6:3+4:5"]
        .map((octave) => Array.from({ length: 4 }, () => `q ${octave}`).join(" "))
        .join(" | "),
    },
  },
});

const slideShapes = score({
  ...drafted,
  id: "approach-slide-shapes",
  title: "Each shape slid in from a fret below",
  key: "D major",
  feel: "swing-16",
  bars: 2,
  tempo: [56, 66, 88],
  voices: {
    hand: { label: "Your part", text: "h 3:7+2:7+1:5[si] h 3:7+2:8+1:7[si] | h 3:7+2:7+1:5[si] h 3:7+2:8+1:7[si]" },
  },
});

const passingTones = score({
  ...drafted,
  id: "approach-passing-tones",
  title: "Chromatic passing tones in a blues line",
  key: "E minor",
  bars: 2,
  tempo: [60, 72, 96],
  voices: {
    line: { label: "Your part", text: "q 6:0 e 6:2 e 6:3 q 5:0 e 5:1{A#} e 5:2 | q 5:2 e 5:1{A#} e 5:0 h 6:3" },
  },
});

const approachNight = score({
  ...drafted,
  id: "approach-night-slides",
  title: "Night Market's accents slid in",
  key: "E dorian",
  bars: 2,
  tempo: [60, 72, 96],
  voicings: NIGHT_PARTIALS,
  voices: { hand: { label: "Your part", text: `${nightSlideBar("Em7")} | ${nightSlideBar("A7")}` } },
  harmony: [
    [1, 1, "Em7", "i7"],
    [2, 1, "A7", "IV7"],
  ],
  derivedFrom: { id: "approach-slides", version: 1, changed: ["key", "harmony"] },
});

export const APPROACH_LESSON: Lesson = {
  id: "lesson-unit-36-approach",
  version: 1,
  provenance: DRAFT_BY_AGENT,
  unitId: "unit-36",
  stage: 6,
  activityKind: "technique",
  checkKind: "playing",
  title: "Outside notes on the way in",
  purpose:
    "Use notes outside the key on purpose, sliding or passing into the right note, so they sound like style rather than mistakes.",
  destination: "Sunday Glide's rhythm part with every accent slid in from a fret below, and ghosted scratches between.",
  variable: "How the target is reached: directly, slid into from a fret below, or through a passing note.",
  capabilities: [
    {
      id: "play.chromatic-approach.slide",
      action: "playing",
      title: "Slide into the shape",
      criterion: "Slide each small shape up from a fret below so it lands on its count.",
    },
    {
      id: "ear.approach.resolve",
      action: "listening",
      title: "Hear it resolve",
      criterion: "Hear the outside note pull into the target and settle there.",
    },
    {
      id: "phrase.passing-tone",
      action: "playing",
      title: "Play the passing note",
      criterion: "Play A♯ between A and B in the blues line, on the way and never landing on it.",
    },
  ],
  scores: [approachSlides, slideShapes, passingTones, approachNight, approachRoots],
  accompaniment: { [approachSlides.id]: [approachRoots.id] },
  demonstration: {
    scoreId: approachSlides.id,
    handGuidance: [
      "A slide-in starts the whole small shape one fret low and slides it up into place as you strike, so the outside notes pass in an instant and the chord lands on the beat.",
      "Chromatic passing notes fill a whole step with the half step between: A, A♯, B on the A string. They sound right because they are on the way somewhere.",
      "Keep the ghosted scratches light so the slid accents stand out.",
    ],
    videoNeeded: ["strumming hand", "muting", "fretting hand"],
  },
  studies: [
    {
      id: "slides",
      scoreId: slideShapes.id,
      title: "Slide into each shape",
      changes: "D and G at the 7th fret, each slid up from a fret below, a half note each.",
    },
    {
      id: "passing",
      scoreId: passingTones.id,
      title: "Passing notes",
      changes: "A blues line in E that passes through A♯ on the way up to B and back down.",
    },
  ],
  successCriteria: [
    "Slide each shape in so the chord lands on its count.",
    "Play the passing A♯ quickly and move on.",
    "Play two bars of the rhythm part with slid accents and light ghosts.",
  ],
  likelyErrors: [
    {
      id: "slide-late",
      signal: "The slide makes the chord land late.",
      repair:
        "Start the slide a fraction before the count so the shape arrives on it. Loop the first half of bar 1, then the study.",
      scoreId: slideShapes.id,
      from: 0,
      to: 96,
    },
    {
      id: "passing-lands",
      signal: "The passing note sounds like a mistake.",
      repair: "Make A♯ short and keep moving to B; never stop on it. Loop bar 1, then both.",
      scoreId: passingTones.id,
      from: 0,
      to: 192,
    },
  ],
  cueFading: [
    {
      id: "hear-the-slides",
      phase: "learn",
      cues: "full",
      scoreId: approachSlides.id,
      instruction: "Hear the rhythm part with its slid accents, then play along.",
    },
    {
      id: "slides-with-count",
      phase: "practise",
      cues: "count-only",
      scoreId: slideShapes.id,
      instruction: "Slide each shape in beside the click alone, landing on 1 and 3.",
    },
    {
      id: "slides-unaided",
      phase: "try-unaided",
      cues: "none",
      scoreId: approachSlides.id,
      instruction: "Count in and play the four bars with the tab hidden.",
    },
  ],
  retrieval: {
    afterDays: 1,
    scoreId: approachSlides.id,
    tempo: 72,
    instruction: "On another day, play the slid accents from memory over the octave roots.",
  },
  transfer: {
    scoreId: approachNight.id,
    instruction:
      "Slide into Night Market's shapes the same way: Em7 and A7 on the top four strings, each accented hit slid up from a fret below.",
    changed: ["key", "harmony"],
  },
  performance: {
    kind: "piece",
    pieceId: "piece-sunday-glide",
    partId: "sunday-glide-slides",
    instruction: "Play Sunday Glide's slide-ins and ghosts over the second guitar's octave roots.",
  },
};

export const LESSONS: readonly Lesson[] = [
  WALKS_LESSON,
  BARRES_LESSON,
  SEVENTHS_LESSON,
  MODES_LESSON,
  BORROWED_LESSON,
  APPROACH_LESSON,
];
