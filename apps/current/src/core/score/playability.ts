/**
 * CAN A HAND PLAY THIS AT THE WRITTEN TEMPI?
 *
 * Heuristics, not a hand model. Every study must be playable by a beginner at
 * its minimum tempo and by an improving player at its maximum tempo. A finding
 * can be waived only by a documented exception on the score that names the
 * rule, the events and the teaching reason; the lesson review lists them.
 *
 * Fret spans, finger counts (a barre counts as one finger), fingering order,
 * string skips, stretches without a deliberate shift, per-technique attack
 * rates and the time available for a chord change are checked.
 */
import { metreInfo, performedTick } from "./time";
import type {
  Fretted,
  NoteEvent,
  PlayabilityRule,
  Score,
  ScoreEvent,
  ScoreProblem,
  StrumEvent,
  Voicing,
} from "./types";
import { strumPositions, voicingPositions } from "./validate";

export type PlayerLevel = "beginner" | "improving";

/** Shortest time between successive attacks of one technique in one voice, in seconds. */
export const TECHNIQUE_MIN_GAP: Record<
  "pick" | "fingerpick" | "strum" | "legato" | "bend",
  Record<PlayerLevel, number>
> = {
  pick: { beginner: 0.25, improving: 0.12 },
  fingerpick: { beginner: 0.25, improving: 0.14 },
  strum: { beginner: 0.25, improving: 0.12 },
  legato: { beginner: 0.33, improving: 0.16 },
  bend: { beginner: 0.6, improving: 0.3 },
};

/** Time to move to a different chord shape, in seconds; shapes that keep two fingers down get longer to settle less. */
export const CHANGE_MIN_GAP: Record<PlayerLevel, { new: number; shared: number }> = {
  beginner: { new: 0.6, shared: 0.4 },
  improving: { new: 0.25, shared: 0.18 },
};

/** Largest fretted span (highest minus lowest fret) a hand can hold, by position. */
export function maxSpan(lowestFret: number): number {
  return lowestFret <= 4 ? 3 : 4;
}

function seconds(score: Score, tick: number, tempo: number): number {
  return (performedTick(tick, score.feel) / metreInfo(score.metre).beatTicks) * (60 / tempo);
}

function fretted(positions: readonly Fretted[]): Fretted[] {
  return positions.filter((position) => position.fret > 0);
}

export function fingersNeeded(positions: readonly Fretted[], barre?: Voicing["barre"]): number {
  const pressed = fretted(positions);
  const underBarre = barre
    ? pressed.filter(
        (position) => position.fret === barre.fret && position.string >= barre.from && position.string <= barre.to,
      )
    : [];
  return pressed.length - underBarre.length + (underBarre.length ? 1 : 0);
}

function shapeProblems(
  label: string,
  positions: readonly Fretted[],
  barre?: Voicing["barre"],
): { rule: PlayabilityRule; message: string }[] {
  const problems: { rule: PlayabilityRule; message: string }[] = [];
  const pressed = fretted(positions);
  if (!pressed.length) return problems;
  const low = Math.min(...pressed.map((position) => position.fret));
  const high = Math.max(...pressed.map((position) => position.fret));
  if (high - low > maxSpan(low))
    problems.push({
      rule: "fret-span",
      message: `${label} spans frets ${low}–${high}, wider than a hand holds around fret ${low}.`,
    });
  if (fingersNeeded(positions, barre) > 4)
    problems.push({ rule: "finger-count", message: `${label} needs more than four fretting fingers.` });
  const fingered = pressed.filter((position) => position.finger);
  for (const a of fingered)
    for (const b of fingered) {
      if (a.finger! >= b.finger!) continue;
      if (a.fret > b.fret)
        problems.push({
          rule: "fingering-order",
          message: `${label}: finger ${a.finger} sits above finger ${b.finger} on the neck.`,
        });
      else if (b.fret - a.fret > b.finger! - a.finger! + 1)
        problems.push({
          rule: "fingering-order",
          message: `${label}: fingers ${a.finger} and ${b.finger} are stretched too far apart.`,
        });
    }
  const byFinger = new Map<number, Set<number>>();
  for (const position of fingered)
    byFinger.set(position.finger!, new Set([...(byFinger.get(position.finger!) ?? []), position.fret]));
  for (const [finger, frets] of byFinger)
    if (frets.size > 1)
      problems.push({ rule: "fingering-order", message: `${label}: finger ${finger} is asked to press two frets.` });
  return problems;
}

function withFingers(voicing: Voicing): Fretted[] {
  return voicingPositions(voicing).map((position) => {
    const finger = voicing.fingers?.[6 - position.string];
    return finger ? { ...position, finger } : position;
  });
}

type Technique = keyof typeof TECHNIQUE_MIN_GAP;

function techniqueOf(event: NoteEvent | StrumEvent): Technique {
  if (event.kind === "strum") return "strum";
  if (event.art?.bend) return "bend";
  if (event.art?.legato === "hammer-on" || event.art?.legato === "pull-off") return "legato";
  return event.notes.some((note) => note.pluck) ? "fingerpick" : "pick";
}

export function playabilityProblems(score: Score): ScoreProblem[] {
  const found: { rule: PlayabilityRule; message: string; eventId?: string }[] = [];
  const add = (rule: PlayabilityRule, message: string, eventId?: string) => found.push({ rule, message, eventId });

  for (const voicing of score.voicings)
    for (const problem of shapeProblems(`Voicing ${voicing.id}`, withFingers(voicing), voicing.barre))
      add(problem.rule, problem.message);
  for (const event of score.events)
    if (event.kind === "note" && event.notes.length > 1)
      for (const problem of shapeProblems(`Event ${event.id}`, event.notes))
        add(problem.rule, problem.message, event.id);

  const voices = new Map<string, ScoreEvent[]>();
  for (const event of score.events) voices.set(event.voice, [...(voices.get(event.voice) ?? []), event]);
  for (const events of voices.values()) {
    const attacks = events
      .filter((event): event is NoteEvent | StrumEvent => event.kind !== "rest" && !event.art?.tie)
      .sort((a, b) => a.at - b.at);
    const lastByTechnique = new Map<Technique, NoteEvent | StrumEvent>();
    let previousNote: NoteEvent | null = null;
    let previousStrum: StrumEvent | null = null;
    for (const event of attacks) {
      const technique = techniqueOf(event);
      const before = lastByTechnique.get(technique);
      if (before)
        for (const [level, tempo] of [
          ["beginner", score.tempo.minimum],
          ["improving", score.tempo.maximum],
        ] as const) {
          const gap = seconds(score, event.at, tempo) - seconds(score, before.at, tempo);
          if (gap < TECHNIQUE_MIN_GAP[technique][level] - 1e-9)
            add(
              "tempo-ceiling",
              `${event.id}: ${technique} attacks ${gap.toFixed(2)} s apart at ${tempo} BPM, too quick for ${level === "beginner" ? "a beginner at the minimum tempo" : "an improving player at the maximum tempo"}.`,
              event.id,
            );
        }
      lastByTechnique.set(technique, event);

      if (event.kind === "strum") {
        if (
          previousStrum &&
          previousStrum.chord &&
          event.chord &&
          previousStrum.chord !== event.chord &&
          !event.art?.dead
        ) {
          const from = strumPositions(previousStrum, score);
          const to = strumPositions(event, score);
          const kept = to.filter(
            (position) =>
              position.fret > 0 && from.some((p) => p.string === position.string && p.fret === position.fret),
          ).length;
          for (const [level, tempo] of [
            ["beginner", score.tempo.minimum],
            ["improving", score.tempo.maximum],
          ] as const) {
            const gap = seconds(score, event.at, tempo) - seconds(score, previousStrum.at, tempo);
            const needed = CHANGE_MIN_GAP[level][kept >= 2 ? "shared" : "new"];
            if (gap < needed - 1e-9)
              add(
                "change-time",
                `${event.id}: ${gap.toFixed(2)} s to change ${previousStrum.chord} → ${event.chord} at ${tempo} BPM is too little for ${level === "beginner" ? "a beginner" : "an improving player"}.`,
                event.id,
              );
          }
        }
        if (event.chord && !event.art?.dead) previousStrum = event;
        continue;
      }

      if (previousNote && event.notes.length === 1 && previousNote.notes.length === 1 && !event.art?.legato) {
        const from = previousNote.notes[0];
        const to = event.notes[0];
        const skip = Math.abs(to.string - from.string);
        const picked = !to.pluck && !from.pluck;
        for (const [level, tempo, limit] of [
          ["beginner", score.tempo.minimum, 0.35],
          ["improving", score.tempo.maximum, 0.18],
        ] as const) {
          const gap = seconds(score, event.at, tempo) - seconds(score, previousNote.at, tempo);
          if (picked && skip >= 2 && gap < limit)
            add(
              "string-skip",
              `${event.id}: skips ${skip - 1} string(s) in ${gap.toFixed(2)} s at ${tempo} BPM (${level}).`,
              event.id,
            );
        }
        if (from.fret > 0 && to.fret > 0 && Math.abs(to.fret - from.fret) >= 5 && !event.art?.shift) {
          const gap =
            seconds(score, event.at, score.tempo.default) - seconds(score, previousNote.at, score.tempo.default);
          if (gap < 0.5)
            add(
              "stretch",
              `${event.id}: jumps ${Math.abs(to.fret - from.fret)} frets in ${gap.toFixed(2)} s; mark a deliberate shift or allow more time.`,
              event.id,
            );
        }
      }
      previousNote = event;
    }
  }

  return found
    .filter(
      (item) =>
        !(score.exceptions ?? []).some(
          (exception) =>
            exception.rule === item.rule &&
            (!exception.events || (item.eventId && exception.events.includes(item.eventId))),
        ),
    )
    .map((item) => ({
      code: item.rule,
      message: `${score.id}: ${item.message}`,
      ...(item.eventId ? { eventId: item.eventId } : {}),
    }));
}
