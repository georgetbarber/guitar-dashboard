import { useState } from "react";
import {
  CONCEPT_KINDS,
  conceptCheckById,
  conceptProgress,
  dueConceptKind,
  nextConceptCheck,
  recordConceptAnswer,
} from "../conceptChecks";
import type { ConceptKind } from "../conceptChecks";
import { retractObservations } from "../learning";
import { useV8Store } from "../store";
import type { CompetencyEvidence } from "../types";
import { RecordSaveStatus } from "./SaveStatus";

const LABELS: Record<ConceptKind, string> = {
  interval: "Interval",
  degree: "Scale degree",
  "chord-tone": "Chord tone",
  "roman-numeral": "Roman numeral",
};

export function ConceptChecks() {
  const { state, dispatch } = useV8Store();
  const [expanded, setExpanded] = useState(() => Boolean(dueConceptKind(state.evidence)));
  const [kind, setKind] = useState<ConceptKind>(() => dueConceptKind(state.evidence) ?? "interval");
  const [checkId, setCheckId] = useState(() => nextConceptCheck(kind, state.evidence).id);
  const [response, setResponse] = useState("");
  const [usedHint, setUsedHint] = useState(false);
  const [record, setRecord] = useState<CompetencyEvidence | null>(null);
  const check = conceptCheckById(checkId)!;
  const progress = conceptProgress(kind, state.evidence);

  const chooseKind = (next: ConceptKind) => {
    setKind(next);
    setCheckId(nextConceptCheck(next, state.evidence).id);
    setResponse("");
    setUsedHint(false);
    setRecord(null);
  };
  const another = () => {
    setCheckId(nextConceptCheck(kind, state.evidence).id);
    setResponse("");
    setUsedHint(false);
    setRecord(null);
  };
  const submit = () => {
    if (!response || record) return;
    const observation = recordConceptAnswer(check, response, usedHint);
    dispatch({ type: "recordActivity", activityId: observation.activityId, evidence: [observation] });
    setRecord(observation);
  };
  const correctMistap = () => {
    if (!record) return;
    dispatch({ type: "recordActivity", activityId: record.activityId, evidence: retractObservations([record]) });
    setRecord(null);
    setResponse("");
    setUsedHint(false);
  };

  return (
    <details
      className="concept-checks card"
      open={expanded}
      onToggle={(event) => setExpanded(event.currentTarget.open)}
    >
      <summary>
        <span className="eyebrow">Optional understanding check</span>
        <strong>Name one relationship</strong>
      </summary>
      <div className="concept-check-body">
        <p>
          These short questions check an answer on screen. They cannot judge your ear, hands, timing or sound. A later
          example changes the notes or harmony so you can see whether the idea travels.
        </p>
        <div className="concept-check-kinds" role="group" aria-label="Choose a relationship">
          {CONCEPT_KINDS.map((candidate) => (
            <button
              key={candidate}
              className={kind === candidate ? "is-active" : ""}
              aria-pressed={kind === candidate}
              onClick={() => chooseKind(candidate)}
            >
              {LABELS[candidate]}
            </button>
          ))}
        </div>
        <small>
          {progress.recalled
            ? "Correct unaided answers on different days and changed examples are recorded."
            : progress.correctUnaided
              ? "One correct unaided answer is recorded. A changed example on a later day can check recall."
              : "No correct unaided answer recorded for this relationship yet."}
        </small>
        <div className="concept-check-question">
          <strong>{check.question}</strong>
          {!record && (
            <>
              <div className="concept-check-options" role="group" aria-label="Choose your answer">
                {check.choices.map((choice) => (
                  <label key={choice}>
                    <input
                      type="radio"
                      name="concept-answer"
                      checked={response === choice}
                      onChange={() => setResponse(choice)}
                    />
                    {choice}
                  </label>
                ))}
              </div>
              <button className="text-action" disabled={usedHint} onClick={() => setUsedHint(true)}>
                {usedHint ? "Hint used" : "Give me a hint"}
              </button>
              {usedHint && <p className="concept-hint">{check.hint}</p>}
              <button className="primary-action" disabled={!response} onClick={submit}>
                Check my answer
              </button>
            </>
          )}
          {record && (
            <div role="status" className="concept-result">
              <strong>
                {record.outcome === "successful" ? "Correct on this question" : "Not this time"}
                {record.assistance === "hint" ? " · with a hint" : ""}
              </strong>
              <p>{check.explanation}</p>
              <p>
                This checks one named relationship in {check.key} {check.mode}. It does not complete a guitar-playing
                task.
              </p>
              <RecordSaveStatus evidenceIds={[record.id]} />
              <div className="action-row">
                <button className="secondary-action" onClick={another}>
                  Try a changed example
                </button>
                <button className="text-action" onClick={correctMistap}>
                  I tapped the wrong answer
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </details>
  );
}
