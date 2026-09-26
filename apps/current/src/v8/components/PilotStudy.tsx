import { ONE_NOTE_QUESTION_ANSWER } from "../pilotEpisode";
import type { MusicalMaterial } from "../structuredMusic";

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
  sectionId?: "whole" | "question" | "answer";
  range?: { fromBeat: number; toBeat: number };
  tempo?: number;
}) {
  const activeEvent = material.events.find(
    (event) => activeBeat !== null && activeBeat >= event.atBeat && activeBeat < event.atBeat + event.beats,
  );
  return (
    <figure className="pilot-study" aria-label="Two-bar one-note question and answer on the open high E string">
      <figcaption>
        <span className="eyebrow">Exact practice phrase</span>
        <strong>{material.title}</strong>
        <small>
          High E string, open (E4) · {tempo} BPM · {material.metre.numerator}/{material.metre.denominator}
        </small>
      </figcaption>
      <div className="pilot-bars">
        {material.sections
          .filter((section) => sectionId === "whole" || section.id === sectionId)
          .map((section) => (
            <div className="pilot-bar" key={section.id}>
              <strong>{section.label}</strong>
              <div
                className="pilot-counts"
                style={
                  range
                    ? { gridTemplateColumns: `repeat(${range.toBeat - range.fromBeat}, minmax(0, 1fr))` }
                    : undefined
                }
              >
                {material.events
                  .filter(
                    (event) =>
                      event.atBeat >= (range?.fromBeat ?? section.fromBeat) &&
                      event.atBeat < (range?.toBeat ?? section.toBeat),
                  )
                  .map((event) => (
                    <div
                      className={`${event.kind === "rest" ? "is-rest" : ""} ${activeBeat === event.atBeat ? "is-current" : ""}`}
                      key={event.id}
                    >
                      <span>{event.atBeat - section.fromBeat + 1}</span>
                      <strong>{conceal ? "·" : event.kind === "note" ? "Play E" : "Rest"}</strong>
                    </div>
                  ))}
              </div>
              <div
                className="pilot-tab"
                role="img"
                aria-label={
                  conceal
                    ? `${section.label} tablature hidden during the check`
                    : `${section.label} tablature on string 1, high E: ${material.events
                        .filter(
                          (event) =>
                            event.atBeat >= (range?.fromBeat ?? section.fromBeat) &&
                            event.atBeat < (range?.toBeat ?? section.toBeat),
                        )
                        .map((event) => (event.kind === "note" ? `open fret ${event.position.fret}` : "muted rest"))
                        .join(", ")}`
                }
                style={
                  range
                    ? { gridTemplateColumns: `repeat(${range.toBeat - range.fromBeat}, minmax(0, 1fr))` }
                    : undefined
                }
              >
                {material.events
                  .filter(
                    (event) =>
                      event.atBeat >= (range?.fromBeat ?? section.fromBeat) &&
                      event.atBeat < (range?.toBeat ?? section.toBeat),
                  )
                  .map((event) => (
                    <span key={event.id} className={activeBeat === event.atBeat ? "is-current" : ""}>
                      {conceal ? "·" : event.kind === "note" ? event.position.fret : "×"}
                    </span>
                  ))}
              </div>
            </div>
          ))}
      </div>
      <div
        className={`pilot-guitar ${activeEvent?.kind === "note" ? "is-sounding" : activeEvent?.kind === "rest" ? "is-muted" : ""}`}
        aria-label="Guitar position: string 1, open high E"
      >
        <strong>On the guitar</strong>
        <span>String 1 · the thinnest string · open high E (E4)</span>
        <div className="pilot-fretboard" aria-hidden="true">
          {["e", "B", "G", "D", "A", "E"].map((string, index) => (
            <div className="pilot-string-row" key={`${index}-${string}`}>
              <span>{string}</span>
              <b className={index === 0 ? "target" : ""}>{index === 0 ? "0" : ""}</b>
              <i />
              <i />
              <i />
            </div>
          ))}
        </div>
        <small>
          {activeEvent?.kind === "rest"
            ? "Touch this string to stop it"
            : activeEvent?.kind === "note"
              ? "Play this open string now"
              : "Open string: no finger on a fret"}
        </small>
      </div>
      <p>
        Count four beats before starting. Let each note sound for one beat; touch the string lightly on a rest so the
        silence is deliberate.
      </p>
    </figure>
  );
}
