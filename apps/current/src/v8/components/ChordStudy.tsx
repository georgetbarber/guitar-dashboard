import { useEffect, useRef, useState } from "react";
import { sharedPositions, timedChords, voicingTab } from "../chordStudy";
import type { ChordStudyVersion } from "../chordStudy";
import { startChordStudyPlayback } from "../chordStudyPlayback";
import type { DraftChordStudy } from "../phase6Drafts";

const STRING_NAMES = ["high E", "B", "G", "D", "A", "low E"] as const;

/** Unshipped draft preview; the live curriculum still uses the one-note player. */
export function ChordStudy({
  study,
  version = "study",
  conceal = false,
}: {
  study: DraftChordStudy;
  version?: ChordStudyVersion;
  conceal?: boolean;
}) {
  const events = timedChords(study, version);
  const shared = sharedPositions(study);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [error, setError] = useState("");
  const stopRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    stopRef.current?.();
    stopRef.current = null;
    setActiveIndex(-1);
  }, [study, version]);
  useEffect(() => () => stopRef.current?.(), []);

  const play = () => {
    stopRef.current?.();
    setActiveIndex(-1);
    setError("");
    try {
      stopRef.current = startChordStudyPlayback(study, version, study.tempo.default, setActiveIndex);
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "The chord guide could not play.");
    }
  };
  const stop = () => {
    stopRef.current?.();
    stopRef.current = null;
    setActiveIndex(-1);
  };

  return (
    <figure className="pilot-study chord-study" aria-label={`Draft ${study.bars}-bar chord study`}>
      <figcaption>
        <span className="eyebrow">Draft study · awaiting guitar review</span>
        <strong>
          {conceal
            ? "Common-tone chord change"
            : `${study.voicings.map((voicing) => voicing.id).join(" → ")} common-tone change`}
        </strong>
        <small>
          {conceal ? "Tonal centre hidden" : `${study.tonalCenter.name} ${study.tonalCenter.mode}`} · {study.tempo.default} BPM · {study.bars} bars of{" "}
          {study.metre.numerator}/{study.metre.denominator}
        </small>
      </figcaption>
      <p>
        {conceal
          ? "Find what stays in place before revealing the shapes."
          : `Shared positions: ${shared.map((position) => `${STRING_NAMES[position.string - 1]} ${position.fret === 0 ? "open" : `fret ${position.fret}`}`).join(" · ") || "none"}.`}
      </p>
      <div className="pilot-bars">
        {Array.from({ length: study.bars }, (_, index) => index * study.metre.numerator).map((barStart) => (
          <div className="pilot-bar" key={barStart}>
            <strong>Bar {barStart / study.metre.numerator + 1}</strong>
            <div
              className="pilot-counts chord-study-counts"
              style={{ gridTemplateColumns: `repeat(${study.metre.numerator}, minmax(0, 1fr))` }}
            >
              {events
                .map((event, index) => ({ event, index }))
                .filter(({ event }) => event.atBeat >= barStart && event.atBeat < barStart + study.metre.numerator)
                .map(({ event, index }) => (
                  <div
                    key={event.id}
                    className={index === activeIndex ? "is-current" : ""}
                    style={{ gridColumn: `span ${event.beats}` }}
                  >
                    <span>Count {event.atBeat - barStart + 1}</span>
                    <strong>{conceal ? `Change ${index + 1}` : event.chordId}</strong>
                    <small
                      role="img"
                      aria-label={
                        conceal
                          ? `Change ${index + 1} fingering hidden`
                          : `${event.chordId} voicing, low E to high E: ${voicingTab(event.positions)}`
                      }
                    >
                      {conceal ? "Fingering hidden" : voicingTab(event.positions)}
                    </small>
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>
      <div className="chord-study-controls">
        <button type="button" onClick={play}>
          Hear the draft chord guide
        </button>
        {activeIndex >= 0 && (
          <button type="button" onClick={stop}>
            Stop guide
          </button>
        )}
      </div>
      <small>
        Synthesized voicings show pitch and order only; they are not a hand demonstration or an assessment of playing.
      </small>
      {error && <p role="alert">{error}</p>}
    </figure>
  );
}
