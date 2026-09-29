import { CONCEPT_CHECKS, PLACEMENT_CHECKS, checkedAnswerIsValid } from "./conceptChecks";
import type { ConceptCheck } from "./conceptChecks";
import { localDateAt } from "./dates";
import { newId } from "./identity";
import { liveObservations } from "./learning";
import type { CompetencyEvidence, LearnerSettings } from "./types";

export const PLACEMENT_DOMAINS = ["pulse", "sound", "ear", "fretboard", "chord"] as const;
export type PlacementDomain = (typeof PLACEMENT_DOMAINS)[number];

const CAPABILITIES: Record<PlacementDomain, string> = {
  pulse: "placement.pulse",
  sound: "placement.sound-control",
  ear: "knowledge.ear-interval-contrast",
  fretboard: "knowledge.fretboard-degree",
  chord: "knowledge.chord-tone",
};

export function placementCheck(domain: "ear" | "fretboard" | "chord", evidence: CompetencyEvidence[]): ConceptCheck {
  const variants =
    domain === "chord"
      ? CONCEPT_CHECKS.filter((item) => item.kind === "chord-tone")
      : PLACEMENT_CHECKS.filter((item) => item.kind === `placement-${domain}`);
  const latest = [...liveObservations(evidence)]
    .filter((item) => item.competencyId === CAPABILITIES[domain] && checkedAnswerIsValid(item))
    .sort((a, b) => a.occurredAt.localeCompare(b.occurredAt))
    .at(-1);
  return variants.find((item) => item.id !== latest?.checkId) ?? variants[0];
}

export function recordPlacementReport(
  domain: "pulse" | "sound",
  succeeded: boolean,
  now = new Date(),
): CompetencyEvidence {
  return {
    id: newId("evidence"),
    competencyId: CAPABILITIES[domain],
    source: "performance",
    assistance: domain === "pulse" ? "guided" : "none",
    context: domain === "pulse" ? { tempo: 100 } : {},
    outcome: succeeded ? "successful" : "retry",
    occurredAt: now.toISOString(),
    localDate: localDateAt(now),
    activityId: `placement:${domain}-v1`,
    method: "self-reported",
  };
}

export type PlacementResult =
  "not-sampled" | "reported-yes" | "reported-not-yet" | "checked-correct" | "checked-with-hint" | "checked-retry";

export function placementResults(evidence: CompetencyEvidence[]): Record<PlacementDomain, PlacementResult> {
  const live = liveObservations(evidence);
  return Object.fromEntries(
    PLACEMENT_DOMAINS.map((domain) => {
      const latest = live
        .filter(
          (item) =>
            item.competencyId === CAPABILITIES[domain] &&
            (domain === "pulse" || domain === "sound"
              ? item.method === "self-reported" && item.activityId === `placement:${domain}-v1`
              : checkedAnswerIsValid(item)),
        )
        .sort((a, b) => a.occurredAt.localeCompare(b.occurredAt))
        .at(-1);
      if (!latest) return [domain, "not-sampled"];
      if (domain === "pulse" || domain === "sound")
        return [domain, latest.outcome === "successful" ? "reported-yes" : "reported-not-yet"];
      return [
        domain,
        latest.outcome !== "successful"
          ? "checked-retry"
          : latest.assistance === "none"
            ? "checked-correct"
            : "checked-with-hint",
      ];
    }),
  ) as Record<PlacementDomain, PlacementResult>;
}

export function placementSuggestion(evidence: CompetencyEvidence[]): {
  baseline: LearnerSettings["startingBaseline"];
  reason: string;
  nextActions: string[];
} {
  const results = placementResults(evidence);
  const nextActions = [
    results.ear === "checked-retry"
      ? "Ear: replay the two pairs, then attend to the distance rather than their loudness."
      : null,
    results.fretboard === "checked-retry"
      ? "Fretboard: locate the open string first, count frets, then name the note's role in the key."
      : null,
    results.chord === "checked-retry"
      ? "Chord: find the chord root, then measure the target note from that root."
      : null,
    results.ear === "checked-with-hint" ? "Ear: compare a changed pair without the hint when you are ready." : null,
    results.fretboard === "checked-with-hint"
      ? "Fretboard: locate another note without the hint before using the map in a phrase."
      : null,
    results.chord === "checked-with-hint" ? "Chord: name the next tone relative to its root without the hint." : null,
    results.ear === "checked-correct"
      ? "Ear: try a changed sound pair later to see whether the comparison travels."
      : null,
    results.fretboard === "checked-correct"
      ? "Fretboard: try the same degree on another string before treating it as a map you can use."
      : null,
    results.chord === "checked-correct"
      ? "Chord: try the same tone role in a chord with a different root or quality."
      : null,
  ].filter((item): item is string => item !== null);
  if (results.pulse === "reported-yes" && results.sound === "reported-yes") {
    return {
      baseline: "some",
      reason:
        "You reported a steady pulse through silence and a controlled note release. Unit 3 is a possible start for practising subdivision. These reports are not a checked performance; you can still begin with the one-note lesson.",
      nextActions,
    };
  }
  return {
    baseline: "repair",
    reason:
      "A clean note and steady pulse are not both reported yet. The one-note lesson gives you a useful starting point without assuming either skill. An unanswered sample is simply unknown, not a failed test.",
    nextActions,
  };
}
