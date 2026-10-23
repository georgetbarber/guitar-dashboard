/**
 * STAGE 1 · SOUND AND TIME — authored lessons.
 *
 * Unit 6, "Change without losing time": the C-to-Am common-tone change first
 * drafted on 30 September 2026 (src/v8/phase6Drafts.ts), re-written in score
 * format 2 with its ids, voicings and timing unchanged (tested against the
 * original draft). Agent-drafted; nobody has played it on a guitar yet.
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

export const LESSONS: readonly Lesson[] = [COMMON_TONE_LESSON];
