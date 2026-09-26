import { ACTIVITIES, CURRICULUM, activityById, unitById } from "./curriculum";
import { newId } from "./identity";
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
 * The observations that still stand.
 *
 * Records are never edited or removed: a mistaken report is corrected by
 * appending a retraction that names it. So every progress calculation starts
 * here, by setting aside the retractions themselves and whatever they retract.
 * The full history remains in state, which is what makes the correction
 * auditable rather than a quiet rewrite.
 */
export function liveObservations(evidence: CompetencyEvidence[]): CompetencyEvidence[] {
  const retracted = new Set(evidence.flatMap((item) => (item.retracts ? [item.retracts] : [])));
  return evidence.filter((item) => !item.retracts && !retracted.has(item.id));
}

/**
 * Build the records that retract these observations. Each mirrors its original
 * so the history stays readable, and carries `retracts` so nothing it named
 * counts any more.
 */
export function retractObservations(observations: CompetencyEvidence[], occurredAt = new Date().toISOString()): CompetencyEvidence[] {
  return observations.map((observation) => ({
    ...observation,
    id: newId("evidence"),
    occurredAt,
    retracts: observation.id
  }));
}

/**
 * Activity completion means the learner achieved the activity's observable
 * action at least once. Retry and partial evidence remains valuable practice
 * history, but must not advance the guided path.
 */
export function completedActivityIdsFromEvidence(evidence: CompetencyEvidence[]): string[] {
  return [...new Set(liveObservations(evidence)
    .filter((item) => item.outcome === "successful")
    .map((item) => item.activityId))];
}

export function masteryFor(competencyId: string, evidence: CompetencyEvidence[]): MasterySummary {
  const relevant = liveObservations(evidence).filter((item) => item.competencyId === competencyId);
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

/**
 * THE SESSION IS BUILT TO THE LENGTH THE LEARNER CHOSE.
 *
 * The planner used to hard-code five items totalling 25 minutes, while
 * settings.dailyMinutes was settable from 10 to 90 and displayed on the Learn
 * screen as though it applied. Someone with fifteen minutes was handed a
 * twenty-five minute session, and someone with an hour was handed the same.
 *
 * This is an interim correction, not the session design: it keeps the existing
 * five-part shape and simply fits it honestly to the available time. The real
 * design — recall, targeted work, musical use, capture, a clear ending — arrives
 * in Phase 4A.
 */
const SESSION_SHAPE = [
  { kinds: ["listen-compare", "sing-predict"] as const, fallback: 0, minimum: 3, share: 3 },
  { kinds: ["technique", "rhythm"] as const, fallback: 2, minimum: 4, share: 5 },
  { kinds: ["relationship"] as const, fallback: 4, minimum: 4, share: 6 },
  { kinds: ["variation", "transfer"] as const, fallback: 5, minimum: 4, share: 6 },
  { kinds: ["creative", "reflection"] as const, fallback: 6, minimum: 3, share: 5 }
];

export const SESSION_MINUTES_MIN = 10;
export const SESSION_MINUTES_MAX = 90;

/**
 * Spread the minutes left after every chosen slot has its minimum, by share,
 * giving whole minutes only. The largest remainders take the leftover, so the
 * parts always add up to the budget exactly — a session that says 40 minutes
 * must be 40 minutes.
 */
function distribute(budget: number, minimums: number[], shares: number[]): number[] {
  const spare = budget - minimums.reduce((sum, value) => sum + value, 0);
  const total = shares.reduce((sum, value) => sum + value, 0);
  const exact = shares.map((share) => (spare * share) / total);
  const whole = exact.map(Math.floor);
  let remaining = spare - whole.reduce((sum, value) => sum + value, 0);
  const order = exact
    .map((value, index) => ({ index, remainder: value - Math.floor(value) }))
    .sort((a, b) => b.remainder - a.remainder);
  for (const entry of order) {
    if (remaining <= 0) break;
    whole[entry.index] += 1;
    remaining -= 1;
  }
  return minimums.map((minimum, index) => minimum + whole[index]);
}

export function buildSession(state: V8State, now = new Date()): SessionPlan {
  const unit = nextUnit(state);
  const budget = Math.min(SESSION_MINUTES_MAX, Math.max(SESSION_MINUTES_MIN, Math.round(state.settings.dailyMinutes)));

  /*
   * Only as many parts as the time can actually hold, in priority order. Ten
   * minutes cannot honestly contain five activities, and padding it out with
   * one-minute items would be the same overstatement in a different form.
   */
  const chosen: typeof SESSION_SHAPE = [];
  let committed = 0;
  for (const slot of SESSION_SHAPE) {
    if (committed + slot.minimum > budget) break;
    chosen.push(slot);
    committed += slot.minimum;
  }

  // Each part is a different activity: the old planner could select the same one
  // for two slots, so a "five-part session" was sometimes three.
  const taken = new Set<string>();
  const unfinished = unit.activities.filter((activity) => !state.completedActivityIds.includes(activity.id));
  const select = (kinds: readonly string[], fallback: number) => {
    const preferred = unfinished.find((activity) => kinds.includes(activity.kind) && !taken.has(activity.id))
      ?? unit.activities.find((activity) => kinds.includes(activity.kind) && !taken.has(activity.id))
      ?? unfinished.find((activity) => !taken.has(activity.id))
      ?? unit.activities.find((activity) => !taken.has(activity.id))
      ?? unit.activities[fallback];
    taken.add(preferred.id);
    return preferred;
  };

  const minutes = distribute(budget, chosen.map((slot) => slot.minimum), chosen.map((slot) => slot.share));
  const items = chosen.map((slot, index) => sessionItem(select(slot.kinds, slot.fallback).id, minutes[index]));

  return {
    id: `session-${now.toISOString().slice(0, 10)}-${unit.id}`,
    unitId: unit.id,
    title: unit.title,
    purpose: unit.outcome,
    totalMinutes: items.reduce((sum, item) => sum + item.minutes, 0),
    items,
    generatedAt: now.toISOString(),
    kind: "full"
  };
}

/** A familiar first step after time away, without inferring that anything was forgotten. */
export function daysSinceLastAttempt(state: V8State, now = new Date()): number | null {
  const latest = liveObservations(state.evidence).reduce<string | null>(
    (current, item) => !current || item.occurredAt > current ? item.occurredAt : current, null
  );
  if (!latest) return null;
  const localDay = (date: Date) => Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86_400_000;
  return Math.max(0, localDay(now) - localDay(new Date(latest)));
}

export function buildReturnSession(state: V8State, now = new Date()): SessionPlan {
  const full = buildSession(state, now);
  const latest = [...liveObservations(state.evidence)].sort((a, b) => b.occurredAt.localeCompare(a.occurredAt))[0];
  const familiar = latest && activityById(latest.activityId);
  const candidates = [familiar ? sessionItem(familiar.id, 1) : undefined, ...full.items].filter(
    (item): item is SessionItem => Boolean(item)
  );
  const distinct = candidates.filter((item, index) => candidates.findIndex((candidate) => candidate.activityId === item.activityId) === index).slice(0, 3);
  const budget = Math.min(15, Math.max(10, state.settings.dailyMinutes));
  const minimums = distinct.map(() => 3);
  const minutes = distribute(budget, minimums, distinct.map((_, index) => index === 0 ? 3 : 2));
  const items = distinct.map((item, index) => ({ ...item, minutes: minutes[index] }));
  return { ...full, id: `${full.id}-return`, title: `Return to ${full.title}`, purpose: "Recall a familiar sound, work one useful part, and use it in music.", totalMinutes: budget, items, kind: "return" };
}

export function createEvidence(
  activityId: string,
  competencyIds: string[],
  source: CompetencyEvidence["source"],
  assistance: Assistance,
  outcome: EvidenceOutcome,
  context: EvidenceContext,
  occurredAt = new Date().toISOString(),
  artifactId?: string
): CompetencyEvidence[] {
  return competencyIds.map((competencyId) => ({
    id: newId("evidence"),
    competencyId,
    source,
    assistance,
    context,
    outcome,
    occurredAt,
    activityId,
    // Recorded on every observation because it is true of every observation the
    // app can currently make. When something is measured, it will say so.
    method: "self-reported" as const,
    ...(artifactId ? { artifactId } : {})
  }));
}

export function pathSummary(state: V8State) {
  const completedUnits = CURRICULUM.filter((unit) => unitProgress(state, unit.id) === 100).length;
  const created = state.sketches.length;
  const revised = state.sketches.filter((sketch) => sketch.revisions.length > 0).length;
  const finished = state.sketches.filter((sketch) => sketch.status === "finished").length;
  return { completedUnits, totalUnits: CURRICULUM.length, created, revised, finished };
}
