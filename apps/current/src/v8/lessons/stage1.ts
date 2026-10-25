/**
 * STAGE 1 · SOUND AND TIME — authored lessons.
 *
 * Unit 6, "Change without losing time": the C-to-Am common-tone change first
 * drafted on 30 September 2026 (src/v8/phase6Drafts.ts), re-written in score
 * format 2 with its ids, voicings and timing unchanged (tested against the
 * original draft).
 *
 * Units 2–5 follow docs/CURRICULUM_MAP.md §3 (Batch 1, 24 October 2026). Unit
 * 1 keeps its Phase 3 pilot player (decision A15). All agent-drafted; nobody
 * has played them on a guitar yet.
 */
import { score } from "../../core/score/build";
import { DRAFT_BY_AGENT } from "../provenance";
import type { Lesson } from "./format";

const common = {
  version: 1,
  provenance: DRAFT_BY_AGENT,
  key: "C major",
  metre: "4/4",
  bars: 2,
  tempo: [40, 60, 72],
} as const;

const C_AM = {
  C: { symbol: "C", shape: "x32010", fingers: "x32-1-" },
  Am: { symbol: "Am", shape: "x02210", fingers: "x-231-" },
} as const;

const commonToneStudy = score({
  ...common,
  id: "common-tone-c-am",
  title: "C to Am, four counts each",
  voicings: C_AM,
  voices: { chords: { label: "Chords", text: "w D:C[#c-first] | w D:Am[#am-answer]" } },
});

const twoCount = score({
  ...common,
  id: "common-tone-c-am-two-count",
  title: "C to Am, two counts each",
  voicings: C_AM,
  voices: {
    chords: { label: "Chords", text: "h D:C[#c-one] h D:Am[#am-one] | h D:C[#c-two] h D:Am[#am-two]" },
  },
  derivedFrom: { id: "common-tone-c-am", version: 1, changed: ["rhythm"] },
});

const gToEm = score({
  ...common,
  id: "common-tone-g-em",
  title: "G to Em, the same move in a new key",
  key: "G major",
  voicings: {
    G: { symbol: "G", shape: "320003", fingers: "21---3" },
    Em: { symbol: "Em", shape: "022000", fingers: "-12---" },
  },
  voices: { chords: { label: "Chords", text: "w D:G[#g-first] | w D:Em[#em-answer]" } },
  derivedFrom: { id: "common-tone-c-am", version: 1, changed: ["key", "position"] },
});

export const COMMON_TONE_LESSON: Lesson = {
  id: "lesson-unit-06-common-tone",
  version: 1,
  provenance: DRAFT_BY_AGENT,
  unitId: "unit-06",
  stage: 1,
  activityKind: "rhythm",
  checkKind: "playing",
  title: "Keep what stays: C to Am",
  purpose: "Change chords without the music stopping, by noticing that most of your hand can stay exactly where it is.",
  destination:
    "Two bars that move from C to Am and back on the beat, with three notes ringing straight through the change.",
  variable: "How many counts each chord lasts before the change comes round.",
  capabilities: [
    {
      id: "harmony.common-tone.hear",
      action: "listening",
      title: "Hear what stays",
      criterion: "Hear that the top of the chord barely moves while the bass falls from C to A.",
    },
    {
      id: "chord.c-am.change",
      action: "playing",
      title: "Change C to Am",
      criterion: "Move only the fingers that must move, landing the new chord on count 1.",
    },
    {
      id: "rhythm.chord-change.pulse",
      action: "timing",
      title: "Change on the beat",
      criterion: "Keep counting aloud through the change so the new chord arrives on time.",
    },
  ],
  scores: [commonToneStudy, twoCount, gToEm],
  demonstration: {
    scoreId: commonToneStudy.id,
    handGuidance: [
      "C: ring finger on the A string at fret 3, middle finger on the D string at fret 2, index finger on the B string at fret 1. Leave the G and high E strings open and don't strike the low E.",
      "Am: keep the index on B fret 1 and the middle on D fret 2. Only the ring finger moves, from the A string at fret 3 across to the G string at fret 2; the A string is now open.",
      "Strum down once at the start of each bar with a loose wrist, then let the chord ring for all four counts while you count aloud.",
    ],
    videoNeeded: [],
  },
  studies: [
    {
      id: "four-counts",
      scoreId: commonToneStudy.id,
      title: "Four counts each",
      changes: "One strum per bar: C for four counts, then Am for four counts.",
    },
    {
      id: "two-counts",
      scoreId: twoCount.id,
      title: "Two counts each",
      changes: "The same change twice as often: two counts of C, two of Am, twice through.",
    },
  ],
  successCriteria: [
    "Play C for four counts and Am for four counts without stopping the count.",
    "Name the three positions that stay put: D-string fret 2, B-string fret 1 and the open high E.",
    "Play the two-count version with every change landing on its beat.",
  ],
  likelyErrors: [
    {
      id: "change-breaks-pulse",
      signal: "The change stops my pulse.",
      repair:
        "Mute the strings and rehearse only the change on count 1 at a slower pulse. Restore one chord at a time, then both bars.",
      scoreId: commonToneStudy.id,
      from: 144,
      to: 240,
    },
    {
      id: "shared-notes-lost",
      signal: "I lift every finger when the chord changes.",
      repair:
        "Place the shared B-string fret 1 first, then check the D-string fret 2 and the open high E before moving the bass and G string. Return to both chords.",
      scoreId: commonToneStudy.id,
      from: 0,
      to: 384,
    },
  ],
  cueFading: [
    {
      id: "hear-and-find",
      phase: "learn",
      cues: "full",
      scoreId: commonToneStudy.id,
      instruction:
        "Hear C for four counts, then Am for four. Find the D-string fret 2, B-string fret 1 and open high E that both shapes share.",
    },
    {
      id: "move-only-what-changes",
      phase: "practise",
      cues: "count-only",
      scoreId: commonToneStudy.id,
      instruction:
        "Change the bass from C to A and add G-string fret 2. Keep the shared notes ringing where comfortable, then play the full eight counts beside the click.",
    },
    {
      id: "two-count-phrase",
      phase: "try-unaided",
      cues: "none",
      scoreId: twoCount.id,
      instruction:
        "Play C–Am–C–Am with two counts each and no diagram. Say which notes stayed in place, then make one answer quieter or louder by choice.",
    },
  ],
  retrieval: {
    afterDays: 1,
    scoreId: commonToneStudy.id,
    tempo: 60,
    instruction:
      "On another day, change C to Am without the diagram, then name the shared notes and try the two-count phrase.",
  },
  transfer: {
    scoreId: gToEm.id,
    instruction:
      "Try the same four-count change from G to Em without the C–Am diagram. Find the notes that stay at the same string and fret, name what moves, and keep the pulse.",
    changed: ["key", "position"],
  },
  performance: {
    kind: "create",
    instruction:
      "Make your own two-chord loop in Create: start from C and Am, choose how many counts each lasts, and say which notes stay put.",
  },
};

/* ------------------------------------------------------------------ */
/* UNIT 2 · Clean beginnings and endings                                */
/* ------------------------------------------------------------------ */

const eighths = (note: string, accents: readonly number[] = []) =>
  Array.from({ length: 8 }, (_, index) => `e ${note}[pm${accents.includes(index) ? ",>" : ""}]`).join(" ");

const endings = score({
  version: 1,
  provenance: DRAFT_BY_AGENT,
  id: "endings-three-ways-a",
  title: "One A, three endings",
  key: "A minor",
  metre: "4/4",
  bars: 3,
  tempo: [56, 72, 96],
  voices: {
    a: { label: "A string", text: "w 5:0[lr] | q 5:2 q r q 5:2 q r | q 5:0[pm] q 5:0[pm] q 5:0[pm] q 5:0[pm]" },
  },
  sections: [
    ["ring", "Let it ring", 1, 1],
    ["release", "Release the fretted note", 2, 2],
    ["mute", "Palm mute", 3, 3],
  ],
});

const chugs = score({
  version: 1,
  provenance: DRAFT_BY_AGENT,
  id: "endings-palm-muted-eighths",
  title: "Palm-muted eighths, two strengths",
  key: "A minor",
  metre: "4/4",
  bars: 2,
  tempo: [60, 84, 96],
  voices: { a: { label: "A string", text: `${eighths("5:0", [0, 4])} | ${eighths("5:0", [0, 4])}` } },
  derivedFrom: { id: "endings-three-ways-a", version: 1, changed: ["rhythm", "articulation"] },
});

const endingsOnE = score({
  version: 1,
  provenance: DRAFT_BY_AGENT,
  id: "endings-three-ways-e",
  title: "The same three endings on the low E",
  key: "E minor",
  metre: "4/4",
  bars: 3,
  tempo: [56, 72, 96],
  voices: {
    e: { label: "Low E string", text: "w 6:0[lr] | q 6:2 q r q 6:2 q r | q 6:0[pm] q 6:0[pm] q 6:0[pm] q 6:0[pm]" },
  },
  derivedFrom: { id: "endings-three-ways-a", version: 1, changed: ["key", "pitch", "position"] },
});

export const ENDINGS_LESSON: Lesson = {
  id: "lesson-unit-02-endings",
  version: 1,
  provenance: DRAFT_BY_AGENT,
  unitId: "unit-02",
  stage: 1,
  activityKind: "technique",
  checkKind: "playing",
  title: "Three ways to end a note",
  purpose: "Decide exactly when a note stops, so the silence after it is as deliberate as the sound.",
  destination:
    "An open A that rings, a fretted B you stop by easing off, and a run of tight palm-muted chugs: the engine under Low Road.",
  variable: "How the note ends: left ringing, released by the fretting hand, or palm-muted.",
  capabilities: [
    {
      id: "ear.sustain.compare",
      action: "listening",
      title: "Hear how a note ends",
      criterion: "Tell a ringing note, a released note and a palm-muted note apart by ear.",
    },
    {
      id: "sound.release.choose",
      action: "playing",
      title: "Choose the ending",
      criterion: "End each note the way the bar asks, on the count where its silence begins.",
    },
    {
      id: "sound.palm-mute.chug",
      action: "playing",
      title: "Palm-muted chugs",
      criterion: "Keep even palm-muted eighths, with the accented ones clearly stronger.",
    },
  ],
  scores: [endings, chugs, endingsOnE],
  demonstration: {
    scoreId: endings.id,
    handGuidance: [
      "Bar 1: pick the open A once and let it ring for four counts. Touch nothing.",
      "Bar 2: press the A string at fret 2 with your first finger, pick, then ease the pressure off on count 2 so the note stops, keeping the finger touching the string. Do it again on count 3.",
      "Bar 3: rest the edge of your picking hand on the strings just where they leave the bridge. Pick the A on every count; it should thud, not ring and not vanish.",
    ],
    videoNeeded: ["muting"],
  },
  studies: [
    {
      id: "three-endings",
      scoreId: endings.id,
      title: "Three endings",
      changes: "One pitch, ended three different ways, one bar each.",
    },
    {
      id: "two-strengths",
      scoreId: chugs.id,
      title: "Palm-muted eighths, two strengths",
      changes: "Twice as many notes, all palm-muted, with counts 1 and 3 picked harder.",
    },
  ],
  successCriteria: [
    "The open A rings for all four counts of bar 1.",
    "The fretted B stops on the rest each time, with no buzz or ring.",
    "The palm-muted eighths stay even, with the accents on 1 and 3 clearly stronger and nothing ringing between.",
  ],
  likelyErrors: [
    {
      id: "mute-chokes",
      signal: "The palm mute kills the note completely.",
      repair:
        "Slide the edge of your palm back towards the bridge until it only just touches the strings. Loop the palm-muted bar slowly until each note thuds with a little pitch, then play all three endings again.",
      scoreId: endings.id,
      from: 384,
      to: 576,
    },
    {
      id: "release-rings",
      signal: "The fretted note keeps ringing after I let go.",
      repair:
        "Ease the pressure without lifting the finger off the string: it should still touch the string so it damps it. Loop the second bar at a slower count, then return to all three bars.",
      scoreId: endings.id,
      from: 192,
      to: 384,
    },
  ],
  cueFading: [
    {
      id: "hear-three-endings",
      phase: "learn",
      cues: "full",
      scoreId: endings.id,
      instruction: "Hear the three endings, then play each bar with the reference: ring, release, mute.",
    },
    {
      id: "chug-with-count",
      phase: "practise",
      cues: "count-only",
      scoreId: chugs.id,
      instruction: "Play the palm-muted eighths beside the click alone, leaning on counts 1 and 3.",
    },
    {
      id: "chugs-unaided",
      phase: "try-unaided",
      cues: "none",
      scoreId: chugs.id,
      instruction:
        "Count in and play both bars of chugs with the tab hidden. Say which ending you used and why it fits.",
    },
  ],
  retrieval: {
    afterDays: 1,
    scoreId: endings.id,
    tempo: 72,
    instruction: "On another day, play the three endings from memory, then name which ending each bar used.",
  },
  transfer: {
    scoreId: endingsOnE.id,
    instruction:
      "Play the same three endings on the low E string: open E ringing, F sharp at fret 2 released, open E palm-muted. Listen for the same three shapes of sound lower down.",
    changed: ["key", "pitch", "position"],
  },
  performance: {
    kind: "piece",
    pieceId: "piece-low-road",
    partId: "low-road-chugs",
    instruction: "Play the open-A chugs of Low Road while the other guitar plays the riff over you.",
  },
};

/* ------------------------------------------------------------------ */
/* UNIT 3 · Pulse before speed                                          */
/* ------------------------------------------------------------------ */

const backbeat = score({
  version: 1,
  provenance: DRAFT_BY_AGENT,
  id: "thumb-backbeat",
  title: "Open low E, accent on 2 and 4",
  key: "G major",
  metre: "4/4",
  bars: 2,
  tempo: [56, 72, 84],
  voices: {
    thumb: {
      label: "Thumb",
      text: "q 6:0@p q 6:0@p[>] q 6:0@p q 6:0@p[>] | q 6:0@p q 6:0@p[>] q 6:0@p q 6:0@p[>]",
    },
  },
});

const thumbRoots = score({
  version: 1,
  provenance: DRAFT_BY_AGENT,
  id: "thumb-roots-g-em-c-d",
  title: "Thumb roots under G, Em, C and D",
  key: "G major",
  metre: "4/4",
  bars: 4,
  tempo: [56, 66, 84],
  voices: {
    thumb: {
      label: "Thumb",
      text: [
        "q 6:3@p q 6:3@p q 6:3@p q 6:3@p",
        "q 6:0@p q 6:0@p q 6:0@p q 6:0@p",
        "q 5:3@p q 5:3@p q 5:3@p q 5:3@p",
        "q 4:0@p q 4:0@p q 4:0@p q 4:0@p",
      ].join(" | "),
    },
  },
  harmony: [
    [1, 1, "G", "I"],
    [2, 1, "Em", "vi"],
    [3, 1, "C", "IV"],
    [4, 1, "D", "V"],
  ],
});

const waltzRoots = score({
  version: 1,
  provenance: DRAFT_BY_AGENT,
  id: "thumb-roots-c-am-waltz",
  title: "Thumb roots under C and Am, in three",
  key: "C major",
  metre: "3/4",
  bars: 4,
  tempo: [56, 66, 84],
  voices: {
    thumb: {
      label: "Thumb",
      text: [
        "q 5:3@p q 5:3@p q 5:3@p",
        "q 5:0@p q 5:0@p q 5:0@p",
        "q 5:3@p q 5:3@p q 5:3@p",
        "q 5:0@p q 5:0@p q 5:0@p",
      ].join(" | "),
    },
  },
  harmony: [
    [1, 1, "C", "I"],
    [2, 1, "Am", "vi"],
    [3, 1, "C", "I"],
    [4, 1, "Am", "vi"],
  ],
  derivedFrom: { id: "thumb-roots-g-em-c-d", version: 1, changed: ["key", "rhythm"] },
});

export const THUMB_PULSE_LESSON: Lesson = {
  id: "lesson-unit-03-thumb-pulse",
  version: 1,
  provenance: DRAFT_BY_AGENT,
  unitId: "unit-03",
  stage: 1,
  activityKind: "rhythm",
  checkKind: "playing",
  title: "A thumb that keeps time",
  purpose: "Give the music a floor: a steady thumb on the root of each chord that never hurries and never waits.",
  destination:
    "Four bars of thumb roots under G, Em, C and D, the first layer of Porch Light, with every change landing on count 1.",
  variable: "Where the steady thumb lands: one open string, then a new root each bar.",
  capabilities: [
    {
      id: "pulse.backbeat.accent",
      action: "timing",
      title: "Lean on 2 and 4",
      criterion: "Keep four even counts while counts 2 and 4 come out a little stronger.",
    },
    {
      id: "fingerstyle.thumb.root-pulse",
      action: "playing",
      title: "Thumb root pulse",
      criterion: "Play every root with the thumb, one per count, moving strings without a gap.",
    },
    {
      id: "fretboard.roots.g-em-c-d.locate",
      action: "locating",
      title: "Find the four roots",
      criterion: "Find G, E, C and D on the low strings without looking them up.",
    },
  ],
  scores: [thumbRoots, backbeat, waltzRoots],
  demonstration: {
    scoreId: thumbRoots.id,
    handGuidance: [
      "Rest your fingers lightly on the top strings and let the thumb do all the work, striking down through the string from the joint where it meets the hand.",
      "The roots: G is the low E string at fret 3 (second finger), E is the open low E, C is the A string at fret 3 (third finger), D is the open D string.",
      "Move the fretting finger during the last count of each bar, so the new root is there on count 1.",
    ],
    videoNeeded: ["fingerpicking hand"],
  },
  studies: [
    {
      id: "backbeat",
      scoreId: backbeat.id,
      title: "One string, accent on 2 and 4",
      changes: "Only the open low E, so all attention goes to even counts and a gentle lean on 2 and 4.",
    },
    {
      id: "four-roots",
      scoreId: thumbRoots.id,
      title: "Four roots, one per bar",
      changes: "The same thumb pulse moving to a new root each bar: G, E, C, D.",
    },
  ],
  successCriteria: [
    "Play both bars of open E with even counts and a slight lean on 2 and 4.",
    "Play the four roots G, E, C and D with the thumb, each change landing on count 1.",
    "Name which string and fret each root is on.",
  ],
  likelyErrors: [
    {
      id: "pulse-waits-at-change",
      signal: "My pulse hesitates when the root moves to a new string.",
      repair:
        "Play only count 4 of one bar and count 1 of the next, moving the finger early during count 4. Loop those two counts slowly, then return to all four bars.",
      scoreId: thumbRoots.id,
      from: 144,
      to: 240,
    },
    {
      id: "accent-rushes",
      signal: "The accented counts rush, or the others vanish.",
      repair:
        "Play all four counts at the same strength first, then lean on 2 and 4 only slightly. Loop one bar, then return to both.",
      scoreId: backbeat.id,
      from: 0,
      to: 192,
    },
  ],
  cueFading: [
    {
      id: "hear-the-floor",
      phase: "learn",
      cues: "full",
      scoreId: thumbRoots.id,
      instruction: "Hear the four roots with the reference, then play along, finding each root before its bar.",
    },
    {
      id: "lean-with-count",
      phase: "practise",
      cues: "count-only",
      scoreId: backbeat.id,
      instruction: "Play the open E beside the click alone, leaning slightly on 2 and 4.",
    },
    {
      id: "roots-unaided",
      phase: "try-unaided",
      cues: "none",
      scoreId: thumbRoots.id,
      instruction: "Count in and play the four roots with the tab hidden, then name the string and fret of each.",
    },
  ],
  retrieval: {
    afterDays: 1,
    scoreId: thumbRoots.id,
    tempo: 66,
    instruction: "On another day, play the four thumb roots from memory, landing each change on count 1.",
  },
  transfer: {
    scoreId: waltzRoots.id,
    instruction:
      "Keep the same thumb in three: C (A string fret 3) for a bar of three counts, then Am (open A), twice: the first two roots of Harbour Song.",
    changed: ["key", "rhythm"],
  },
  performance: {
    kind: "piece",
    pieceId: "piece-porch-light",
    partId: "porch-light-roots",
    instruction:
      "Play Porch Light's thumb roots, G, E, C, D, G, E, D and a long G, a root on every count while the other guitar plays the tune.",
  },
};

/* ------------------------------------------------------------------ */
/* UNIT 4 · Subdivide the space                                         */
/* ------------------------------------------------------------------ */

const EM7 = { symbol: "Em7", shape: "022030", fingers: "-12-3-" } as const;
const MOTION_PATTERN = (chord: string) =>
  `q D:${chord} e D:${chord} e U:${chord} e r e U:${chord} e D:${chord} e U:${chord}`;

const scratches = score({
  version: 1,
  provenance: DRAFT_BY_AGENT,
  id: "motion-scratch-eighths",
  title: "Scratch eighths, accent on 2 and 4",
  key: "E minor",
  metre: "4/4",
  bars: 2,
  tempo: [60, 80, 96],
  voices: {
    hand: {
      label: "Strumming hand",
      text: "e X e x e X[>] e x e X e x e X[>] e x | e X e x e X[>] e x e X e x e X[>] e x",
    },
  },
});

const em7Groove = score({
  version: 1,
  provenance: DRAFT_BY_AGENT,
  id: "motion-em7-groove",
  title: "Em7: the hand keeps moving, the strings come and go",
  key: "E minor",
  metre: "4/4",
  bars: 2,
  tempo: [60, 76, 96],
  voicings: { Em7: EM7 },
  voices: { hand: { label: "Strumming hand", text: `${MOTION_PATTERN("Em7")} | ${MOTION_PATTERN("Em7")}` } },
});

const emGroove = score({
  version: 1,
  provenance: DRAFT_BY_AGENT,
  id: "motion-em-groove",
  title: "The same pattern on Em",
  key: "E minor",
  metre: "4/4",
  bars: 2,
  tempo: [60, 76, 96],
  voicings: { Em: { symbol: "Em", shape: "022000", fingers: "-12---" } },
  voices: { hand: { label: "Strumming hand", text: `${MOTION_PATTERN("Em")} | ${MOTION_PATTERN("Em")}` } },
  derivedFrom: { id: "motion-em7-groove", version: 1, changed: ["harmony"] },
});

export const CONSTANT_MOTION_LESSON: Lesson = {
  id: "lesson-unit-04-constant-motion",
  version: 1,
  provenance: DRAFT_BY_AGENT,
  unitId: "unit-04",
  stage: 1,
  activityKind: "rhythm",
  checkKind: "playing",
  title: "The hand that never stops",
  purpose:
    "Feel the eighths inside every beat by keeping the strumming hand swinging down and up all the time, whether it hits the strings or not.",
  destination:
    "Two bars of Em7 with a bounce: down, down-up, miss, up, down-up. It is the first half of Night Market's first layer, which Unit 5's stabs complete.",
  variable: "Which of the hand's eighth-note strokes actually touch the strings.",
  capabilities: [
    {
      id: "rhythm.eighths.count",
      action: "timing",
      title: "Count the eighths",
      criterion: "Count “1 & 2 & 3 & 4 &” aloud and keep every stroke on its syllable.",
    },
    {
      id: "strum.constant-motion",
      action: "playing",
      title: "Constant motion",
      criterion: "Keep the hand moving down on the counts and up on the “and”s, through every missed stroke.",
    },
    {
      id: "strum.scratch.mute",
      action: "playing",
      title: "Muted scratches",
      criterion: "Make every scratch a dry click, with no pitch ringing.",
    },
  ],
  scores: [em7Groove, scratches, emGroove],
  demonstration: {
    scoreId: em7Groove.id,
    handGuidance: [
      "Em7: first finger on the A string at fret 2, second finger on the D string at fret 2, third finger on the B string at fret 3. The other strings ring open.",
      "Swing the strumming hand from the wrist like shaking off water: down on every count, up on every “and”. It never stops, even where no strings are struck.",
      "For a scratch, lay the fretting hand flat across all six strings without pressing them down, and strum. You should hear a click, not a note.",
    ],
    videoNeeded: ["muting", "strumming hand"],
  },
  studies: [
    {
      id: "scratch-eighths",
      scoreId: scratches.id,
      title: "Scratch eighths",
      changes: "No pitches at all: every eighth is a muted scratch, with counts 2 and 4 accented.",
    },
    {
      id: "em7-groove",
      scoreId: em7Groove.id,
      title: "Em7 with missed strokes",
      changes:
        "The same moving hand, now letting the Em7 sound on some strokes and passing over the strings on others.",
    },
  ],
  successCriteria: [
    "Play two bars of scratch eighths with the hand never pausing and the accents on 2 and 4.",
    "Play the Em7 pattern with the missed down-stroke on count 3 still made in the air.",
    "Count the eighths aloud while you play, without the count drifting from the hand.",
  ],
  likelyErrors: [
    {
      id: "hand-stops",
      signal: "My strumming hand stops when it misses the strings.",
      repair:
        "Play a whole bar of scratches with the hand swinging evenly, then keep that exact swing and let the Em7 sound only on the strokes the pattern marks. Return to the full pattern.",
      scoreId: scratches.id,
      from: 0,
      to: 192,
    },
    {
      id: "scratch-rings",
      signal: "The scratches ring instead of clicking.",
      repair:
        "Lay the fretting hand flatter so it touches all six strings, pressing none of them. Loop one bar of scratches slowly until each one clicks, then return to both bars.",
      scoreId: scratches.id,
      from: 0,
      to: 192,
    },
  ],
  cueFading: [
    {
      id: "hear-the-bounce",
      phase: "learn",
      cues: "full",
      scoreId: em7Groove.id,
      instruction: "Hear the Em7 pattern, then play along, saying “1 & 2 & 3 & 4 &” as the hand moves.",
    },
    {
      id: "scratch-with-count",
      phase: "practise",
      cues: "count-only",
      scoreId: scratches.id,
      instruction: "Play the scratch eighths beside the click alone, accenting 2 and 4.",
    },
    {
      id: "groove-unaided",
      phase: "try-unaided",
      cues: "none",
      scoreId: em7Groove.id,
      instruction: "Count in and play the Em7 pattern with the tab hidden. Then say which strokes missed the strings.",
    },
  ],
  retrieval: {
    afterDays: 1,
    scoreId: em7Groove.id,
    tempo: 72,
    instruction: "On another day, play the Em7 pattern from memory with the hand never stopping.",
  },
  transfer: {
    scoreId: emGroove.id,
    instruction:
      "Keep the hand and the pattern exactly the same and change the chord to Em: lift the third finger, so the B string rings open.",
    changed: ["harmony"],
  },
  performance: {
    kind: "create",
    instruction:
      "Make a two-bar strum of your own in Create on Em7: choose which eighths sound and which the hand passes over.",
  },
};

/* ------------------------------------------------------------------ */
/* UNIT 5 · Silence is an action                                        */
/* ------------------------------------------------------------------ */

const STAB_BAR = "e D:Em7[st] e r e r e U:Em7[st] e r e r e r e r";

const stabs = score({
  version: 1,
  provenance: DRAFT_BY_AGENT,
  id: "silence-em7-stabs",
  title: "Em7 stabs on 1 and the “and” of 2",
  key: "E minor",
  metre: "4/4",
  bars: 2,
  tempo: [60, 80, 96],
  voicings: { Em7: EM7 },
  voices: { hand: { label: "Strumming hand", text: `${STAB_BAR} | ${STAB_BAR}` } },
});

const stopTime = score({
  version: 1,
  provenance: DRAFT_BY_AGENT,
  id: "silence-stop-time-e5",
  title: "Stop-time hits on E5",
  key: "E minor",
  metre: "4/4",
  bars: 2,
  tempo: [60, 72, 96],
  voices: { hits: { label: "E5", text: "q 6:0+5:2[st] q r q 6:0+5:2[st] q r | w 6:0+5:2" } },
});

const displacedStabs = score({
  version: 1,
  provenance: DRAFT_BY_AGENT,
  id: "silence-em7-stabs-displaced",
  title: "The stabs moved to 2 and the “and” of 3",
  key: "E minor",
  metre: "4/4",
  bars: 2,
  tempo: [60, 80, 96],
  voicings: { Em7: EM7 },
  voices: {
    hand: {
      label: "Strumming hand",
      text: "e r e r e D:Em7[st] e r e r e U:Em7[st] e r e r | e r e r e D:Em7[st] e r e r e U:Em7[st] e r e r",
    },
  },
  derivedFrom: { id: "silence-em7-stabs", version: 1, changed: ["rhythm"] },
});

export const STABS_LESSON: Lesson = {
  id: "lesson-unit-05-stabs",
  version: 1,
  provenance: DRAFT_BY_AGENT,
  unitId: "unit-05",
  stage: 1,
  activityKind: "rhythm",
  checkKind: "playing",
  title: "Stabs and space",
  purpose: "Make the gaps part of the groove: short, exact chords with silence you choose around them.",
  destination: "Two bars of Em7 stabs that leave most of the bar empty, and the stop-time hits that end Front Step.",
  variable: "Where the silence sits around two short chords.",
  capabilities: [
    {
      id: "ear.rest-pattern.recognise",
      action: "listening",
      title: "Hear the gaps",
      criterion: "Hear where each stab falls and where the silence starts, and clap it back.",
    },
    {
      id: "rhythm.rest.place",
      action: "timing",
      title: "Land after a rest",
      criterion: "Come in exactly on 1 and on the “and” of 2 after each silence.",
    },
    {
      id: "sound.stab.staccato",
      action: "playing",
      title: "Short stabs",
      criterion: "Stop every stab dead, so nothing rings into the rest.",
    },
  ],
  scores: [stabs, stopTime, displacedStabs],
  demonstration: {
    scoreId: stabs.id,
    handGuidance: [
      "Em7 has three open strings, so lifting your fingers will not stop it. Stop each stab with the fretting hand: ease off and lay it flat across all the strings straight after the chord.",
      "That leaves the strumming hand free to keep swinging in eighths through the rests, exactly as in Unit 4; it simply misses the strings.",
      "For the stop-time hits, play E5 (open low E and the A string at fret 2) and stop each hit with the heel of the strumming hand on the count after it (2 and 4).",
    ],
    videoNeeded: ["muting", "strumming hand"],
  },
  studies: [
    {
      id: "stabs",
      scoreId: stabs.id,
      title: "Em7 stabs",
      changes: "Two short chords a bar, on 1 and the “and” of 2, with silence after them.",
    },
    {
      id: "stop-time",
      scoreId: stopTime.id,
      title: "Stop-time hits",
      changes: "Single E5 hits on 1 and 3, then a long E5: the end of Front Step.",
    },
  ],
  successCriteria: [
    "Play both bars of stabs with every chord stopped before the next eighth.",
    "Come back in on count 1 of bar 2 without rushing through the silence.",
    "Play the stop-time hits so the long E5 lands exactly on count 1 of bar 2.",
  ],
  likelyErrors: [
    {
      id: "stab-rings",
      signal: "The chord keeps ringing into the rest.",
      repair:
        "Right after each stab, ease the fretting hand off and lay it flat across the strings, keeping the strumming hand moving. Loop one bar slowly until the rests are silent, then both bars.",
      scoreId: stabs.id,
      from: 0,
      to: 192,
    },
    {
      id: "rest-rushes",
      signal: "I come in early after the silence.",
      repair:
        "Count the eighths aloud through the rests, “1 & 2 & 3 & 4 &”, and only play on “1” and the “&” after 2. Loop one bar at a slower tempo, then return to both.",
      scoreId: stabs.id,
      from: 0,
      to: 192,
    },
  ],
  cueFading: [
    {
      id: "hear-the-space",
      phase: "learn",
      cues: "full",
      scoreId: stabs.id,
      instruction: "Hear the stabs, clap where they fall, then play along, stopping each chord dead.",
    },
    {
      id: "hits-with-count",
      phase: "practise",
      cues: "count-only",
      scoreId: stopTime.id,
      instruction: "Play the stop-time hits beside the click alone, stopping each one on the next count.",
    },
    {
      id: "stabs-unaided",
      phase: "try-unaided",
      cues: "none",
      scoreId: stabs.id,
      instruction: "Count in and play the stabs with the tab hidden. Then say where the silence began in each bar.",
    },
  ],
  retrieval: {
    afterDays: 1,
    scoreId: stabs.id,
    tempo: 72,
    instruction: "On another day, play the stabs from memory, with every rest silent.",
  },
  transfer: {
    scoreId: displacedStabs.id,
    instruction:
      "Move both stabs one count later, to 2 and the “and” of 3, and keep the hand moving. Notice how the same two chords now lean forward.",
    changed: ["rhythm"],
  },
  performance: {
    kind: "piece",
    pieceId: "piece-front-step",
    partId: "front-step-one-finger",
    instruction:
      "Play the Stage 1 capstone, Front Step: its ending is exactly these stop-time hits, with the second guitar.",
  },
};

export const LESSONS: readonly Lesson[] = [
  ENDINGS_LESSON,
  THUMB_PULSE_LESSON,
  CONSTANT_MOTION_LESSON,
  STABS_LESSON,
  COMMON_TONE_LESSON,
];
