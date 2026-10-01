import { positionMidi } from "./structuredMusic";
import type { GuitarPosition } from "./structuredMusic";
import type { DraftChordStudy, DraftChordVoicing } from "./phase6Drafts";

export type ChordStudyVersion = "study" | "two-count";

export interface TimedChord {
  id: string;
  chordId: DraftChordVoicing["id"];
  atBeat: number;
  beats: number;
  positions: readonly GuitarPosition[];
  midis: readonly number[];
}

/** One exact timeline supplies both the chord display and its synthetic reference. */
export function timedChords(study: DraftChordStudy, version: ChordStudyVersion): TimedChord[] {
  const voicings = new Map(study.voicings.map((voicing) => [voicing.id, voicing]));
  return (version === "study" ? study.events : study.variation).map((event) => {
    const voicing = voicings.get(event.chordId);
    if (!voicing) throw new Error(`Missing voicing for ${event.chordId}.`);
    const positions = [...voicing.positions].sort((a, b) => b.string - a.string);
    return {
      ...event,
      positions,
      midis: positions.map((position) => positionMidi(study.tuningMidi, position)),
    };
  });
}

/** The same string and fret, not merely the same pitch class, remains in place. */
export function sharedPositions(study: DraftChordStudy): GuitarPosition[] {
  const [first, ...others] = study.voicings;
  if (!first) return [];
  return first.positions
    .filter((position) =>
      others.every((voicing) =>
        voicing.positions.some((other) => other.string === position.string && other.fret === position.fret),
      ),
    )
    .sort((a, b) => b.string - a.string);
}

export function voicingTab(positions: readonly GuitarPosition[]): string {
  return Array.from(
    { length: 6 },
    (_, index) => positions.find((position) => position.string === 6 - index)?.fret ?? "x",
  ).join("");
}
