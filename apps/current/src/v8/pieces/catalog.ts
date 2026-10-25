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
    version: 3,
    title: "Front Step",
    styles: ["blues-rock"],
    description:
      "A blues in E built on a call and an answer: it starts with one open string and one low root, and grows into a shuffle with a solo chorus.",
    firstStage: 1,
    capstoneStages: [1, 6],
  },
  {
    id: "piece-low-road",
    version: 2,
    title: "Low Road",
    styles: ["blues-rock"],
    description:
      "A driving riff in A: palm-muted root chugs with two power chords kicking on the off-beats, an octave fill and a double-stop tag, then the whole thing moved to E, and the riff as single notes, developed.",
    firstStage: 1,
    capstoneStages: [2],
  },
  {
    id: "piece-lantern",
    version: 1,
    title: "Lantern",
    styles: ["melody"],
    description:
      "An eight-bar melody in G built from one three-note motif: the first phrase stops open, the second comes home.",
    firstStage: 3,
    capstoneStages: [3],
  },
  {
    id: "piece-porch-light",
    version: 2,
    title: "Porch Light",
    styles: ["folk"],
    description:
      "A fingerpicked tune in G: a thumb that keeps time on the bass strings and a melody pinched on top, from one note a beat to full Travis picking.",
    firstStage: 1,
    capstoneStages: [4],
  },
  {
    id: "piece-harbour-song",
    version: 1,
    title: "Harbour Song",
    styles: ["folk"],
    description:
      "A slow waltz in C: a thumb on the bass, a ringing p-i-m-a arpeggio, and a melody you find by ear before you see it.",
    firstStage: 1,
    capstoneStages: [],
  },
  {
    id: "piece-sunday-glide",
    version: 2,
    title: "Sunday Glide",
    styles: ["soul-funk"],
    description:
      "A soul vamp in D, I to IV: octave roots, small chords on the top strings in swung sixteenths, and sixths that slide into the chord.",
    firstStage: 2,
    capstoneStages: [],
  },
  {
    id: "piece-night-market",
    version: 1,
    title: "Night Market",
    styles: ["soul-funk"],
    description:
      "A funk vamp in E: an Em7 bounce and stabs, then a sixteenth groove where A7 turns E minor into E Dorian, a riff that answers the chords, and a break of stabs played together.",
    firstStage: 1,
    capstoneStages: [5],
  },
  {
    id: "piece-two-rivers",
    version: 1,
    title: "Two Rivers",
    styles: ["blues-rock", "soul-funk"],
    description:
      "One root, A, and two modes: a straight rock vamp from A to G with a melody that leans on the flat 7, then a swung soul vamp from Am7 to D with a melody that leans on the natural 6.",
    firstStage: 2,
    capstoneStages: [],
  },
  {
    id: "piece-glasshouse",
    version: 1,
    title: "Glasshouse",
    styles: ["soul-funk"],
    description:
      "A slow soul ballad in C: C, Em, F, then F minor borrowed from C minor, with a melody whose A turns to A♭ for that one chord.",
    firstStage: 6,
    capstoneStages: [],
  },
];

export function pieceEntry(id: string): PieceEntry | null {
  return PIECE_CATALOG.find((entry) => entry.id === id) ?? null;
}

export function capstoneForStage(stage: number): PieceEntry | null {
  return PIECE_CATALOG.find((entry) => entry.capstoneStages.includes(stage)) ?? null;
}
