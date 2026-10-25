import type { CSSProperties } from "react";
import type { Score, StringNumber } from "../../../core/score/types";
import { allPositions, fretboardAt, stringName } from "../../../core/score/views";

const STRING_LABELS: Record<StringNumber, string> = { 1: "e", 2: "B", 3: "G", 4: "D", 5: "A", 6: "E" };

/**
 * The hand's territory for this score: every position it uses, and the ones
 * sounding now filled in. Strings run high E at the top, as in the tab.
 */
export function ScoreFretboard({ score, activeTick }: { score: Score; activeTick: number | null }) {
  const everywhere = allPositions(score);
  const now = activeTick === null ? [] : fretboardAt(score, activeTick);
  const highest = Math.max(4, ...everywhere.map((position) => position.fret));
  const lowest = highest > 7 ? Math.max(0, Math.min(...everywhere.map((position) => position.fret)) - 1) : 0;
  const frets = Array.from({ length: highest - lowest + 1 }, (_, index) => lowest + index);
  const sounding = (string: StringNumber, fret: number) =>
    now.some((item) => item.string === string && item.fret === fret);
  const used = (string: StringNumber, fret: number) =>
    everywhere.find((item) => item.string === string && item.fret === fret);
  const summary = (now.length ? now : everywhere)
    .map(
      (item) =>
        `${stringName(item.string)} ${item.fret === 0 ? "open" : `fret ${item.fret}`}${item.name ? ` (${item.name})` : ""}`,
    )
    .join("; ");
  return (
    <div
      className="score-board"
      role="img"
      aria-label={`${now.length ? "Sounding now" : "Positions in this study"}: ${summary || "none"}.`}
    >
      <div className="score-board__frets" aria-hidden="true" style={{ "--frets": frets.length } as CSSProperties}>
        <span />
        {frets.map((fret) => (
          <small key={fret}>{fret === 0 ? "open" : fret}</small>
        ))}
      </div>
      {([1, 2, 3, 4, 5, 6] as StringNumber[]).map((string) => (
        <div
          key={string}
          className="score-board__string"
          aria-hidden="true"
          style={{ "--frets": frets.length } as CSSProperties}
        >
          <span>{STRING_LABELS[string]}</span>
          {frets.map((fret) => {
            const position = used(string, fret);
            return (
              <b
                key={fret}
                className={`${position ? "is-used" : ""} ${sounding(string, fret) ? "is-sounding" : ""} ${fret === 0 ? "is-open" : ""}`}
              >
                {position ? (position.name ?? fret) : ""}
              </b>
            );
          })}
        </div>
      ))}
    </div>
  );
}
