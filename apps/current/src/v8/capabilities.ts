import { PILOT_EPISODE } from "./pilotEpisode";
import { pilotAttempts } from "./pilotProgress";
import type { PilotAttempt, V8State } from "./types";

export type CapabilityAction = "listening" | "naming" | "locating" | "timing" | "playing";

export interface CapabilityDefinition {
  id: string;
  action: CapabilityAction;
  title: string;
  criterion: string;
  /** Only a whole-phrase self-report exists for these pilot capabilities. */
  pilotReport: boolean;
}

/** Keep this catalogue small and tied to the authored pilot. Add later capabilities with their lessons. */
export const PILOT_CAPABILITIES: readonly CapabilityDefinition[] = [
  {
    id: "pilot.listen.question-answer",
    action: "listening",
    title: "Hear question and answer",
    criterion: "Hear how the second bar answers the first.",
    pilotReport: false,
  },
  {
    id: "pilot.name.attack-rest",
    action: "naming",
    title: "Name attacks and rests",
    criterion: "Name where sound starts and where silence begins in both bars.",
    pilotReport: false,
  },
  {
    id: "pilot.locate.open-high-e",
    action: "locating",
    title: "Find the open high E",
    criterion: "Locate the first string and connect its open sound to the phrase.",
    pilotReport: false,
  },
  {
    id: "pulse.quarter-note.steady",
    action: "timing",
    title: "Keep the pulse through silence",
    criterion: "Keep counting through the rests in both bars.",
    pilotReport: true,
  },
  {
    id: "sound.release.to-rest",
    action: "playing",
    title: "Stop the sound at each rest",
    criterion: "Release each note where the phrase becomes silent.",
    pilotReport: true,
  },
  {
    id: "phrase.question-answer.one-note",
    action: "playing",
    title: "Play the full exchange",
    criterion: PILOT_EPISODE.successCriterion,
    pilotReport: true,
  },
];

export interface CapabilitySnapshot {
  capability: CapabilityDefinition;
  latestReport?: PilotAttempt;
  /** A single whole-phrase report cannot separately verify each component. */
  status: "not-checked" | "whole-phrase-report";
}

export function pilotCapabilitySnapshots(state: Pick<V8State, "pilotAttempts">): CapabilitySnapshot[] {
  const latest = [...pilotAttempts(state)].sort((a, b) => b.occurredAt.localeCompare(a.occurredAt))[0];
  return PILOT_CAPABILITIES.map((capability) => ({
    capability,
    latestReport: capability.pilotReport ? latest : undefined,
    status: capability.pilotReport && latest ? "whole-phrase-report" : "not-checked",
  }));
}
