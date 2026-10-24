import { useState, type CSSProperties } from "react";
import "../../../styles/score.css";
import { FEELS, metreInfo } from "../../../core/score/time";
import type { Score, StringNumber, StrumEvent } from "../../../core/score/types";
import {
  barGrid,
  describeEvent,
  rhythmLane,
  tabCells,
  type TabCell,
  type TechniqueMark,
} from "../../../core/score/views";
import { ChordDiagram } from "./ChordDiagram";
import { ScoreFretboard } from "./ScoreFretboard";
import { StaffRow } from "./StaffRow";

const STRING_LABELS: Record<StringNumber, string> = { 1: "e", 2: "B", 3: "G", 4: "D", 5: "A", 6: "E" };

const MARK_TEXT: Record<TechniqueMark, string> = {
  h: "h",
  p: "p",
  sl: "sl",
  si: "/",
  sa: "\\",
  b: "b",
  br: "b↘",
  "~": "~",
  pm: "PM",
  lr: "l.r.",
  ">": ">",
  gh: "( )",
  st: "·",
};

const MARK_MEANING: Record<TechniqueMark, string> = {
  h: "h hammer-on: sound the note with the fretting finger",
  p: "p pull-off: pluck the string with the fretting finger as it lifts",
  sl: "sl slide: keep pressing and move along the string",
  si: "/ slide in from a lower fret",
  sa: "\\ slide in from a higher fret",
  b: "b bend: push the string until it reaches the target pitch",
  br: "b↘ bend, then release back to the fretted note",
  "~": "~ vibrato: a small, even wobble in pitch",
  pm: "PM palm mute: rest the side of the picking hand on the strings by the bridge",
  lr: "l.r. let ring: keep the note sounding into the next ones",
  ">": "> accent: play this one stronger",
  gh: "( ) ghost: barely there, felt more than heard",
  st: "· short: stop the note early",
};

const BEND_TEXT: Record<number, string> = { 0.5: "¼", 1: "½", 1.5: "¾", 2: "full" };

const STAFF_KEY = "interval.score.staff";

function readStaff(): boolean {
  try {
    return localStorage.getItem(STAFF_KEY) === "1";
  } catch {
    return false;
  }
}

function writeStaff(value: boolean) {
  try {
    localStorage.setItem(STAFF_KEY, value ? "1" : "0");
  } catch {
    /* A private window keeps the choice for this view only. */
  }
}

function markLabel(cell: TabCell): string {
  return cell.marks
    .map((mark) =>
      mark === "b" || mark === "br" ? `${MARK_TEXT[mark]}${BEND_TEXT[cell.bend ?? 1] ?? ""}` : MARK_TEXT[mark],
    )
    .join(" ");
}

export interface ScoreViewProps {
  score: Score;
  /** Notated tick under the playhead. */
  activeTick?: number | null;
  /** Hide answer-bearing labels for an unaided check: frets, note and chord names, diagrams and the fretboard. */
  conceal?: boolean;
  /** Only these ticks are shown, as when repairing one part. */
  range?: { from: number; to: number };
  /** Larger type and one bar per line, for reading from a music stand. */
  large?: boolean;
  eyebrow?: string;
}

/** Tab with technique marks, the count, rhythm lanes, chord shapes and the fretboard, all from one score. */
export function ScoreView({
  score,
  activeTick = null,
  conceal = false,
  range,
  large = false,
  eyebrow,
}: ScoreViewProps) {
  const [staff, setStaff] = useState(readStaff);
  const showStaff = staff && !conceal;
  const info = metreInfo(score.metre);
  const firstBar = range ? Math.floor(range.from / info.ticksPerBar) + 1 : 1;
  const lastBar = range ? Math.ceil(range.to / info.ticksPerBar) : score.bars;
  const bars = Array.from({ length: lastBar - firstBar + 1 }, (_, index) => firstBar + index);
  const marksUsed = new Set<TechniqueMark>();
  const sounding = new Set(
    activeTick === null
      ? []
      : score.events
          .filter((event) => event.at <= activeTick && activeTick < event.at + event.dur)
          .map((event) => event.id),
  );
  const soundingStrum = score.events.find(
    (event): event is StrumEvent => event.kind === "strum" && sounding.has(event.id),
  );
  const activeVoicing = soundingStrum?.chord ?? null;

  return (
    <figure
      className={`score-view ${large ? "is-large" : ""}`}
      aria-label={`Score: ${conceal ? "hidden during this check" : score.title}`}
    >
      <figcaption className="score-view__caption">
        {eyebrow && <span className="eyebrow">{eyebrow}</span>}
        <strong>{score.title}</strong>
        <small>
          {conceal ? "Key hidden" : `${score.key.tonic} ${score.key.mode}`} · {score.metre} · {FEELS[score.feel].label}{" "}
          · {score.tempo.minimum}–{score.tempo.maximum} BPM
        </small>
        {!conceal && (
          <label className="score-view__staff-toggle">
            <input
              type="checkbox"
              checked={staff}
              onChange={(event) => {
                setStaff(event.target.checked);
                writeStaff(event.target.checked);
              }}
            />{" "}
            Show staff notation (optional)
          </label>
        )}
      </figcaption>
      {score.voicings.length > 0 &&
        (conceal ? (
          <p className="score-view__hidden">Chord shapes hidden until you check.</p>
        ) : (
          <div className="score-view__diagrams">
            {score.voicings.map((voicing) => (
              <ChordDiagram key={voicing.id} voicing={voicing} active={activeVoicing === voicing.id} />
            ))}
          </div>
        ))}
      <div className="score-view__bars">
        {bars.map((bar) => {
          const grid = barGrid(score, bar);
          const cells = tabCells(score, grid);
          cells.forEach((cell) => cell.marks.forEach((mark) => marksUsed.add(mark)));
          const nowColumn =
            activeTick !== null && activeTick >= grid.from && activeTick < grid.to
              ? Math.floor((activeTick - grid.from) / grid.step)
              : -1;
          const style = { "--columns": grid.columns } as CSSProperties;
          const column = (index: number, span = 1) => ({ gridColumn: `${index + 2} / span ${span}` });
          const events = score.events.filter((event) => event.at >= grid.from && event.at < grid.to);
          const spoken = events
            .map(
              (event) => `${grid.labels[(event.at - grid.from) / grid.step]}: ${describeEvent(event, score, conceal)}`,
            )
            .join("; ");
          const sectionLabel = score.sections.find(
            (section) => section.from <= grid.from && grid.from < section.to,
          )?.label;
          return (
            <section
              className="score-bar"
              key={bar}
              aria-label={`Bar ${bar}${sectionLabel && !conceal ? `, ${sectionLabel}` : ""}. ${spoken}.`}
            >
              <header>
                <strong>Bar {bar}</strong>
                {sectionLabel && score.sections.length > 1 && (
                  <span>
                    {conceal ? `Part ${score.sections.findIndex((s) => s.label === sectionLabel) + 1}` : sectionLabel}
                  </span>
                )}
              </header>
              <div className="score-bar__grid" aria-hidden="true">
                <div className="score-row score-row--count" style={style}>
                  <span className="score-row__label">count</span>
                  {grid.labels.map((label, index) => (
                    <span
                      key={index}
                      style={column(index)}
                      className={`${grid.beatStarts.includes(index) ? "is-beat" : ""} ${index === nowColumn ? "is-now" : ""}`}
                    >
                      {label}
                    </span>
                  ))}
                </div>
                {score.voices.map((voice) => (
                  <div className="score-row score-row--lane" style={style} key={voice.id}>
                    <span className="score-row__label">{score.voices.length > 1 ? voice.label : "rhythm"}</span>
                    {rhythmLane(score, grid, voice.id).map((span) => (
                      <span
                        key={span.eventId}
                        style={column(span.fromColumn, span.toColumn - span.fromColumn)}
                        className={`lane lane--${span.kind} ${span.accent ? "is-accent" : ""} ${span.ghost ? "is-ghost" : ""} ${sounding.has(span.eventId) ? "is-sounding" : ""}`}
                      >
                        {span.kind === "rest"
                          ? span.toColumn - span.fromColumn > 1
                            ? "rest"
                            : "·"
                          : `${span.accent ? ">" : ""}${span.dead ? "x" : span.stroke === "down" ? "↓" : span.stroke === "up" ? "↑" : span.kind === "held" ? "" : "●"}`}
                      </span>
                    ))}
                  </div>
                ))}
                {showStaff && <StaffRow score={score} grid={grid} style={style} sounding={sounding} large={large} />}
                <div className="score-row score-row--marks" style={style}>
                  <span className="score-row__label" />
                  {[...new Set(cells.map((cell) => cell.column))].map((index) => {
                    const label = [
                      ...new Set(
                        cells
                          .filter((cell) => cell.column === index)
                          .map(markLabel)
                          .filter(Boolean),
                      ),
                    ].join(" ");
                    return label && !conceal ? (
                      <span key={index} style={column(index)}>
                        {label}
                      </span>
                    ) : null;
                  })}
                </div>
                {([1, 2, 3, 4, 5, 6] as StringNumber[]).map((string) => (
                  <div className="score-row score-row--string" style={style} key={string}>
                    <span className="score-row__label">{STRING_LABELS[string]}</span>
                    {cells
                      .filter((cell) => cell.string === string)
                      .map((cell) => (
                        <span
                          key={`${cell.eventId}-${cell.string}`}
                          style={column(cell.column)}
                          className={sounding.has(cell.eventId) ? "is-sounding" : ""}
                        >
                          {conceal ? "•" : cell.text}
                        </span>
                      ))}
                  </div>
                ))}
              </div>
            </section>
          );
        })}
      </div>
      {conceal ? (
        <p className="score-view__hidden">Positions hidden. Play it from memory, then reveal if you need to.</p>
      ) : (
        <ScoreFretboard score={score} activeTick={activeTick} />
      )}
      {marksUsed.size > 0 && !conceal && (
        <details className="score-view__legend">
          <summary>What the marks mean</summary>
          <ul>
            {[...marksUsed].map((mark) => (
              <li key={mark}>{MARK_MEANING[mark]}</li>
            ))}
          </ul>
        </details>
      )}
    </figure>
  );
}
