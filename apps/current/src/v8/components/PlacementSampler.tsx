import { useEffect, useRef, useState } from "react";
import { playClick, playMidi, stopAudio } from "../../audio/engine";
import { conceptCheckById, recordConceptAnswer } from "../conceptChecks";
import { placementCheck, placementResults, placementSuggestion, recordPlacementReport } from "../placement";
import type { PlacementDomain } from "../placement";
import { useV8Store } from "../store";
import type { CompetencyEvidence, LearnerSettings } from "../types";
import { RecordSaveStatus } from "./SaveStatus";

const LABELS: Record<PlacementDomain, string> = {
  pulse: "Pulse through silence",
  sound: "Note release",
  ear: "Hear an interval change",
  fretboard: "Fretboard map",
  chord: "Chord tone",
};

const RESULT_TEXT = {
  "not-sampled": "Not sampled",
  "reported-yes": "You reported doing this",
  "reported-not-yet": "You reported this needs practice",
  "checked-correct": "One on-screen answer checked correct",
  "checked-with-hint": "One on-screen answer checked correct with a hint",
  "checked-retry": "Latest on-screen answer needs another pass",
} as const;

function playPulseSample() {
  stopAudio();
  for (let beat = 0; beat < 4; beat += 1) playClick(beat * 0.6, beat === 0);
  playClick(8 * 0.6, true);
}

function PhysicalSample({ domain }: { domain: "pulse" | "sound" }) {
  const { dispatch } = useV8Store();
  const [record, setRecord] = useState<CompetencyEvidence | null>(null);
  const [playedPulse, setPlayedPulse] = useState(false);
  const [pulseRunning, setPulseRunning] = useState(false);
  const [audioError, setAudioError] = useState("");
  const pulseTimer = useRef<number | null>(null);
  useEffect(
    () => () => {
      if (pulseTimer.current !== null) window.clearTimeout(pulseTimer.current);
    },
    [],
  );
  const startPulse = () => {
    try {
      if (pulseTimer.current !== null) window.clearTimeout(pulseTimer.current);
      playPulseSample();
      setPlayedPulse(false);
      setPulseRunning(true);
      pulseTimer.current = window.setTimeout(() => {
        setPulseRunning(false);
        setPlayedPulse(true);
      }, 5_000);
      setAudioError("");
    } catch {
      setPulseRunning(false);
      setAudioError("The clicks could not start on this device. Skip this sample or try again later.");
    }
  };
  const report = (succeeded: boolean) => {
    if (domain === "pulse" && !playedPulse) return;
    const observation = recordPlacementReport(domain, succeeded);
    dispatch({ type: "recordActivity", activityId: observation.activityId, evidence: [observation] });
    setRecord(observation);
    setPlayedPulse(false);
  };
  return (
    <section className="placement-domain" aria-label={LABELS[domain]}>
      <h4>{LABELS[domain]}</h4>
      {domain === "pulse" ? (
        <>
          <p>
            Tap with four clicks at 100 BPM. Keep tapping through four silent beats. Did your tap meet the returning
            click?
          </p>
          <button className="secondary-action" onClick={startPulse}>
            {pulseRunning ? "Replay clicks and silence" : "Play clicks and silence"}
          </button>
          {pulseRunning && <small role="status">Keep tapping until the return click. Then report what happened.</small>}
        </>
      ) : (
        <p>
          With your guitar, play four even notes and deliberately stop each sound before the next. Was every release
          clear? Leave this unanswered if you have no guitar now.
        </p>
      )}
      {audioError && <small role="alert">{audioError}</small>}
      <div className="action-row">
        <button className="secondary-action" disabled={domain === "pulse" && !playedPulse} onClick={() => report(true)}>
          I could do this
        </button>
        <button className="text-action" disabled={domain === "pulse" && !playedPulse} onClick={() => report(false)}>
          Not yet
        </button>
      </div>
      <small>Your report is useful for choosing a start. The app has not measured your timing or sound.</small>
      {record && <RecordSaveStatus evidenceIds={[record.id]} />}
    </section>
  );
}

function CheckedSample({ domain }: { domain: "ear" | "fretboard" | "chord" }) {
  const { state, dispatch } = useV8Store();
  const [checkId, setCheckId] = useState(() => placementCheck(domain, state.evidence).id);
  const [response, setResponse] = useState("");
  const [played, setPlayed] = useState(false);
  const [audioRunning, setAudioRunning] = useState(false);
  const [usedHint, setUsedHint] = useState(false);
  const [record, setRecord] = useState<CompetencyEvidence | null>(null);
  const [audioError, setAudioError] = useState("");
  const audioTimer = useRef<number | null>(null);
  useEffect(
    () => () => {
      if (audioTimer.current !== null) window.clearTimeout(audioTimer.current);
    },
    [],
  );
  const shown = conceptCheckById(checkId)!;
  const replay = () => {
    if (!shown.audioPairs) return;
    try {
      if (audioTimer.current !== null) window.clearTimeout(audioTimer.current);
      stopAudio();
      const [[firstRoot, firstTarget], [secondRoot, secondTarget]] = shown.audioPairs;
      playMidi(firstRoot, 0, 0.5);
      playMidi(firstTarget, 0.65, 0.55);
      playMidi(secondRoot, 1.75, 0.5);
      playMidi(secondTarget, 2.4, 0.55);
      setPlayed(false);
      setAudioRunning(true);
      audioTimer.current = window.setTimeout(() => {
        setAudioRunning(false);
        setPlayed(true);
      }, 3_100);
      setAudioError("");
    } catch {
      setAudioRunning(false);
      setAudioError("Audio could not start on this device. Skip this sample or try again later.");
    }
  };
  const submit = () => {
    if (!response || record || (domain === "ear" && !played)) return;
    const observation = recordConceptAnswer(shown, response, usedHint);
    dispatch({ type: "recordActivity", activityId: observation.activityId, evidence: [observation] });
    setRecord(observation);
  };
  const another = () => {
    setCheckId(placementCheck(domain, [...state.evidence, ...(record ? [record] : [])]).id);
    setResponse("");
    setPlayed(false);
    setAudioRunning(false);
    setUsedHint(false);
    setRecord(null);
    setAudioError("");
  };
  return (
    <section className="placement-domain" aria-label={LABELS[domain]}>
      <h4>{LABELS[domain]}</h4>
      <p>{shown.question}</p>
      {domain === "ear" && (
        <button className="secondary-action" onClick={replay}>
          Play both note pairs
        </button>
      )}
      {audioRunning && <small role="status">Listen to both pairs before choosing an answer.</small>}
      {audioError && <small role="alert">{audioError}</small>}
      {!record ? (
        <>
          <div className="concept-check-options" role="group" aria-label={`${LABELS[domain]} answer`}>
            {shown.choices.map((choice) => (
              <label key={choice}>
                <input
                  type="radio"
                  name={`placement-${domain}`}
                  checked={response === choice}
                  disabled={domain === "ear" && !played}
                  onChange={() => setResponse(choice)}
                />
                {choice}
              </label>
            ))}
          </div>
          <button className="text-action" disabled={usedHint} onClick={() => setUsedHint(true)}>
            {usedHint ? "Hint used" : "Give me a hint"}
          </button>
          {usedHint && <p>{shown.hint}</p>}
          <button className="primary-action" disabled={!response || (domain === "ear" && !played)} onClick={submit}>
            Check this answer
          </button>
        </>
      ) : (
        <div className="concept-result" role="status">
          <strong>
            {record.outcome === "successful" ? "Correct on this question" : "Not this time"}
            {usedHint ? " · with a hint" : ""}
          </strong>
          <p>{shown.explanation}</p>
          <RecordSaveStatus evidenceIds={[record.id]} />
          <button className="secondary-action" onClick={another}>
            Try a different example
          </button>
        </div>
      )}
    </section>
  );
}

export function PlacementSampler({
  selectedBaseline,
  onChoose,
  showChoices = false,
}: {
  selectedBaseline: LearnerSettings["startingBaseline"];
  onChoose: (baseline: LearnerSettings["startingBaseline"]) => void;
  showChoices?: boolean;
}) {
  const { state } = useV8Store();
  const results = placementResults(state.evidence);
  const suggestion = placementSuggestion(state.evidence);
  const sampled = Object.values(results).some((result) => result !== "not-sampled");
  useEffect(() => () => stopAudio(), []);
  return (
    <details className="placement-sampler card">
      <summary>
        <strong>Try a short starting-point sample</strong>
        <span>Optional · guitar-free questions are available</span>
      </summary>
      <div className="placement-content">
        <p>
          Each area stands on its own. You can skip any sample, especially the guitar one. A checked answer establishes
          only that answer; your pulse and note control remain your own reports.
        </p>
        <div className="placement-results" aria-label="Starting-point samples">
          {(["pulse", "sound", "ear", "fretboard", "chord"] as const).map((domain) => (
            <div key={domain}>
              <strong>{LABELS[domain]}</strong>
              <small>{RESULT_TEXT[results[domain]]}</small>
            </div>
          ))}
        </div>
        <PhysicalSample domain="pulse" />
        <PhysicalSample domain="sound" />
        <CheckedSample domain="ear" />
        <CheckedSample domain="fretboard" />
        <CheckedSample domain="chord" />
        {sampled && (
          <section className="placement-suggestion" aria-label="Suggested starting point">
            <h4>Suggested start: {suggestion.baseline === "some" ? "Unit 3" : "Unit 1"}</h4>
            <p>{suggestion.reason}</p>
            <p>
              The ear, fretboard and chord answers show separate places to practise; one question in each cannot
              establish broad skill. Unit 7 remains your choice, not an automatic result of this sample.
            </p>
            {suggestion.nextActions.length > 0 && (
              <ul>
                {suggestion.nextActions.map((action) => (
                  <li key={action}>{action}</li>
                ))}
              </ul>
            )}
            <button
              className="secondary-action"
              disabled={selectedBaseline === suggestion.baseline}
              onClick={() => onChoose(suggestion.baseline)}
            >
              {selectedBaseline === suggestion.baseline ? "Suggested start selected" : "Use this suggested start"}
            </button>
          </section>
        )}
        {showChoices && (
          <div className="placement-manual" role="group" aria-label="Choose a starting unit">
            <p>
              You can choose a different starting point. Changing it creates a new session plan; it does not delete
              earlier work or mark skipped units mastered.
            </p>
            {(
              [
                ["repair", "Start at Unit 1"],
                ["some", "Start at Unit 3"],
                ["secure", "Start at Unit 7"],
              ] as const
            ).map(([baseline, label]) => (
              <button
                key={baseline}
                className="secondary-action"
                aria-pressed={selectedBaseline === baseline}
                onClick={() => onChoose(baseline)}
              >
                {label}
              </button>
            ))}
          </div>
        )}
      </div>
    </details>
  );
}
