import type { CSSProperties } from "react";
import {
  keySignature,
  ledgerSteps,
  STAFF_LINES,
  staffSymbols,
  type Accidental,
  type StaffSymbol,
} from "../../../core/score/staff";
import type { Score } from "../../../core/score/types";
import type { BarGrid } from "../../../core/score/views";

/** Highest and lowest steps drawn: room for ledger lines from the open low E (written E3) to fret 12 on the high E. */
const TOP = 46;
const BOTTOM = 20;
const HEAD_X = 9;

const ACCIDENTAL_TEXT: Record<Accidental, string> = {
  sharp: "♯",
  flat: "♭",
  natural: "♮",
  "double-sharp": "x",
  "double-flat": "♭♭",
};

function y(step: number, half: number): number {
  return (TOP - step) * half + half;
}

function Lines({ half }: { half: number }) {
  return (
    <>
      {STAFF_LINES.map((step) => (
        <line key={step} className="staff-line" x1="0" x2="100%" y1={y(step, half)} y2={y(step, half)} />
      ))}
    </>
  );
}

function Rest({ symbol, half }: { symbol: StaffSymbol; half: number }) {
  return (
    <g>
      <RestShape symbol={symbol} half={half} />
      {symbol.dotted && <circle className="staff-ink" cx={HEAD_X + 7} cy={y(34, half) - half * 0.5} r={1.4} />}
    </g>
  );
}

function RestShape({ symbol, half }: { symbol: StaffSymbol; half: number }) {
  const mid = y(34, half);
  const x = HEAD_X;
  if (symbol.value === "whole") return <rect className="staff-ink" x={x - 4} y={y(36, half)} width={9} height={half} />;
  if (symbol.value === "half") return <rect className="staff-ink" x={x - 4} y={mid - half} width={9} height={half} />;
  if (symbol.value === "quarter")
    return (
      <path
        className="staff-stroke"
        d={`M${x - 2} ${mid - 3 * half} l4 ${half * 1.6} l-4 ${half * 1.6} l4 ${half * 1.6} q-5 -1 -2 ${half * 1.6}`}
      />
    );
  const flags = symbol.value === "sixteenth" ? 2 : 1;
  return (
    <g>
      <path className="staff-stroke" d={`M${x + 3} ${mid - half * 1.5} L${x - 1} ${mid + half * 2.5}`} />
      {Array.from({ length: flags }, (_, index) => (
        <circle
          key={index}
          className="staff-ink"
          cx={x - 1 + index * -1}
          cy={mid - half * 1.5 + index * half * 2}
          r={half * 0.55}
        />
      ))}
    </g>
  );
}

function Note({ symbol, half }: { symbol: StaffSymbol; half: number }) {
  const heads = [...new Map(symbol.heads.map((head) => [head.step, head])).values()];
  if (!heads.length) return null;
  const low = heads[0].step;
  const high = heads.at(-1)!.step;
  const hollow = symbol.value === "half" || symbol.value === "whole";
  const rx = half * 1.3;
  const ry = half * 0.95;
  const up = symbol.stem === "up";
  const stemX = up ? HEAD_X + rx - 0.6 : HEAD_X - rx + 0.6;
  const stemFrom = up ? y(low, half) : y(high, half);
  const stemTo = up ? y(high, half) - half * 7 : y(low, half) + half * 7;
  const flags = symbol.value === "eighth" ? 1 : symbol.value === "sixteenth" ? 2 : 0;
  const ledgers = [...new Set(heads.flatMap((head) => ledgerSteps(head.step)))];
  return (
    <g>
      {ledgers.map((step) => (
        <line
          key={step}
          className="staff-line"
          x1={HEAD_X - rx - 3}
          x2={HEAD_X + rx + 3}
          y1={y(step, half)}
          y2={y(step, half)}
        />
      ))}
      {heads.map((head) =>
        head.dead ? (
          <path
            key={head.step}
            className="staff-stroke"
            d={`M${HEAD_X - rx} ${y(head.step, half) - ry} L${HEAD_X + rx} ${y(head.step, half) + ry} M${HEAD_X - rx} ${y(head.step, half) + ry} L${HEAD_X + rx} ${y(head.step, half) - ry}`}
          />
        ) : (
          <ellipse
            key={head.step}
            className={hollow ? "staff-hollow" : "staff-ink"}
            cx={HEAD_X}
            cy={y(head.step, half)}
            rx={rx}
            ry={ry}
            transform={`rotate(-20 ${HEAD_X} ${y(head.step, half)})`}
          />
        ),
      )}
      {heads.map(
        (head) =>
          head.accidental && (
            <text
              key={`a${head.step}`}
              className="staff-text"
              x={HEAD_X - rx - 2}
              y={y(head.step, half) + half}
              textAnchor="end"
              fontSize={half * 3.4}
            >
              {ACCIDENTAL_TEXT[head.accidental]}
            </text>
          ),
      )}
      {symbol.value !== "whole" && symbol.value !== null && (
        <line className="staff-stroke" x1={stemX} x2={stemX} y1={stemFrom} y2={stemTo} />
      )}
      {Array.from({ length: flags }, (_, index) => {
        const start = stemTo + (up ? 1 : -1) * index * half * 1.6;
        return (
          <path
            key={index}
            className="staff-stroke"
            d={`M${stemX} ${start} q${half * 2.2} ${(up ? 1 : -1) * half * 1.4} ${half * 1.4} ${(up ? 1 : -1) * half * 3.6}`}
          />
        );
      })}
      {symbol.dotted && <circle className="staff-ink" cx={HEAD_X + rx + 3} cy={y(high, half) - half * 0.5} r={1.4} />}
      {symbol.triplet && (
        <text
          className="staff-text"
          x={HEAD_X}
          y={up ? stemTo - 2 : stemTo + half * 3}
          textAnchor="middle"
          fontSize={half * 2.4}
        >
          3
        </text>
      )}
      {symbol.tie && (
        <path
          className="staff-stroke"
          d={`M${HEAD_X - rx - 1} ${y(low, half) + (up ? 1 : -1) * half * 1.5} q-4 ${(up ? 1 : -1) * 3} -8 0`}
        />
      )}
    </g>
  );
}

/**
 * One bar of optional treble-clef staff, an octave above sounding pitch, laid
 * on the same columns as the tab and the count.
 */
export function StaffRow({
  score,
  grid,
  style,
  sounding,
  large,
}: {
  score: Score;
  grid: BarGrid;
  style: CSSProperties;
  sounding: ReadonlySet<string>;
  large: boolean;
}) {
  const half = large ? 5 : 3.5;
  const height = (TOP - BOTTOM) * half + half * 2;
  const symbols = staffSymbols(score, grid);
  const signature = keySignature(score.key);
  const starts = new Map<number, StaffSymbol[]>();
  for (const symbol of symbols) starts.set(symbol.column, [...(starts.get(symbol.column) ?? []), symbol]);
  // One cell per column, or per held event, so the staff lines run unbroken across the bar.
  const cells: { column: number; span: number; symbols: StaffSymbol[] }[] = [];
  const startColumns = [...starts.keys()].sort((a, b) => a - b);
  for (let column = 0; column < grid.columns;) {
    const here = starts.get(column) ?? [];
    const next = startColumns.find((start) => start > column) ?? grid.columns;
    const span = here.length ? next - column : 1;
    cells.push({ column, span, symbols: here });
    column += span;
  }
  return (
    <div className="score-row score-row--staff" style={style}>
      <span className="score-row__label">
        <svg width="100%" height={height} aria-hidden="true">
          <Lines half={half} />
          <text className="staff-text" x="1" y={y(30, half) + half * 1.2} fontSize={half * 8.6}>
            𝄞
          </text>
          <text className="staff-text" x={half * 2.6} y={y(24, half)} fontSize={half * 2.4}>
            8
          </text>
          {signature.steps.map((step, index) => (
            <text
              key={index}
              className="staff-text"
              x={half * 5.2 + index * half * 1.55}
              y={y(step, half) + half}
              fontSize={half * 2.9}
            >
              {signature.kind === "sharp" ? "♯" : "♭"}
            </text>
          ))}
        </svg>
      </span>
      {cells.map((cell) => (
        <span key={cell.column} style={{ gridColumn: `${cell.column + 2} / span ${cell.span}` }}>
          <svg width="100%" height={height} aria-hidden="true">
            <Lines half={half} />
            {cell.symbols.map((symbol, index) => (
              <g
                key={symbol.eventId}
                className={sounding.has(symbol.eventId) ? "is-sounding" : ""}
                transform={index ? `translate(${index * 3} 0)` : undefined}
              >
                {symbol.rest ? <Rest symbol={symbol} half={half} /> : <Note symbol={symbol} half={half} />}
              </g>
            ))}
          </svg>
        </span>
      ))}
    </div>
  );
}
