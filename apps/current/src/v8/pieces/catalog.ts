/**
 * WHICH PIECES EXIST, KNOWN BEFORE ANY CONTENT LOADS.
 *
 * Tiny and in the app shell, like the lesson catalogue: Play and the course
 * map list pieces and capstones from here, and the music itself loads with a
 * stage's lesson pack. A test keeps this list identical to the library.
 */
import type { PieceEntry } from "./format";

export const PIECE_CATALOG: readonly PieceEntry[] = [
  {
    id: "piece-front-step",
    version: 1,
    title: "Front Step",
    styles: ["blues-rock"],
    description:
      "A blues in E built on a call and an answer: it starts with one open string and one low root, and grows into a shuffle with a solo chorus.",
    firstStage: 1,
    capstoneStages: [1],
  },
  {
    id: "piece-low-road",
    version: 1,
    title: "Low Road",
    styles: ["blues-rock"],
    description:
      "A driving riff in A: palm-muted root chugs with two power chords kicking on the off-beats, an octave fill and a double-stop tag, then the whole thing moved to E.",
    firstStage: 1,
    capstoneStages: [2],
  },
];

export function pieceEntry(id: string): PieceEntry | null {
  return PIECE_CATALOG.find((entry) => entry.id === id) ?? null;
}

export function capstoneForStage(stage: number): PieceEntry | null {
  return PIECE_CATALOG.find((entry) => entry.capstoneStages.includes(stage)) ?? null;
}
