/**
 * DISPLAY AND SOUND MUST AGREE.
 *
 * For every attack in a score: the tab shows its strings and frets in its
 * column, the fretboard shows the same positions while it lasts, and the
 * synthesiser sounds exactly those pitches at that moment (or, for a
 * hammer-on, pull-off or slide, moves the ringing string to that pitch).
 * The lesson validator runs this on every score, so a view cannot drift from
 * the data it claims to show.
 */
import { performScore } from "./perform";
import type { Score, ScoreProblem } from "./types";
import { eventStrings, positionMidi, strumPositions } from "./validate";
import { barGrid, fretboardAt, tabCells } from "./views";
import { metreInfo } from "./time";

export function correspondenceProblems(score: Score): ScoreProblem[] {
  const problems: ScoreProblem[] = [];
  const info = metreInfo(score.metre);
  const sounds = performScore(score, { tempo: score.tempo.default });
  const grids = Array.from({ length: score.bars }, (_, index) => barGrid(score, index + 1));
  for (const event of score.events) {
    if (event.kind === "rest") continue;
    const grid = grids[Math.floor(event.at / info.ticksPerBar)];
    const cells = tabCells(score, grid).filter((cell) => cell.eventId === event.id);
    const strings = eventStrings(event, score);
    const positions = event.art?.dead ? [] : event.kind === "note" ? event.notes : strumPositions(event, score);
    const add = (message: string) =>
      problems.push({ code: "correspondence", message: `${score.id}: ${event.id} ${message}`, eventId: event.id });

    if (cells.length !== strings.length || strings.some((string) => !cells.some((cell) => cell.string === string)))
      add("is missing from the tab on one of its strings.");
    if (cells.some((cell) => cell.column !== (event.at - grid.from) / grid.step))
      add("is shown in the wrong tab column.");
    for (const position of positions)
      if (!cells.some((cell) => cell.string === position.string && cell.fret === position.fret))
        add(`shows the wrong fret on string ${position.string}.`);

    const board = fretboardAt(score, event.at).filter((item) => item.eventId === event.id);
    if (
      board.length !== positions.length ||
      positions.some(
        (position) => !board.some((item) => item.string === position.string && item.fret === position.fret),
      )
    )
      add("is not shown on the fretboard while it sounds.");

    if (event.art?.tie) continue;
    if (event.kind === "note" && event.art?.legato) {
      for (const position of event.notes) {
        const target = positionMidi(position);
        if (
          !sounds.some((sound) => sound.string === position.string && sound.glides.some((glide) => glide.to === target))
        )
          add(`does not move string ${position.string} to its written pitch.`);
      }
      continue;
    }
    const own = sounds.filter((sound) => sound.eventId === event.id);
    if (event.art?.dead) {
      if (own.length !== strings.length || own.some((sound) => sound.kind !== "dead"))
        add("is not sounded as a muted scratch.");
      continue;
    }
    const expected = positions
      .map(
        (position) =>
          `${position.string}:${positionMidi(position) + (event.kind === "note" && event.art?.slideIn ? (event.art.slideIn === "below" ? -2 : 2) : 0)}`,
      )
      .sort();
    const heard = own.map((sound) => `${sound.string}:${sound.midi}`).sort();
    if (JSON.stringify(expected) !== JSON.stringify(heard))
      add(`sounds ${heard.join(", ") || "nothing"} instead of ${expected.join(", ")}.`);
  }
  return problems;
}
