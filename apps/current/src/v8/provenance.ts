/**
 * WHO WROTE A LESSON, WHO CHECKED IT, AND WHAT THE LEARNER SEES.
 *
 * Every authored episode, study and piece carries provenance: its content
 * version, author, reviewer, review status and review date. Agent-written work
 * is `agent-drafted` and starts as `draft`. Review status is never a learner
 * access lock: draft lessons are playable, with a calm tag saying so.
 *
 * George moves a lesson to reviewed with "Mark as checked", which writes a
 * learner-owned ReviewMark rather than editing the authored content.
 */
import type { Provenance } from "../core/score/types";
import type { ActivityDefinition, ReviewMark, ReviewStatus } from "./types";

export const AGENT_DRAFTED = "agent-drafted";
/** The 48 templated units that predate authored episodes. */
export const LEGACY_TEMPLATE = "legacy-template";

/** Provenance as carried on authored content. contentId and version come from the content itself. */
export type { Provenance };

export interface AuthoredProvenance extends Provenance {
  contentId: string;
  contentVersion: number;
}

export const DRAFT_BY_AGENT: Provenance = {
  author: AGENT_DRAFTED,
  reviewer: "",
  reviewStatus: "draft",
  reviewedAt: null,
};

export function provenanceProblems(provenance: Provenance | undefined): string[] {
  if (!provenance) return ["Missing provenance (author, reviewer, review status, review date)."];
  const problems: string[] = [];
  if (!provenance.author.trim()) problems.push("Provenance needs an author.");
  if (!["draft", "reviewed", "trialled"].includes(provenance.reviewStatus)) problems.push("Unknown review status.");
  if (provenance.reviewStatus === "draft" && (provenance.reviewer || provenance.reviewedAt))
    problems.push("A draft cannot name a reviewer or review date.");
  if (
    provenance.reviewStatus !== "draft" &&
    (!provenance.reviewer.trim() || !Number.isFinite(Date.parse(provenance.reviewedAt ?? "")))
  )
    problems.push("Reviewed or trialled content needs a named reviewer and a review date.");
  return problems;
}

/** The templated activities were never checked on a guitar either; they say so in the same way. */
export function legacyActivityProvenance(activity: Pick<ActivityDefinition, "id">): AuthoredProvenance {
  return {
    contentId: activity.id,
    contentVersion: 1,
    author: LEGACY_TEMPLATE,
    reviewer: "",
    reviewStatus: "draft",
    reviewedAt: null,
  };
}

export function reviewMarkId(contentId: string, contentVersion: number): string {
  return `${contentId}@${contentVersion}`;
}

export function newReviewMark(
  contentId: string,
  contentVersion: number,
  reviewer: string,
  now = new Date(),
): ReviewMark {
  const at = now.toISOString();
  return {
    id: reviewMarkId(contentId, contentVersion),
    contentId,
    contentVersion,
    reviewer: reviewer.trim(),
    reviewedAt: at,
    withdrawn: false,
    updatedAt: at,
  };
}

export interface EffectiveReview {
  status: ReviewStatus;
  reviewer: string;
  reviewedAt: string | null;
  /** True when the status comes from the learner's own "Mark as checked". */
  fromLearnerMark: boolean;
}

/**
 * The status a learner should see. An authored review wins; otherwise a live
 * mark for this exact version makes the content reviewed. A mark for an older
 * version does not carry over to a revised lesson.
 */
export function effectiveReview(provenance: AuthoredProvenance, marks: readonly ReviewMark[] = []): EffectiveReview {
  if (provenance.reviewStatus !== "draft") {
    return {
      status: provenance.reviewStatus,
      reviewer: provenance.reviewer,
      reviewedAt: provenance.reviewedAt,
      fromLearnerMark: false,
    };
  }
  const mark = marks.find(
    (item) => item.id === reviewMarkId(provenance.contentId, provenance.contentVersion) && !item.withdrawn,
  );
  return mark
    ? { status: "reviewed", reviewer: mark.reviewer, reviewedAt: mark.reviewedAt, fromLearnerMark: true }
    : { status: "draft", reviewer: "", reviewedAt: null, fromLearnerMark: false };
}
