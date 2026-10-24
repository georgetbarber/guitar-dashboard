/**
 * STAGE 4 · TRIADS AND HARMONIC MOVEMENT — authored lessons.
 *
 * Units 19–24 follow docs/CURRICULUM_MAP.md §3 (Batch 2, 24 October 2026).
 * All agent-drafted; nobody has played them on a guitar yet. Their music
 * feeds Sunday Glide (Units 19, 20, 23), Harbour Song's arpeggio (Unit 21),
 * Porch Light's Travis picking (Unit 22) and Lantern's chords (Unit 24).
 */
import { score } from "../../core/score/build";
import {
  LANTERN_MELODY_BARS,
  OPEN_G_C_D_EM,
  TOP_STRING_D_G,
  TRAVIS,
  fingersOffBeats,
  lanternStrum,
  sixteenthGroove,
  thumbAlternating,
  waltzBass,
  waltzFingers,
  type TravisChord,
} from "../pieces/library";
import { DRAFT_BY_AGENT } from "../provenance";
import type { Lesson } from "./format";

const drafted = { version: 1, provenance: DRAFT_BY_AGENT, metre: "4/4" } as const;

/* ------------------------------------------------------------------ */
/* UNIT 19 · Triads are relationships                                   */
/* ------------------------------------------------------------------ */

const triadsDDm = score({
  ...drafted,
  id: "triad-d-dm-top",
  title: "D and Dm on the top three strings",
  key: "D major",
  bars: 2,
  tempo: [60, 72, 88],
  voices: {
    triads: {
      label: "Triads",
      text: "h 3:7+2:7+1:5 h 3:7+2:6{F}+1:5 | h 3:7+2:7+1:5 h 3:7+2:6{F}+1:5",
    },
  },
});

const sus2Hammer = score({
  ...drafted,
  id: "triad-sus2-hammer",
  title: "From the 2 to the 3: D and G",
  key: "D major",
  bars: 2,
  tempo: [60, 72, 88],
  voices: {
    triads: {
      label: "Triads",
      text: "q 3:7+2:5+1:5 q 2:7[h] h 3:7+2:7+1:5 | q 3:7+2:8+1:5 q 1:7[h] h 3:7+2:8+1:7",
    },
  },
});

const triadsEEm = score({
  ...drafted,
  id: "triad-e-em-top",
  title: "The same shapes two frets up: E and Em",
  key: "E major",
  bars: 2,
  tempo: [60, 72, 88],
  voices: {
    triads: {
      label: "Triads",
      text: "h 3:9+2:9+1:7 h 3:9+2:8{G}+1:7 | h 3:9+2:9+1:7 h 3:9+2:8{G}+1:7",
    },
  },
  derivedFrom: { id: "triad-d-dm-top", version: 1, changed: ["key", "position"] },
});

export const TRIADS_LESSON: Lesson = {
  id: "lesson-unit-19-triads",
  version: 1,
  provenance: DRAFT_BY_AGENT,
  unitId: "unit-19",
  stage: 4,
  activityKind: "technique",
  checkKind: "playing",
  title: "Three notes, three strings",
  purpose: "See a chord as three relationships, root, 3 and 5, in a small shape you can move and colour.",
  destination: "D and Dm at the 7th fret, a one-fret change apart, and the soul move from the 2 into the 3.",
  variable: "The middle note of the shape: the 3, the ♭3, or the 2 on its way to the 3.",
  capabilities: [
    {
      id: "chord.triad.top-strings",
      action: "locating",
      title: "Find the triad",
      criterion: "Put D on the top three strings at the 7th fret without looking: root on the G string.",
    },
    {
      id: "chord-tone.role.name",
      action: "naming",
      title: "Name root, 3 and 5",
      criterion: "Say which string holds the root, the 3 and the 5 in D, Dm and E.",
    },
    {
      id: "ear.triad.major-minor",
      action: "listening",
      title: "Hear major and minor",
      criterion: "Hear which of D and Dm is major and which minor before looking.",
    },
    {
      id: "play.triad.hammer-on",
      action: "playing",
      title: "Hammer the 2 into the 3",
      criterion: "Play the sus2 shape and hammer the 3 on its beat, loud enough to hear.",
    },
  ],
  scores: [triadsDDm, sus2Hammer, triadsEEm],
  demonstration: {
    scoreId: triadsDDm.id,
    handGuidance: [
      "D on the top three strings at the 7th fret: first finger on the high E at fret 5 (A, the 5), third finger on the G string at fret 7 (D, the root), fourth finger on the B string at fret 7 (F♯, the 3).",
      "For Dm only the 3 moves: F♯ drops one fret to F on the B string at fret 6, under the second finger. Major to minor is that one fret.",
      "For D's sus2, lay the first finger across the B and high E strings at fret 5 (E and A), then hammer the fourth finger onto B-string fret 7 to turn the 2 into the 3. In G (D, G and B at frets 7, 8 and 7), hammer the high E from fret 5 to fret 7.",
    ],
    videoNeeded: ["legato"],
  },
  studies: [
    {
      id: "major-minor",
      scoreId: triadsDDm.id,
      title: "D and Dm",
      changes: "The same shape with its 3 lowered one fret: major, minor, major, minor.",
    },
    {
      id: "sus2",
      scoreId: sus2Hammer.id,
      title: "The 2 into the 3",
      changes: "D and G each start as a sus2 and become major when the 3 is hammered on.",
    },
  ],
  successCriteria: [
    "Play D and Dm on the top three strings with all three notes ringing, and name the root, 3 and 5.",
    "Hear which chord is major and which minor before you look.",
    "Play the sus2 hammer-ons in D and G so the third arrives on its beat.",
  ],
  likelyErrors: [
    {
      id: "strings-buzz",
      signal: "One of the three strings buzzes or is dead.",
      repair:
        "Play each string of the shape on its own, slowly, and adjust the finger that buzzes until all three ring. Loop bar 1, then both bars.",
      scoreId: triadsDDm.id,
      from: 0,
      to: 192,
    },
    {
      id: "hammer-quiet",
      signal: "The hammer-on is too quiet.",
      repair:
        "Hammer from a little higher with the fingertip, landing just behind the fret. Loop the first two beats slowly, then the whole study.",
      scoreId: sus2Hammer.id,
      from: 0,
      to: 96,
    },
  ],
  cueFading: [
    {
      id: "hear-major-minor",
      phase: "learn",
      cues: "full",
      scoreId: triadsDDm.id,
      instruction: "Hear D and Dm, then play along and name which is which.",
    },
    {
      id: "sus2-with-count",
      phase: "practise",
      cues: "count-only",
      scoreId: sus2Hammer.id,
      instruction: "Play the sus2 hammer-ons beside the click alone, landing each 3 on count 2.",
    },
    {
      id: "triads-unaided",
      phase: "try-unaided",
      cues: "none",
      scoreId: triadsDDm.id,
      instruction: "Count in and play D, Dm, D, Dm with the tab hidden, naming each chord as you play it.",
    },
  ],
  retrieval: {
    afterDays: 1,
    scoreId: triadsDDm.id,
    tempo: 72,
    instruction: "On another day, find D and Dm from memory and name the string that changes.",
  },
  transfer: {
    scoreId: triadsEEm.id,
    instruction:
      "Move both shapes up two frets: E and Em at the 9th fret. The roles stay where they were: root on the G string, 3 on the B string, 5 on the high E.",
    changed: ["key", "position"],
  },
  performance: {
    kind: "piece",
    pieceId: "piece-sunday-glide",
    partId: "sunday-glide-rhythm",
    instruction: "Play Sunday Glide's rhythm part: D and G as small shapes on the top three strings.",
  },
};

/* ------------------------------------------------------------------ */
/* UNIT 20 · Inversions change perspective                              */
/* ------------------------------------------------------------------ */

const inversionsD = score({
  ...drafted,
  id: "inversions-d-top",
  title: "Three shapes of D up the neck",
  key: "D major",
  bars: 2,
  tempo: [56, 66, 80],
  voices: {
    triads: {
      label: "Triads",
      text: "h 3:2+2:3+1:2 h 3:7+2:7+1:5[sh] | h 3:11+2:10+1:10[sh] h 3:7+2:7+1:5[sh]",
    },
  },
});

const nearestDG = score({
  ...drafted,
  id: "d-g-nearest",
  title: "D to the nearest G and back",
  key: "D major",
  bars: 2,
  tempo: [56, 66, 80],
  voices: {
    triads: { label: "Triads", text: "h 3:7+2:7+1:5 h 3:7+2:8+1:7 | h 3:7+2:7+1:5 h 3:7+2:8+1:7" },
  },
});

const sixteenthPart = score({
  ...drafted,
  id: "d-g-sixteenths",
  title: "D and G in swung sixteenths",
  key: "D major",
  feel: "swing-16",
  bars: 2,
  tempo: [60, 66, 72],
  voicings: TOP_STRING_D_G,
  voices: { hand: { label: "Strumming hand", text: `${sixteenthGroove("D")} | ${sixteenthGroove("G")}` } },
});

const inversionsG = score({
  ...drafted,
  id: "inversions-g-top",
  title: "Three shapes of G up the neck",
  key: "G major",
  bars: 2,
  tempo: [56, 66, 80],
  voices: {
    triads: {
      label: "Triads",
      text: "h 3:4+2:3+1:3 h 3:7+2:8+1:7[sh] | h 3:12+2:12+1:10[sh] h 3:7+2:8+1:7[sh]",
    },
  },
  derivedFrom: { id: "inversions-d-top", version: 1, changed: ["key", "pitch"] },
});

export const INVERSIONS_LESSON: Lesson = {
  id: "lesson-unit-20-inversions",
  version: 1,
  provenance: DRAFT_BY_AGENT,
  unitId: "unit-20",
  stage: 4,
  activityKind: "technique",
  checkKind: "playing",
  title: "The same chord, three ways up",
  purpose: "Find every chord in three places, so the next chord is always a fret or two away.",
  destination:
    "D and G changing by one or two notes at the 7th fret, strummed in swung sixteenths as Sunday Glide's rhythm part.",
  variable: "Which note of the chord is on top: the shape's inversion.",
  capabilities: [
    {
      id: "chord.inversion.locate",
      action: "locating",
      title: "Find all three shapes",
      criterion: "Find D's three shapes on the top three strings and say which note is on top of each.",
    },
    {
      id: "chord.inversion.nearest",
      action: "playing",
      title: "Move to the nearest shape",
      criterion: "Change D to the G nearest it and back, with only two notes moving.",
    },
    {
      id: "ear.top-note.compare",
      action: "listening",
      title: "Hear the top note",
      criterion: "Hear the top note rise as the shapes of D climb the neck.",
    },
  ],
  scores: [inversionsD, nearestDG, sixteenthPart, inversionsG],
  demonstration: {
    scoreId: inversionsD.id,
    handGuidance: [
      "D has three shapes on the top three strings, each with a different note on top: A–D–F♯ at the 2nd and 3rd frets (the open-D shape), D–F♯–A around the 7th, and F♯–A–D at the 10th and 11th.",
      "From D at the 7th, the nearest G is D–G–B at the 7th and 8th frets: the D on the G string stays, and only two notes move. Barre the 7th fret with the first finger and put the second finger on B-string fret 8.",
      "In the rhythm part the strumming hand moves down and up in sixteenths the whole time, touching only the top three strings where a chord is marked. Rest the fretting hand's spare fingers on the lower strings to keep them quiet.",
    ],
    videoNeeded: ["strumming hand"],
  },
  studies: [
    {
      id: "inversions",
      scoreId: inversionsD.id,
      title: "Three shapes of D",
      changes: "D at the 2nd, 7th and 10th frets, each with a different note on top.",
    },
    {
      id: "nearest",
      scoreId: nearestDG.id,
      title: "D to G, nearest shape",
      changes: "D and the G beside it at the 7th fret, two notes moving each time.",
    },
    {
      id: "sixteenths",
      scoreId: sixteenthPart.id,
      title: "Swung sixteenths",
      changes: "The same D and G strummed with the hand moving in swung sixteenths: Sunday Glide's rhythm part.",
    },
  ],
  successCriteria: [
    "Play the three D shapes and say which note is on top of each.",
    "Change D to the nearest G and back with only two notes moving.",
    "Play two bars of the rhythm part with the hand moving in sixteenths and the chords on 1, the “a” of 1, the “and” of 2, 3 and the “a” of 3.",
  ],
  likelyErrors: [
    {
      id: "shift-lands-wrong",
      signal: "I land on the wrong fret after the shift.",
      repair:
        "Look at the target fret before you move, slide the first finger along the high E as a guide, then place the others. Loop bar 1 slowly, then both bars.",
      scoreId: inversionsD.id,
      from: 0,
      to: 192,
    },
    {
      id: "sixteenths-collapse",
      signal: "My strumming hand stops moving in the gaps.",
      repair:
        "Mute all the strings with the fretting hand and strum every sixteenth, then let the hand miss the strings except where the chords are. Loop one bar at 60, then both.",
      scoreId: sixteenthPart.id,
      from: 0,
      to: 192,
    },
  ],
  cueFading: [
    {
      id: "hear-the-shapes",
      phase: "learn",
      cues: "full",
      scoreId: inversionsD.id,
      instruction: "Hear the three shapes of D climb, then play along and sing each top note.",
    },
    {
      id: "nearest-with-count",
      phase: "practise",
      cues: "count-only",
      scoreId: nearestDG.id,
      instruction: "Change D to G and back beside the click alone, keeping the D on the G string down.",
    },
    {
      id: "nearest-unaided",
      phase: "try-unaided",
      cues: "none",
      scoreId: nearestDG.id,
      instruction: "Count in and change D to G and back with the tab hidden; name the note that stays.",
    },
  ],
  retrieval: {
    afterDays: 1,
    scoreId: nearestDG.id,
    tempo: 66,
    instruction: "On another day, find D's three shapes from memory and change to the nearest G from each.",
  },
  transfer: {
    scoreId: inversionsG.id,
    instruction:
      "Find G's three shapes on the top three strings: B–D–G at the 3rd and 4th frets, D–G–B at the 7th and 8th, G–B–D at the 10th and 12th.",
    changed: ["key", "pitch"],
  },
  performance: {
    kind: "piece",
    pieceId: "piece-sunday-glide",
    partId: "sunday-glide-rhythm",
    instruction: "Play Sunday Glide's rhythm part over the octave roots.",
  },
};

/* ------------------------------------------------------------------ */
/* UNIT 21 · Keep what can stay                                         */
/* ------------------------------------------------------------------ */

const waltz = { ...drafted, metre: "3/4" } as const;

const waltzCAm = score({
  ...waltz,
  id: "waltz-c-am",
  title: "The waltz arpeggio: C to Am",
  key: "C major",
  bars: 2,
  tempo: [60, 72, 84],
  voices: {
    fingers: { label: "Fingers", text: `${waltzFingers("C")} | ${waltzFingers("Am")}` },
    thumb: { label: "Thumb", text: `${waltzBass("C")} | ${waltzBass("Am")}` },
  },
});

const waltzFull = score({
  ...waltz,
  id: "waltz-c-am-f-g",
  title: "C, Am, Fmaj7, G in three",
  key: "C major",
  bars: 4,
  tempo: [60, 72, 84],
  voices: {
    fingers: { label: "Fingers", text: (["C", "Am", "Fmaj7", "G"] as const).map(waltzFingers).join(" | ") },
    thumb: { label: "Thumb", text: (["C", "Am", "Fmaj7", "G"] as const).map(waltzBass).join(" | ") },
  },
  harmony: [
    [1, 1, "C", "I"],
    [2, 1, "Am", "vi"],
    [3, 1, "Fmaj7", "IVmaj7"],
    [4, 1, "G", "V"],
  ],
});

/** G, Em, C and D in three: per chord the bass, then the G, B and high E string notes. */
const WALTZ_G = [
  ["6:3", "3:0", "2:0", "1:3"],
  ["6:0", "3:0", "2:0", "1:0"],
  ["5:3", "3:0", "2:1", "1:0"],
  ["4:0", "3:2", "2:3", "1:2"],
] as const;

const waltzInG = score({
  ...waltz,
  id: "waltz-g-em-c-d",
  title: "The same arpeggio over G, Em, C and D",
  key: "G major",
  bars: 4,
  tempo: [60, 72, 84],
  voices: {
    fingers: {
      label: "Fingers",
      text: WALTZ_G.map(([, i, m, a]) => `e r e ${i}@i[lr] e ${m}@m[lr] e ${a}@a[lr] e ${m}@m[lr] e ${i}@i[lr]`).join(
        " | ",
      ),
    },
    thumb: { label: "Thumb", text: WALTZ_G.map(([bass]) => `h. ${bass}@p`).join(" | ") },
  },
  harmony: [
    [1, 1, "G", "I"],
    [2, 1, "Em", "vi"],
    [3, 1, "C", "IV"],
    [4, 1, "D", "V"],
  ],
  derivedFrom: { id: "waltz-c-am-f-g", version: 1, changed: ["key", "harmony"] },
});

export const COMMON_TONES_LESSON: Lesson = {
  id: "lesson-unit-21-common-tones",
  version: 1,
  provenance: DRAFT_BY_AGENT,
  unitId: "unit-21",
  stage: 4,
  activityKind: "technique",
  checkKind: "playing",
  title: "What stays when the chord changes",
  purpose:
    "Let the notes chords share keep ringing, so a progression sounds like one thing moving rather than four blocks.",
  destination:
    "Harbour Song's waltz arpeggio over C, Am, Fmaj7 and G, with C on the B string ringing through three chords.",
  variable: "Which chord comes next, and so which notes stay and which move.",
  capabilities: [
    {
      id: "ear.held-tone.hear",
      action: "listening",
      title: "Hear the held note",
      criterion: "Hear the C on the B string carry on through C, Am and Fmaj7.",
    },
    {
      id: "fingerstyle.waltz-arpeggio",
      action: "playing",
      title: "Play the waltz arpeggio",
      criterion: "Thumb on count 1, then index, middle, ring, middle, index in even eighths, in three.",
    },
    {
      id: "harmony.common-tone.hold",
      action: "playing",
      title: "Keep the shared finger down",
      criterion: "Keep B-string fret 1 pressed from C through Am to Fmaj7 while the bass moves.",
    },
  ],
  scores: [waltzFull, waltzCAm, waltzInG],
  demonstration: {
    scoreId: waltzFull.id,
    handGuidance: [
      "Thumb (p) on the bass string on count 1; then index (i) on the G string, middle (m) on the B string, ring (a) on the high E, back to middle and index: six even eighths in a bar of three.",
      "From C to Am to Fmaj7, the first finger never leaves B-string fret 1 (C), and the high E stays open. From Am to Fmaj7 the A on G-string fret 2 stays too; the bass moves to F on the D string at fret 3.",
      "G (320003) moves the whole hand; start moving on the last eighth of the Fmaj7 bar.",
    ],
    videoNeeded: ["fingerpicking hand"],
  },
  studies: [
    {
      id: "c-am",
      scoreId: waltzCAm.id,
      title: "C to Am",
      changes: "Two bars: the arpeggio over C, then over Am, with two of the three upper notes unchanged.",
    },
    {
      id: "four-chords",
      scoreId: waltzFull.id,
      title: "C, Am, Fmaj7, G",
      changes: "Four bars: the C on the B string rings through three chords before G moves everything.",
    },
  ],
  successCriteria: [
    "Play the arpeggio in three with even eighths and the bass on every count 1.",
    "Keep B-string fret 1 pressed from C through Am to Fmaj7.",
    "Say which notes stay and which move at each change.",
  ],
  likelyErrors: [
    {
      id: "bass-wrong-string",
      signal: "My thumb hits the wrong bass string.",
      repair:
        "Play only the thumb on count 1 through the four bars, C on the A string, A open, F on the D string, G on the low E, then add the fingers. Loop the first two bars, then all four.",
      scoreId: waltzFull.id,
      from: 0,
      to: 288,
    },
    {
      id: "lift-shared-finger",
      signal: "I lift the first finger at every change.",
      repair:
        "Hold B-string fret 1 down and change only what must change, slowly, from C to Am to Fmaj7. Loop the first three bars, then all four.",
      scoreId: waltzFull.id,
      from: 0,
      to: 432,
    },
  ],
  cueFading: [
    {
      id: "hear-the-waltz",
      phase: "learn",
      cues: "full",
      scoreId: waltzFull.id,
      instruction: "Hear the four bars and listen for the C that keeps sounding, then play along.",
    },
    {
      id: "c-am-with-count",
      phase: "practise",
      cues: "count-only",
      scoreId: waltzCAm.id,
      instruction: "Play C to Am beside the click alone, keeping the first finger down.",
    },
    {
      id: "waltz-unaided",
      phase: "try-unaided",
      cues: "none",
      scoreId: waltzFull.id,
      instruction:
        "Count in and play the four bars with the tab hidden, then say which note stayed under your first finger.",
    },
  ],
  retrieval: {
    afterDays: 1,
    scoreId: waltzFull.id,
    tempo: 66,
    instruction: "On another day, play the four bars from memory and name what each change keeps.",
  },
  transfer: {
    scoreId: waltzInG.id,
    instruction:
      "Play the same arpeggio in three over G, Em, C and D. G and Em share the open G and B strings: listen for them staying.",
    changed: ["key", "harmony"],
  },
  performance: {
    kind: "piece",
    pieceId: "piece-harbour-song",
    partId: "harbour-song-arpeggio",
    instruction: "Play Harbour Song's waltz arpeggio while the other guitar plays the melody.",
  },
};

/* ------------------------------------------------------------------ */
/* UNIT 22 · Hear each moving voice                                     */
/* ------------------------------------------------------------------ */

const TRAVIS_STUDY: TravisChord[] = ["G", "Em", "C", "D"];
const pinchBar = (chord: TravisChord) => {
  const { i, m } = TRAVIS[chord];
  const top = { G: "1:3", Em: "1:0", C: "1:0", D: "1:2" }[chord];
  return `e ${top}@m e ${i}@i e r e ${m}@m e r e ${i}@i e r e ${m}@m`;
};

const travisThumb = score({
  ...drafted,
  id: "travis-thumb-only",
  title: "Thumb alone: root and second bass note",
  key: "G major",
  bars: 4,
  tempo: [56, 66, 84],
  voices: { thumb: { label: "Thumb", text: TRAVIS_STUDY.map(thumbAlternating).join(" | ") } },
});

const travisOffBeats = score({
  ...drafted,
  id: "travis-thumb-and-finger",
  title: "Thumb, with the fingers on the off-beats",
  key: "G major",
  bars: 4,
  tempo: [56, 66, 84],
  voices: {
    fingers: { label: "Fingers", text: TRAVIS_STUDY.map(fingersOffBeats).join(" | ") },
    thumb: { label: "Thumb", text: TRAVIS_STUDY.map(thumbAlternating).join(" | ") },
  },
});

const travisPinches = score({
  ...drafted,
  id: "travis-with-pinches",
  title: "The full pattern, pinched on count 1",
  key: "G major",
  bars: 4,
  tempo: [56, 66, 84],
  voices: {
    fingers: { label: "Fingers", text: TRAVIS_STUDY.map(pinchBar).join(" | ") },
    thumb: { label: "Thumb", text: TRAVIS_STUDY.map(thumbAlternating).join(" | ") },
  },
  harmony: [
    [1, 1, "G", "I"],
    [2, 1, "Em", "vi"],
    [3, 1, "C", "IV"],
    [4, 1, "D", "V"],
  ],
});

const travisInC = score({
  ...drafted,
  id: "travis-c-am-f-g",
  title: "The same pattern over C, Am, Fmaj7 and G",
  key: "C major",
  bars: 4,
  tempo: [56, 66, 84],
  voices: {
    fingers: {
      label: "Fingers",
      text: [
        "e r e 3:0@i e r e 2:1@m e r e 3:0@i e r e 2:1@m",
        "e r e 3:2@i e r e 2:1@m e r e 3:2@i e r e 2:1@m",
        "e r e 2:1@i e r e 1:0@m e r e 2:1@i e r e 1:0@m",
        "e r e 3:0@i e r e 2:0@m e r e 3:0@i e r e 2:0@m",
      ].join(" | "),
    },
    thumb: {
      label: "Thumb",
      text: [
        "q 5:3@p q 4:2@p q 5:3@p q 4:2@p",
        "q 5:0@p q 4:2@p q 5:0@p q 4:2@p",
        "q 4:3@p q 3:2@p q 4:3@p q 3:2@p",
        "q 6:3@p q 4:0@p q 6:3@p q 4:0@p",
      ].join(" | "),
    },
  },
  harmony: [
    [1, 1, "C", "I"],
    [2, 1, "Am", "vi"],
    [3, 1, "Fmaj7", "IVmaj7"],
    [4, 1, "G", "V"],
  ],
  derivedFrom: { id: "travis-with-pinches", version: 1, changed: ["key", "harmony"] },
});

export const TRAVIS_LESSON: Lesson = {
  id: "lesson-unit-22-travis",
  version: 1,
  provenance: DRAFT_BY_AGENT,
  unitId: "unit-22",
  stage: 4,
  activityKind: "technique",
  checkKind: "playing",
  title: "Thumb and fingers, two voices",
  purpose: "Make one guitar sound like two players: a bass that never stops and a higher line that answers it.",
  destination:
    "Travis picking over G, Em, C and D: the thumb alternating on every count, the fingers between, pinched on 1.",
  variable: "How much the fingers add over the steady thumb: nothing, the off-beats, then a pinch on 1.",
  capabilities: [
    {
      id: "ear.bass-melody.separate",
      action: "listening",
      title: "Hear two voices",
      criterion: "Hear the thumb's bass line and the fingers' line as two separate parts.",
    },
    {
      id: "fingerstyle.alternating-bass",
      action: "playing",
      title: "Alternate the bass",
      criterion: "Keep the thumb alternating root and second bass note on every count through all four chords.",
    },
    {
      id: "fingerstyle.pinch",
      action: "playing",
      title: "Pinch on 1",
      criterion: "Sound a high note with the middle finger and the bass with the thumb at exactly the same moment.",
    },
  ],
  scores: [travisPinches, travisThumb, travisOffBeats, travisInC],
  demonstration: {
    scoreId: travisPinches.id,
    handGuidance: [
      "Thumb only first: root on counts 1 and 3, the second bass note on 2 and 4. G: low E fret 3 and the open D. Em: open low E and D-string fret 2. C: A-string fret 3 and D-string fret 2. D: the open D and G-string fret 2.",
      "Then let the index and middle fingers answer between the thumb's notes, on every “and”: index on the G string, middle on the B string (for D, the B and high E strings).",
      "Last, the pinch: on count 1 the middle finger plays a high note together with the thumb.",
    ],
    videoNeeded: ["fingerpicking hand"],
  },
  studies: [
    {
      id: "thumb",
      scoreId: travisThumb.id,
      title: "Thumb alone",
      changes: "Only the alternating bass, over G, Em, C and D.",
    },
    {
      id: "off-beats",
      scoreId: travisOffBeats.id,
      title: "Fingers on the off-beats",
      changes: "The same thumb with the index and middle fingers on every “and”.",
    },
    {
      id: "pinches",
      scoreId: travisPinches.id,
      title: "Pinch on 1",
      changes: "The full pattern: a high note pinched with the thumb on every count 1.",
    },
  ],
  successCriteria: [
    "Keep the thumb alternating through all four chords without stopping.",
    "Add the fingers on every “and” with the thumb still steady.",
    "Pinch on count 1 so the high note and the bass sound together.",
  ],
  likelyErrors: [
    {
      id: "thumb-follows-fingers",
      signal: "My thumb starts copying the fingers' rhythm.",
      repair:
        "Go back to the thumb alone for a bar, counting 1 2 3 4 aloud, then add only the index on the “and” of 1 and 3. Loop bar 1 of the off-beat study, then the whole study.",
      scoreId: travisOffBeats.id,
      from: 0,
      to: 192,
    },
    {
      id: "wrong-second-string",
      signal: "The thumb hits the wrong second string on C or D.",
      repair:
        "Say the two bass strings for each chord before playing it: C on the A and D strings, D on the D and G strings. Loop bars 3 and 4 of the thumb study slowly, then all four.",
      scoreId: travisThumb.id,
      from: 384,
      to: 768,
    },
  ],
  cueFading: [
    {
      id: "hear-the-pattern",
      phase: "learn",
      cues: "full",
      scoreId: travisPinches.id,
      instruction: "Hear the full pattern, then play only the thumb part along with it.",
    },
    {
      id: "off-beats-with-count",
      phase: "practise",
      cues: "count-only",
      scoreId: travisOffBeats.id,
      instruction: "Play the thumb and the off-beat fingers beside the click alone.",
    },
    {
      id: "pinches-unaided",
      phase: "try-unaided",
      cues: "none",
      scoreId: travisPinches.id,
      instruction: "Count in and play the four bars with pinches and the tab hidden.",
    },
  ],
  retrieval: {
    afterDays: 1,
    scoreId: travisOffBeats.id,
    tempo: 66,
    instruction: "On another day, play the thumb and fingers from memory over G, Em, C and D.",
  },
  transfer: {
    scoreId: travisInC.id,
    instruction:
      "Use the same thumb and fingers over C, Am, Fmaj7 and G. For Fmaj7 the thumb alternates the D and G strings and the fingers move up to the B and high E.",
    changed: ["key", "harmony"],
  },
  performance: {
    kind: "piece",
    pieceId: "piece-porch-light",
    partId: "porch-light-travis",
    instruction: "Play Porch Light's Travis picking while the other guitar plays the tune.",
  },
};

/* ------------------------------------------------------------------ */
/* UNIT 23 · Target the changing chord                                  */
/* ------------------------------------------------------------------ */

const sixthsLand = score({
  ...drafted,
  id: "sixths-land-d-g",
  title: "Sixths on the chord: D, then G",
  key: "D major",
  bars: 2,
  tempo: [60, 72, 88],
  voices: {
    sixths: { label: "Sixths", text: "h 3:2@p+1:2@m h 3:4@p+1:3@m | h 3:2@p+1:2@m h 3:4@p+1:3@m" },
  },
  harmony: [
    [1, 1, "D", "I"],
    [1, 3, "G", "IV"],
    [2, 1, "D", "I"],
    [2, 3, "G", "IV"],
  ],
});

const sixthsSlide = score({
  ...drafted,
  id: "sixths-slide-d-g",
  title: "Sliding into each sixth from a fret below",
  key: "D major",
  bars: 2,
  tempo: [60, 72, 88],
  voices: {
    sixths: {
      label: "Sixths",
      text: "q 3:2@p+1:2@m[si] q r q 3:4@p+1:3@m[si] q r | q 3:2@p+1:2@m[si] q r q 3:4@p+1:3@m[si] q r",
    },
  },
});

const sixthsInA = score({
  ...drafted,
  id: "sixths-land-a-d",
  title: "The same idea in A: A, then D",
  key: "A major",
  bars: 2,
  tempo: [60, 72, 88],
  voices: {
    sixths: { label: "Sixths", text: "h 3:9@p+1:9@m h 3:11@p+1:10@m | h 3:9@p+1:9@m h 3:11@p+1:10@m" },
  },
  derivedFrom: { id: "sixths-land-d-g", version: 1, changed: ["key", "position"] },
});

export const SIXTHS_LESSON: Lesson = {
  id: "lesson-unit-23-sixths",
  version: 1,
  provenance: DRAFT_BY_AGENT,
  unitId: "unit-23",
  stage: 4,
  activityKind: "technique",
  checkKind: "playing",
  title: "Sixths that land on the chord",
  purpose:
    "Play two notes that sit inside each chord as it changes, the soul guitarist's way of following the harmony.",
  destination: "Sunday Glide's sliding sixths: A with F♯ over D, B with G over G, each slid into from a fret below.",
  variable: "Which chord tones the sixth lands on as the chord changes.",
  capabilities: [
    {
      id: "play.sixths.slide-target",
      action: "playing",
      title: "Slide onto the target",
      criterion: "Slide each sixth in from a fret below so it arrives on its count, with the B string silent.",
    },
    {
      id: "chord-tone.landing.name",
      action: "naming",
      title: "Name what you land on",
      criterion: "Say which chord tones each sixth lands on: 5 and 3 over D, 3 and root over G.",
    },
    {
      id: "ear.landing.consonant",
      action: "listening",
      title: "Hear it sit in the chord",
      criterion: "Hear each sixth settle into its chord, and hear it clash if you play the D sixth over G.",
    },
  ],
  scores: [sixthsLand, sixthsSlide, sixthsInA],
  demonstration: {
    scoreId: sixthsLand.id,
    handGuidance: [
      "Over D, play A and F♯ together: G-string fret 2 and high E fret 2, the same fret, so a major sixth. A is D's 5 and F♯ its 3.",
      "Over G, move to B and G: G-string fret 4 and high E fret 3, one fret lower on top, so a minor sixth. B is G's 3 and G its root.",
      "Pluck the G string with the thumb and the high E with the middle finger, with the finger on the G string leaning on the B string so it stays silent. For the slide-in, start a fret lower and slide up as you pluck.",
    ],
    videoNeeded: ["fingerpicking hand", "legato"],
  },
  studies: [
    {
      id: "land",
      scoreId: sixthsLand.id,
      title: "Land on each chord",
      changes: "Half-note sixths: the D sixth, then the G sixth, twice.",
    },
    {
      id: "slide",
      scoreId: sixthsSlide.id,
      title: "Slide in",
      changes: "The same sixths as short notes, each slid into from a fret below, with space after them.",
    },
  ],
  successCriteria: [
    "Play the D and G sixths in time with the B string silent.",
    "Name the chord tones each sixth lands on: 5 and 3 over D, 3 and root over G.",
    "Slide into each sixth from a fret below so it arrives on its count.",
  ],
  likelyErrors: [
    {
      id: "b-string-rings",
      signal: "The B string rings between the two notes.",
      repair:
        "Lean the finger on the G string a little flatter so it touches the B string. Loop bar 1 slowly until only two notes sound, then both bars.",
      scoreId: sixthsLand.id,
      from: 0,
      to: 192,
    },
    {
      id: "slide-late",
      signal: "The slide makes me late.",
      repair:
        "Start the slide a fraction before the count so it lands on it; practise only the slide into the D sixth, then the whole study.",
      scoreId: sixthsSlide.id,
      from: 0,
      to: 96,
    },
  ],
  cueFading: [
    {
      id: "hear-the-sixths",
      phase: "learn",
      cues: "full",
      scoreId: sixthsLand.id,
      instruction: "Hear the sixths over D and G, then play along and name the chord tones.",
    },
    {
      id: "slides-with-count",
      phase: "practise",
      cues: "count-only",
      scoreId: sixthsSlide.id,
      instruction: "Slide into each sixth beside the click alone, landing on counts 1 and 3.",
    },
    {
      id: "sixths-unaided",
      phase: "try-unaided",
      cues: "none",
      scoreId: sixthsLand.id,
      instruction: "Count in and play the four sixths with the tab hidden; name the chord tones as you land.",
    },
  ],
  retrieval: {
    afterDays: 1,
    scoreId: sixthsLand.id,
    tempo: 72,
    instruction: "On another day, find the D and G sixths from memory and say which chord tones they are.",
  },
  transfer: {
    scoreId: sixthsInA.id,
    instruction:
      "In A, land on A's chord tones and then D's: E with C♯ at the 9th fret (5 and 3 of A), then F♯ with D at the 11th and 10th frets (3 and root of D).",
    changed: ["key", "position"],
  },
  performance: {
    kind: "piece",
    pieceId: "piece-sunday-glide",
    partId: "sunday-glide-sixths",
    instruction: "Play Sunday Glide's sliding sixths over its rhythm part, in swung sixteenths.",
  },
};

/* ------------------------------------------------------------------ */
/* UNIT 24 · First harmonised phrase                                    */
/* ------------------------------------------------------------------ */

const lanternTune = score({
  ...drafted,
  id: "harmonise-lantern-tune",
  title: "Lantern's tune",
  key: "G major",
  bars: 8,
  tempo: [60, 72, 88],
  voices: { melody: { label: "Tune", text: LANTERN_MELODY_BARS.join(" | ") } },
});

const lessonHarmony = score({
  ...drafted,
  id: "harmonise-lantern-chords",
  title: "One way to harmonise it: G, C, D, D, Em, C, D, G",
  key: "G major",
  bars: 8,
  tempo: [60, 72, 88],
  voicings: OPEN_G_C_D_EM,
  voices: {
    chords: {
      label: "Chords",
      text: ["G", "C", "D", "D", "Em", "C", "D"].map(lanternStrum).concat("w D:G").join(" | "),
    },
  },
});

const { Em: _em, ...G_C_D } = OPEN_G_C_D_EM;

const plainHarmony = score({
  ...drafted,
  id: "harmonise-lantern-plain",
  title: "A plainer way: G in bar 5",
  key: "G major",
  bars: 8,
  tempo: [60, 72, 88],
  voicings: G_C_D,
  voices: {
    chords: {
      label: "Chords",
      text: ["G", "C", "D", "D", "G", "C", "D"].map(lanternStrum).concat("w D:G").join(" | "),
    },
  },
});

const porchTopLine = score({
  ...drafted,
  id: "harmonise-porch-tune",
  title: "A new tune: Porch Light's top line",
  key: "G major",
  bars: 4,
  tempo: [60, 72, 88],
  voices: { melody: { label: "Tune", text: "h 1:3 h 2:0 | h 1:0 h 2:0 | h 1:0 h 2:1 | h 1:2 h 2:3" } },
});

const porchHarmony = score({
  ...drafted,
  id: "harmonise-porch-chords",
  title: "G, Em, C, D under the new tune",
  key: "G major",
  bars: 4,
  tempo: [60, 72, 88],
  voicings: OPEN_G_C_D_EM,
  voices: { chords: { label: "Chords", text: ["G", "Em", "C", "D"].map(lanternStrum).join(" | ") } },
  derivedFrom: { id: "harmonise-lantern-chords", version: 1, changed: ["pitch", "rhythm"] },
});

export const HARMONISE_LESSON: Lesson = {
  id: "lesson-unit-24-harmonise",
  version: 1,
  provenance: DRAFT_BY_AGENT,
  unitId: "unit-24",
  stage: 4,
  activityKind: "creative",
  checkKind: "creating",
  title: "Chords under a tune",
  purpose: "Choose your own chords for a melody by finding the note each bar lands on, and keep the version you like.",
  destination: "Your own harmonisation of Lantern, saved in Create, beside the lesson's G, C, D, D, Em, C, D, G.",
  variable: "Which chord sits under each bar's landing note.",
  capabilities: [
    {
      id: "harmony.melody-in-chord.name",
      action: "naming",
      title: "Name the chords that fit",
      criterion: "For each bar, name the landing note and which of G, C, D and Em contain it.",
    },
    {
      id: "ear.harmony.supports",
      action: "listening",
      title: "Hear a chord support the tune",
      criterion: "Hear a chord that contains the landing note sit under it, and one that does not pull against it.",
    },
    {
      id: "play.melody-with-triads",
      action: "playing",
      title: "Strum under the tune",
      criterion: "Strum your chosen chords under the tune with each change on count 1.",
    },
  ],
  scores: [lessonHarmony, plainHarmony, lanternTune, porchHarmony, porchTopLine],
  accompaniment: {
    [lessonHarmony.id]: [lanternTune.id],
    [plainHarmony.id]: [lanternTune.id],
    [porchHarmony.id]: [porchTopLine.id],
  },
  demonstration: {
    scoreId: lessonHarmony.id,
    handGuidance: [
      "Each bar of Lantern has a landing note: the long one from the “and” of 2. Choose a chord that contains it: G (G B D), C (C E G), D (D F♯ A) or Em (E G B).",
      "Bar 1 lands on G, which G, C and Em all contain. Bar 5 lands on G too: the lesson's version uses Em there for a change of colour.",
      "Strum with the Unit 16 pattern and let the tune tell you whether a chord fits: one that contains the landing note sounds settled under it.",
    ],
    videoNeeded: [],
  },
  studies: [
    {
      id: "lesson-version",
      scoreId: lessonHarmony.id,
      title: "The lesson's version",
      changes: "G, C, D, D, Em, C, D, G under the tune, with Em in bar 5.",
    },
    {
      id: "plain-version",
      scoreId: plainHarmony.id,
      title: "A plainer version",
      changes: "The same, but with G in bar 5: compare how the two bar 5s colour the same landing note.",
    },
  ],
  successCriteria: [
    "Choose a chord for every bar of Lantern's tune and save your version in Create.",
    "Say which chord holds each bar's landing note.",
    "Play your version once with the tune and keep at least one choice you like.",
  ],
  likelyErrors: [
    {
      id: "chord-clashes",
      signal: "A chord clashes with the tune.",
      repair:
        "Find that bar's landing note, the long one, and list which of G, C, D and Em contain it; try each under the tune. Loop bar 5, where two chords both work, then the whole tune.",
      scoreId: lessonHarmony.id,
      from: 768,
      to: 960,
    },
    {
      id: "strum-drowns-tune",
      signal: "My strumming drowns the tune.",
      repair:
        "Strum lightly and only on counts 1 and 3, so the tune sits on top. Loop the first two bars, then all eight.",
      scoreId: lessonHarmony.id,
      from: 0,
      to: 384,
    },
  ],
  cueFading: [
    {
      id: "hear-a-harmonisation",
      phase: "learn",
      cues: "full",
      scoreId: lessonHarmony.id,
      instruction:
        "Hear the lesson's version: Lantern's tune with G, C, D and Em under it. Find the landing note in each bar.",
    },
    {
      id: "compare-with-count",
      phase: "practise",
      cues: "count-only",
      scoreId: plainHarmony.id,
      instruction:
        "Strum the plainer version beside the click with the tune, and compare its bar 5 with the lesson's Em.",
    },
    {
      id: "make-your-own",
      phase: "try-unaided",
      cues: "none",
      scoreId: lanternTune.id,
      instruction:
        "Make your own version: open Create with the tune, choose a chord for every bar, save it, then come back and report what you chose.",
    },
  ],
  retrieval: {
    afterDays: 1,
    scoreId: lessonHarmony.id,
    tempo: 72,
    instruction:
      "On another day, strum the lesson's version or yours from memory under the tune and name each landing note.",
  },
  transfer: {
    scoreId: porchHarmony.id,
    instruction:
      "Harmonise a new tune, Porch Light's top line, with G, Em, C and D: G and B over G, E and B over Em, E and C over C, F♯ and D over D.",
    changed: ["pitch", "rhythm"],
  },
  performance: {
    kind: "piece",
    pieceId: "piece-lantern",
    partId: "lantern-chords",
    instruction: "Play Lantern's chords while the second guitar plays the tune.",
  },
};

export const LESSONS: readonly Lesson[] = [
  TRIADS_LESSON,
  INVERSIONS_LESSON,
  COMMON_TONES_LESSON,
  TRAVIS_LESSON,
  SIXTHS_LESSON,
  HARMONISE_LESSON,
];
