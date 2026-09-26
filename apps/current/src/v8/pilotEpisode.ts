import type { MusicalMaterial, PerformanceReference } from "./structuredMusic";
import { STANDARD_TUNING_MIDI, validateMaterial } from "./structuredMusic";

export interface TeachingMove {
  id: string;
  phase: "learn" | "practise" | "try-unaided";
  fromBeat: number;
  toBeat: number;
  instruction: string;
  cues: "full" | "count-only" | "none";
}

export interface ObstacleBranch {
  id: string;
  learnerSignal: string;
  fromBeat: number;
  toBeat: number;
  changedSupport: string;
  returnTo: "whole-study";
}

export interface EpisodeDefinition {
  id: string;
  version: number;
  unitId: string;
  materialId: string;
  materialVersion: number;
  objective: string;
  successCriterion: string;
  capabilityIds: readonly string[];
  moves: readonly TeachingMove[];
  obstacles: readonly ObstacleBranch[];
  variationMaterialId: string;
  delayedCheck: { earliestDaysLater: number; tempo: number; cues: "none"; instruction: string };
}

const E4 = { midi: 64, spelling: "E", position: { string: 1 as const, fret: 0 }, articulation: "full-value" as const };
const note = (id: string, atBeat: number) => ({ id, kind: "note" as const, atBeat, beats: 1, ...E4 });
const rest = (id: string, atBeat: number) => ({ id, kind: "rest" as const, atBeat, beats: 1 });

const common = {
  version: 1,
  tuningMidi: STANDARD_TUNING_MIDI,
  tonalCenter: { name: "E", midi: 64 },
  metre: { numerator: 4 as const, denominator: 4 as const },
  bars: 2,
  tempo: { minimum: 50, default: 60, maximum: 88 },
  sections: [
    { id: "question", label: "Question", fromBeat: 0, toBeat: 4 },
    { id: "answer", label: "Answer", fromBeat: 4, toBeat: 8 },
  ],
} as const;

/** High open E. One event per click, including each intentional silence. */
export const ONE_NOTE_QUESTION_ANSWER: MusicalMaterial = {
  ...common,
  id: "one-note-question-answer",
  title: "One-note question and answer",
  events: [
    note("q-1", 0),
    rest("q-2", 1),
    note("q-3", 2),
    rest("q-4", 3),
    note("a-1", 4),
    note("a-2", 5),
    rest("a-3", 6),
    note("a-4", 7),
  ],
};

/** A single rhythmic change: the answer's second attack moves from count 2 to 3. */
export const ONE_NOTE_ANSWER_SHIFT: MusicalMaterial = {
  ...common,
  id: "one-note-answer-shift",
  title: "Answer with a later middle note",
  derivedFrom: { id: ONE_NOTE_QUESTION_ANSWER.id, version: 1, changedDimension: "rhythm" },
  events: [
    note("q-1", 0),
    rest("q-2", 1),
    note("q-3", 2),
    rest("q-4", 3),
    note("a-1", 4),
    rest("a-2", 5),
    note("a-3", 6),
    note("a-4", 7),
  ],
};

export const PILOT_MATERIALS: readonly MusicalMaterial[] = [ONE_NOTE_QUESTION_ANSWER, ONE_NOTE_ANSWER_SHIFT];

/** No human guitar performance has been reviewed or shipped for this pilot yet. */
export const PILOT_PERFORMED_REFERENCES: readonly PerformanceReference[] = [];

export const PILOT_EPISODE: EpisodeDefinition = {
  id: "one-note-qa-episode",
  version: 1,
  unitId: "unit-01",
  materialId: ONE_NOTE_QUESTION_ANSWER.id,
  materialVersion: ONE_NOTE_QUESTION_ANSWER.version,
  objective: "Make a short rhythmic question and answer with one open string, including the silences.",
  successCriterion:
    "Play the two bars at 60 BPM, enter on count 1, stop each sound on the following click, and keep the pulse through every rest.",
  capabilityIds: ["pulse.quarter-note.steady", "sound.release.to-rest", "phrase.question-answer.one-note"],
  moves: [
    {
      id: "hear-and-see",
      phase: "learn",
      fromBeat: 0,
      toBeat: 8,
      cues: "full",
      instruction:
        "Listen and count 1 2 3 4 twice. The question sounds on 1 and 3; the answer sounds on 1, 2 and 4. Use the open high E string.",
    },
    {
      id: "play-with-count",
      phase: "practise",
      fromBeat: 0,
      toBeat: 8,
      cues: "count-only",
      instruction:
        "Play beside the count. Touch the high E string lightly with the picking hand to stop it on each rest; keep counting during silence.",
    },
    {
      id: "play-unaided",
      phase: "try-unaided",
      fromBeat: 0,
      toBeat: 8,
      cues: "none",
      instruction:
        "After one four-click count-in, play both bars without the model notes. Notice whether the rests and final answer still land on time.",
    },
  ],
  obstacles: [
    {
      id: "unclear-start",
      learnerSignal: "I do not know where to start.",
      fromBeat: 0,
      toBeat: 4,
      changedSupport:
        "Hear only the question bar, then count aloud and play its notes on 1 and 3. Add the answer only after that feels clear.",
      returnTo: "whole-study",
    },
    {
      id: "release",
      learnerSignal: "My note rings through the rest.",
      fromBeat: 0,
      toBeat: 2,
      changedSupport:
        "Loop one sound and one silence. On count 2, touch the string with the picking hand without plucking it. Then restore the whole question.",
      returnTo: "whole-study",
    },
    {
      id: "pulse",
      learnerSignal: "I lose the count in the silence.",
      fromBeat: 0,
      toBeat: 4,
      changedSupport:
        "Tap all four counts while playing only 1 and 3. Keep the hand moving silently on 2 and 4, then try both bars again.",
      returnTo: "whole-study",
    },
  ],
  variationMaterialId: ONE_NOTE_ANSWER_SHIFT.id,
  delayedCheck: {
    earliestDaysLater: 1,
    tempo: 72,
    cues: "none",
    instruction:
      "On a later day, hear one count-in and play the original two bars at 72 BPM before looking at the notes.",
  },
};

export function validatePilotEpisode(): string[] {
  const errors = PILOT_MATERIALS.flatMap((material) =>
    validateMaterial(material).map((error) => `${material.id}: ${error}`),
  );
  const original = PILOT_MATERIALS.find(
    (material) => material.id === PILOT_EPISODE.materialId && material.version === PILOT_EPISODE.materialVersion,
  );
  if (!original) return [...errors, "Episode has no matching versioned material."];
  const totalBeats = original.bars * original.metre.numerator;
  const validSpan = (fromBeat: number, toBeat: number) => fromBeat >= 0 && fromBeat < toBeat && toBeat <= totalBeats;
  if (!PILOT_EPISODE.moves.some((move) => move.phase === "try-unaided" && move.cues === "none"))
    errors.push("Episode lacks an unaided check.");
  for (const move of PILOT_EPISODE.moves)
    if (!validSpan(move.fromBeat, move.toBeat)) errors.push(`Invalid teaching span: ${move.id}.`);
  for (const obstacle of PILOT_EPISODE.obstacles)
    if (!validSpan(obstacle.fromBeat, obstacle.toBeat) || obstacle.returnTo !== "whole-study")
      errors.push(`Invalid repair branch: ${obstacle.id}.`);
  if (PILOT_EPISODE.obstacles.length < 3) errors.push("Episode needs three specific repair paths.");
  const variation = PILOT_MATERIALS.find((material) => material.id === PILOT_EPISODE.variationMaterialId);
  if (
    !variation?.derivedFrom ||
    variation.derivedFrom.id !== original.id ||
    variation.derivedFrom.version !== original.version
  )
    errors.push("Variation does not identify its preserved original.");
  if (
    PILOT_EPISODE.delayedCheck.earliestDaysLater < 1 ||
    PILOT_EPISODE.delayedCheck.tempo < original.tempo.minimum ||
    PILOT_EPISODE.delayedCheck.tempo > original.tempo.maximum
  )
    errors.push("Delayed check is outside the study's limits.");
  return errors;
}
