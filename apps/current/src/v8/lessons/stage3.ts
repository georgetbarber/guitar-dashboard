/**
 * STAGE 3 · TONAL HEARING AND MELODY — authored lessons.
 *
 * Units 13–18 follow docs/CURRICULUM_MAP.md §3 (Batch 2, 24 October 2026).
 * All agent-drafted; nobody has played them on a guitar yet. Their music
 * feeds Lantern (Units 13–16), Front Step's calls and answers (Unit 17) and
 * Harbour Song's melody (Unit 18).
 */
import { score } from "../../core/score/build";
import {
  HARBOUR_MELODY_BARS,
  LANTERN_MELODY_BARS,
  OPEN_G_C_D_EM,
  WALTZ,
  lanternStrum,
  waltzBass,
  waltzFingers,
  type WaltzChord,
} from "../pieces/library";
import { DRAFT_BY_AGENT } from "../provenance";
import type { Lesson } from "./format";

const drafted = { version: 1, provenance: DRAFT_BY_AGENT, metre: "4/4" } as const;

/* ------------------------------------------------------------------ */
/* UNIT 13 · Home and departure                                         */
/* ------------------------------------------------------------------ */

const lowGDrone = score({
  ...drafted,
  id: "home-low-g-drone",
  title: "A low G held under you",
  key: "G major",
  bars: 4,
  tempo: [56, 66, 80],
  voices: { drone: { label: "Low G", text: Array.from({ length: 4 }, () => "w 6:3[lr]").join(" | ") } },
});

const homeDegrees = score({
  ...drafted,
  id: "home-degrees-g",
  title: "1–2–3–1, 1–5–1 and 1–6–5 over a low G",
  key: "G major",
  bars: 4,
  tempo: [56, 66, 80],
  voices: {
    line: { label: "Your part", text: "q 3:0 q 3:2 q 2:0 q 3:0 | q 3:0 q 2:3 h 3:0 | q 3:0 q 1:0 h 2:3 | w 3:0" },
  },
  sections: [
    ["steps", "1–2–3–1", 1, 1],
    ["fifth", "1–5–1", 2, 2],
    ["sixth", "1–6–5", 3, 3],
    ["home", "Home", 4, 4],
  ],
});

const homePhrase = score({
  ...drafted,
  id: "home-phrase-g",
  title: "Leave home and come back",
  key: "G major",
  bars: 4,
  tempo: [56, 66, 80],
  voices: {
    line: {
      label: "Your part",
      text: "e 2:0 q 3:2 q. 3:0 q r | e 1:0 q 2:3 q. 2:0 q r | e 2:3 q 2:0 q. 3:2 q r | w 3:0",
    },
  },
});

const lowDDrone = score({
  ...drafted,
  id: "home-low-d-drone",
  title: "A low D held under you",
  key: "D major",
  bars: 4,
  tempo: [56, 66, 80],
  voices: { drone: { label: "Open D", text: Array.from({ length: 4 }, () => "w 4:0[lr]").join(" | ") } },
});

const homeDegreesD = score({
  ...drafted,
  id: "home-degrees-d",
  title: "The same patterns from D",
  key: "D major",
  bars: 4,
  tempo: [56, 66, 80],
  voices: {
    line: { label: "Your part", text: "q 2:3 q 1:0 q 1:2 q 2:3 | q 2:3 q 3:2 h 2:3 | q 2:3 q 2:0 h 3:2 | w 2:3" },
  },
  derivedFrom: { id: "home-degrees-g", version: 1, changed: ["key", "pitch", "position"] },
});

export const HOME_LESSON: Lesson = {
  id: "lesson-unit-13-home",
  version: 1,
  provenance: DRAFT_BY_AGENT,
  unitId: "unit-13",
  stage: 3,
  activityKind: "technique",
  checkKind: "playing",
  title: "Where home is",
  purpose: "Hear every note as near to home or away from it, so a melody's pull becomes something you feel.",
  destination:
    "Three short patterns over a held low G, each one leaving G and coming back, and a phrase that lands home.",
  variable: "Which degree the pattern visits before it returns: the 2 and 3, the 5, or the 6.",
  capabilities: [
    {
      id: "ear.tonic.return",
      action: "listening",
      title: "Hear the pull home",
      criterion: "Hear which notes want to move and which sound settled against the held G.",
    },
    {
      id: "degree.home-away.name",
      action: "naming",
      title: "Name home and away",
      criterion: "Say for each pattern whether it ends home on 1 or away from it, before checking.",
    },
    {
      id: "play.melody.over-drone",
      action: "playing",
      title: "Play over the drone",
      criterion: "Play the patterns and the phrase in time while the low G keeps sounding.",
    },
  ],
  scores: [homeDegrees, homePhrase, lowGDrone, homeDegreesD, lowDDrone],
  accompaniment: {
    [homeDegrees.id]: [lowGDrone.id],
    [homePhrase.id]: [lowGDrone.id],
    [homeDegreesD.id]: [lowDDrone.id],
  },
  demonstration: {
    scoreId: homeDegrees.id,
    handGuidance: [
      "Everything is in open position on the G, B and high E strings: G is the open G string, A is G-string fret 2, B is the open B, D is B-string fret 3 and E is the open high E.",
      "The app holds a low G under you the whole time. Listen to each note against it: G sounds settled, B and D sound bright but stable, A and E lean.",
      "Pick each note and stop the one before it as the next one starts, so you hear each degree on its own against the drone.",
    ],
    videoNeeded: [],
  },
  studies: [
    {
      id: "degrees",
      scoreId: homeDegrees.id,
      title: "Three patterns",
      changes: "1–2–3–1, 1–5–1 and 1–6–5, a bar each, then G held for a bar.",
    },
    {
      id: "phrase",
      scoreId: homePhrase.id,
      title: "Leave and come back",
      changes: "A four-bar phrase in the Lantern rhythm that goes away from G and lands home in the last bar.",
    },
  ],
  successCriteria: [
    "Play the three patterns over the drone with each note on its count.",
    "Say for each pattern whether it ended home or away, before checking.",
    "Play the phrase and hear it land home in the last bar.",
  ],
  likelyErrors: [
    {
      id: "everything-sounds-home",
      signal: "Every note sounds equally settled to me.",
      repair:
        "Hum the drone note, then play only bar 1 slowly, holding each note for a full count and listening for which one wants to move. Then play all four bars.",
      scoreId: homeDegrees.id,
      from: 0,
      to: 192,
    },
    {
      id: "lost-on-strings",
      signal: "I can't find the notes without looking.",
      repair:
        "Say the string and fret aloud before each note: open G, G-string 2, open B, open G. Loop bars 1 and 2 slowly, then all four.",
      scoreId: homeDegrees.id,
      from: 0,
      to: 384,
    },
  ],
  cueFading: [
    {
      id: "hear-the-patterns",
      phase: "learn",
      cues: "full",
      scoreId: homeDegrees.id,
      instruction: "Hear each pattern over the drone and sing its last note before you play along.",
    },
    {
      id: "phrase-with-count",
      phase: "practise",
      cues: "count-only",
      scoreId: homePhrase.id,
      instruction: "Play the phrase beside the click and the drone, saying “home” when it lands on G.",
    },
    {
      id: "patterns-unaided",
      phase: "try-unaided",
      cues: "none",
      scoreId: homeDegrees.id,
      instruction: "Count in and play the three patterns with the tab hidden, then say which ended home.",
    },
  ],
  retrieval: {
    afterDays: 1,
    scoreId: homeDegrees.id,
    tempo: 66,
    instruction: "On another day, play the three patterns from memory over the drone and name each degree.",
  },
  transfer: {
    scoreId: homeDegreesD.id,
    instruction:
      "Play the same three patterns from D with an open D held under you. D is B-string fret 3; the 5 and the 6 now sit below it, on the G and B strings.",
    changed: ["key", "pitch", "position"],
  },
  performance: {
    kind: "piece",
    pieceId: "piece-lantern",
    partId: "lantern-drone",
    instruction: "Hold the open-G drone under Lantern while its melody leaves home and comes back.",
  },
};

/* ------------------------------------------------------------------ */
/* UNIT 14 · Degrees have character                                     */
/* ------------------------------------------------------------------ */

const pentatonicG = score({
  ...drafted,
  id: "pentatonic-g-shape",
  title: "G major pentatonic: 1 2 3 5 6",
  key: "G major",
  bars: 4,
  tempo: [56, 66, 84],
  voices: {
    line: {
      label: "Your part",
      text: "q 6:3 q 6:5 q 5:2 q 5:5 | q 4:2 q 4:5 q 3:2 q 3:4 | q 3:2 q 4:5 q 4:2 q 5:5 | q 5:2 q 6:5 h 6:3",
    },
  },
});

const leaningDegrees = score({
  ...drafted,
  id: "pentatonic-g-leaning",
  title: "The 4 and the 7 lean",
  key: "G major",
  bars: 4,
  tempo: [56, 66, 84],
  voices: {
    line: { label: "Your part", text: "q 5:2 q 5:3 h 5:2 | q 4:5 q 4:4 h 4:5 | q 5:5 q 4:2 q 4:5 q 3:2 | w 4:5" },
  },
});

const pentatonicA = score({
  ...drafted,
  id: "pentatonic-a-shape",
  title: "The same shape from A",
  key: "A major",
  bars: 4,
  tempo: [56, 66, 84],
  voices: {
    line: {
      label: "Your part",
      text: "q 6:5 q 6:7 q 5:4 q 5:7 | q 4:4 q 4:7 q 3:4 q 3:6 | q 3:4 q 4:7 q 4:4 q 5:7 | q 5:4 q 6:7 h 6:5",
    },
  },
  derivedFrom: { id: "pentatonic-g-shape", version: 1, changed: ["key", "position"] },
});

export const PENTATONIC_LESSON: Lesson = {
  id: "lesson-unit-14-pentatonic",
  version: 1,
  provenance: DRAFT_BY_AGENT,
  unitId: "unit-14",
  stage: 3,
  activityKind: "technique",
  checkKind: "playing",
  title: "Five notes around a root",
  purpose: "Know a handful of notes by what they do around home, in one shape you can carry to any key.",
  destination:
    "The G major pentatonic shape up and down by degree, then the 4 and the 7 leaning back to their neighbours.",
  variable: "Which degrees are in play: the five safe ones, then the two that lean.",
  capabilities: [
    {
      id: "fretboard.major-pentatonic.locate",
      action: "locating",
      title: "Find the shape",
      criterion: "Find both G roots in the shape and play it up and down without looking.",
    },
    {
      id: "degree.character.name",
      action: "naming",
      title: "Name each degree",
      criterion: "Say 1, 2, 3, 5 or 6 for each note as you play it, and name the 4 and the 7.",
    },
    {
      id: "ear.degree.identify",
      action: "listening",
      title: "Hear the leaning notes",
      criterion: "Hear that the 4 wants to fall to the 3 and the 7 wants to rise to the 1.",
    },
  ],
  scores: [pentatonicG, leaningDegrees, pentatonicA],
  demonstration: {
    scoreId: pentatonicG.id,
    handGuidance: [
      "The shape covers frets 2 to 5, one finger per fret: first finger on fret 2, fourth on fret 5. The roots are G on the low E at fret 3 and on the D string at fret 5.",
      "Say the degree as you play each note: 1, 2, 3, 5, 6, 1. There is no 4 and no 7 in this shape, which is why every note sounds safe over G.",
      "In the second study the 4 (C, A-string fret 3) and the 7 (F♯, D-string fret 4) lean: each one wants to step back to the note beside it.",
    ],
    videoNeeded: [],
  },
  studies: [
    {
      id: "shape",
      scoreId: pentatonicG.id,
      title: "The five-note shape",
      changes: "G major pentatonic up from the low G to B on the G string, and back down, by degree.",
    },
    {
      id: "leaning",
      scoreId: leaningDegrees.id,
      title: "The 4 and the 7",
      changes: "3–4–3 and 1–7–1: the two notes the shape leaves out, each leaning back home.",
    },
  ],
  successCriteria: [
    "Play the shape up and down in time, naming each degree as you go.",
    "Find both G roots in the shape without looking.",
    "Play the 4 and the 7 and let each one resolve to its neighbour.",
  ],
  likelyErrors: [
    {
      id: "lose-the-root",
      signal: "I lose track of which note is the root.",
      repair:
        "Play only the two roots, low E fret 3 and D-string fret 5, then the notes between them, saying 1 2 3 5 6 1. Loop bars 1 and 2, then the whole shape.",
      scoreId: pentatonicG.id,
      from: 0,
      to: 384,
    },
    {
      id: "fingers-stretch",
      signal: "My hand can't reach fret 5 comfortably.",
      repair:
        "Let the fourth finger take fret 5 and keep the first on fret 2, with the thumb low behind the neck. Play bar 1 slowly, then the whole shape.",
      scoreId: pentatonicG.id,
      from: 0,
      to: 192,
    },
  ],
  cueFading: [
    {
      id: "hear-the-shape",
      phase: "learn",
      cues: "full",
      scoreId: pentatonicG.id,
      instruction: "Hear the shape up and down, then play along, naming each degree aloud.",
    },
    {
      id: "leaning-with-count",
      phase: "practise",
      cues: "count-only",
      scoreId: leaningDegrees.id,
      instruction: "Play the leaning notes beside the click alone, holding each 4 and 7 until it resolves.",
    },
    {
      id: "shape-unaided",
      phase: "try-unaided",
      cues: "none",
      scoreId: pentatonicG.id,
      instruction: "Count in and play the shape up and down with the tab hidden, naming each degree.",
    },
  ],
  retrieval: {
    afterDays: 1,
    scoreId: pentatonicG.id,
    tempo: 66,
    instruction: "On another day, play the shape from memory starting on either root, naming the degrees.",
  },
  transfer: {
    scoreId: pentatonicA.id,
    instruction:
      "Move the whole shape up two frets so the root is A on the low E at fret 5. Every finger keeps its job and every degree its place.",
    changed: ["key", "position"],
  },
  performance: {
    kind: "piece",
    pieceId: "piece-lantern",
    partId: "lantern-melody",
    instruction: "Play Lantern's melody: it is built from these five notes, with the 4 and the 7 added.",
  },
};

/* ------------------------------------------------------------------ */
/* UNIT 15 · Make a motif                                               */
/* ------------------------------------------------------------------ */

const motifRhythm = score({
  ...drafted,
  id: "motif-rhythm-then-notes",
  title: "The motif's rhythm, then its notes",
  key: "G major",
  bars: 2,
  tempo: [60, 72, 88],
  voices: { line: { label: "Your part", text: `e 3:0 q 3:0 q. 3:0 q r | ${LANTERN_MELODY_BARS[0]}` } },
  sections: [
    ["rhythm", "Rhythm on one note", 1, 1],
    ["motif", "The motif", 2, 2],
  ],
});

const motifThreeWays = score({
  ...drafted,
  id: "motif-three-ways",
  title: "The motif, its rhythm changed, its contour changed",
  key: "G major",
  bars: 4,
  tempo: [60, 72, 88],
  voices: {
    line: {
      label: "Your part",
      text: `${LANTERN_MELODY_BARS[0]} | q 2:0 e 3:2 e 3:0 h r | e 2:0 q 3:2 q. 2:3 q r | ${LANTERN_MELODY_BARS[0]}`,
    },
  },
  sections: [
    ["motif", "The motif", 1, 1],
    ["rhythm", "New rhythm, same notes", 2, 2],
    ["contour", "Same rhythm, new last note", 3, 3],
    ["again", "The motif again", 4, 4],
  ],
});

const motifInD = score({
  ...drafted,
  id: "motif-in-d",
  title: "The motif from D",
  key: "D major",
  bars: 2,
  tempo: [60, 72, 88],
  voices: { line: { label: "Your part", text: "e 1:2 q 1:0 q. 2:3 q r | e 1:2 q 1:0 q. 1:5 q r" } },
  derivedFrom: { id: "motif-rhythm-then-notes", version: 1, changed: ["key", "pitch"] },
});

export const MOTIF_LESSON: Lesson = {
  id: "lesson-unit-15-motif",
  version: 1,
  provenance: DRAFT_BY_AGENT,
  unitId: "unit-15",
  stage: 3,
  activityKind: "technique",
  checkKind: "playing",
  title: "One small idea, three ways",
  purpose: "Make a three-note idea memorable through its rhythm, then change it without losing it.",
  destination:
    "Lantern's motif, B–A–G with its own rhythm, then the same motif with a new rhythm and with a new last note.",
  variable: "One dimension of the motif at a time: its rhythm, then its contour.",
  capabilities: [
    {
      id: "phrase.motif.play",
      action: "playing",
      title: "Play the motif",
      criterion: "Play B, A, G with the motif's rhythm, the last note held from the “and” of 2.",
    },
    {
      id: "rhythm.motif.identity",
      action: "timing",
      title: "Keep its rhythm",
      criterion: "Tap the motif's rhythm on one note, then keep exactly that rhythm when the notes are added.",
    },
    {
      id: "ear.motif.variation",
      action: "listening",
      title: "Hear what changed",
      criterion: "Hear whether a variation changed the rhythm or the notes, and still recognise the motif.",
    },
  ],
  scores: [motifRhythm, motifThreeWays, motifInD],
  demonstration: {
    scoreId: motifRhythm.id,
    handGuidance: [
      "Tap the rhythm first: a short note on 1, a longer one on the “and” of 1, a held note from the “and” of 2, then a rest on 4.",
      "Then put the notes in: B (open B string), A (G-string fret 2), G (open G string). The rhythm does not change.",
      "The held note starts between the beats; count “1 and 2 and” aloud so it does not slip onto count 2 or 3.",
    ],
    videoNeeded: [],
  },
  studies: [
    {
      id: "rhythm-first",
      scoreId: motifRhythm.id,
      title: "Rhythm first",
      changes: "The motif's rhythm on the open G, then the same rhythm on B, A and G.",
    },
    {
      id: "three-ways",
      scoreId: motifThreeWays.id,
      title: "Three ways",
      changes: "The motif, then its notes in a new rhythm, then its rhythm with the last note moved up to D.",
    },
  ],
  successCriteria: [
    "Tap the motif's rhythm, then play it on B, A and G with the rhythm unchanged.",
    "Play the three versions and say what changed in each: the rhythm, or the notes.",
    "Keep the rest on count 4 in every bar.",
  ],
  likelyErrors: [
    {
      id: "rhythm-squares-off",
      signal: "The motif turns into even notes.",
      repair:
        "Count eighths aloud, 1 & 2 & 3 & 4 &, and tap the rhythm on one note: 1, &, then the long note from the & of 2. Loop bar 1, then play both bars.",
      scoreId: motifRhythm.id,
      from: 0,
      to: 192,
    },
    {
      id: "variation-unrecognisable",
      signal: "My variation doesn't sound like the motif any more.",
      repair:
        "Change one thing at a time: keep the notes and change the rhythm (bar 2), or keep the rhythm and change the last note (bar 3). Loop bars 2 and 3, then all four.",
      scoreId: motifThreeWays.id,
      from: 192,
      to: 576,
    },
  ],
  cueFading: [
    {
      id: "hear-the-motif",
      phase: "learn",
      cues: "full",
      scoreId: motifRhythm.id,
      instruction: "Hear the rhythm on one note and then the motif; tap the rhythm before you play it.",
    },
    {
      id: "variations-with-count",
      phase: "practise",
      cues: "count-only",
      scoreId: motifThreeWays.id,
      instruction: "Play the three versions beside the click alone, keeping the rest on count 4.",
    },
    {
      id: "variations-unaided",
      phase: "try-unaided",
      cues: "none",
      scoreId: motifThreeWays.id,
      instruction: "Count in and play all four bars with the tab hidden, then say what changed in bars 2 and 3.",
    },
  ],
  retrieval: {
    afterDays: 1,
    scoreId: motifRhythm.id,
    tempo: 72,
    instruction: "On another day, tap the motif's rhythm from memory, then play it and one variation of your own.",
  },
  transfer: {
    scoreId: motifInD.id,
    instruction:
      "Play the same motif from D: F♯, E, D on the high E and B strings with the same rhythm. Then change only its last note, up to A on the high E at fret 5.",
    changed: ["key", "pitch"],
  },
  performance: {
    kind: "piece",
    pieceId: "piece-lantern",
    partId: "lantern-melody",
    instruction:
      "Play Lantern's melody: every bar but the last opens with the motif's rhythm and falls, as the motif does.",
  },
};

/* ------------------------------------------------------------------ */
/* UNIT 16 · Phrase toward a destination                                */
/* ------------------------------------------------------------------ */

const ENDINGS_HARMONY = [
  [1, 1, "G", "I"],
  [2, 1, "C", "IV"],
  [3, 1, "D", "V"],
  [5, 1, "Em", "vi"],
  [6, 1, "C", "IV"],
  [7, 1, "D", "V"],
  [8, 1, "G", "I"],
] as const;

const endingsMelody = score({
  ...drafted,
  id: "endings-lantern-melody",
  title: "Two phrases, two endings",
  key: "G major",
  bars: 8,
  tempo: [60, 72, 88],
  voices: { melody: { label: "Your part", text: LANTERN_MELODY_BARS.join(" | ") } },
  sections: [
    ["open", "Phrase 1 · stops on 2", 1, 4],
    ["settled", "Phrase 2 · comes home to 1", 5, 8],
  ],
  harmony: ENDINGS_HARMONY,
});

const endingsChords = score({
  ...drafted,
  id: "endings-lantern-chords",
  title: "The chords under the two phrases",
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
  harmony: ENDINGS_HARMONY,
});

const { Em: _em, ...G_C_D } = OPEN_G_C_D_EM;

const strumGCDG = score({
  ...drafted,
  id: "strum-g-c-d-g",
  title: "Strum I–IV–V–I: G, C, D, G",
  key: "G major",
  bars: 4,
  tempo: [60, 72, 88],
  voicings: G_C_D,
  voices: { chords: { label: "Chords", text: ["G", "C", "D"].map(lanternStrum).concat("w D:G").join(" | ") } },
  harmony: [
    [1, 1, "G", "I"],
    [2, 1, "C", "IV"],
    [3, 1, "D", "V"],
    [4, 1, "G", "I"],
  ],
});

const strumTune = score({
  ...drafted,
  id: "strum-tune-g",
  title: "The tune over your chords",
  key: "G major",
  bars: 4,
  tempo: [60, 72, 88],
  voices: {
    melody: {
      label: "Tune",
      text: [LANTERN_MELODY_BARS[0], LANTERN_MELODY_BARS[1], LANTERN_MELODY_BARS[6], LANTERN_MELODY_BARS[7]].join(
        " | ",
      ),
    },
  },
});

const endingsInD = score({
  ...drafted,
  id: "endings-in-d",
  title: "A phrase that comes home to D",
  key: "D major",
  bars: 4,
  tempo: [60, 72, 88],
  voices: {
    melody: {
      label: "Your part",
      text: "e 1:2 q 1:0 q. 2:3 q r | e 2:0 q 3:2 q. 3:0 q r | e 2:2 q 2:0 q. 3:2 q r | w 2:3",
    },
  },
  harmony: [
    [1, 1, "D", "I"],
    [2, 1, "G", "IV"],
    [3, 1, "A", "V"],
    [4, 1, "D", "I"],
  ],
  derivedFrom: { id: "endings-lantern-melody", version: 1, changed: ["key", "pitch"] },
});

const endingsInDChords = score({
  ...drafted,
  id: "endings-d-chords",
  title: "D, G, A, D under the phrase",
  key: "D major",
  bars: 4,
  tempo: [60, 72, 88],
  voicings: {
    D: OPEN_G_C_D_EM.D,
    G: OPEN_G_C_D_EM.G,
    A: { symbol: "A", shape: "x02220", fingers: "x-123-" },
  },
  voices: { chords: { label: "Chords", text: ["D", "G", "A"].map(lanternStrum).concat("w D:D").join(" | ") } },
});

export const ENDINGS_LESSON: Lesson = {
  id: "lesson-unit-16-endings",
  version: 1,
  provenance: DRAFT_BY_AGENT,
  unitId: "unit-16",
  stage: 3,
  activityKind: "technique",
  checkKind: "playing",
  title: "Two endings",
  purpose: "Make a phrase point somewhere: stop it open like a question, or bring it home like an answer.",
  destination: "Lantern's eight bars: the first phrase stops open on A over D, the second comes home to G.",
  variable: "The degree a phrase lands on at its end: 2 (open) or 1 (settled).",
  capabilities: [
    {
      id: "ear.ending.settled-open",
      action: "listening",
      title: "Hear open and settled",
      criterion: "Hear that the phrase ending on A asks for more, and the one ending on G is finished.",
    },
    {
      id: "degree.landing.name",
      action: "naming",
      title: "Name the landing degree",
      criterion: "Say which degree each phrase ends on, 2 or 1, and which chord is under it.",
    },
    {
      id: "phrase.target.degree",
      action: "playing",
      title: "Aim for the ending",
      criterion: "Play both phrases so each lands on its last note on time, open then home.",
    },
    {
      id: "chord.g-c-d.strum",
      action: "playing",
      title: "Strum G, C and D",
      criterion: "Strum G, C, D and G with every change landing on count 1 while the tune plays.",
    },
  ],
  scores: [endingsMelody, endingsChords, strumGCDG, strumTune, endingsInD, endingsInDChords],
  accompaniment: {
    [endingsMelody.id]: [endingsChords.id],
    [strumGCDG.id]: [strumTune.id],
    [endingsInD.id]: [endingsInDChords.id],
  },
  demonstration: {
    scoreId: endingsMelody.id,
    handGuidance: [
      "Phrase 1 stops on A (G-string fret 2), the 2 of G, over a D chord: it sounds like a question. Phrase 2 stops on G, the 1, over G: an answer.",
      "D is the course's first D chord: xx0232. First finger on the G string at fret 2, second on the high E at fret 2, third on the B string at fret 3. Strum only the top four strings.",
      "Strum down, down-up, miss, up, and let the last up-strum ring while the hand moves to the next chord.",
    ],
    videoNeeded: [],
  },
  studies: [
    {
      id: "endings",
      scoreId: endingsMelody.id,
      title: "Two endings",
      changes: "The eight-bar melody with the chords: phrase 1 stops on A, phrase 2 on G.",
    },
    {
      id: "strum",
      scoreId: strumGCDG.id,
      title: "Strum I–IV–V–I",
      changes: "You strum G, C, D and G while the app plays the tune: the harmony under the endings.",
    },
  ],
  successCriteria: [
    "Play both phrases, stopping on A at the end of phrase 1 and on G at the end of phrase 2.",
    "Name the last degree of each phrase, 2 or 1, and say which sounds finished.",
    "Strum G, C, D and G with every change landing on count 1 while the app plays the tune.",
  ],
  likelyErrors: [
    {
      id: "endings-sound-same",
      signal: "Both endings sound the same to me.",
      repair:
        "Loop bar 4, the end of phrase 1, and sing the note you expect next; it wants to go on. Then play all eight bars and hear bar 8 stop.",
      scoreId: endingsMelody.id,
      from: 576,
      to: 768,
    },
    {
      id: "d-chord-late",
      signal: "The D chord arrives late.",
      repair:
        "Mute the strings and practise only the move from C to D on count 1, placing the first finger first. Loop bars 2 and 3 at the slowest tempo, then all four bars.",
      scoreId: strumGCDG.id,
      from: 192,
      to: 576,
    },
  ],
  cueFading: [
    {
      id: "hear-the-endings",
      phase: "learn",
      cues: "full",
      scoreId: endingsMelody.id,
      instruction: "Hear both phrases with the chords and sing the last note of each before it sounds.",
    },
    {
      id: "strum-with-count",
      phase: "practise",
      cues: "count-only",
      scoreId: strumGCDG.id,
      instruction: "Strum the four chords beside the click while the app plays the tune.",
    },
    {
      id: "endings-unaided",
      phase: "try-unaided",
      cues: "none",
      scoreId: endingsMelody.id,
      instruction: "Count in and play the eight bars with the tab hidden: stop phrase 1 open and bring phrase 2 home.",
    },
  ],
  retrieval: {
    afterDays: 1,
    scoreId: endingsMelody.id,
    tempo: 72,
    instruction: "On another day, play both phrases from memory and name the degree each one ends on.",
  },
  transfer: {
    scoreId: endingsInD.id,
    instruction:
      "In D, over D, G, A and D: F♯ E D, then B A G, then C♯ B A, then home to D on the B string. Then play it again ending on E instead, and hear it stay open.",
    changed: ["key", "pitch"],
  },
  performance: {
    kind: "piece",
    pieceId: "piece-lantern",
    partId: "lantern-melody",
    instruction: "Play Lantern's melody with the second guitar: this is the Stage 3 capstone.",
  },
};

/* ------------------------------------------------------------------ */
/* UNIT 17 · Answer what you hear                                       */
/* ------------------------------------------------------------------ */

const pentatonicE = score({
  ...drafted,
  id: "pentatonic-e-open",
  title: "E minor pentatonic in open position",
  key: "E minor",
  bars: 4,
  tempo: [60, 72, 90],
  voices: {
    line: {
      label: "Your part",
      text: "q 6:0 q 6:3 q 5:0 q 5:2 | q 4:0 q 4:2 q 3:0 q 3:2 | q 2:0 q 2:3 q 1:0 q 1:3 | w 1:0",
    },
  },
});

const callE = score({
  ...drafted,
  id: "call-e-two-bars",
  title: "The call",
  key: "E minor",
  bars: 4,
  tempo: [60, 72, 90],
  voices: { call: { label: "Call", text: "q r e 2:3 e 1:0 q 1:3 q 1:0 | h 2:0 h r | w r | w r" } },
});

const answerE = score({
  ...drafted,
  id: "answer-e-two-bars",
  title: "An answer to the call",
  key: "E minor",
  bars: 4,
  tempo: [60, 72, 90],
  voices: { answer: { label: "Your answer", text: "w r | w r | q r e 3:2 e 3:0 q 2:0 q 3:2 | h 4:2 h r" } },
  sections: [
    ["listen", "Listen to the call", 1, 2],
    ["answer", "Answer", 3, 4],
  ],
});

const curl = score({
  ...drafted,
  id: "minor-third-curl",
  title: "The ♭3 curled toward the 3",
  key: "E minor",
  bars: 2,
  tempo: [60, 72, 90],
  voices: { line: { label: "Your part", text: "q 1:0 q 1:3[b.5r] h 1:0 | q 2:3 q 1:3[b.5r] h 1:0" } },
});

const callA = score({
  ...drafted,
  id: "call-a-two-bars",
  title: "A call in A",
  key: "A minor",
  bars: 4,
  tempo: [60, 72, 90],
  voices: { call: { label: "Call", text: "q r e 2:1 e 2:3 q 1:0 q 2:3 | h 3:2 h r | w r | w r" } },
});

const answerA = score({
  ...drafted,
  id: "answer-a-two-bars",
  title: "An answer in A minor pentatonic",
  key: "A minor",
  bars: 4,
  tempo: [60, 72, 90],
  voices: { answer: { label: "Your answer", text: "w r | w r | q r e 3:0 e 3:2 q 2:1 q 3:2 | h 5:0 h r" } },
  sections: [
    ["listen", "Listen to the call", 1, 2],
    ["answer", "Answer", 3, 4],
  ],
  derivedFrom: { id: "answer-e-two-bars", version: 1, changed: ["key", "pitch"] },
});

export const CALL_ANSWER_LESSON: Lesson = {
  id: "lesson-unit-17-call-answer",
  version: 1,
  provenance: DRAFT_BY_AGENT,
  unitId: "unit-17",
  stage: 3,
  activityKind: "technique",
  checkKind: "playing",
  title: "Call and answer",
  purpose: "Hear a short blues phrase and answer it in the same language without copying it.",
  destination:
    "A two-bar call in E minor pentatonic answered by two bars of your own, with the G curled a little sharp.",
  variable: "Who speaks: the call is given, the answer is yours.",
  capabilities: [
    {
      id: "fretboard.minor-pentatonic.open-e",
      action: "locating",
      title: "Find the open shape",
      criterion: "Play E minor pentatonic from the open low E to G on the high E, naming 1, ♭3, 4, 5 and ♭7.",
    },
    {
      id: "ear.call.imitate",
      action: "listening",
      title: "Hear the call",
      criterion: "Hear the call's rhythm and its last note well enough to sing it back.",
    },
    {
      id: "phrase.answer.play",
      action: "playing",
      title: "Answer it",
      criterion: "Play an answer in the next two bars that keeps the call's feel but takes a different path.",
    },
    {
      id: "play.minor-third.curl",
      action: "playing",
      title: "Curl the ♭3",
      criterion: "Push the G on the high E a quarter-tone sharp and let it fall back, without a full bend.",
    },
  ],
  scores: [pentatonicE, answerE, curl, callE, answerA, callA],
  accompaniment: { [answerE.id]: [callE.id], [answerA.id]: [callA.id] },
  demonstration: {
    scoreId: pentatonicE.id,
    handGuidance: [
      "E minor pentatonic in open position is five notes around E: 1 (E), ♭3 (G), 4 (A), 5 (B) and ♭7 (D). Every open string belongs to it; the others are at frets 2 and 3.",
      "First finger for fret 2, second or third finger for fret 3, so the hand stays in one place.",
      "The curl: as you play G on the high E at fret 3, push the string very slightly toward the ceiling so it rises a quarter-tone, halfway to G♯, then let it fall back. It is a colour, not a bend.",
    ],
    videoNeeded: ["bends"],
  },
  studies: [
    {
      id: "shape",
      scoreId: pentatonicE.id,
      title: "The open shape",
      changes: "E minor pentatonic up through all six strings, by degree.",
    },
    {
      id: "answer",
      scoreId: answerE.id,
      title: "Call and answer",
      changes:
        "The app plays a two-bar call; you answer in the next two bars with the same rhythm, starting lower and ending on E at D-string fret 2.",
    },
    {
      id: "curl",
      scoreId: curl.id,
      title: "The curl",
      changes: "The G on the high E curled toward G♯ twice, landing back on the open E.",
    },
  ],
  successCriteria: [
    "Play the shape up from the open low E, naming each degree.",
    "Hear the call and play the answer in the next two bars, in time.",
    "Curl the G a little sharp and let it fall back, without bending it a full fret.",
  ],
  likelyErrors: [
    {
      id: "answer-copies",
      signal: "My answer just repeats the call.",
      repair:
        "Keep the call's rhythm but start your answer lower, on the G string, and end on E at D-string fret 2. Loop bars 3 and 4 slowly, then play the whole exchange.",
      scoreId: answerE.id,
      from: 384,
      to: 768,
    },
    {
      id: "curl-too-far",
      signal: "The curl turns into a full bend.",
      repair:
        "Use the third finger with the second behind it and push only until the note just starts to rise, then let go. Loop the first bar slowly, then both.",
      scoreId: curl.id,
      from: 0,
      to: 192,
    },
  ],
  cueFading: [
    {
      id: "hear-the-shape",
      phase: "learn",
      cues: "full",
      scoreId: pentatonicE.id,
      instruction: "Hear the scale from the low E, then play along naming each degree.",
    },
    {
      id: "answer-with-count",
      phase: "practise",
      cues: "count-only",
      scoreId: answerE.id,
      instruction: "Hear the call, then play the answer in the next two bars beside the click.",
    },
    {
      id: "answer-unaided",
      phase: "try-unaided",
      cues: "none",
      scoreId: answerE.id,
      instruction:
        "Count in, listen to the call and play the answer with the tab hidden. Then play one answer of your own.",
    },
  ],
  retrieval: {
    afterDays: 1,
    scoreId: answerE.id,
    tempo: 72,
    instruction: "On another day, answer the call from memory, then make up a second answer.",
  },
  transfer: {
    scoreId: answerA.id,
    instruction:
      "Answer a new call in A minor pentatonic, open position: the root is now the open A string, so the answer ends there.",
    changed: ["key", "pitch"],
  },
  performance: {
    kind: "piece",
    pieceId: "piece-front-step",
    partId: "front-step-calls",
    instruction: "Play Front Step's calls and answers over the second guitar's 12-bar.",
  },
};

/* ------------------------------------------------------------------ */
/* UNIT 18 · Find a melody by ear                                       */
/* ------------------------------------------------------------------ */

const waltz = { ...drafted, metre: "3/4" } as const;
const HARBOUR_CHORDS: WaltzChord[] = ["C", "Am", "Fmaj7", "G", "C", "Am", "G"];

const byEarMelody = score({
  ...waltz,
  id: "by-ear-harbour-melody",
  title: "Harbour Song's melody",
  key: "C major",
  bars: 8,
  tempo: [60, 72, 90],
  voices: { melody: { label: "Your part", text: HARBOUR_MELODY_BARS.join(" | ") } },
});

const byEarArpeggio = score({
  ...waltz,
  id: "by-ear-harbour-arpeggio",
  title: "The waltz arpeggio under the melody",
  key: "C major",
  bars: 8,
  tempo: [60, 72, 90],
  voices: {
    fingers: {
      label: "Fingers",
      text: HARBOUR_CHORDS.map(waltzFingers)
        .concat(`e r e ${WALTZ.C.i}@i[lr] e ${WALTZ.C.m}@m[lr] q. ${WALTZ.C.a}@a`)
        .join(" | "),
    },
    thumb: { label: "Thumb", text: HARBOUR_CHORDS.map(waltzBass).concat(waltzBass("C")).join(" | ") },
  },
});

const byEarRhythm = score({
  ...waltz,
  id: "by-ear-harbour-rhythm",
  title: "The melody's rhythm on one note",
  key: "C major",
  bars: 8,
  tempo: [60, 72, 90],
  voices: {
    line: {
      label: "Your part",
      text: HARBOUR_MELODY_BARS.map((bar) => bar.replace(/\d:\d+/g, "1:0")).join(" | "),
    },
  },
});

const byEarInG = score({
  ...waltz,
  id: "by-ear-waltz-g",
  title: "A new waltz tune in G",
  key: "G major",
  bars: 4,
  tempo: [60, 72, 90],
  voices: { melody: { label: "Your part", text: "h 2:0 q 3:2 | q 3:0 q 2:0 q 2:3 | h 2:3 q 2:1 | h. 3:0" } },
});

export const BY_EAR_LESSON: Lesson = {
  id: "lesson-unit-18-by-ear",
  version: 1,
  provenance: DRAFT_BY_AGENT,
  unitId: "unit-18",
  stage: 3,
  activityKind: "technique",
  checkKind: "playing",
  title: "Find it by ear",
  purpose: "Get a tune from your head to the guitar: rhythm first, then degrees, then the strings and frets.",
  destination: "Harbour Song's eight-bar waltz melody, found by ear and played over its arpeggio.",
  variable: "What you find first: the rhythm, then the notes.",
  capabilities: [
    {
      id: "ear.melody.find",
      action: "listening",
      title: "Hear the next note",
      criterion: "Sing the melody and hear whether each next note goes up or down, and roughly how far.",
    },
    {
      id: "fretboard.melody.by-ear",
      action: "locating",
      title: "Find it on the strings",
      criterion: "Find each note of the first four bars on the B and high E strings before looking at the tab.",
    },
    {
      id: "rhythm.waltz.three",
      action: "timing",
      title: "Count in three",
      criterion: "Feel ONE two three under the melody and place its long notes on ONE.",
    },
  ],
  scores: [byEarMelody, byEarRhythm, byEarArpeggio, byEarInG],
  accompaniment: { [byEarMelody.id]: [byEarArpeggio.id], [byEarRhythm.id]: [byEarArpeggio.id] },
  demonstration: {
    scoreId: byEarMelody.id,
    handGuidance: [
      "Count in three: ONE two three. Every bar starts with the bass, and the melody's long notes sit on ONE.",
      "The melody lives on the B and high E strings in open position, apart from the A at the 5th fret of the high E: reach it with the fourth finger, or move the hand up for it.",
      "Find each note by singing it first, guessing its degree in C, then trying the string and fret you think it is. The tab confirms it afterwards.",
    ],
    videoNeeded: [],
  },
  studies: [
    {
      id: "rhythm",
      scoreId: byEarRhythm.id,
      title: "The rhythm on one note",
      changes: "The melody's rhythm played on the open high E with the arpeggio, so you can hear its shape in time.",
    },
    {
      id: "melody",
      scoreId: byEarMelody.id,
      title: "The melody",
      changes: "The real notes, on the B and high E strings, over the arpeggio.",
    },
  ],
  successCriteria: [
    "Tap the melody's rhythm in three with the arpeggio playing.",
    "Find the first four bars by ear before looking, then check them against the tab.",
    "Play all eight bars in time with the arpeggio.",
  ],
  likelyErrors: [
    {
      id: "cannot-find-note",
      signal: "I can't find a note by ear.",
      repair:
        "Sing the note, then sing down to C, home, counting the steps: two steps down means it is the 3, E. Loop bar 1 slowly, then bars 1 to 4.",
      scoreId: byEarMelody.id,
      from: 0,
      to: 144,
    },
    {
      id: "three-feels-like-four",
      signal: "I keep counting four.",
      repair:
        "Count ONE two three aloud with the arpeggio and tap only on ONE. Loop the first two bars of the rhythm study, then all eight.",
      scoreId: byEarRhythm.id,
      from: 0,
      to: 288,
    },
  ],
  cueFading: [
    {
      id: "hear-the-melody",
      phase: "learn",
      cues: "full",
      scoreId: byEarMelody.id,
      instruction: "Hear the melody over the arpeggio twice and sing it before you look at the tab.",
    },
    {
      id: "rhythm-with-count",
      phase: "practise",
      cues: "count-only",
      scoreId: byEarRhythm.id,
      instruction: "Tap the rhythm on the open high E beside the click, then sing the melody over it.",
    },
    {
      id: "melody-unaided",
      phase: "try-unaided",
      cues: "none",
      scoreId: byEarMelody.id,
      instruction: "Count in and play the melody with the tab hidden, finding each note by ear.",
    },
  ],
  retrieval: {
    afterDays: 1,
    scoreId: byEarMelody.id,
    tempo: 72,
    instruction: "On another day, sing the melody, then find it again on the guitar without the tab.",
  },
  transfer: {
    scoreId: byEarInG.id,
    instruction:
      "Find a new waltz tune in G by ear: hear it, sing it, then find it on the G and B strings. It ends on the open G string.",
    changed: ["key", "pitch"],
  },
  performance: {
    kind: "piece",
    pieceId: "piece-harbour-song",
    partId: "harbour-song-melody",
    instruction: "Play Harbour Song's melody while the other guitar plays the waltz arpeggio.",
  },
};

export const LESSONS: readonly Lesson[] = [
  HOME_LESSON,
  PENTATONIC_LESSON,
  MOTIF_LESSON,
  ENDINGS_LESSON,
  CALL_ANSWER_LESSON,
  BY_EAR_LESSON,
];
