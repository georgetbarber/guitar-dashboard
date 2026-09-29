import { buildChords, buildScale, createContext, intervalName, noteName } from "../core/music/theory";
import type { ModeId } from "../core/music/types";
import { positionMidi, STANDARD_TUNING_MIDI } from "./structuredMusic";
import type { GuitarString } from "./structuredMusic";
import { localDateAt } from "./dates";
import { newId } from "./identity";
import { liveObservations } from "./learning";
import type { CompetencyEvidence } from "./types";

export const CONCEPT_KINDS = ["interval", "degree", "chord-tone", "roman-numeral"] as const;
export type ConceptKind = (typeof CONCEPT_KINDS)[number];
export type PlacementCheckKind = "placement-ear" | "placement-fretboard";

export interface ConceptCheck {
  id: string;
  version: 1;
  kind: ConceptKind | PlacementCheckKind;
  capabilityId: string;
  key: string;
  mode: ModeId;
  question: string;
  choices: readonly string[];
  answer: string;
  hint: string;
  explanation: string;
  /** Sound is a question stimulus, never an answer-bearing label. */
  audioPairs?: readonly [readonly [number, number], readonly [number, number]];
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

function fretboardCheck(variant: number, key: string, string: GuitarString, fret: number): ConceptCheck {
  const context = createContext(key, "major");
  const midi = positionMidi(STANDARD_TUNING_MIDI, { string, fret });
  const pitch = noteName(midi % 12);
  const openName = noteName(STANDARD_TUNING_MIDI[6 - string] % 12);
  const stringLabel = `${string === 1 ? "high " : string === 6 ? "low " : ""}${openName} string (string ${string})`;
  const degree = buildScale(context).find((tone) => tone.pitchClass === midi % 12)?.degreeLabel;
  if (!degree) throw new Error("The placement note must belong to its named key.");
  return {
    id: `placement-fretboard-${variant}`, version: 1, kind: "placement-fretboard",
    capabilityId: "knowledge.fretboard-degree", key, mode: "major",
    question: `In ${key} major, what scale degree is at fret ${fret} on the ${stringLabel} in standard tuning?`,
    choices: ["1", "3", "5", "7"], answer: degree,
    hint: "Count up from the open string, then compare that note with the key's home note.",
    explanation: `String ${string} at fret ${fret} is ${pitch}; in ${key} major that is degree ${degree}. This checks a map answer, not finding it with your hand.`,
  };
}

export const PLACEMENT_CHECKS: readonly ConceptCheck[] = [
  {
    id: "placement-ear-1", version: 1, kind: "placement-ear", capabilityId: "knowledge.ear-interval-contrast",
    key: "C", mode: "major", question: "Using C major as a reference, listen to two pairs beginning on C. How does the second span compare?",
    choices: ["narrower", "wider", "the same"], answer: "wider",
    hint: "Attend to the distance between each pair's notes, not their loudness or timing.",
    explanation: "The first pair rises three semitones; the second rises four. The second interval is wider. An answer alone cannot prove what you heard.",
    audioPairs: [[60, 63], [60, 64]],
  },
  {
    id: "placement-ear-2", version: 1, kind: "placement-ear", capabilityId: "knowledge.ear-interval-contrast",
    key: "D", mode: "major", question: "Using D major as a reference, listen to two pairs beginning on D. How does the second span compare?",
    choices: ["narrower", "wider", "the same"], answer: "narrower",
    hint: "Attend to the distance between each pair's notes, not their loudness or timing.",
    explanation: "The first pair rises four semitones; the second rises three. The second interval is narrower. An answer alone cannot prove what you heard.",
    audioPairs: [[62, 66], [62, 65]],
  },
  fretboardCheck(1, "C", 1, 3),
  fretboardCheck(2, "D", 2, 3),
];

export function conceptCheckById(id: string): ConceptCheck | undefined {
  return [...CONCEPT_CHECKS, ...PLACEMENT_CHECKS].find((item) => item.id === id);
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
