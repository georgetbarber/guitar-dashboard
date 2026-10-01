import { ONE_NOTE_QUESTION_ANSWER } from "../pilotEpisode";
import type { MaterialEvent, MusicalMaterial } from "../structuredMusic";

const STRING_NAMES = ["high E", "B", "G", "D", "A", "low E"] as const;
type NoteEvent = Extract<MaterialEvent, { kind: "note" }>;

function fretLabel(fret: number): string {
  return fret === 0 ? "open" : `fret ${fret}`;
}

/** The score and sound are both projections of the same versioned events. */
export function PilotStudy({
  material = ONE_NOTE_QUESTION_ANSWER,
  activeBeat = null,
  conceal = false,
  sectionId = "whole",
  range,
  tempo = material.tempo.default,
}: {
  material?: MusicalMaterial;
  activeBeat?: number | null;
  conceal?: boolean;
  sectionId?: string;
  range?: { fromBeat: number; toBeat: number };
  tempo?: number;
}) {
  const activeEvent = material.events.find(
    (event) => activeBeat !== null && activeBeat >= event.atBeat && activeBeat < event.atBeat + event.beats,
  );
  const notes = material.events.filter((event): event is NoteEvent => event.kind === "note");
  const positions = [
    ...new Map(notes.map((note) => [`${note.position.string}:${note.position.fret}`, note.position])).values(),
  ].sort((a, b) => a.string - b.string || a.fret - b.fret);
  const pilotOpenE =
    notes.length > 0 &&
    notes.every((note) => note.position.string === 1 && note.position.fret === 0 && note.midi === 64);
  const stringNumbers = [...new Set(positions.map((position) => position.string))];
  const location = pilotOpenE
    ? "High E string, open (E4)"
    : positions.length === 0
      ? "Rhythm only"
      : stringNumbers.length === 1
        ? `${STRING_NAMES[stringNumbers[0] - 1]} string, ${positions.map((position) => fretLabel(position.fret)).join(", ")}`
        : positions.map((position) => `string ${position.string} ${fretLabel(position.fret)}`).join(", ");
  const positionText = pilotOpenE
    ? "String 1 · the thinnest string · open high E (E4)"
    : positions.length === 0
      ? "No pitched guitar position in this study"
      : positions
          .map(
            (position) =>
              `string ${position.string} (${STRING_NAMES[position.string - 1]}), ${fretLabel(position.fret)}`,
          )
          .join(" · ");
  const maxFret = Math.max(3, ...positions.map((position) => position.fret));
  const targetPositions = new Set(positions.map((position) => `${position.string}:${position.fret}`));
  const activePosition = activeEvent?.kind === "note" ? activeEvent.position : null;
  const activeInstruction =
    activeEvent?.kind === "rest"
      ? positions.length === 0
        ? "Make this silence deliberate"
        : "Touch this string to stop it"
      : activePosition?.fret === 0
        ? "Play this open string now"
        : activePosition
          ? `Play string ${activePosition.string} at fret ${activePosition.fret} now`
          : pilotOpenE
            ? "Open string: no finger on a fret"
            : "Follow the score from left to right";
  return (
    <figure className="pilot-study" aria-label={`Guitar study: ${material.title}`}>
      <figcaption>
        <span className="eyebrow">Exact practice phrase</span>
        <strong>{material.title}</strong>
        <small>
          {conceal ? "Guitar positions hidden" : location} · {tempo} BPM · {material.metre.numerator}/
          {material.metre.denominator}
        </small>
      </figcaption>
      <div className="pilot-bars">
        {material.sections
          .filter(
            (section) =>
              (sectionId === "whole" || section.id === sectionId) &&
              (!range || (section.fromBeat < range.toBeat && section.toBeat > range.fromBeat)),
          )
          .map((section) => {
            const fromBeat = Math.max(section.fromBeat, range?.fromBeat ?? section.fromBeat);
            const toBeat = Math.min(section.toBeat, range?.toBeat ?? section.toBeat);
            const events = material.events.filter((event) => event.atBeat >= fromBeat && event.atBeat < toBeat);
            const columns = { gridTemplateColumns: `repeat(${toBeat - fromBeat}, minmax(0, 1fr))` };
            return (
              <div className="pilot-bar" key={section.id}>
                <strong>{conceal ? `Example ${material.sections.indexOf(section) + 1}` : section.label}</strong>
                <div className="pilot-counts" style={columns}>
                  {events.map((event) => (
                    <div
                      className={`${event.kind === "rest" ? "is-rest" : ""} ${activeBeat !== null && activeBeat >= event.atBeat && activeBeat < event.atBeat + event.beats ? "is-current" : ""}`}
                      key={event.id}
                      style={
                        Number.isInteger(event.beats) && event.beats > 1
                          ? { gridColumn: `span ${event.beats}` }
                          : undefined
                      }
                    >
                      <span>{event.atBeat - section.fromBeat + 1}</span>
                      <strong>{conceal ? "·" : event.kind === "note" ? `Play ${event.spelling}` : "Rest"}</strong>
                    </div>
                  ))}
                </div>
                <div
                  className="pilot-tab"
                  role="img"
                  aria-label={
                    conceal
                      ? `Example ${material.sections.indexOf(section) + 1} tablature hidden during the check`
                      : `${section.label} tablature: ${events
                          .map((event) =>
                            event.kind === "note"
                              ? `string ${event.position.string}, ${fretLabel(event.position.fret)}`
                              : "rest",
                          )
                          .join(", ")}`
                  }
                  style={columns}
                >
                  {events.map((event) => (
                    <span
                      key={event.id}
                      className={
                        activeBeat !== null && activeBeat >= event.atBeat && activeBeat < event.atBeat + event.beats
                          ? "is-current"
                          : ""
                      }
                      style={
                        Number.isInteger(event.beats) && event.beats > 1
                          ? { gridColumn: `span ${event.beats}` }
                          : undefined
                      }
                    >
                      {conceal ? "·" : event.kind === "note" ? event.position.fret : "×"}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
      </div>
      <div
        className={`pilot-guitar ${!conceal && activeEvent?.kind === "note" ? "is-sounding" : !conceal && activeEvent?.kind === "rest" ? "is-muted" : ""}`}
        aria-label={conceal ? "Guitar positions hidden during this check" : `Guitar positions: ${positionText}`}
      >
        <strong>On the guitar</strong>
        <span>{conceal ? "Position diagram hidden until you answer" : positionText}</span>
        {!conceal && (
          <div className="pilot-fretboard" aria-hidden="true">
            {["e", "B", "G", "D", "A", "E"].map((string, index) => (
              <div
                className="pilot-string-row"
                key={`${index}-${string}`}
                style={{ gridTemplateColumns: `24px repeat(${maxFret + 1}, minmax(24px, 1fr))` }}
              >
                <span>{string}</span>
                {Array.from({ length: maxFret + 1 }, (_, fret) => {
                  const target = activePosition
                    ? activePosition.string === index + 1 && activePosition.fret === fret
                    : targetPositions.has(`${index + 1}:${fret}`);
                  return (
                    <b key={fret} className={target ? "target" : ""}>
                      {target ? fret : ""}
                    </b>
                  );
                })}
              </div>
            ))}
          </div>
        )}
        <small>{conceal ? "Try the phrase from memory before revealing the positions" : activeInstruction}</small>
      </div>
      <p>
        Count four beats before starting. Follow the written note lengths; touch the string lightly on a rest so the
        silence is deliberate.
      </p>
    </figure>
  );
}
