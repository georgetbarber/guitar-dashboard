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

/** A deterministic on-screen answer check is distinct from a report about playing. */
export type EvidenceMethod = "self-reported" | "exact-answer";

export interface CompetencyEvidence {
  id: string;
  competencyId: string;
  source: EvidenceSource;
  assistance: Assistance;
  context: EvidenceContext;
  outcome: EvidenceOutcome;
  occurredAt: string;
  /** Learner-local calendar date at capture; older records fall back to UTC date. */
  localDate?: string;
  activityId: string;
  /** Absent on records written before this field existed; those are all self-reported too. */
  method?: EvidenceMethod;
  /** Exact-answer checks keep their question identity, version and selected answer. */
  checkId?: string;
  contentVersion?: number;
  response?: string;
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
  /** A fully authored episode can coexist with legacy templated activities during migration. */
  episodeId?: string;
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
  /** A shorter, familiar return after time away; no claim of forgotten skill. */
  kind?: "full" | "return";
}

/** Device-durable position in the first authored episode. Older workspaces omit it. */
export interface PilotCursor {
  id: string;
  episodeId: string;
  episodeVersion: number;
  materialId: string;
  materialVersion: number;
  step: "learn" | "practise" | "try" | "repair" | "vary" | "return";
  sectionId: "whole" | "question" | "answer";
  tempo: number;
  assistance: Assistance;
  /** Generated when a check begins and reused if the record action is retried. */
  attemptId?: string;
  repairId?: string;
  /** A learner's saved review whose next change they chose to practise. */
  reviewId?: string;
  updatedAt: string;
}

/** A self-report about a specific attempt; it is never a measured performance. */
export interface PilotAttempt {
  id: string;
  cursorId: string;
  episodeId: string;
  episodeVersion: number;
  materialId: string;
  materialVersion: number;
  kind: "first-check" | "later-check";
  assistance: Assistance;
  method: "self-reported";
  tempo: number;
  outcome: EvidenceOutcome;
  observation: string;
  occurredAt: string;
  /** Learner-local calendar date at capture; older records fall back to UTC date. */
  localDate?: string;
}

export type LessonStep = "learn" | "practise" | "try" | "transfer" | "create" | "return";

/**
 * Device-durable position in one authored lesson (src/v8/lessons). One per
 * lesson; a revised lesson version starts a fresh cursor. Older workspaces
 * omit the list, and older clients ignore it.
 */
export interface LessonCursor {
  id: string;
  lessonId: string;
  lessonVersion: number;
  step: LessonStep;
  /** The score in view: a study, the transfer or the recall score. */
  scoreId: string;
  tempo: number;
  assistance: Assistance;
  /** Generated when a check begins and reused if the record action is retried. */
  attemptId?: string;
  /** The likely error being repaired, when the learner chose one. */
  errorId?: string;
  /** For a lesson whose check is making something: the learner's own version, saved in Create. */
  sketchId?: string;
  updatedAt: string;
}

/** A self-report about one lesson check; never a measured performance. */
export interface LessonAttempt {
  id: string;
  cursorId: string;
  lessonId: string;
  lessonVersion: number;
  scoreId: string;
  scoreVersion: number;
  kind: "first-check" | "transfer-check" | "later-check";
  assistance: Assistance;
  /** Exact-answer for a listening check, which the app marks; self-reported for everything played or made. */
  method: "self-reported" | "exact-answer";
  tempo: number;
  outcome: EvidenceOutcome;
  /** The learner's observation, or for a listening check the app's summary of the answers. */
  observation: string;
  /** For a making check: the sketch the learner made and reported on. */
  artifactId?: string;
  occurredAt: string;
  localDate: string;
}

export type PilotReviewFocus = "phrasing" | "muting" | "tension" | "tone" | "intention";

/** A learner's written comparison after a temporary take, never measured evidence. */
export interface PilotListeningReview {
  id: string;
  episodeId: string;
  episodeVersion: number;
  materialId: string;
  materialVersion: number;
  takeCapturedAt: string;
  focus: PilotReviewFocus;
  intended: string;
  noticed: string;
  nextChange: string;
  method: "self-reported";
  createdAt: string;
  localDate: string;
}

export interface PilotVariation {
  id: string;
  sourceMaterialId: string;
  sourceVersion: number;
  materialId: string;
  materialVersion: number;
  answerMiddleCount: 3;
  createdAt: string;
}

/** Device-local return address for a contextual explanation. */
export interface ExploreFocus {
  materialId: string;
  materialVersion: number;
  sectionId: "whole" | "question" | "answer";
  tempo: number;
  returnActivityId: string;
  returnRoute: RouteId;
  openedAt: string;
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
  snapshot: Pick<Sketch, "chords" | "melody" | "rhythmPattern" | "sections" | "notes"> &
    Partial<Pick<Sketch, "key" | "mode" | "tempo" | "metre">>;
}

/** Provenance is kept in the device workspace/backup; the music itself can sync. */
export interface SketchOrigin {
  kind: "pilot" | "free-play";
  sourceId: string;
  sourceVersion?: number;
  label: string;
  activityId?: string;
  sectionId?: "whole" | "question" | "answer";
  referenceTempo: number;
  createdAt: string;
  /** Exact Free Play guide retained even when the new sketch changes. */
  preview?: FreePlayPreview;
}

export type FreePlayPreview =
  | { kind: "chords"; pitches: number[][] }
  | { kind: "notes"; pitches: number[]; bpm: number }
  | { kind: "degree"; tonic: number; target: number }
  | { kind: "groove"; bpm: number; accents: boolean[] };

export const SKETCH_SYNC_FIELDS = [
  "name", "intention", "tags", "tempo", "metre", "key", "mode", "chords", "melody",
  "rhythmPattern", "bassMovement", "sections", "notes", "ambiguityNotes", "reflections", "status"
] as const;
export type SketchSyncField = typeof SKETCH_SYNC_FIELDS[number];

export interface Sketch {
  id: string;
  origin?: SketchOrigin;
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

/** Review status of authored content. Separate from whether a learner may open it. */
export type ReviewStatus = "draft" | "reviewed" | "trialled";

export const FEEDBACK_CATEGORIES = [
  "wrong-music", "unplayable", "confusing", "too-hard", "too-easy", "sounds-bad", "other"
] as const;
export type FeedbackCategory = typeof FEEDBACK_CATEGORIES[number];

/**
 * "Something's wrong here": the learner's note about a piece of content.
 *
 * Its own record type. It is never learning evidence, never counts towards
 * progress, and only its "dealt with" state can change after it is written.
 */
export interface FeedbackNote {
  id: string;
  /** Stable id of what the note is about: an episode, activity, piece or screen. */
  contentId: string;
  contentVersion?: number;
  /** Human-readable name at the time, so an export reads on its own. */
  contentTitle: string;
  /** Step, section, bar or beat, when the screen has one. */
  location?: string;
  /** What was on screen when the note was started. */
  showing: string;
  text: string;
  category?: FeedbackCategory;
  createdAt: string;
  localDate: string;
  /** When George marked it as dealt with; null after reopening. */
  resolvedAt?: string | null;
  updatedAt: string;
  appVersion?: string;
}

/** A tick on one item of George's checklist (src/v8/georgeChecks.json). */
export interface ChecklistTick {
  id: string;
  done: boolean;
  updatedAt: string;
}

/**
 * "Mark as checked": a learner-owned overlay recording that George played a
 * lesson and is content with it. It applies to one exact content version, so
 * a revised lesson returns to draft until it is checked again.
 */
export interface ReviewMark {
  /** `${contentId}@${contentVersion}` */
  id: string;
  contentId: string;
  contentVersion: number;
  reviewer: string;
  reviewedAt: string;
  /** Undoing a check keeps the record so other devices learn of the undo. */
  withdrawn: boolean;
  updatedAt: string;
}

export interface V8State {
  /** Device-only decision, committed atomically with a restored workspace. */
  pendingRestoreId?: string;
  /** Feedback notes, checklist ticks and review marks sync in their own collections, never in the profile. */
  feedbackNotes?: FeedbackNote[];
  checklistTicks?: ChecklistTick[];
  reviewMarks?: ReviewMark[];
  /** The name last used when marking a lesson as checked. Device workspace and backup only. */
  reviewerName?: string;
  /** Authored-lesson state is local to this workspace and included in its backup, like the pilot's. */
  lessonCursors?: LessonCursor[];
  lessonAttempts?: LessonAttempt[];
  /** Pilot state is local to this workspace and included in its backup. */
  pilotCursor?: PilotCursor | null;
  pilotAttempts?: PilotAttempt[];
  pilotReviews?: PilotListeningReview[];
  pilotVariations?: PilotVariation[];
  /** The current device's guided route; stays fixed across detours and reloads. */
  sessionPlan?: SessionPlan | null;
  sessionCursor?: number;
  /** A learner-authored destination, kept in this device workspace and backup. */
  personalGoal?: string;
  /** User-chosen familiar material for a later recall or warm-up. */
  favoriteActivityIds?: string[];
  exploreFocus?: ExploreFocus | null;
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
  /** Days with an independently checked answer or measured performance. */
  successfulDays: number;
  /** Learner-reported success stays visible without becoming verified readiness. */
  reportedSuccessDays: number;
  contextCount: number;
  assistedAttempts: number;
  lastAttemptAt?: string;
  lastAttemptLocalDate?: string;
}
