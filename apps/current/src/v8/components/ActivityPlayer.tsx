import { useMemo, useState } from "react";
import { playHarmonicRelationship, playMelodicRelationship } from "../../audio/engine";
import { createContext, normalize } from "../../core/music/theory";
import { activityById, unitById, CURRICULUM } from "../curriculum";
import { createEvidence } from "../learning";
import { useV8Store } from "../store";
import type { ActivityDefinition, Assistance, EvidenceOutcome } from "../types";
import { MicroStudy } from "./MicroStudy";
import { RhythmNotation } from "./RhythmNotation";

const OUTCOMES: Array<{ value: EvidenceOutcome; label: string; description: string }> = [
  { value: "retry", label: "Needs another pass", description: "Not yet — I couldn’t do the success action above this time." },
  { value: "partial", label: "Partly there", description: "Some of it worked, but not the whole thing or not reliably." },
  { value: "successful", label: "Successful today", description: "Yes — I did the success action above, deliberately." }
];

const INTERVAL_NAMES = [
  "the home note (tonic) on its own", "a minor 2nd above home", "a major 2nd above home",
  "a minor 3rd above home", "a major 3rd above home", "a perfect 4th above home",
  "a tritone above home", "a perfect 5th above home", "a minor 6th above home",
  "a major 6th above home", "a minor 7th above home", "a major 7th above home"
];

function earCaption(semitones: number, harmonic: boolean): string {
  const name = INTERVAL_NAMES[((semitones % 12) + 12) % 12];
  if (semitones % 12 === 0) return `You should hear ${name}.`;
  return harmonic ? `You should hear home and ${name} sounding together.` : `You should hear home, then ${name}.`;
}

export function ActivityPlayer({ activityId, onClose }: { activityId: string; onClose?: () => void }) {
  const { state, dispatch } = useV8Store();
  const activity = activityById(activityId);
  const [assistance, setAssistance] = useState<Assistance>("none");
  const [hint, setHint] = useState(false);
  const [reveal, setReveal] = useState(false);
  const [reflection, setReflection] = useState("");
  const [attempted, setAttempted] = useState(false);
  const [earIndex, setEarIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [caption, setCaption] = useState<string | null>(null);
  const [justCompleted, setJustCompleted] = useState<EvidenceOutcome | null>(null);
  const unit = useMemo(() => unitById(activity?.unitId ?? state.activeUnitId), [activity?.unitId, state.activeUnitId]);
  if (!activity) return null;
  const originLabel = state.activityOrigin === "practice" ? "Strengthen"
    : state.activityOrigin === "path" ? "Course map"
      : state.activityOrigin === "today" ? "Guided session"
        : state.activityOrigin === "create" ? "Create"
          : state.activityOrigin === "play" ? "Play"
            : state.activityOrigin === "explore" ? "Explore"
              : "Learn";

  const targets = unit.microStudy.earTargets ?? [0];
  const hear = (harmonic = false) => {
    setAttempted(true);
    const tonicPc = createContext(state.settings.tonicName, state.settings.mode).tonic;
    const semitones = targets[earIndex % targets.length];
    setEarIndex((index) => index + 1);
    if (harmonic) playHarmonicRelationship(tonicPc, normalize(tonicPc + semitones));
    else playMelodicRelationship(tonicPc, normalize(tonicPc + semitones));
    setCaption(earCaption(semitones, harmonic));
    setPlaying(true);
    window.setTimeout(() => setPlaying(false), 2200);
  };
  const useHint = () => {
    setHint(true);
    if (assistance === "none") setAssistance("hint");
  };
  const useReveal = () => {
    setReveal(true);
    setAssistance("reveal");
  };
  const complete = (outcome: EvidenceOutcome) => {
    if (!attempted && activity.kind !== "reflection") return;
    if (activity.kind === "reflection" && reflection.trim().length < 8) return;
    const evidence = createEvidence(
      activity.id,
      activity.competencyIds,
      activity.source,
      assistance,
      outcome,
      {
        key: state.settings.tonicName,
        mode: state.settings.mode,
        tempo: unit.microStudy.tempo,
        instrument: state.settings.instrument,
        fretRegion: unit.stage < 3 ? [0, 5] : [0, 12]
      }
    );
    dispatch({ type: "recordActivity", activityId: activity.id, evidence, reflection: reflection.trim() });
    setJustCompleted(outcome);
  };

  const retryCurrentActivity = () => {
    setJustCompleted(null);
    setAssistance("none");
    setHint(false);
    setReveal(false);
    setAttempted(activity.kind === "reflection" && reflection.trim().length >= 8);
    setEarIndex(0);
    setPlaying(false);
    setCaption(null);
  };

  // Find the next unfinished activity in this unit, then in a later unit. The
  // current activity is treated as done only after a successful outcome.
  const nextActivity = (): ActivityDefinition | null => {
    const done = new Set(state.completedActivityIds);
    if (justCompleted === "successful") done.add(activity.id);
    const index = unit.activities.findIndex((item) => item.id === activity.id);
    const inUnit = unit.activities.slice(index + 1).find((item) => !done.has(item.id))
      ?? unit.activities.find((item) => !done.has(item.id));
    if (inUnit) return inUnit;
    const laterUnit = CURRICULUM.find((candidate) => candidate.order > unit.order && candidate.activities.some((item) => !done.has(item.id)));
    return laterUnit?.activities.find((item) => !done.has(item.id)) ?? null;
  };

  const responseGuide = activity.kind === "listen-compare"
    ? "Play the micro-study yourself, then choose the result that honestly describes how controllable and explainable it felt."
    : activity.kind === "sing-predict"
      ? "Make your prediction, play or sing the idea, then choose the result that describes the comparison."
      : activity.kind === "reflection"
        ? "Write a specific observation and next action, then save it below."
        : "Make the musical attempt described above, listen back if useful, then choose the result that best describes it.";

  if (justCompleted) {
    const successful = justCompleted === "successful";
    const next = nextActivity();
    const outcomeLabel = OUTCOMES.find((item) => item.value === justCompleted)?.label ?? "Logged";
    const sameUnit = next && next.unitId === unit.id;
    return (
      <section className="activity-player activity-done" aria-labelledby="activity-title">
        <header className="activity-header">
          <button className="icon-button" onClick={onClose} aria-label="Close activity">←</button>
          <div><span>{originLabel} · {unit.title}</span><h1 id="activity-title">{successful ? "Completed" : "Attempt logged"}: {activity.title}</h1><p>{successful
            ? `Recorded as “${outcomeLabel}”. This activity is complete; independent mastery still depends on unassisted success across days and contexts.`
            : `Recorded as “${outcomeLabel}”. The evidence is saved, but this activity remains in your guided path until its success action is achieved.`}</p></div>
        </header>
        <div className="done-panel card">
          <span className="done-check" aria-hidden="true">{successful ? "✓" : "↻"}</span>
          {!successful
            ? <>
                <h2>This stays in your path.</h2>
                <p>A partial or unsuccessful attempt is useful evidence, not completion. Simplify the task, use help if useful, and make another deliberate attempt.</p>
                <div className="done-actions">
                  <button className="primary-action large" onClick={retryCurrentActivity}>Try this activity again</button>
                  <button className="text-action" onClick={onClose}>Stop here for now</button>
                </div>
              </>
            : next
            ? <>
                <h2>Keep the momentum going</h2>
                <p>{sameUnit ? "Next in this unit:" : "You’ve finished this unit — next up:"} <strong>{next.title}</strong> <small>({next.kind.replaceAll("-", " ")} · {next.minutes} min)</small></p>
                <div className="done-actions">
                  <button className="primary-action large" onClick={() => dispatch({ type: "openActivity", activityId: next.id })}>Continue to next →</button>
                  <button className="text-action" onClick={onClose}>Stop here for now</button>
                </div>
              </>
            : <>
                <h2>That’s everything available for now</h2>
                <p>You’ve completed every activity currently unlocked. Take a break, or explore what you’ve built.</p>
                <div className="done-actions"><button className="primary-action" onClick={onClose}>Back to my learning</button></div>
              </>}
        </div>
      </section>
    );
  }

  return (
    <section className="activity-player" aria-labelledby="activity-title">
      <header className="activity-header">
        <button className="icon-button" onClick={onClose} aria-label="Close activity">←</button>
        <div><span>{originLabel} · {unit.title} · {activity.minutes} minutes</span><h1 id="activity-title">{activity.title}</h1><p>{activity.why}</p></div>
      </header>

      <div className="activity-grid">
        <article className="activity-main card">
          <span className="activity-kind">{activity.kind.replaceAll("-", " ")}</span>
          <h2>{activity.instruction}</h2>
          <p className="activity-prompt">{activity.prompt}</p>
          <aside className="response-guide">
            <strong>How to answer</strong>
            <p>{responseGuide}</p>
            <small>This is a practice task, not a hidden right-or-wrong quiz. Your answer is the result you report after trying it.</small>
          </aside>
          <aside className="do-now">
            <strong>Do this now</strong>
            <p>{activity.action}</p>
          </aside>
          <MicroStudy study={unit.microStudy} />
          {activity.kind === "rhythm" && <RhythmNotation pattern={unit.microStudy.rhythm} metre={unit.microStudy.metre} />}
          {["listen-compare", "sing-predict", "relationship"].includes(activity.kind) && (
            <div className="action-row">
              <button className="primary-action" onClick={() => hear(false)}>{targets.length === 1 && targets[0] === 0 ? "Hear the tonic reference" : "Hear reference and target"}</button>
              {!(targets.length === 1 && targets[0] === 0) && <button className="secondary-action" onClick={() => hear(true)}>Hear together</button>}
            </div>
          )}
          {["listen-compare", "sing-predict", "relationship"].includes(activity.kind) && (
            <div className={`audio-feedback ${playing ? "is-playing" : ""}`} role="status" aria-live="polite">
              <span className="audio-dot" aria-hidden="true">♪</span>
              <p>{caption ?? "Tap the button above to hear it. No sound? Check your volume and that the device isn’t muted, then tap again."}</p>
            </div>
          )}
          {["technique", "rhythm", "variation", "transfer"].includes(activity.kind) && (
            <button className={`attempt-pad ${attempted ? "is-done" : ""}`} onClick={() => setAttempted(true)}>
              <strong>{attempted ? "Attempt recorded" : "Play the task now"}</strong>
              <span>{attempted ? "Listen to the result before assessing it." : "Tap after you have made a deliberate attempt on the guitar."}</span>
            </button>
          )}
          {activity.kind === "creative" && (
            <div className="creative-bridge">
              <div><strong>Make two to four bars</strong><span>Capture the idea in the Sketchbook, then return here to describe the result.</span></div>
              <button className="secondary-action" onClick={() => { dispatch({ type: "createSketch" }); dispatch({ type: "suspendActivity", route: "create" }); history.pushState({}, "", "/create"); }}>Open a new sketch</button>
              <button className="text-action" onClick={() => setAttempted(true)}>I captured the idea</button>
            </div>
          )}
          {activity.kind === "reflection" && (
            <label className="reflection-field">What changed, what remains uncertain, and what will you keep?
              <textarea value={reflection} onChange={(event) => { setReflection(event.target.value); setAttempted(event.target.value.trim().length >= 8); }} placeholder="Be specific about sound, timing, movement or intention…" />
            </label>
          )}
          <div className="help-actions">
            <button onClick={useHint}>Use a hint</button>
            <button onClick={useReveal}>Reveal the reference</button>
          </div>
          <small className="help-note">Using help is completely fine. It's still recorded — but an attempt with a hint or reveal is kept separate and doesn't count toward “Secure”, so your independent progress stays honest.</small>
          {hint && <aside className="guidance"><strong>Hint</strong><p>{activity.hint}</p></aside>}
          {reveal && <aside className="guidance reveal"><strong>Reference, not a shortcut</strong><p>{activity.reveal}</p></aside>}
        </article>

        <aside className="activity-check card">
          <span>How did it go?</span>
          <div className="success-criterion"><small>You’ve succeeded when</small><p>{activity.observable}</p></div>
          <div className="assistance-state"><small>Evidence status</small><strong>{assistance === "none" ? "Independent attempt" : `${assistance} used`}</strong></div>
          <p className="outcome-lead">Pick the option that matches what just happened:</p>
          <div className="outcome-buttons">
            {OUTCOMES.map((outcome) => (
              <button disabled={!attempted} onClick={() => complete(outcome.value)} key={outcome.value}>
                <strong>{outcome.label}</strong><span>{outcome.description}</span>
              </button>
            ))}
          </div>
          {!attempted && <small>Make the attempt first; these are your answer choices.</small>}
        </aside>
      </div>
    </section>
  );
}
