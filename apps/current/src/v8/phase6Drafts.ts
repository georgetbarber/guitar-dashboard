import { buildChords, createContext, normalize } from "../core/music/theory";
import type { EpisodeDefinition } from "./pilotEpisode";
import { positionMidi, STANDARD_TUNING_MIDI, validateMaterial } from "./structuredMusic";
import type { GuitarPosition, MusicalMaterial } from "./structuredMusic";

const highE = (fret: number): GuitarPosition => ({ string: 1, fret });
const thirdNote = (id: string, atBeat: number, fret: 0 | 3 | 4, spelling: "E" | "G" | "G#") => ({
  id,
  kind: "note" as const,
  atBeat,
  beats: 1,
  midi: 64 + fret,
  spelling,
  position: highE(fret),
  articulation: "full-value" as const,
});
const rest = (id: string, atBeat: number) => ({ id, kind: "rest" as const, atBeat, beats: 1 });

const thirdBase = {
  version: 1,
  review: { status: "draft" as const },
  tuningMidi: STANDARD_TUNING_MIDI,
  tonalCenter: { name: "E", midi: 64 },
  metre: { numerator: 4 as const, denominator: 4 as const },
  bars: 2,
  tempo: { minimum: 50, default: 66, maximum: 84 },
  sections: [
    { id: "minor", label: "Minor third", fromBeat: 0, toBeat: 4 },
    { id: "major", label: "Major third", fromBeat: 4, toBeat: 8 },
  ],
} as const;

/** Draft for Unit 10. It is not linked to the active curriculum or pilot player. */
export const THIRD_COLOUR_DRAFT: MusicalMaterial = {
  ...thirdBase,
  id: "third-colour-e-minor-major",
  title: "One fret changes the third",
  events: [
    thirdNote("minor-root", 0, 0, "E"),
    thirdNote("minor-third", 1, 3, "G"),
    thirdNote("minor-return", 2, 0, "E"),
    rest("minor-space", 3),
    thirdNote("major-root", 4, 0, "E"),
    thirdNote("major-third", 5, 4, "G#"),
    thirdNote("major-return", 6, 0, "E"),
    rest("major-space", 7),
  ],
};

/** Same rhythm and positions; reversed contrast tests whether the interval is heard, not memorised by bar order. */
export const THIRD_COLOUR_REVERSED_DRAFT: MusicalMaterial = {
  ...thirdBase,
  id: "third-colour-e-major-minor",
  title: "Third colour in reverse order",
  derivedFrom: { id: THIRD_COLOUR_DRAFT.id, version: 1, changedDimension: "pitch" },
  sections: [
    { id: "major", label: "Major third", fromBeat: 0, toBeat: 4 },
    { id: "minor", label: "Minor third", fromBeat: 4, toBeat: 8 },
  ],
  events: [
    thirdNote("major-root", 0, 0, "E"),
    thirdNote("major-third", 1, 4, "G#"),
    thirdNote("major-return", 2, 0, "E"),
    rest("major-space", 3),
    thirdNote("minor-root", 4, 0, "E"),
    thirdNote("minor-third", 5, 3, "G"),
    thirdNote("minor-return", 6, 0, "E"),
    rest("minor-space", 7),
  ],
};

export const THIRD_COLOUR_EPISODE_DRAFT: EpisodeDefinition = {
  id: "third-colour-episode",
  version: 1,
  unitId: "unit-10",
  materialId: THIRD_COLOUR_DRAFT.id,
  materialVersion: THIRD_COLOUR_DRAFT.version,
  objective: "Hear and play the one-fret difference between E–G and E–G# on one string.",
  successCriterion:
    "After the root, locate fret 3 for a minor third and fret 4 for a major third; hear which span is wider without reading the answer.",
  capabilityIds: ["ear.third.compare", "interval.third.locate", "fretboard.one-string.locate"],
  moves: [
    {
      id: "hear-contrast",
      phase: "learn",
      fromBeat: 0,
      toBeat: 8,
      instruction: "Hear E–G–E, then E–G#–E. Keep the root and rhythm constant; only the middle fret moves.",
      cues: "full",
    },
    {
      id: "play-and-predict",
      phase: "practise",
      fromBeat: 0,
      toBeat: 8,
      instruction: "Sing the next middle note before playing. Alternate fret 3 and fret 4 on the high E string.",
      cues: "count-only",
    },
    {
      id: "identify-and-play",
      phase: "try-unaided",
      fromBeat: 0,
      toBeat: 8,
      instruction: "Hear a concealed order, name the wider interval, then play both versions without note labels.",
      cues: "none",
    },
  ],
  obstacles: [
    {
      id: "cannot-hear",
      learnerSignal: "Both intervals sound the same to me.",
      fromBeat: 0,
      toBeat: 2,
      changedSupport:
        "Sing E then G several times; move only the second sound up one fret to G#. Compare again before naming.",
      returnTo: "whole-study",
    },
    {
      id: "cannot-land",
      learnerSignal: "I cannot land on the target fret.",
      fromBeat: 0,
      toBeat: 4,
      changedSupport:
        "Pause after E, locate fret 3 by sight and touch, then move one fret to 4 before restoring the pulse.",
      returnTo: "whole-study",
    },
    {
      id: "name-first",
      learnerSignal: "I remember the label but cannot predict the sound.",
      fromBeat: 0,
      toBeat: 4,
      changedSupport:
        "Hide the labels, sing the narrower and wider answer, then check against the guitar before returning to both bars.",
      returnTo: "whole-study",
    },
  ],
  variationMaterialId: THIRD_COLOUR_REVERSED_DRAFT.id,
  delayedCheck: {
    earliestDaysLater: 1,
    tempo: 66,
    cues: "none",
    instruction: "On another day, hear the reversed order and identify each third before seeing frets 3 and 4.",
  },
};

export interface DraftChordVoicing {
  id: "C" | "Am";
  positions: readonly GuitarPosition[];
}

export interface DraftChordStudy {
  id: string;
  version: 1;
  review: { status: "draft" };
  unitId: "unit-06";
  tonalCenter: "C major";
  tuningMidi: MusicalMaterial["tuningMidi"];
  metre: MusicalMaterial["metre"];
  bars: number;
  tempo: { minimum: 40; default: 60; maximum: 72 };
  voicings: readonly DraftChordVoicing[];
  events: readonly { id: string; atBeat: number; beats: number; chordId: DraftChordVoicing["id"] }[];
  variation: readonly { id: string; atBeat: number; beats: number; chordId: DraftChordVoicing["id"] }[];
}

export interface DraftChordEpisode extends Omit<EpisodeDefinition, "variationMaterialId"> {
  variation: "two-count";
}

/** Draft only: the active one-note score/player cannot yet represent simultaneous chord notes. */
export const COMMON_TONE_CHANGE_DRAFT: DraftChordStudy = {
  id: "common-tone-c-am",
  version: 1,
  review: { status: "draft" },
  unitId: "unit-06",
  tonalCenter: "C major",
  tuningMidi: STANDARD_TUNING_MIDI,
  metre: { numerator: 4, denominator: 4 },
  bars: 2,
  tempo: { minimum: 40, default: 60, maximum: 72 },
  voicings: [
    {
      id: "C",
      positions: [
        { string: 5, fret: 3 },
        { string: 4, fret: 2 },
        { string: 3, fret: 0 },
        { string: 2, fret: 1 },
        { string: 1, fret: 0 },
      ],
    },
    {
      id: "Am",
      positions: [
        { string: 5, fret: 0 },
        { string: 4, fret: 2 },
        { string: 3, fret: 2 },
        { string: 2, fret: 1 },
        { string: 1, fret: 0 },
      ],
    },
  ],
  events: [
    { id: "c-first", atBeat: 0, beats: 4, chordId: "C" },
    { id: "am-answer", atBeat: 4, beats: 4, chordId: "Am" },
  ],
  variation: [
    { id: "c-one", atBeat: 0, beats: 2, chordId: "C" },
    { id: "am-one", atBeat: 2, beats: 2, chordId: "Am" },
    { id: "c-two", atBeat: 4, beats: 2, chordId: "C" },
    { id: "am-two", atBeat: 6, beats: 2, chordId: "Am" },
  ],
};

/** Teaching script for the chord score. It has no live player or reviewed hand demonstration yet. */
export const COMMON_TONE_EPISODE_DRAFT: DraftChordEpisode = {
  id: "common-tone-c-am-episode",
  version: 1,
  unitId: COMMON_TONE_CHANGE_DRAFT.unitId,
  materialId: COMMON_TONE_CHANGE_DRAFT.id,
  materialVersion: COMMON_TONE_CHANGE_DRAFT.version,
  objective: "Hear a C-to-Am change as moving voices while three string/fret positions stay put.",
  successCriterion:
    "Play C for four counts and Am for four counts, name the three unchanged string/fret positions, then try two-count changes without stopping the pulse.",
  capabilityIds: ["harmony.common-tone.hear", "chord.c-am.change", "rhythm.chord-change.pulse"],
  moves: [
    {
      id: "hear-and-find",
      phase: "learn",
      fromBeat: 0,
      toBeat: 8,
      instruction:
        "Hear C for four counts, then Am for four. Find the D-string fret 2, B-string fret 1 and open high E that both shapes share.",
      cues: "full",
    },
    {
      id: "move-only-what-changes",
      phase: "practise",
      fromBeat: 0,
      toBeat: 8,
      instruction:
        "Change the bass from C to A and add G-string fret 2. Keep the shared notes ringing where comfortable; return to the full eight counts.",
      cues: "count-only",
    },
    {
      id: "two-count-phrase",
      phase: "try-unaided",
      fromBeat: 0,
      toBeat: 8,
      instruction:
        "Play C–Am–C–Am with two counts each. Say which notes stayed in place, then make one quieter or louder answer by choice.",
      cues: "none",
    },
  ],
  obstacles: [
    {
      id: "change-breaks-pulse",
      learnerSignal: "The change stops my pulse.",
      fromBeat: 3,
      toBeat: 5,
      changedSupport:
        "Mute the strings and rehearse only the change on count 1 at a slower pulse. Restore one chord at a time, then both bars.",
      returnTo: "whole-study",
    },
    {
      id: "shared-notes-lost",
      learnerSignal: "I lift every finger when the chord changes.",
      fromBeat: 0,
      toBeat: 8,
      changedSupport:
        "Place the shared B-string fret 1 first, then compare the D-string fret 2 and open high E before moving the bass and G string. Return to both chords.",
      returnTo: "whole-study",
    },
  ],
  variation: "two-count",
  delayedCheck: {
    earliestDaysLater: 1,
    tempo: 60,
    cues: "none",
    instruction:
      "On another day, change C to Am without the diagram, then identify the shared notes and try the two-count phrase.",
  },
};

export function validatePhase6Drafts(chordDraft: DraftChordStudy = COMMON_TONE_CHANGE_DRAFT): string[] {
  const errors = [
    ...validateMaterial(THIRD_COLOUR_DRAFT).map((error) => `Third study: ${error}`),
    ...validateMaterial(THIRD_COLOUR_REVERSED_DRAFT).map((error) => `Third variation: ${error}`),
  ];
  const chordModel = buildChords(createContext("C", "major"));
  if (!Number.isInteger(chordDraft.bars) || chordDraft.bars < 1 || chordDraft.bars > 16)
    errors.push("Chord study: invalid bar count.");
  if (chordDraft.tuningMidi.some((midi) => !Number.isInteger(midi) || midi < 0 || midi > 127))
    errors.push("Chord study: invalid tuning.");
  const voicingIds = new Set<string>();
  for (const voicing of chordDraft.voicings) {
    if (voicingIds.has(voicing.id)) errors.push(`${voicing.id}: duplicate voicing ID.`);
    voicingIds.add(voicing.id);
    const chord = chordModel.find((item) => item.symbol === voicing.id);
    const strings = voicing.positions.map((position) => position.string);
    if (new Set(strings).size !== strings.length || strings.some((string) => string < 1 || string > 6))
      errors.push(`${voicing.id}: a string is duplicated or invalid.`);
    if (
      voicing.positions.some((position) => !Number.isInteger(position.fret) || position.fret < 0 || position.fret > 12)
    )
      errors.push(`${voicing.id}: fret is outside this draft's small playing region.`);
    if (!chord) {
      errors.push(`${voicing.id}: chord is missing from C major.`);
      continue;
    }
    const played = new Set(
      voicing.positions.map((position) => normalize(positionMidi(chordDraft.tuningMidi, position))),
    );
    const expected = new Set(chord.tones.map((tone) => tone.pitchClass));
    if (played.size !== expected.size || [...played].some((pitch) => !expected.has(pitch)))
      errors.push(`${voicing.id}: frets do not sound the named chord.`);
  }
  for (const [label, events] of [
    ["study", chordDraft.events],
    ["variation", chordDraft.variation],
  ] as const) {
    let nextBeat = 0;
    const eventIds = new Set<string>();
    for (const event of events) {
      if (
        !event.id ||
        eventIds.has(event.id) ||
        !Number.isInteger(event.atBeat) ||
        !Number.isInteger(event.beats) ||
        event.atBeat !== nextBeat ||
        event.beats <= 0 ||
        (event.atBeat % chordDraft.metre.numerator) + event.beats > chordDraft.metre.numerator ||
        !voicingIds.has(event.chordId)
      )
        errors.push(`${label}: invalid chord event ${event.id}.`);
      eventIds.add(event.id);
      nextBeat = event.atBeat + event.beats;
    }
    if (nextBeat !== chordDraft.bars * chordDraft.metre.numerator)
      errors.push(`${label}: events do not fill the study.`);
  }
  return errors;
}
