/**
 * THE AUTHORED LESSON: EVERYTHING AN EPISODE NEEDS, AS REQUIRED DATA.
 *
 * Completion brief §4.3 lists what every episode must have. Each item is a
 * required field here, and validate.ts fails a lesson that leaves one out:
 * exact music (format 2 scores), an inviting purpose and audible destination,
 * a demonstration with written hand guidance, at least two musically distinct
 * studies, the variable being changed, capabilities, honest success criteria,
 * likely errors with specific repairs, a cue-fading sequence, a delayed
 * retrieval task, a real transfer, a route into a performance or personal
 * artefact, and provenance.
 *
 * A lesson stands in for one templated activity of its unit; a self-report
 * from its unaided check is recorded against that activity, so progress keeps
 * one meaning across templated and authored units.
 */
import type { ChangedDimension, Provenance, Score } from "../../core/score/types";
import type { CapabilityAction } from "../capabilities";
import type { ActivityKind } from "../types";

export interface LessonCapability {
  id: string;
  action: CapabilityAction;
  title: string;
  /** What doing it looks or sounds like; shown beside the self-report. */
  criterion: string;
}

export interface LessonStudy {
  id: string;
  scoreId: string;
  title: string;
  /** What is different from the study before it, in musical terms. */
  changes: string;
}

export interface LikelyError {
  id: string;
  /** What the learner notices, in their words. */
  signal: string;
  /** A specific changed support, ending with a return to the whole study. */
  repair: string;
  scoreId: string;
  /** The span to loop while repairing, in ticks of that score. */
  from: number;
  to: number;
}

export type CuePhase = "learn" | "practise" | "try-unaided";
export type CueLevel = "full" | "count-only" | "none";

export interface CueStep {
  id: string;
  phase: CuePhase;
  cues: CueLevel;
  scoreId: string;
  instruction: string;
}

/** Techniques whose hand movement really needs seeing; a lesson using one must flag the missing video. */
export type VisibleTechnique =
  | "bends"
  | "vibrato"
  | "muting"
  | "fingerpicking hand"
  | "legato"
  | "strumming hand"
  | "fretting hand";

/**
 * What the unaided check asks for. It must match the evidence the stand-in
 * activity records: playing (performance or production), listening
 * (recognition), creating (creation) or reflecting (reflection).
 */
export type CheckKind = "playing" | "listening" | "creating" | "reflecting";

export interface Lesson {
  id: string;
  version: number;
  provenance: Provenance;
  unitId: string;
  stage: number;
  activityKind: ActivityKind;
  checkKind: CheckKind;
  title: string;
  /** Why someone would want to play this, in a sentence. */
  purpose: string;
  /** What the learner will hear themselves play by the end. */
  destination: string;
  /** The one musical variable the studies change. */
  variable: string;
  capabilities: readonly LessonCapability[];
  scores: readonly Score[];
  demonstration: {
    scoreId: string;
    /** Written hand guidance standing in for a filmed demonstration. */
    handGuidance: readonly string[];
    /** Shown as "demonstration video still needed" until a reviewed video exists. */
    videoNeeded: readonly VisibleTechnique[];
  };
  studies: readonly LessonStudy[];
  successCriteria: readonly string[];
  likelyErrors: readonly LikelyError[];
  cueFading: readonly CueStep[];
  retrieval: { afterDays: number; scoreId: string; tempo: number; instruction: string };
  transfer: { scoreId: string; instruction: string; changed: readonly ChangedDimension[] };
  performance: { kind: "create"; instruction: string } | { kind: "piece"; pieceId: string; instruction: string };
}

/** The part of a lesson the app needs before its stage's content has loaded. */
export interface LessonEntry {
  id: string;
  version: number;
  unitId: string;
  stage: number;
  activityKind: ActivityKind;
  title: string;
}

export function entryOf(lesson: Lesson): LessonEntry {
  return {
    id: lesson.id,
    version: lesson.version,
    unitId: lesson.unitId,
    stage: lesson.stage,
    activityKind: lesson.activityKind,
    title: lesson.title,
  };
}

export function scoreById(lesson: Lesson, id: string): Score {
  const found = lesson.scores.find((score) => score.id === id);
  if (!found) throw new Error(`Lesson ${lesson.id} has no score ${id}.`);
  return found;
}
