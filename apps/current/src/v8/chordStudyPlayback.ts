import { startVoicingProgression } from "../audio/engine";
import { timedChords } from "./chordStudy";
import type { ChordStudyVersion } from "./chordStudy";
import type { DraftChordStudy } from "./phase6Drafts";

/** Synthetic reference only: it cannot demonstrate fingering, timing quality or tone. */
export function startChordStudyPlayback(
  study: DraftChordStudy,
  version: ChordStudyVersion,
  tempo: number,
  onStep?: (index: number) => void,
): () => void {
  if (!Number.isFinite(tempo) || tempo < study.tempo.minimum || tempo > study.tempo.maximum)
    throw new Error("Tempo is outside this study's practice range.");
  const events = timedChords(study, version);
  return startVoicingProgression(
    events.map((event) => event.midis),
    tempo,
    onStep,
    events.map((event) => event.beats),
  );
}
