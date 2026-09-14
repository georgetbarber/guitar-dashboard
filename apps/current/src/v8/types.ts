import type { ModeId } from "../core/music/types";

export type RouteId = "today" | "path" | "practice" | "play" | "create" | "explore";
export type MasteryState = "introduced" | "practising" | "secure" | "transfer-ready";
export type Assistance = "none" | "hint" | "reveal" | "guided";
export type EvidenceSource = "recognition" | "production" | "performance" | "transfer" | "creation" | "reflection";
export type EvidenceOutcome = "successful" | "partial" | "retry";
export type Instrument = "electric" | "acoustic";

export const COMPETENCY_STRANDS = [
  "sound", "rhythm", "fretboard", "ear", "melody", "harmony", "composition", "reflection"
] as const;
export type CompetencyStrand = typeof COMPETENCY_STRANDS[number];

export interface EvidenceContext {
  key?: string;
  mode?: ModeId;
  fretRegion?: [number, number];
  tempo?: number;
  instrument?: Instrument;
}

/**
 * How an outcome was established.
 *
 * Only one value exists because only one thing happens today: the learner reads
 * the success criterion and reports what occurred. Nothing in V8 measures a
 * performance or checks an answer, and naming those here before they exist
 * would be the same overstatement this field is meant to remove. Phase 5 adds
 * them, and the rules and validator gain their values with them.
 */
export type EvidenceMethod = "self-reported";

export interface CompetencyEvidence {
  id: string;
  competencyId: string;
  source: EvidenceSource;
  assistance: Assistance;
  context: EvidenceContext;
  outcome: EvidenceOutcome;
  occurredAt: string;
  activityId: string;
  /** Absent on records written before this field existed; those are all self-reported too. */
  method?: EvidenceMethod;
  /** The sketch this observation points at, for work the learner actually saved. */
  artifactId?: string;
  /**
   * The id of an earlier observation this record retracts.
   *
   * Observations are immutable: a mistaken report is corrected by appending a
   * retraction, never by editing or deleting the original. A record carrying
   * this is a retraction, counts towards nothing itself, and removes the record
   * it names from every progress calculation.
   */
  retracts?: string;
}

export type ActivityKind =
  | "listen-compare"
  | "sing-predict"
  | "technique"
  | "rhythm"
  | "relationship"
  | "play-reveal"
  | "variation"
  | "creative"
  | "transfer"
  | "reflection";

export interface ActivityDefinition {
  id: string;
  unitId: string;
  kind: ActivityKind;
  title: string;
  instruction: string;
  why: string;
  minutes: number;
  competencyIds: string[];
  source: EvidenceSource;
  action: string;
  observable: string;
  prompt: string;
  hint?: string;
  reveal?: string;
}

export interface MicroStudy {
  title: string;
  purpose: string;
  tempo: number;
  metre: "4/4" | "3/4" | "6/8";
  tab: string[];
  rhythm: string;
  earTargets?: readonly number[];
}

export interface CurriculumUnit {
  id: string;
  stage: number;
  order: number;
  title: string;
  outcome: string;
  focus: string;
  prerequisiteIds: string[];
  competencyIds: string[];
  microStudy: MicroStudy;
  activities: ActivityDefinition[];
  optional?: boolean;
}

export interface SessionItem {
  activityId: string;
  title: string;
  purpose: string;
  minutes: number;
  kind: ActivityKind;
}

export interface SessionPlan {
  id: string;
  unitId: string;
  title: string;
  purpose: string;
  totalMinutes: number;
  items: SessionItem[];
  generatedAt: string;
}

export interface LearnerSettings {
  instrument: Instrument;
  dailyMinutes: number;
  tonicName: string;
  mode: ModeId;
  theme: "light" | "dark";
  reducedMotion: boolean;
  diagnosticComplete: boolean;
  startingBaseline: "repair" | "some" | "secure";
}

export interface Reflection {
  id: string;
  prompt: string;
  response: string;
  createdAt: string;
}

export interface ChordEvent {
  id: string;
  symbol: string;
  beats: number;
  voicing: Array<number | null>;
}

export interface MelodyEvent {
  id: string;
  string: number;
  fret: number;
  beat: number;
  duration: number;
}

export interface RecordedTake {
  id: string;
  name: string;
  createdAt: string;
  blobId?: string;
  note: string;
  cloud?: {
    storagePath: string;
    contentType: string;
    bytes: number;
    uploadedAt: string;
  };
}

export interface SketchRevision {
  id: string;
  createdAt: string;
  summary: string;
  snapshot: Pick<Sketch, "chords" | "melody" | "rhythmPattern" | "sections" | "notes">;
}

export const SKETCH_SYNC_FIELDS = [
  "name", "intention", "tags", "tempo", "metre", "key", "mode", "chords", "melody",
  "rhythmPattern", "bassMovement", "sections", "notes", "ambiguityNotes", "reflections", "status"
] as const;
export type SketchSyncField = typeof SKETCH_SYNC_FIELDS[number];

export interface Sketch {
  id: string;
  name: string;
  intention: string;
  tags: string[];
  tempo: number;
  metre: "4/4" | "3/4" | "6/8";
  key: string | null;
  mode: ModeId | null;
  chords: ChordEvent[];
  melody: MelodyEvent[];
  rhythmPattern: string;
  bassMovement: string;
  sections: string[];
  notes: string;
  ambiguityNotes: string;
  takes: RecordedTake[];
  revisions: SketchRevision[];
  reflections: Reflection[];
  status: "capture" | "understand" | "vary" | "arrange" | "record" | "compare" | "revise" | "finished";
  createdAt: string;
  updatedAt: string;
  fieldUpdatedAt?: Partial<Record<SketchSyncField, string>>;
}

export interface V8State {
  version: 8;
  syncVersion: 1;
  updatedAt: string;
  settingsUpdatedAt: string;
  route: RouteId;
  activeUnitId: string;
  activeActivityId: string | null;
  activityOrigin?: RouteId | null;
  resumeActivityId: string | null;
  completedActivityIds: string[];
  evidence: CompetencyEvidence[];
  settings: LearnerSettings;
  sketches: Sketch[];
  deletedSketchIds: Record<string, string>;
  activeSketchId: string | null;
  lastReflection: string;
}

export interface MasterySummary {
  competencyId: string;
  state: MasteryState;
  successfulDays: number;
  contextCount: number;
  assistedAttempts: number;
}
