/**
 * PLAYING ALONG: PARTS THAT SOUND TOGETHER.
 *
 * A piece's parts are separate scores (one per guitar), because two guitars
 * may sound the same string at once while one guitar cannot. Parts played
 * together must share metre, bar count and feel, and every part must be
 * playable at any tempo the learner's part allows, so the same audio-clock
 * schedule lines them up exactly.
 */
import type { Score } from "./types";

export function ensembleProblems(lead: Score, parts: readonly Score[]): string[] {
  const problems: string[] = [];
  for (const part of parts) {
    const name = `Part ${part.id}`;
    if (part.id === lead.id) problems.push(`${name} cannot accompany itself.`);
    if (part.metre !== lead.metre) problems.push(`${name} is in ${part.metre}, not ${lead.metre}.`);
    if (part.bars !== lead.bars) problems.push(`${name} has ${part.bars} bars, not ${lead.bars}.`);
    if (part.feel !== lead.feel) problems.push(`${name} has a ${part.feel} feel, not ${lead.feel}.`);
    if (part.tempo.minimum > lead.tempo.minimum || part.tempo.maximum < lead.tempo.maximum)
      problems.push(`${name} cannot play across ${lead.tempo.minimum}–${lead.tempo.maximum} BPM.`);
  }
  return problems;
}
