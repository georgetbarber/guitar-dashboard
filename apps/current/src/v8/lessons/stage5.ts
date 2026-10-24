/**
 * STAGE 5 · GROOVE AND MUSICAL LANGUAGE — authored lessons.
 *
 * Units 25–30 follow docs/CURRICULUM_MAP.md §3 (Batch 3). All agent-drafted;
 * nobody has played them on a guitar yet. Their music feeds Low Road's
 * single-note riff and its development (Units 25, 28), Night Market (26, 28),
 * Front Step's solo chorus and boogie (27, 29), and Unit 30's listening check
 * on the three feels.
 */
import { score } from "../../core/score/build";
import {
  BOOGIE,
  LOW_SINGLE,
  NIGHT_BASS,
  NIGHT_PARTIALS,
  NIGHT_RIFF,
  POWER,
  nightGroove,
  riffBar,
  riffTurn,
} from "../pieces/library";
import { DRAFT_BY_AGENT } from "../provenance";
import type { Lesson } from "./format";

const drafted = { version: 1, provenance: DRAFT_BY_AGENT, metre: "4/4" } as const;
const { A5, C5, D5, E5, G5, A5_LOW } = POWER;

/* ------------------------------------------------------------------ */
/* UNIT 25 · A riff is rhythm plus contour                              */
/* ------------------------------------------------------------------ */

const singleRiff = score({
  ...drafted,
  id: "single-riff-a",
  title: "The riff as single notes",
  key: "A minor",
  bars: 4,
  tempo: [60, 76, 112],
  voices: {
    riff: {
      label: "Your part",
      text: [LOW_SINGLE.riff, LOW_SINGLE.riff, LOW_SINGLE.riff, LOW_SINGLE.turn].join(" | "),
    },
  },
});

const singlePicked = score({
  ...drafted,
  id: "single-riff-picked",
  title: "Every note picked",
  key: "A minor",
  bars: 4,
  tempo: [56, 66, 96],
  voices: {
    riff: {
      label: "Your part",
      text: [LOW_SINGLE.riff, LOW_SINGLE.riff, LOW_SINGLE.riff, LOW_SINGLE.turn]
        .join(" | ")
        .replaceAll("[p]", "")
        .replaceAll("[h]", ""),
    },
  },
});

const powerBand = score({
  ...drafted,
  id: "single-riff-power",
  title: "The power-chord riff",
  key: "A minor",
  bars: 4,
  tempo: [56, 76, 112],
  voices: {
    riff: {
      label: "Second guitar",
      text: [riffBar(A5, C5, D5), riffBar(A5, C5, D5), riffBar(A5, C5, D5), riffTurn(A5, C5, D5)].join(" | "),
    },
  },
});

/** A fourth lower from the open low E: A, C, D, E become E, G, A, B. */
const SINGLE_E = {
  riff: "e 6:0 e 6:3 e 6:0[p] e 6:3[>] e 6:0 e 5:0 e 5:2[h] e 5:0[>]",
  turn: "e 6:0 e 6:3 e 6:0[p] e 6:3[>] h 5:0",
};

const singleRiffE = score({
  ...drafted,
  id: "single-riff-e",
  title: "The same riff from E",
  key: "E minor",
  bars: 4,
  tempo: [60, 76, 112],
  voices: {
    riff: { label: "Your part", text: [SINGLE_E.riff, SINGLE_E.riff, SINGLE_E.riff, SINGLE_E.turn].join(" | ") },
  },
  derivedFrom: { id: "single-riff-a", version: 1, changed: ["key", "position"] },
});

const powerBandE = score({
  ...drafted,
  id: "single-riff-power-e",
  title: "The power-chord riff from E",
  key: "E minor",
  bars: 4,
  tempo: [56, 76, 112],
  voices: {
    riff: {
      label: "Second guitar",
      text: [riffBar(E5, G5, A5_LOW), riffBar(E5, G5, A5_LOW), riffBar(E5, G5, A5_LOW), riffTurn(E5, G5, A5_LOW)].join(
        " | ",
      ),
    },
  },
});

export const SINGLE_RIFF_LESSON: Lesson = {
  id: "lesson-unit-25-single-riff",
  version: 1,
  provenance: DRAFT_BY_AGENT,
  unitId: "unit-25",
  stage: 5,
  activityKind: "technique",
  checkKind: "playing",
  title: "The riff as single notes",
  purpose: "Turn a chord riff into a line you can sing: the same rhythm, now with a contour that rises and falls.",
  destination:
    "Low Road's riff as single notes at the 5th position, locked to the second guitar's power chords, with a pull-off and a hammer-on.",
  variable: "How each note is sounded: picked, pulled off or hammered on.",
  capabilities: [
    {
      id: "play.riff.pentatonic",
      action: "playing",
      title: "Play the riff's notes",
      criterion: "Play A, C, D and E in the riff's order at the 5th position, one finger per fret, without looking.",
    },
    {
      id: "play.legato.hammer-pull",
      action: "playing",
      title: "Pull off and hammer on",
      criterion: "Sound the A after C by pulling off, and the E after D by hammering on, as loud as the picked notes.",
    },
    {
      id: "rhythm.riff.lock",
      action: "timing",
      title: "Lock to the chords",
      criterion: "Land C on the “and” of 2 and D on the “and” of 4 together with the second guitar's C5 and D5.",
    },
  ],
  scores: [singleRiff, singlePicked, singleRiffE, powerBand, powerBandE],
  accompaniment: {
    [singleRiff.id]: [powerBand.id],
    [singlePicked.id]: [powerBand.id],
    [singleRiffE.id]: [powerBandE.id],
  },
  demonstration: {
    scoreId: singleRiff.id,
    handGuidance: [
      "A minor pentatonic at the 5th position, one finger per fret: first finger on fret 5, fourth on fret 8. The riff uses A (low E fret 5), C (low E fret 8), D (A string fret 5) and E (A string fret 7).",
      "The pull-off: from C, pull the fourth finger down and off the string so A sounds without a pick stroke. The hammer-on: from D, bring the third finger down hard just behind fret 7 for E.",
      "Pick the accented notes firmly, C on the “and” of 2 and D on the “and” of 4: they land with the second guitar's C5 and D5.",
    ],
    videoNeeded: ["legato"],
  },
  studies: [
    {
      id: "picked",
      scoreId: singlePicked.id,
      title: "Every note picked",
      changes: "The riff's notes and rhythm with every note picked, at a slower tempo, to learn where the fingers go.",
    },
    {
      id: "legato",
      scoreId: singleRiff.id,
      title: "With the pull-off and hammer-on",
      changes: "The same notes with C pulled off to A and D hammered on to E.",
    },
  ],
  successCriteria: [
    "Play the four bars with the pull-off and hammer-on sounding without a pick stroke.",
    "Land C and D with the second guitar's power chords on the “and” of 2 and of 4.",
    "Keep straight, even eighths from the first bar to the held D.",
  ],
  likelyErrors: [
    {
      id: "pull-off-silent",
      signal: "The pull-off is almost silent.",
      repair:
        "Pull the fourth finger down toward the floor as it leaves the string, as if plucking it, and keep the first finger already on fret 5. Loop the first two beats slowly, then the whole riff.",
      scoreId: singleRiff.id,
      from: 0,
      to: 96,
    },
    {
      id: "accents-late",
      signal: "My accents land after the chords.",
      repair:
        "Count “1 and 2 and” aloud and pick C exactly on the second “and”; play the picked version first. Loop bar 1, then all four.",
      scoreId: singlePicked.id,
      from: 0,
      to: 192,
    },
  ],
  cueFading: [
    {
      id: "hear-the-riff",
      phase: "learn",
      cues: "full",
      scoreId: singleRiff.id,
      instruction: "Hear the single-note riff over the power chords, then play along.",
    },
    {
      id: "picked-with-count",
      phase: "practise",
      cues: "count-only",
      scoreId: singlePicked.id,
      instruction: "Pick every note beside the click and the second guitar, landing C and D with its chords.",
    },
    {
      id: "riff-unaided",
      phase: "try-unaided",
      cues: "none",
      scoreId: singleRiff.id,
      instruction: "Count in and play the riff with the pull-off and hammer-on and the tab hidden.",
    },
  ],
  retrieval: {
    afterDays: 1,
    scoreId: singleRiff.id,
    tempo: 76,
    instruction: "On another day, find the riff from memory at the 5th position and lock it to the chords.",
  },
  transfer: {
    scoreId: singleRiffE.id,
    instruction:
      "Play the same riff a fourth lower from the open low E: E, G, A and B in open position. The pull-off ends on the open string; the hammer-on starts from the open A.",
    changed: ["key", "position"],
  },
  performance: {
    kind: "piece",
    pieceId: "piece-low-road",
    partId: "low-road-single-note",
    instruction: "Play Low Road's single-note riff while the second guitar plays the power-chord riff.",
  },
};

/* ------------------------------------------------------------------ */
/* UNIT 26 · Syncopation creates lift                                   */
/* ------------------------------------------------------------------ */

const VAMP = ["Em7", "A7", "Em7", "A7"] as const;
const vampHarmony = (first: string, second: string) =>
  [1, 2, 3, 4].map((bar) => [bar, 1, bar % 2 ? first : second, bar % 2 ? "i7" : "IV7"] as const);

const grooveVamp = score({
  ...drafted,
  id: "groove-em7-a7",
  title: "The sixteenth groove: Em7 and A7",
  key: "E dorian",
  bars: 4,
  tempo: [60, 72, 96],
  voicings: NIGHT_PARTIALS,
  voices: { hand: { label: "Strumming hand", text: VAMP.map(nightGroove).join(" | ") } },
  harmony: vampHarmony("Em7", "A7"),
});

/** The hand alone: a muted scratch on every sixteenth, the groove's accents on 1 and the "and" of 2. */
const scratchBar = Array.from({ length: 16 }, (_, index) => {
  const stroke = index % 2 ? "x" : "X";
  return `s ${stroke}[${index === 0 || index === 6 ? ">" : "gh"}]`;
}).join(" ");

const grooveScratch = score({
  ...drafted,
  id: "groove-scratch-only",
  title: "The hand alone: every sixteenth muted",
  key: "E dorian",
  bars: 2,
  tempo: [56, 66, 96],
  voices: { hand: { label: "Strumming hand", text: `${scratchBar} | ${scratchBar}` } },
});

const grooveLow = score({
  ...drafted,
  id: "groove-low-line",
  title: "The second guitar's low line on E and A",
  key: "E dorian",
  bars: 4,
  tempo: [56, 72, 104],
  voices: { bass: { label: "Second guitar", text: VAMP.map((chord) => NIGHT_BASS[chord]).join(" | ") } },
});

/** The same two shapes five frets higher: Am7 and D7 in A Dorian. */
const A_DORIAN_PARTIALS = {
  Am7: { symbol: "Am7", shape: "xx7988", fingers: "xx1423" },
  D7: {
    symbol: "D7",
    shape: "xx7778",
    fingers: "xx1113",
    barre: [7, 2, 4, 1] as const,
    inversion: "second" as const,
  },
};
const grooveInA = score({
  ...drafted,
  id: "groove-am7-d7",
  title: "The same groove five frets up: Am7 and D7",
  key: "A dorian",
  bars: 4,
  tempo: [60, 72, 96],
  voicings: A_DORIAN_PARTIALS,
  voices: {
    hand: {
      label: "Strumming hand",
      text: VAMP.map((chord) => nightGroove(chord).replaceAll(chord, chord === "Em7" ? "Am7" : "D7")).join(" | "),
    },
  },
  harmony: vampHarmony("Am7", "D7"),
  derivedFrom: { id: "groove-em7-a7", version: 1, changed: ["key", "position"] },
});

const grooveLowA = score({
  ...drafted,
  id: "groove-low-line-a",
  title: "The second guitar's low line on A and D",
  key: "A dorian",
  bars: 4,
  tempo: [56, 72, 104],
  voices: {
    bass: {
      label: "Second guitar",
      text: [1, 2, 3, 4]
        .map((bar) =>
          bar % 2 ? "e 5:0 e r e r e 5:0 e r e 5:0 e 5:2 e 5:3" : "e 4:0 e r e r e 4:0 e r e 4:0 e 5:3 e 5:2",
        )
        .join(" | "),
    },
  },
});

export const SIXTEENTHS_LESSON: Lesson = {
  id: "lesson-unit-26-sixteenths",
  version: 1,
  provenance: DRAFT_BY_AGENT,
  unitId: "unit-26",
  stage: 5,
  activityKind: "rhythm",
  checkKind: "playing",
  title: "Sixteenths that lift",
  purpose:
    "Make a groove dance by putting the chords where the beat does not expect them, with the hand never stopping.",
  destination:
    "Night Market's sixteenth groove: Em7 and A7 on 1, the “a” of 1 and the “and” of 2, ghosted scratches everywhere else.",
  variable: "Which sixteenths sound the chord, and which are only a muted scratch.",
  capabilities: [
    {
      id: "strum.sixteenths.constant",
      action: "playing",
      title: "Keep the hand moving",
      criterion: "Strum down and up on every sixteenth for four bars without the hand stopping, even where it misses.",
    },
    {
      id: "rhythm.sixteenth.syncopation",
      action: "timing",
      title: "Place the off-beat chords",
      criterion: "Sound the chord exactly on the “a” of 1 and the “and” of 2, not on the beats around them.",
    },
    {
      id: "sound.accent-ghost",
      action: "playing",
      title: "Accents and ghosts",
      criterion: "Make the accented chords clearly louder than the ghosted scratches between them.",
    },
  ],
  scores: [grooveVamp, grooveScratch, grooveInA, grooveLow, grooveLowA],
  accompaniment: { [grooveVamp.id]: [grooveLow.id], [grooveInA.id]: [grooveLowA.id] },
  demonstration: {
    scoreId: grooveVamp.id,
    handGuidance: [
      "The strumming hand moves down on every count and every “and”, up on every “e” and “a”, all the time; it only presses through the strings where a chord is written.",
      "Em7 is xx2433: first finger on the D string at fret 2 (E), fourth on the G string at fret 4 (B), second on the B string at fret 3 (D), third on the high E at fret 3 (G). For A7 the first finger lies across the D, G and B strings at fret 2 and the third stays on the high E: E and G stay, B and D step down to A and C♯.",
      "Between the chords let the fretting fingers go slack on the strings so they are muted: the scratches are ghosts, much quieter than the chords.",
    ],
    videoNeeded: ["strumming hand", "fretting hand", "muting"],
  },
  studies: [
    {
      id: "scratch",
      scoreId: grooveScratch.id,
      title: "The hand alone",
      changes:
        "Every sixteenth a muted scratch, accented on 1 and the “and” of 2: the hand's motion without the chords.",
    },
    {
      id: "groove",
      scoreId: grooveVamp.id,
      title: "The groove",
      changes: "The same motion, with Em7 and A7 sounding on 1, the “a” of 1 and the “and” of 2.",
    },
  ],
  successCriteria: [
    "Keep the strumming hand moving in sixteenths for four bars.",
    "Make the accents on 1 and the “and” of 2 louder than everything else.",
    "Change Em7 to A7 in the gap, keeping the E and the G under your fingers.",
  ],
  likelyErrors: [
    {
      id: "hand-stops",
      signal: "My strumming hand stops in the gaps.",
      repair:
        "Go back to the hand-alone study: mute every string and scratch every sixteenth, saying “1 e and a”. Loop one bar, then the groove.",
      scoreId: grooveScratch.id,
      from: 0,
      to: 192,
    },
    {
      id: "ghosts-loud",
      signal: "The scratches are as loud as the chords.",
      repair:
        "Brush the scratches with the tip of the pick and dig in only for the chords; loosen the fretting hand fully between them. Loop bar 1 slowly, then all four.",
      scoreId: grooveVamp.id,
      from: 0,
      to: 192,
    },
  ],
  cueFading: [
    {
      id: "hear-the-groove",
      phase: "learn",
      cues: "full",
      scoreId: grooveVamp.id,
      instruction: "Hear the groove with the low line, then play along with the hand moving in sixteenths.",
    },
    {
      id: "scratch-with-count",
      phase: "practise",
      cues: "count-only",
      scoreId: grooveScratch.id,
      instruction: "Scratch every sixteenth beside the click alone, accenting 1 and the “and” of 2.",
    },
    {
      id: "groove-unaided",
      phase: "try-unaided",
      cues: "none",
      scoreId: grooveVamp.id,
      instruction: "Count in and play the four bars of groove with the tab hidden.",
    },
  ],
  retrieval: {
    afterDays: 1,
    scoreId: grooveVamp.id,
    tempo: 72,
    instruction: "On another day, play the groove from memory and keep the hand moving through every gap.",
  },
  transfer: {
    scoreId: grooveInA.id,
    instruction:
      "Move both shapes up five frets: Am7 (xx7988) and D7 (first finger across fret 7, third on the high E at fret 8). The groove does not change; A Dorian is E Dorian moved.",
    changed: ["key", "position"],
  },
  performance: {
    kind: "piece",
    pieceId: "piece-night-market",
    partId: "night-market-groove",
    instruction: "Play Night Market's groove while the second guitar plays the low line.",
  },
};

/* ------------------------------------------------------------------ */
/* UNIT 27 · Articulation changes meaning                               */
/* ------------------------------------------------------------------ */

const touch = score({
  ...drafted,
  id: "phrase-touch",
  title: "One phrase, connected then clipped",
  key: "E minor",
  bars: 4,
  tempo: [60, 72, 92],
  voices: {
    line: {
      label: "Your part",
      text: [
        "e 2:3 e 2:0 e 3:2 e 3:0 q 4:2 q r",
        "h 3:2 h r",
        "e 2:3[st] e 2:0[st] e 3:2[st] e 3:0[st] q 4:2[st] q r",
        "q 3:2[st] q r h r",
      ].join(" | "),
    },
  },
  sections: [
    ["connected", "Connected", 1, 2],
    ["clipped", "Clipped", 3, 4],
  ],
});

const bendTargets = score({
  ...drafted,
  id: "bend-targets",
  title: "Hear the target, then bend to it",
  key: "E minor",
  bars: 2,
  tempo: [56, 66, 84],
  voices: { line: { label: "Your part", text: "h 3:4 h 3:2[b2] | h 1:4{G#} h 1:3[b1]" } },
  sections: [
    ["whole", "Whole step: A to B", 1, 1],
    ["half", "Half step: G to G♯", 2, 2],
  ],
});

const bendPhrase = score({
  ...drafted,
  id: "bend-phrase",
  title: "Bend, then let it sing",
  key: "E minor",
  bars: 2,
  tempo: [60, 72, 92],
  voices: { line: { label: "Your part", text: "q r e 3:0 e 3:2 q 3:2[b2] q 2:0[~] | h 2:0[~] h r" } },
});

const bendTargetsA = score({
  ...drafted,
  id: "bend-targets-a",
  title: "The same bends at the 7th fret, in A minor",
  key: "A minor",
  bars: 2,
  tempo: [56, 66, 84],
  voices: { line: { label: "Your part", text: "h 3:9 h 3:7[b2] | h 2:9{G#} h 2:8[b1]" } },
  derivedFrom: { id: "bend-targets", version: 1, changed: ["key", "position"] },
});

export const BENDS_LESSON: Lesson = {
  id: "lesson-unit-27-bends",
  version: 1,
  provenance: DRAFT_BY_AGENT,
  unitId: "unit-27",
  stage: 5,
  activityKind: "technique",
  checkKind: "playing",
  title: "Bend to the note",
  purpose:
    "Give one phrase different meanings with touch alone: connected or clipped, bent up to its note, left to sing.",
  destination:
    "The opening of Front Step's solo: G and A, A bent up a whole step to B, then B held with an even vibrato.",
  variable: "How the notes are shaped: their length, their bend, their vibrato.",
  capabilities: [
    {
      id: "play.bend.to-target",
      action: "playing",
      title: "Bend to a pitch",
      criterion: "Bend A up to B and G up to G♯ so each bent note matches the fretted target you played first.",
    },
    {
      id: "ear.bend.in-tune",
      action: "listening",
      title: "Hear a bend in tune",
      criterion: "Hear whether a bend is short of its target, on it, or past it.",
    },
    {
      id: "play.vibrato.steady",
      action: "playing",
      title: "Even vibrato",
      criterion: "Hold B with a vibrato that pulses evenly, in time, without going sharp.",
    },
    {
      id: "sound.legato-staccato.contrast",
      action: "playing",
      title: "Connected or clipped",
      criterion: "Play the same phrase connected and then clipped, so the difference is plain to hear.",
    },
  ],
  scores: [bendPhrase, touch, bendTargets, bendTargetsA],
  demonstration: {
    scoreId: bendPhrase.id,
    handGuidance: [
      "Connected: hold each note until the next one starts. Clipped: lift the fretting finger just after each attack so a little silence follows. The notes are the same; the meaning is not.",
      "To bend, put the third finger on the note with the second and first fingers behind it on the same string, and push the string toward the ceiling with all three, turning from the wrist. Play the target first (B at G-string fret 4), then bend A at fret 2 until it matches.",
      "Vibrato: on the held B, rock the string a little up and back in even pulses, from the wrist rather than the finger.",
    ],
    videoNeeded: ["bends", "vibrato"],
  },
  studies: [
    {
      id: "touch",
      scoreId: touch.id,
      title: "Connected, then clipped",
      changes: "One two-bar phrase played connected, then the same notes clipped short.",
    },
    {
      id: "targets",
      scoreId: bendTargets.id,
      title: "Bend to the target",
      changes: "Each target note fretted first, then reached by bending: A to B (a whole step), G to G♯ (a half step).",
    },
  ],
  successCriteria: [
    "Play the phrase connected, then clipped, and hear the difference.",
    "Bend A to B and G to G♯ so each bent note matches its target.",
    "Hold the last B with an even vibrato in time.",
  ],
  likelyErrors: [
    {
      id: "bend-short",
      signal: "My bend falls short of the note.",
      repair:
        "Play the fretted B, sing it, then bend A slowly until the bent note matches what you sang; push with all three fingers. Loop the first bar of the targets study, then both.",
      scoreId: bendTargets.id,
      from: 0,
      to: 192,
    },
    {
      id: "vibrato-uneven",
      signal: "My vibrato wobbles unevenly.",
      repair:
        "Make the vibrato in eighths with the click: up on each count, back on each “and”, small and slow. Loop the held B, then the phrase.",
      scoreId: bendPhrase.id,
      from: 192,
      to: 384,
    },
  ],
  cueFading: [
    {
      id: "hear-the-phrase",
      phase: "learn",
      cues: "full",
      scoreId: bendPhrase.id,
      instruction: "Hear the phrase: the bend reaching B and the vibrato after it. Then play along.",
    },
    {
      id: "targets-with-count",
      phase: "practise",
      cues: "count-only",
      scoreId: bendTargets.id,
      instruction: "Play each target, then bend to it, beside the click alone.",
    },
    {
      id: "phrase-unaided",
      phase: "try-unaided",
      cues: "none",
      scoreId: bendPhrase.id,
      instruction: "Count in and play the phrase with the tab hidden; the bend must reach B.",
    },
  ],
  retrieval: {
    afterDays: 1,
    scoreId: bendPhrase.id,
    tempo: 72,
    instruction: "On another day, play the phrase from memory and check the bend against the fretted B first.",
  },
  transfer: {
    scoreId: bendTargetsA.id,
    instruction:
      "In A minor at the 7th fret: bend D (G-string fret 7) up to E, checking against fret 9, and G (B-string fret 8) up a half step to G♯, checking against fret 9.",
    changed: ["key", "position"],
  },
  performance: {
    kind: "piece",
    pieceId: "piece-front-step",
    partId: "front-step-solo",
    instruction: "Play Front Step's solo chorus over the boogie: every bend must reach its note.",
  },
};

/* ------------------------------------------------------------------ */
/* UNIT 28 · Develop an idea                                            */
/* ------------------------------------------------------------------ */

const developLowRoad = score({
  ...drafted,
  id: "develop-low-road",
  title: "One change at a time: ending, rhythm, register",
  key: "A minor",
  bars: 4,
  tempo: [60, 76, 112],
  voices: {
    riff: {
      label: "Your part",
      text: [LOW_SINGLE.riff, LOW_SINGLE.newEnding, LOW_SINGLE.newRhythm, LOW_SINGLE.octaveUp].join(" | "),
    },
  },
  sections: [
    ["original", "The riff", 1, 1],
    ["ending", "New ending", 2, 2],
    ["rhythm", "New rhythm", 3, 3],
    ["register", "New register", 4, 4],
  ],
});

const developPads = score({
  ...drafted,
  id: "develop-low-pads",
  title: "The second guitar's held power chords",
  key: "A minor",
  bars: 4,
  tempo: [56, 76, 116],
  voices: { pad: { label: "Second guitar", text: [`w ${A5}`, `w ${A5}`, `w ${A5}`, `h ${A5} h ${D5}`].join(" | ") } },
});

const NIGHT_DEVELOPED = [
  NIGHT_RIFF.Em7,
  "e r e r e r e r s 6:0 s 6:3[h] s 5:0 s r s 4:2[>] s r e r",
  "e r e r e r s r s 6:0 s 6:3[h] s 5:0 s r s 5:2[>] s r s r e r",
  "e r e r e r e r s 4:2 s 4:5[h] s 3:2 s r s 3:4[>] s r e r",
];

const developNight = score({
  ...drafted,
  id: "develop-night-riff",
  title: "Night Market's riff, developed the same way",
  key: "E dorian",
  bars: 4,
  tempo: [60, 72, 96],
  voices: { riff: { label: "Your part", text: NIGHT_DEVELOPED.join(" | ") } },
  sections: [
    ["original", "The riff", 1, 1],
    ["ending", "New ending", 2, 2],
    ["rhythm", "A sixteenth early", 3, 3],
    ["register", "An octave up", 4, 4],
  ],
});

const developNightGroove = score({
  ...drafted,
  id: "develop-night-groove",
  title: "The second guitar's Em7 groove",
  key: "E dorian",
  bars: 4,
  tempo: [56, 72, 104],
  voicings: { Em7: NIGHT_PARTIALS.Em7 },
  voices: { hand: { label: "Second guitar", text: Array.from({ length: 4 }, () => nightGroove("Em7")).join(" | ") } },
});

const developCall = score({
  ...drafted,
  id: "develop-call",
  title: "The Unit 17 call, developed",
  key: "E minor",
  bars: 4,
  tempo: [60, 72, 90],
  voices: {
    line: {
      label: "Your part",
      text: [
        "q r e 2:3 e 1:0 q 1:3 q 1:0",
        "q r e 2:3 e 1:0 q 1:3 q 2:0",
        "e r e 2:3 e 1:0 e r q 1:3 q 1:0",
        "q r e 4:0 e 4:2 q 3:0 q 4:2",
      ].join(" | "),
    },
  },
  derivedFrom: { id: "develop-low-road", version: 1, changed: ["key", "pitch"] },
});

export const DEVELOP_LESSON: Lesson = {
  id: "lesson-unit-28-develop",
  version: 1,
  provenance: DRAFT_BY_AGENT,
  unitId: "unit-28",
  stage: 5,
  activityKind: "variation",
  checkKind: "playing",
  title: "Develop an idea",
  purpose: "Keep a riff fresh for a whole song by changing one thing at a time while its fingerprint stays.",
  destination:
    "Low Road's riff four ways, then as A A A′ B: the riff, the riff, a new ending, and the riff an octave up.",
  variable: "One dimension per version: the ending, the rhythm or the register.",
  capabilities: [
    {
      id: "phrase.riff.develop",
      action: "playing",
      title: "Develop the riff",
      criterion: "Play four versions of the riff, each changing one dimension, all still recognisably the riff.",
    },
    {
      id: "ear.variation.identity",
      action: "listening",
      title: "Hear what changed",
      criterion: "Hear whether a version changed the ending, the rhythm or the register.",
    },
    {
      id: "rhythm.displacement",
      action: "timing",
      title: "Start a sixteenth early",
      criterion: "Play Night Market's riff a sixteenth early, keeping every note and the gap after it.",
    },
  ],
  scores: [developLowRoad, developNight, developCall, developPads, developNightGroove],
  accompaniment: { [developLowRoad.id]: [developPads.id], [developNight.id]: [developNightGroove.id] },
  demonstration: {
    scoreId: developLowRoad.id,
    handGuidance: [
      "Change one thing at a time and keep the rest. The accents on the “and” of 2 and of 4 are the riff's fingerprint: they stay in every version.",
      "New ending: instead of E down to D, step up from G to A on the D string (frets 5 and 7). New rhythm: two quarter notes replace four eighths. New register: the same shape two strings higher and two frets up, starting from that A.",
      "Night Market's riff develops the same way; its rhythm version starts a sixteenth early, so it pushes against the beat.",
    ],
    videoNeeded: ["legato"],
  },
  studies: [
    {
      id: "low-road",
      scoreId: developLowRoad.id,
      title: "Low Road, four ways",
      changes: "The riff, then a new ending, a new rhythm and a new register, a bar each.",
    },
    {
      id: "night-market",
      scoreId: developNight.id,
      title: "Night Market, four ways",
      changes: "The answering riff with a new ending, a sixteenth early, and an octave up, over the Em7 groove.",
    },
  ],
  successCriteria: [
    "Play the four Low Road versions with the accents on the “and” of 2 and of 4 every time.",
    "Say what each version changed: the ending, the rhythm or the register.",
    "Play Night Market's riff a sixteenth early and keep it there.",
  ],
  likelyErrors: [
    {
      id: "riff-lost",
      signal: "My variation no longer sounds like the riff.",
      repair:
        "Check that only one thing changed: keep the first half of the bar exactly as the riff, and the accents where they were. Loop bars 3 and 4, then all four.",
      scoreId: developLowRoad.id,
      from: 384,
      to: 768,
    },
    {
      id: "displaced-drags",
      signal: "The early riff drags back onto the beat.",
      repair:
        "Count sixteenths, “1 e and a”, and start the riff on the “a” of 2; play it slowly with the groove. Loop bar 3, then the whole study.",
      scoreId: developNight.id,
      from: 384,
      to: 576,
    },
  ],
  cueFading: [
    {
      id: "hear-the-versions",
      phase: "learn",
      cues: "full",
      scoreId: developLowRoad.id,
      instruction: "Hear the four Low Road versions and say what changed in each before you play.",
    },
    {
      id: "night-with-count",
      phase: "practise",
      cues: "count-only",
      scoreId: developNight.id,
      instruction: "Play Night Market's four versions beside the click and the groove.",
    },
    {
      id: "versions-unaided",
      phase: "try-unaided",
      cues: "none",
      scoreId: developLowRoad.id,
      instruction: "Count in and play the four Low Road versions with the tab hidden; then make one of your own.",
    },
  ],
  retrieval: {
    afterDays: 1,
    scoreId: developLowRoad.id,
    tempo: 76,
    instruction: "On another day, play the riff and three versions of your own, each changing one thing.",
  },
  transfer: {
    scoreId: developCall.id,
    instruction:
      "Develop the Unit 17 call the same way: a new last note (B instead of E), a new rhythm (starting an eighth early), and an octave lower on the D and G strings.",
    changed: ["key", "pitch"],
  },
  performance: {
    kind: "piece",
    pieceId: "piece-low-road",
    partId: "low-road-development",
    instruction: "Play Low Road as A A A′ B over the second guitar's held chords.",
  },
};

/* ------------------------------------------------------------------ */
/* UNIT 29 · Improvise with constraints                                 */
/* ------------------------------------------------------------------ */

const shuffle = { ...drafted, feel: "shuffle-8" } as const;
const B5_BOOGIE = Array.from({ length: 8 }, () => "e 5:2+4:4").join(" ");

const boogieLine = score({
  ...shuffle,
  id: "boogie-line-1",
  title: "The boogie: line 1",
  key: "E major",
  bars: 4,
  tempo: [60, 76, 100],
  voices: { boogie: { label: "Boogie", text: [BOOGIE.E7, BOOGIE.A7, BOOGIE.E7, BOOGIE.E7].join(" | ") } },
  harmony: [
    [1, 1, "E7", "I7"],
    [2, 1, "A7", "IV7"],
    [3, 1, "E7", "I7"],
  ],
});

const boogieLine3 = score({
  ...shuffle,
  id: "boogie-line-3",
  title: "The boogie: line 3, with B as root and fifth",
  key: "E major",
  bars: 4,
  tempo: [60, 76, 100],
  voices: { boogie: { label: "Boogie", text: [B5_BOOGIE, BOOGIE.A7, BOOGIE.E7, B5_BOOGIE].join(" | ") } },
  harmony: [
    [1, 1, "B7", "V7"],
    [2, 1, "A7", "IV7"],
    [3, 1, "E7", "I7"],
    [4, 1, "B7", "V7"],
  ],
});

const improvThree = score({
  ...shuffle,
  id: "improv-three-notes",
  title: "One answer with only E, G and A",
  key: "E blues",
  bars: 4,
  tempo: [60, 76, 100],
  voices: {
    lead: { label: "Your part", text: "q 4:2 e 3:0 e 3:2 h 4:2 | q 3:2 e 3:0 e 4:2 h r | e r e 4:2 q 3:0 h 3:2 | w r" },
  },
});

const improvBlues = score({
  ...shuffle,
  id: "improv-blues-note",
  title: "The same idea with the blue note, B♭",
  key: "E blues",
  bars: 4,
  tempo: [60, 76, 100],
  voices: {
    lead: {
      label: "Your part",
      text: "q 4:2 e 3:0 e 3:2 e 3:3 e 3:2 q 3:0 | h 4:2 h r | e 2:0 e 3:3 e 3:2 e 3:0 h 4:2 | w r",
    },
  },
});

const boogieInA = score({
  ...shuffle,
  id: "boogie-line-1-a",
  title: "The boogie in A: A and D",
  key: "A major",
  bars: 4,
  tempo: [60, 76, 100],
  voices: {
    boogie: {
      label: "Boogie",
      text: [
        BOOGIE.A7,
        "e 4:0+3:2 e 4:0+3:2 e 4:0+3:4 e 4:0+3:4 e 4:0+3:2 e 4:0+3:2 e 4:0+3:4 e 4:0+3:4",
        BOOGIE.A7,
        BOOGIE.A7,
      ].join(" | "),
    },
  },
  harmony: [
    [1, 1, "A7", "I7"],
    [2, 1, "D7", "IV7"],
    [3, 1, "A7", "I7"],
  ],
  derivedFrom: { id: "boogie-line-1", version: 1, changed: ["key", "position"] },
});

export const IMPROVISE_LESSON: Lesson = {
  id: "lesson-unit-29-improvise",
  version: 1,
  provenance: DRAFT_BY_AGENT,
  unitId: "unit-29",
  stage: 5,
  activityKind: "technique",
  checkKind: "playing",
  title: "Improvise with three notes",
  purpose:
    "Make up music on the spot without freezing: hold a shuffle, then say something with very few notes and plenty of space.",
  destination:
    "Front Step's boogie shuffle in your hands, then your own answers over it using only E, G and A, with a bar of space in every four.",
  variable: "How many notes you allow yourself: three, then five, then the blue note.",
  capabilities: [
    {
      id: "rhythm.shuffle.triplet",
      action: "timing",
      title: "Feel the shuffle",
      criterion: "Play long-short shuffled eighths through four bars without drifting straight.",
    },
    {
      id: "ear.twelve-bar.place",
      action: "listening",
      title: "Know where you are",
      criterion: "Hear the change to A in bar 2 and back to E, and know which line of the 12-bar you are in.",
    },
    {
      id: "play.improvise.constraint",
      action: "playing",
      title: "Improvise with limits",
      criterion: "Make up answers over the boogie with only E, G and A, leaving the fourth bar of each line empty.",
    },
    {
      id: "play.boogie.shuffle",
      action: "playing",
      title: "Play the boogie",
      criterion: "Play the boogie on E and A, root and fifth then root and sixth on every beat, in shuffle.",
    },
  ],
  scores: [boogieLine, boogieLine3, improvThree, improvBlues, boogieInA],
  accompaniment: { [improvThree.id]: [boogieLine.id], [improvBlues.id]: [boogieLine.id] },
  demonstration: {
    scoreId: boogieLine.id,
    handGuidance: [
      "Shuffle: each beat splits long-short, like a triplet with the first two notes joined: “ONE-a TWO-a”.",
      "The boogie: first finger on the fifth (A string fret 2) with the open low E, then the third finger reaching to the sixth (fret 4), twice each per beat. For A, the same on the A and D strings. For B, keep root and fifth only until the fourth-finger stretch to fret 6 is comfortable.",
      "To improvise, start with only E (D string fret 2), G (open G string) and A (G string fret 2); leave the fourth bar of every line empty. Then add B and D, then B♭ at G-string fret 3, the blue note.",
    ],
    videoNeeded: [],
  },
  studies: [
    {
      id: "boogie",
      scoreId: boogieLine.id,
      title: "The boogie, line 1",
      changes: "E, A, E, E: the quick change in bar 2, root and fifth then root and sixth on every beat.",
    },
    {
      id: "line-3",
      scoreId: boogieLine3.id,
      title: "Line 3, with B as root and fifth",
      changes: "B, A, E, B: the last line, with B held to root and fifth until the stretch comes.",
    },
    {
      id: "three-notes",
      scoreId: improvThree.id,
      title: "One answer with three notes",
      changes: "An example of what three notes and space can say, while the app plays the boogie.",
    },
    {
      id: "blue-note",
      scoreId: improvBlues.id,
      title: "With the blue note",
      changes: "The same idea with B♭ passing between A and B.",
    },
  ],
  successCriteria: [
    "Play the boogie through line 1 in shuffle with the change to A in bar 2.",
    "Improvise two lines with only E, G and A, leaving each fourth bar empty.",
    "Add the blue note once and let it move on to A or B.",
  ],
  likelyErrors: [
    {
      id: "shuffle-straightens",
      signal: "My shuffle turns into straight eighths.",
      repair:
        "Say “ONE-a TWO-a” with the click, then play only the low E in that rhythm before adding the fifth and sixth. Loop bar 1, then all four.",
      scoreId: boogieLine.id,
      from: 0,
      to: 192,
    },
    {
      id: "no-space",
      signal: "I fill every bar.",
      repair:
        "Play your phrase, then mute the strings with the fretting hand for the whole fourth bar while the band plays on. Loop bars 3 and 4, then all four.",
      scoreId: improvThree.id,
      from: 384,
      to: 768,
    },
  ],
  cueFading: [
    {
      id: "hear-the-boogie",
      phase: "learn",
      cues: "full",
      scoreId: boogieLine.id,
      instruction: "Hear the boogie in shuffle, then play along.",
    },
    {
      id: "three-with-count",
      phase: "practise",
      cues: "count-only",
      scoreId: improvThree.id,
      instruction: "Play the example over the app's boogie, then make up your own answers with E, G and A.",
    },
    {
      id: "improvise-unaided",
      phase: "try-unaided",
      cues: "none",
      scoreId: improvThree.id,
      instruction:
        "Count in, hide the tab and improvise over the boogie with only E, G and A, a bar of space in every four. The example is one way; yours is the check.",
    },
  ],
  retrieval: {
    afterDays: 1,
    scoreId: boogieLine.id,
    tempo: 76,
    instruction: "On another day, play the boogie from memory, then improvise a line over it.",
  },
  transfer: {
    scoreId: boogieInA.id,
    instruction:
      "Play the boogie in A: A on the A and D strings, D on the D and G strings, with the same root-fifth, root-sixth movement.",
    changed: ["key", "position"],
  },
  performance: {
    kind: "piece",
    pieceId: "piece-front-step",
    partId: "front-step-boogie",
    instruction:
      "Play Front Step's whole boogie shuffle, 12 bars and the stop-time ending, under the second guitar's chords.",
  },
};

/* ------------------------------------------------------------------ */
/* UNIT 30 · Compare musical dialects                                   */
/* ------------------------------------------------------------------ */

/*
 * One motif with eighth pairs and sixteenth pairs, so every feel changes how it
 * sounds. Each sixteenth pair is picked then hammered, so the pick only moves
 * in eighths even when the sixteenths lean.
 */
const MOTIF_E = "e 4:2 e 3:0 s 3:0 s 3:2[h] s 2:0 s 2:3[h] q 2:0 q r | e 2:0 e 3:2 s 3:0 s 3:2[h] s 3:0 s 3:2[h] h 4:2";
const MOTIF_A = "e 3:2 e 2:1 s 2:1 s 2:3[h] s 1:0 s 1:3[h] q 1:0 q r | e 1:0 e 2:3 s 2:1 s 2:3[h] s 2:1 s 2:3[h] h 3:2";

const feelScore = (
  id: string,
  title: string,
  feel: "straight" | "shuffle-8" | "swing-16",
  key: "E minor" | "A minor",
  text: string,
) =>
  score({ ...drafted, id, title, key, feel, bars: 2, tempo: [60, 72, 88], voices: { line: { label: "Motif", text } } });

const feelStraight = feelScore("feel-straight", "Straight eighths, as in rock", "straight", "E minor", MOTIF_E);
const feelShuffle = feelScore("feel-shuffle", "Shuffle, as in blues", "shuffle-8", "E minor", MOTIF_E);
const feelSwung = feelScore("feel-swung-sixteenths", "Swung sixteenths, as in soul", "swing-16", "E minor", MOTIF_E);
const feelQuestions = [
  feelScore("feel-example-1", "Example 1", "shuffle-8", "A minor", MOTIF_A),
  feelScore("feel-example-2", "Example 2", "swing-16", "A minor", MOTIF_A),
  feelScore("feel-example-3", "Example 3", "straight", "A minor", MOTIF_A),
  feelScore("feel-example-4", "Example 4", "swing-16", "A minor", MOTIF_A),
];
const feelNew = score({
  ...drafted,
  id: "feel-new-motif",
  title: "A new motif, swung",
  key: "A minor",
  feel: "swing-16",
  bars: 2,
  tempo: [60, 72, 88],
  voices: {
    line: {
      label: "Your part",
      text: "e 2:1 e 2:3 s 1:0 s 1:3[h] s 2:1 s 2:3[h] q 3:2 q r | s 2:1 s 2:3[h] e 2:1 e 3:2 e 3:0 h 3:2",
    },
  },
  derivedFrom: { id: "feel-straight", version: 1, changed: ["key", "pitch", "feel"] },
});

const FEELS = ["Straight eighths, as in rock", "Shuffle, as in blues", "Swung sixteenths, as in soul"] as const;
const FEEL_EXPLAINED = {
  straight: "Every eighth and every sixteenth is evenly spaced: nothing leans.",
  shuffle: "Each beat splits long-short, a triplet with the first two notes joined; the eighths lilt.",
  swung: "The beats and eighths stay even, but every pair of sixteenths leans long-short: the soul lope.",
};

export const FEELS_LESSON: Lesson = {
  id: "lesson-unit-30-feels",
  version: 1,
  provenance: DRAFT_BY_AGENT,
  unitId: "unit-30",
  stage: 5,
  activityKind: "listen-compare",
  checkKind: "listening",
  title: "Three feels, one motif",
  purpose:
    "Hear what makes rock, blues and soul feel different when the notes are exactly the same: the time between them.",
  destination:
    "One E minor motif played straight, shuffled and in swung sixteenths, and the ear to tell which is which.",
  variable: "The feel: where the off-beat notes fall.",
  capabilities: [
    {
      id: "ear.feel.identify",
      action: "listening",
      title: "Name the feel",
      criterion: "Hear an example and say whether it is straight, shuffled or in swung sixteenths.",
    },
    {
      id: "feel.difference.name",
      action: "naming",
      title: "Say what changed",
      criterion: "Say that the feels change the spacing of the off-beats, not the notes.",
    },
    {
      id: "rhythm.feel.switch",
      action: "timing",
      title: "Switch feels",
      criterion: "Play the motif in each feel in turn, keeping the beat steady.",
    },
  ],
  scores: [feelStraight, feelShuffle, feelSwung, ...feelQuestions, feelNew],
  demonstration: {
    scoreId: feelStraight.id,
    handGuidance: [
      "The notes never change: E, G, A, B and D from E minor pentatonic, on the D, G and B strings, each sixteenth pair picked then hammered. What changes is where the off-beats fall.",
      "Straight: everything evenly spaced. Shuffle: each beat splits long-short, “ONE-a TWO-a”. Swung sixteenths: the beats and eighths are even, but each pair of sixteenths leans long-short.",
      "Let the picking hand follow the feel: down on the beat, up on the off-beat, wherever the off-beat falls.",
    ],
    videoNeeded: ["legato"],
  },
  studies: [
    {
      id: "shuffle",
      scoreId: feelShuffle.id,
      title: "Shuffle",
      changes: "The same motif with every beat split long-short.",
    },
    {
      id: "swung",
      scoreId: feelSwung.id,
      title: "Swung sixteenths",
      changes: "The same motif with even eighths and long-short sixteenths.",
    },
  ],
  successCriteria: [
    "Name the feel of each example before the answer is shown.",
    "Play the motif in all three feels with the beat steady.",
    "Say what changed between them: the spacing, not the notes.",
  ],
  likelyErrors: [
    {
      id: "shuffle-or-swung",
      signal: "Shuffle and swung sixteenths sound the same to me.",
      repair:
        "Listen to beat 1 only: in the shuffle its two eighths are uneven; in swung sixteenths they are even and only beat 2's sixteenths lean. Loop the first beat of the swung study, then the shuffle's.",
      scoreId: feelSwung.id,
      from: 0,
      to: 96,
    },
    {
      id: "shuffle-drifts",
      signal: "My shuffle drifts back to straight.",
      repair: "Say “ONE-a TWO-a” with the click and play only the first beat until it lilts. Loop bar 1, then both.",
      scoreId: feelShuffle.id,
      from: 0,
      to: 192,
    },
  ],
  cueFading: [
    {
      id: "hear-straight",
      phase: "learn",
      cues: "full",
      scoreId: feelStraight.id,
      instruction: "Hear the motif straight, then each study, and play along with each.",
    },
    {
      id: "shuffle-with-count",
      phase: "practise",
      cues: "count-only",
      scoreId: feelShuffle.id,
      instruction: "Play the motif shuffled beside the click alone, then straight, then shuffled again.",
    },
    {
      id: "name-the-feel",
      phase: "try-unaided",
      cues: "none",
      scoreId: feelQuestions[0].id,
      instruction: "Hear each example, with no notes shown, and choose its feel.",
    },
  ],
  listening: {
    questions: feelQuestions.map((example, index) => {
      const answer = example.feel === "straight" ? FEELS[0] : example.feel === "shuffle-8" ? FEELS[1] : FEELS[2];
      const why =
        example.feel === "straight"
          ? FEEL_EXPLAINED.straight
          : example.feel === "shuffle-8"
            ? FEEL_EXPLAINED.shuffle
            : FEEL_EXPLAINED.swung;
      return {
        id: `example-${index + 1}`,
        version: 2,
        scoreId: example.id,
        prompt: "Which feel is this? The notes are the same motif each time.",
        choices: FEELS,
        answer,
        explanation: why,
      };
    }),
  },
  retrieval: {
    afterDays: 1,
    scoreId: feelStraight.id,
    tempo: 72,
    instruction: "On another day, name the feel of each example again, without listening to the lesson first.",
  },
  transfer: {
    scoreId: feelNew.id,
    instruction:
      "Play a new motif in A minor in swung sixteenths, then straight and shuffled: the spacing travels to any notes.",
    changed: ["key", "pitch", "feel"],
  },
  performance: {
    kind: "create",
    instruction:
      "In Create, write a two-bar motif of your own and play it straight, shuffled and swung; keep the version that feels most like you.",
  },
};

export const LESSONS: readonly Lesson[] = [
  SINGLE_RIFF_LESSON,
  SIXTEENTHS_LESSON,
  BENDS_LESSON,
  DEVELOP_LESSON,
  IMPROVISE_LESSON,
  FEELS_LESSON,
];
