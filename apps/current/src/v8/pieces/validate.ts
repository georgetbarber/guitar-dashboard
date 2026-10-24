/**
 * A PIECE IS SHIPPABLE ONLY WHEN EVERY PART IS PLAYABLE AND PLAYS TOGETHER.
 *
 * Each score passes the same structure, theory, playability and
 * display/audio correspondence checks as a lesson's. Each part's
 * accompaniment lines up with it (core/score/ensemble.ts). Feel and articulation
 * must agree with the piece's styles, so the three styles stay audibly
 * different (docs/CURRICULUM_MAP.md §9). Capstones name real parts and an
 * honest criterion.
 */
import { ensembleProblems } from "../../core/score/ensemble";
import type { FeelId } from "../../core/score/time";
import type { Articulation, Score } from "../../core/score/types";
import { CURRICULUM } from "../curriculum";
import { CAPSTONE_CAPABILITIES } from "../lessons/capabilityCatalogue";
import { enough, provenanceProblems, shippableScoreProblems } from "../lessons/validate";
import type { Piece, PieceStyle } from "./format";

const PIECE_ID = /^piece-[a-z0-9-]{3,60}$/;
const CAPABILITY = /^[a-z0-9-]+(?:\.[a-z0-9-]+){1,3}$/;

/** Feels each style may use. A piece with several styles may use any feel one of them allows. */
export const STYLE_FEELS: Readonly<Record<PieceStyle, readonly FeelId[]>> = {
  folk: ["straight"],
  "blues-rock": ["straight", "shuffle-8", "swing-8"],
  "soul-funk": ["straight", "swing-16"],
  melody: ["straight", "swing-8"],
};

function usesArticulation(score: Score, test: (art: Articulation) => boolean): boolean {
  return score.events.some((event) => event.kind !== "rest" && test(event.art ?? {}));
}

export function validatePiece(piece: Piece): string[] {
  const errors: string[] = [];
  const add = (message: string) => errors.push(`${piece.id}: ${message}`);

  if (!PIECE_ID.test(piece.id)) add("piece ids start with piece- and use lower-case letters, digits and hyphens.");
  if (!Number.isInteger(piece.version) || piece.version < 1) add("needs a positive whole version.");
  provenanceProblems(piece.provenance).forEach(add);
  if (!enough(piece.title, 3)) add("needs a title.");
  if (!enough(piece.description)) add("needs a description saying what it is.");
  if (!piece.styles.length) add("needs at least one style.");

  const scores = new Map<string, Score>();
  for (const score of piece.scores) {
    if (scores.has(score.id)) add(`score ${score.id} appears twice.`);
    scores.set(score.id, score);
    errors.push(...shippableScoreProblems(score).map((message) => `${piece.id}: ${message}`));
    if (
      score.provenance.author !== piece.provenance.author ||
      score.provenance.reviewStatus !== piece.provenance.reviewStatus
    )
      add(`score ${score.id} must share the piece's author and review status.`);
    const feels = new Set(piece.styles.flatMap((style) => STYLE_FEELS[style]));
    if (!feels.has(score.feel)) add(`score ${score.id} has a ${score.feel} feel, which none of its styles uses.`);
    // Folk parts ring; they are not built on palm-muted chugs or dead scratches.
    if (
      piece.styles.length === 1 &&
      piece.styles[0] === "folk" &&
      usesArticulation(score, (art) => Boolean(art.palmMute || art.dead))
    )
      add(`score ${score.id} uses palm mutes or scratches, which a folk piece does not.`);
  }

  if (!piece.parts.length) add("needs at least one part.");
  const used = new Set<string>();
  const partIds = new Set<string>();
  const units = new Set(CURRICULUM.map((unit) => unit.id));
  for (const part of piece.parts) {
    if (partIds.has(part.id)) add(`part ${part.id} appears twice.`);
    partIds.add(part.id);
    if (![1, 2, 3, 4].includes(part.layer)) add(`part ${part.id} has no valid layer.`);
    if (!enough(part.title, 4) || !enough(part.instruction)) add(`part ${part.id} needs a title and an instruction.`);
    const lead = scores.get(part.scoreId);
    if (!lead) add(`part ${part.id} names unknown score ${part.scoreId}.`);
    used.add(part.scoreId);
    const backing: Score[] = [];
    for (const id of part.accompanimentIds) {
      used.add(id);
      const score = scores.get(id);
      if (!score) add(`part ${part.id} is accompanied by unknown score ${id}.`);
      else backing.push(score);
    }
    if (lead) ensembleProblems(lead, backing).forEach((problem) => add(`part ${part.id}: ${problem}`));
    if (!part.unitIds.length) add(`part ${part.id} must name the units that teach it.`);
    for (const unit of part.unitIds) if (!units.has(unit)) add(`part ${part.id} names unknown unit ${unit}.`);
  }
  if (!piece.parts.some((part) => part.layer === 1)) add("needs a one-note part (layer 1).");
  for (const score of piece.scores) if (!used.has(score.id)) add(`score ${score.id} is never used.`);

  const stages = new Set<number>();
  for (const capstone of piece.capstones) {
    if (!Number.isInteger(capstone.stage) || capstone.stage < 1 || capstone.stage > 8)
      add(`capstone stage ${capstone.stage} is not a stage.`);
    if (stages.has(capstone.stage)) add(`has two capstones for stage ${capstone.stage}.`);
    stages.add(capstone.stage);
    if (!capstone.partIds.length) add(`the stage ${capstone.stage} capstone names no parts.`);
    for (const id of capstone.partIds)
      if (!partIds.has(id)) add(`the stage ${capstone.stage} capstone names unknown part ${id}.`);
    const capability = capstone.capability;
    if (!CAPABILITY.test(capability.id) || capability.action !== "playing")
      add(`the stage ${capstone.stage} capstone needs a playing capability with a valid id.`);
    if (CAPSTONE_CAPABILITIES[capstone.stage - 1] !== capability.id)
      add(
        `the stage ${capstone.stage} capstone must use ${CAPSTONE_CAPABILITIES[capstone.stage - 1]} from the catalogue.`,
      );
    if (!enough(capability.title, 4) || !enough(capability.criterion) || !enough(capstone.criterion))
      add(`the stage ${capstone.stage} capstone needs a title and honest criteria.`);
    // A capstone combines its stage's work: every part it uses is taught by then.
    for (const id of capstone.partIds) {
      const part = piece.parts.find((item) => item.id === id);
      const first = Math.min(
        ...(part?.unitIds ?? []).map((unit) => CURRICULUM.find((item) => item.id === unit)?.stage ?? 9),
      );
      if (part && first > capstone.stage)
        add(`the stage ${capstone.stage} capstone uses part ${id}, which is first taught in a later stage.`);
    }
  }
  return errors;
}

/** Across pieces and lessons: piece, score and capability ids are unique, and one capstone per stage. */
export function validatePieceSet(
  pieces: readonly Piece[],
  lessons: readonly { id: string; scores: readonly Score[]; capabilities: readonly { id: string }[] }[] = [],
): string[] {
  const errors = pieces.flatMap(validatePiece);
  const ids = new Set<string>();
  const scoreOwners = new Map<string, string>();
  const capabilityOwners = new Map<string, string>();
  const capstoneStages = new Map<number, string>();
  for (const lesson of lessons) {
    for (const score of lesson.scores) scoreOwners.set(score.id, lesson.id);
    for (const capability of lesson.capabilities) capabilityOwners.set(capability.id, lesson.id);
  }
  for (const piece of pieces) {
    if (ids.has(piece.id)) errors.push(`${piece.id}: appears twice.`);
    ids.add(piece.id);
    for (const score of piece.scores) {
      const owner = scoreOwners.get(score.id);
      if (owner && owner !== piece.id) errors.push(`${piece.id}: score ${score.id} is already used by ${owner}.`);
      scoreOwners.set(score.id, piece.id);
    }
    for (const capstone of piece.capstones) {
      const owner = capabilityOwners.get(capstone.capability.id);
      if (owner && owner !== piece.id)
        errors.push(`${piece.id}: capability ${capstone.capability.id} is already defined by ${owner}.`);
      capabilityOwners.set(capstone.capability.id, piece.id);
      const stageOwner = capstoneStages.get(capstone.stage);
      if (stageOwner) errors.push(`${piece.id}: stage ${capstone.stage} already has a capstone in ${stageOwner}.`);
      capstoneStages.set(capstone.stage, piece.id);
    }
  }
  return errors;
}
