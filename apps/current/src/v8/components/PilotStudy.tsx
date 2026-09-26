import { ONE_NOTE_QUESTION_ANSWER } from "../pilotEpisode";

/** The pilot's visible counts come from the same events the future player will schedule. */
export function PilotStudy() {
  const material = ONE_NOTE_QUESTION_ANSWER;
  return (
    <figure className="pilot-study" aria-label="Two-bar one-note question and answer on the open high E string">
      <figcaption>
        <span className="eyebrow">Exact practice phrase</span>
        <strong>{material.title}</strong>
        <small>
          High E string, open (E4) · {material.tempo.default} BPM · {material.metre.numerator}/
          {material.metre.denominator}
        </small>
      </figcaption>
      <div className="pilot-bars">
        {material.sections.map((section) => (
          <div className="pilot-bar" key={section.id}>
            <strong>{section.label}</strong>
            <div className="pilot-counts">
              {material.events
                .filter((event) => event.atBeat >= section.fromBeat && event.atBeat < section.toBeat)
                .map((event) => (
                  <div className={event.kind === "rest" ? "is-rest" : ""} key={event.id}>
                    <span>Count {event.atBeat - section.fromBeat + 1}</span>
                    <strong>{event.kind === "note" ? "Play E" : "Rest"}</strong>
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>
      <p>
        Count four beats before starting. Let each note sound for one beat; touch the string lightly on a rest so the
        silence is deliberate.
      </p>
    </figure>
  );
}
