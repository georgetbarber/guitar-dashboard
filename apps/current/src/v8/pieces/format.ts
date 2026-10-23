/**
 * A PIECE: ORIGINAL MUSIC WORTH COMING BACK TO, IN LAYERS.
 *
 * A piece is a small original composition the course returns to (brief §4.2,
 * docs/CURRICULUM_MAP.md §6). Each part is one guitar's score; the learner
 * plays one part while the app plays the parts listed as its accompaniment.
 * Parts sit in four layers, from one-note participation to expressive
 * variation, and later layers are added in later versions of the piece.
 *
 * A capstone is a stage's performance of a piece: the parts it asks for, one
 * playing capability and an honest self-report criterion. Its self-report is
 * recorded against `stage-N-capstone`, never against a unit's activity.
 */
import type { Provenance, Score } from "../../core/score/types";
import type { LessonCapability } from "../lessons/format";

/** 1 one-note participation · 2 accompaniment · 3 melody or riff · 4 expressive variation. */
export type PieceLayer = 1 | 2 | 3 | 4;

export const LAYER_NAMES: Readonly<Record<PieceLayer, string>> = {
  1: "One-note part",
  2: "Accompaniment",
  3: "Melody or riff",
  4: "Expressive variation",
};

export type PieceStyle = "folk" | "blues-rock" | "soul-funk" | "melody";

export const STYLE_NAMES: Readonly<Record<PieceStyle, string>> = {
  folk: "Folk fingerpicking",
  "blues-rock": "Blues-rock",
  "soul-funk": "Soul and funk",
  melody: "Melody",
};

export interface PiecePart {
  id: string;
  layer: PieceLayer;
  title: string;
  /** The learner's score for this part. */
  scoreId: string;
  /** Scores the app plays while the learner plays this part. */
  accompanimentIds: readonly string[];
  /** What to do, in a sentence or two. */
  instruction: string;
  /** Units where this part is taught or revisited. */
  unitIds: readonly string[];
}

export interface Capstone {
  stage: number;
  /** The parts the learner plays, in order. */
  partIds: readonly string[];
  capability: LessonCapability;
  /** What the learner reports, in their own terms. */
  criterion: string;
}

export interface Piece {
  id: string;
  version: number;
  provenance: Provenance;
  title: string;
  styles: readonly PieceStyle[];
  /** What it is and why it is worth playing, in a sentence. */
  description: string;
  scores: readonly Score[];
  parts: readonly PiecePart[];
  capstones: readonly Capstone[];
}

/** The part of a piece the app needs before its content has loaded. */
export interface PieceEntry {
  id: string;
  version: number;
  title: string;
  styles: readonly PieceStyle[];
  description: string;
  /** The stage whose units first teach a part of it. */
  firstStage: number;
  capstoneStages: readonly number[];
}

export function pieceEntryOf(piece: Piece, firstStage: number): PieceEntry {
  return {
    id: piece.id,
    version: piece.version,
    title: piece.title,
    styles: piece.styles,
    description: piece.description,
    firstStage,
    capstoneStages: piece.capstones.map((capstone) => capstone.stage),
  };
}

export function capstoneActivityId(stage: number): string {
  return `stage-${stage}-capstone`;
}

/** Favourites share the familiar-favourites list, as `piece:<id>` entries. */
export function pieceFavouriteId(pieceId: string): string {
  return `piece:${pieceId}`;
}

export function pieceScore(piece: Piece, id: string): Score {
  const found = piece.scores.find((score) => score.id === id);
  if (!found) throw new Error(`Piece ${piece.id} has no score ${id}.`);
  return found;
}
