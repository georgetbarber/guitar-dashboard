import { playChord, playClick, playMidi, stopAudio } from "../audio/engine";
import type { FreePlayPreview } from "./types";

/** Count in once, then schedule an exact guide on a stable beat grid. */
export function hearFreePlayPreview(preview: FreePlayPreview, repeats = 1): number {
  stopAudio();
  const bpm = preview.kind === "notes" || preview.kind === "groove" ? preview.bpm : 72;
  const beat = 60 / bpm;
  const loops = Math.max(1, Math.min(4, Math.round(repeats)));
  const materialBeats =
    preview.kind === "chords"
      ? Math.max(4, preview.pitches.length * 4)
      : preview.kind === "notes"
        ? Math.max(4, Math.ceil((preview.pitches.length * 0.5) / 4) * 4)
        : preview.kind === "degree"
          ? 4
          : 8;
  for (let count = 0; count < 4; count++) playClick(count * beat, count === 0);
  for (let repeat = 0; repeat < loops; repeat++) {
    const start = 4 + repeat * materialBeats;
    if (preview.kind !== "groove")
      for (let count = 0; count < materialBeats; count++) {
        playClick((start + count) * beat, count % 4 === 0);
      }
    if (preview.kind === "chords") {
      preview.pitches.forEach((pitches, index) => playChord(pitches, (start + index * 4) * beat, 3.2 * beat));
    } else if (preview.kind === "notes") {
      preview.pitches.forEach((pitch, index) => {
        if (pitch >= 0) playMidi(60 + pitch, (start + index * 0.5) * beat, 0.42 * beat, 0.16);
      });
    } else if (preview.kind === "degree") {
      [preview.tonic, preview.target, preview.tonic].forEach((pitch, index) =>
        playMidi(60 + pitch, (start + index) * beat, 0.85 * beat),
      );
    } else {
      [...preview.accents, ...preview.accents].forEach((accented, index) =>
        playClick((start + index * (4 / Math.max(1, preview.accents.length))) * beat, accented),
      );
    }
  }
  return (4 + loops * materialBeats) * beat * 1000;
}

/** An edited groove remains a beat grid, never silently becomes pitched notes. */
export function hearEditedGroove(pattern: string, bpm: number): boolean {
  const symbols = pattern.trim().split(/\s+/);
  if (!symbols.length || !symbols.every((symbol) => symbol === "●" || symbol === "·")) return false;
  hearFreePlayPreview({ kind: "groove", bpm, accents: symbols.map((symbol) => symbol === "●") });
  return true;
}
