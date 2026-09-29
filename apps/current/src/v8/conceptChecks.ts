import { buildChords, buildScale, createContext, intervalName } from "../core/music/theory";
import type { ModeId } from "../core/music/types";
import { localDateAt } from "./dates";
import { newId } from "./identity";
import { liveObservations } from "./learning";
import type { CompetencyEvidence } from "./types";

export const CONCEPT_KINDS = ["interval", "degree", "chord-tone", "roman-numeral"] as const;
export type ConceptKind = (typeof CONCEPT_KINDS)[number];

export interface ConceptCheck {
  id: string;
  version: 1;
  kind: ConceptKind;
  capabilityId: string;
  key: string;
  mode: ModeId;
  question: string;
  choices: readonly string[];
  answer: string;
  hint: string;
  explanation: string;
}

function check(kind: ConceptKind, variant: number, key: string, mode: ModeId): ConceptCheck {
  const context = createContext(key, mode);
  const scale = buildScale(context);
  const chords = buildChords(context);
  const base = { id: `${kind}-${variant}`, version: 1 as const, kind, capabilityId: `knowledge.${kind}`, key, mode };
  if (kind === "interval") {
    const target = scale[2];
    const answer = intervalName(target.interval);
    return {
      ...base,
      question: `From ${key} up to ${target.name}, what interval connects the two notes?`,
      choices: ["major second", "minor third", "major third", "perfect fourth"],
      answer,
      hint: "Count letter names first, then compare the number of semitones.",
      explanation: `${key} to ${target.name} spans ${target.interval} semitones: a ${answer}.`,
    };
  }
  if (kind === "degree") {
    const target = scale[variant === 1 ? 2 : 4];
    return {
      ...base,
      question: `In ${key} ${mode}, what scale-degree role does ${target.name} have?`,
      choices: ["1", "3", "4", "5"],
      answer: target.degreeLabel,
      hint: "Name the home note, then count scale positions from home.",
      explanation: `${target.name} is degree ${target.degreeLabel} of ${key} ${mode}.`,
    };
  }
  if (kind === "chord-tone") {
    const chord = chords[0];
    const target = chord.tones[1];
    return {
      ...base,
      question: `In the ${chord.symbol} chord, what is ${target.name} relative to the chord root?`,
      choices: ["root", "minor third", "major third", "fifth"],
      answer: target.interval === 3 ? "minor third" : "major third",
      hint: "Measure from the chord's own root, rather than from the key's home note.",
      explanation: `${chord.symbol} has root ${chord.rootName}; ${target.name} is ${target.interval} semitones above it.`,
    };
  }
  const chord = chords[3];
  return {
    ...base,
    question: `In ${key} ${mode}, what Roman numeral names the ${chord.symbol} chord?`,
    choices: mode === "minor" ? ["i", "iv", "v", "VI"] : ["I", "ii", "IV", "V"],
    answer: chord.roman,
    hint: "Find the chord root's degree in the key, then use the chord quality for uppercase or lowercase.",
    explanation: `${chord.symbol} is built on degree ${chord.degreeLabel} in ${key} ${mode}, so its numeral is ${chord.roman}.`,
  };
}

/** Two authored contexts per relationship; the second changes the actual notes or quality. */
export const CONCEPT_CHECKS: readonly ConceptCheck[] = [
  check("interval", 1, "C", "major"),
  check("interval", 2, "A", "minor"),
  check("degree", 1, "C", "major"),
  check("degree", 2, "G", "major"),
  check("chord-tone", 1, "C", "major"),
  check("chord-tone", 2, "D", "minor"),
  check("roman-numeral", 1, "C", "major"),
  check("roman-numeral", 2, "A", "minor"),
];

export function conceptCheckById(id: string): ConceptCheck | undefined {
  return CONCEPT_CHECKS.find((item) => item.id === id);
}

export function checkedAnswerIsValid(item: CompetencyEvidence): boolean {
  if (item.method !== "exact-answer" || !item.checkId || !item.contentVersion || !item.response) return false;
  const known = conceptCheckById(item.checkId);
  if (!known || item.contentVersion !== known.version) return false;
  return (
    item.competencyId === known.capabilityId &&
    item.activityId === `concept-check:${known.id}` &&
    item.source === "recognition" &&
    item.context.key === known.key &&
    item.context.mode === known.mode &&
    known.choices.includes(item.response) &&
    item.outcome === (item.response === known.answer ? "successful" : "retry")
  );
}

export function recordConceptAnswer(
  check: ConceptCheck,
  response: string,
  usedHint: boolean,
  now = new Date(),
): CompetencyEvidence {
  if (!check.choices.includes(response)) throw new Error("Choose one of the answers shown in this check.");
  return {
    id: newId("evidence"),
    competencyId: check.capabilityId,
    source: "recognition",
    assistance: usedHint ? "hint" : "none",
    context: { key: check.key, mode: check.mode },
    outcome: response === check.answer ? "successful" : "retry",
    occurredAt: now.toISOString(),
    localDate: localDateAt(now),
    activityId: `concept-check:${check.id}`,
    method: "exact-answer",
    checkId: check.id,
    contentVersion: check.version,
    response,
  };
}

function currentAnswers(kind: ConceptKind, evidence: CompetencyEvidence[]): CompetencyEvidence[] {
  return liveObservations(evidence).filter(
    (item) => item.competencyId === `knowledge.${kind}` && checkedAnswerIsValid(item),
  );
}

export function conceptProgress(kind: ConceptKind, evidence: CompetencyEvidence[]) {
  const attempts = currentAnswers(kind, evidence).sort((a, b) => a.occurredAt.localeCompare(b.occurredAt));
  const successes = attempts.filter((item) => item.outcome === "successful" && item.assistance === "none");
  const recalled = successes.some((later) =>
    successes.some(
      (earlier) =>
        earlier.checkId !== later.checkId &&
        (earlier.localDate ?? earlier.occurredAt.slice(0, 10)) < (later.localDate ?? later.occurredAt.slice(0, 10)),
    ),
  );
  return { attempts: attempts.length, correctUnaided: successes.length, recalled, latest: attempts.at(-1) };
}

export function nextConceptCheck(kind: ConceptKind, evidence: CompetencyEvidence[], now = new Date()): ConceptCheck {
  const variants = CONCEPT_CHECKS.filter((item) => item.kind === kind);
  const attempts = currentAnswers(kind, evidence).sort((a, b) => a.occurredAt.localeCompare(b.occurredAt));
  const firstSuccess = attempts.find((item) => item.outcome === "successful" && item.assistance === "none");
  if (
    firstSuccess &&
    !conceptProgress(kind, evidence).recalled &&
    (firstSuccess.localDate ?? firstSuccess.occurredAt.slice(0, 10)) < localDateAt(now)
  ) {
    return variants.find((item) => item.id !== firstSuccess.checkId) ?? variants[0];
  }
  const latest = attempts.at(-1);
  return variants.find((item) => item.id !== latest?.checkId) ?? variants[0];
}

export function dueConceptKind(evidence: CompetencyEvidence[], now = new Date()): ConceptKind | null {
  const today = localDateAt(now);
  return (
    CONCEPT_KINDS.find((kind) => {
      const attempts = currentAnswers(kind, evidence);
      const first = attempts.find((item) => item.outcome === "successful" && item.assistance === "none");
      if (!first || (first.localDate ?? first.occurredAt.slice(0, 10)) >= today) return false;
      return !conceptProgress(kind, evidence).recalled;
    }) ?? null
  );
}
