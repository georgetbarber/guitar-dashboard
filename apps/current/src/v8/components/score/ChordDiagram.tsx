import { chordDiagram } from "../../../core/score/views";
import { stringName } from "../../../core/score/views";
import type { Voicing } from "../../../core/score/types";

const FINGER_WORDS = ["", "index", "middle", "ring", "little"] as const;

/** A chord box drawn from the voicing's own frets: low E on the left, the nut at the top. */
export function ChordDiagram({ voicing, active = false }: { voicing: Voicing; active?: boolean }) {
  const diagram = chordDiagram(voicing);
  const width = 112;
  const left = 16;
  const top = 34;
  const gap = (width - left * 2) / 5;
  const fretHeight = 22;
  const x = (string: number) => left + (6 - string) * gap;
  const y = (fret: number) => top + (fret - diagram.baseFret + 0.5) * fretHeight;
  const description = diagram.strings
    .map(({ string, fret, finger }) =>
      fret === null
        ? `${stringName(string)} not played`
        : fret === 0
          ? `${stringName(string)} open`
          : `${stringName(string)} fret ${fret}${finger ? `, ${FINGER_WORDS[finger]} finger` : ""}`,
    )
    .join("; ");
  return (
    <figure className={`chord-diagram ${active ? "is-sounding" : ""}`}>
      <svg
        viewBox={`0 0 ${width} ${top + diagram.frets * fretHeight + 10}`}
        role="img"
        aria-label={`${voicing.symbol} chord shape: ${description}${diagram.barre ? `; barre at fret ${diagram.barre.fret}` : ""}.`}
      >
        {diagram.baseFret === 1 ? (
          <rect className="chord-diagram__nut" x={left} y={top - 3} width={gap * 5} height={4} />
        ) : (
          <text className="chord-diagram__fret-label" x={2} y={top + fretHeight * 0.65}>
            {diagram.baseFret}
          </text>
        )}
        {Array.from({ length: diagram.frets + 1 }, (_, index) => (
          <line
            key={`fret-${index}`}
            x1={left}
            x2={left + gap * 5}
            y1={top + index * fretHeight}
            y2={top + index * fretHeight}
          />
        ))}
        {[6, 5, 4, 3, 2, 1].map((string) => (
          <line key={`string-${string}`} x1={x(string)} x2={x(string)} y1={top} y2={top + diagram.frets * fretHeight} />
        ))}
        {diagram.barre && (
          <rect
            className="chord-diagram__barre"
            x={x(diagram.barre.to) - 6}
            y={y(diagram.barre.fret) - 6}
            width={x(diagram.barre.from) - x(diagram.barre.to) + 12}
            height={12}
            rx={6}
          />
        )}
        {diagram.strings.map(({ string, fret, finger }) =>
          fret === null ? (
            <text key={string} className="chord-diagram__open" x={x(string)} y={top - 10}>
              ×
            </text>
          ) : fret === 0 ? (
            <circle key={string} className="chord-diagram__open-ring" cx={x(string)} cy={top - 14} r={4.5} />
          ) : (
            <g key={string}>
              <circle className="chord-diagram__dot" cx={x(string)} cy={y(fret)} r={8} />
              {finger && (
                <text className="chord-diagram__finger" x={x(string)} y={y(fret) + 4}>
                  {finger}
                </text>
              )}
            </g>
          ),
        )}
      </svg>
      <figcaption>{voicing.symbol}</figcaption>
    </figure>
  );
}
