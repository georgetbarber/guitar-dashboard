import { ACTIVITIES, CURRICULUM, activityById, unitById } from "./curriculum";
import { COMPETENCY_STRANDS } from "./types";
import type {
  Assistance,
  CompetencyStrand,
  CompetencyEvidence,
  EvidenceContext,
  EvidenceOutcome,
  MasterySummary,
  SessionItem,
  SessionPlan,
  V8State
} from "./types";

function day(value: string): string {
  return value.slice(0, 10);
}

function contextKey(context: EvidenceContext): string {
  return [context.key, context.mode, context.fretRegion?.join("-"), context.tempo, context.instrument]
    .filter((value) => value !== undefined)
    .join("|");
}

/**
 * Activity completion means the learner achieved the activity's observable
 * action at least once. Retry and partial evidence remains valuable practice
 * history, but must not advance the guided path.
 */
export function completedActivityIdsFromEvidence(evidence: CompetencyEvidence[]): string[] {
  return [...new Set(evidence
    .filter((item) => item.outcome === "successful")
    .map((item) => item.activityId))];
}

export function masteryFor(competencyId: string, evidence: CompetencyEvidence[]): MasterySummary {
  const relevant = evidence.filter((item) => item.competencyId === competencyId);
  const independent = relevant.filter((item) => item.assistance === "none" && item.outcome === "successful");
  const successfulDays = new Set(independent.map((item) => day(item.occurredAt))).size;
  const contextCount = new Set(independent.map((item) => contextKey(item.context))).size;
  const hasTransfer = independent.some((item) => item.source === "transfer");
  const state = successfulDays >= 2 && contextCount >= 2 && hasTransfer
    ? "transfer-ready"
    : successfulDays >= 2
      ? "secure"
      : relevant.length
        ? "practising"
        : "introduced";
  return {
    competencyId,
    state,
    successfulDays,
    contextCount,
    assistedAttempts: relevant.filter((item) => item.assistance !== "none").length
  };
}

export function masteryNextStep(summary: MasterySummary): string {
  switch (summary.state) {
    case "transfer-ready":
      return "Secure across contexts — keep transferring it to new music.";
    case "secure":
      return summary.contextCount < 2
        ? "Play it in a new key or tempo, then do a transfer task, to reach Transfer-ready."
        : "Do a transfer task (new key, region or tempo) to reach Transfer-ready.";
    case "practising": {
      const daysLeft = Math.max(1, 2 - summary.successfulDays);
      return `${daysLeft} more independent success day${daysLeft === 1 ? "" : "s"} (no hint or reveal) to reach Secure.`;
    }
    default:
      return "Complete it independently once to start building evidence.";
  }
}

// Weakest-link ranking: prefer activities whose competency shows the least independent
// mastery and the most retries, so "recommended next" reflects real evidence, not just order.
export function recommendPractice(activities: typeof ACTIVITIES, state: V8State, focusStrands: readonly CompetencyStrand[] = []): typeof ACTIVITIES[number] | undefined {
  if (!activities.length) return undefined;
  const stateRank: Record<string, number> = { introduced: 0, practising: 1, secure: 2, "transfer-ready": 3 };
  const retriesFor = (competencyId: string) =>
    state.evidence.filter((item) => item.competencyId === competencyId && item.outcome !== "successful").length;
  const weakness = (activity: typeof ACTIVITIES[number]) => {
    const focusedIds = focusStrands.length
      ? activity.competencyIds.filter((id) => focusStrands.some((strand) => id.startsWith(`${strand}:`)))
      : activity.competencyIds;
    const summaries = (focusedIds.length ? focusedIds : activity.competencyIds).map((id) => masteryFor(id, state.evidence));
    const minMastery = Math.min(...summaries.map((summary) => stateRank[summary.state] ?? 0));
    const retries = (focusedIds.length ? focusedIds : activity.competencyIds).reduce((sum, id) => sum + retriesFor(id), 0);
    const done = state.completedActivityIds.includes(activity.id) ? 1 : 0;
    // Lower is more urgent: unfinished first, then least mastery, then most retries.
    return done * 100 + minMastery * 10 - Math.min(retries, 9);
  };
  return [...activities].sort((a, b) => weakness(a) - weakness(b))[0];
}

export function recommendedPracticeStrand(state: V8State): CompetencyStrand | undefined {
  const stateRank: Record<string, number> = { introduced: 0, practising: 1, secure: 2, "transfer-ready": 3 };
  const candidates = COMPETENCY_STRANDS.flatMap((strand, index) => {
    const competencyIds = [...new Set(state.evidence.filter((item) => item.competencyId.startsWith(`${strand}:`)).map((item) => item.competencyId))];
    if (!competencyIds.length) return [];
    const minMastery = Math.min(...competencyIds.map((id) => stateRank[masteryFor(id, state.evidence).state] ?? 0));
    const retries = state.evidence.filter((item) => item.competencyId.startsWith(`${strand}:`) && item.outcome !== "successful").length;
    return [{ strand, index, score: minMastery * 100 - Math.min(retries, 99) }];
  });
  return candidates.sort((a, b) => a.score - b.score || a.index - b.index)[0]?.strand;
}

export function unitProgress(state: V8State, unitId: string): number {
  const unit = unitById(unitId);
  const completed = unit.activities.filter((activity) => state.completedActivityIds.includes(activity.id)).length;
  return Math.round((completed / unit.activities.length) * 100);
}

export function nextUnit(state: V8State) {
  const startingOrder = state.settings.startingBaseline === "secure" ? 7 : state.settings.startingBaseline === "some" ? 3 : 1;
  return CURRICULUM.find((unit) => unit.order >= startingOrder && unitProgress(state, unit.id) < 100) ?? CURRICULUM.at(-1)!;
}

function sessionItem(activityId: string, minutes: number): SessionItem {
  const activity = activityById(activityId) ?? ACTIVITIES[0];
  return { activityId, title: activity.title, purpose: activity.why, minutes, kind: activity.kind };
}

export function buildSession(state: V8State, now = new Date()): SessionPlan {
  const unit = nextUnit(state);
  const unfinished = unit.activities.filter((activity) => !state.completedActivityIds.includes(activity.id));
  const choose = (kinds: typeof unit.activities[number]["kind"][], fallback: number) =>
    unfinished.find((activity) => kinds.includes(activity.kind)) ?? unit.activities[fallback];
  const selections: Array<[ReturnType<typeof choose>, number]> = [
    [choose(["listen-compare", "sing-predict"], 0), 3],
    [choose(["technique", "rhythm"], 2), 5],
    [choose(["relationship"], 4), 6],
    [choose(["variation", "transfer"], 5), 6],
    [choose(["creative", "reflection"], 6), 5]
  ];
  const items = selections.map(([activity, minutes]) => sessionItem(activity.id, minutes));
  return {
    id: `session-${now.toISOString().slice(0, 10)}-${unit.id}`,
    unitId: unit.id,
    title: unit.title,
    purpose: unit.outcome,
    totalMinutes: items.reduce((sum, item) => sum + item.minutes, 0),
    items,
    generatedAt: now.toISOString()
  };
}

export function createEvidence(
  activityId: string,
  competencyIds: string[],
  source: CompetencyEvidence["source"],
  assistance: Assistance,
  outcome: EvidenceOutcome,
  context: EvidenceContext,
  occurredAt = new Date().toISOString()
): CompetencyEvidence[] {
  return competencyIds.map((competencyId, index) => ({
    id: `${occurredAt}-${activityId}-${index}`,
    competencyId,
    source,
    assistance,
    context,
    outcome,
    occurredAt,
    activityId
  }));
}

export function pathSummary(state: V8State) {
  const completedUnits = CURRICULUM.filter((unit) => unitProgress(state, unit.id) === 100).length;
  const created = state.sketches.length;
  const revised = state.sketches.filter((sketch) => sketch.revisions.length > 0).length;
  const finished = state.sketches.filter((sketch) => sketch.status === "finished").length;
  return { completedUnits, totalUnits: CURRICULUM.length, created, revised, finished };
}
