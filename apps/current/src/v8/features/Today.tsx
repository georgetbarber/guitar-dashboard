import { useEffect } from "react";
import { buildReturnSession, buildSession, daysSinceLastAttempt, liveObservations, nextUnit, pathSummary, sessionActivityComplete, unitProgress } from "../learning";
import { activityById, CURRICULUM, STAGES } from "../curriculum";
import { pilotCapabilitySnapshots } from "../capabilities";
import { useV8Store } from "../store";

export function Today() {
  const { state, dispatch, navigate } = useV8Store();
  const session = state.sessionPlan ?? buildSession(state);
  useEffect(() => {
    if (!state.sessionPlan) dispatch({ type: "beginSession", plan: session });
  }, [dispatch, session, state.sessionPlan]);
  const awayDays = daysSinceLastAttempt(state);
  const unit = nextUnit(state);
  const stage = STAGES[unit.stage - 1];
  const unitsInStage = CURRICULUM.filter((candidate) => candidate.stage === unit.stage);
  const unitPosition = unitsInStage.findIndex((candidate) => candidate.id === unit.id) + 1;
  const summary = pathSummary(state);
  const currentProject = state.sketches.find((sketch) => sketch.id === state.activeSketchId) ?? state.sketches.at(-1);
  const firstUnfinished = session.items.find((item) => !sessionActivityComplete(state, session, item.activityId));
  const first = firstUnfinished ?? session.items[0];
  const sessionComplete = !firstUnfinished;
  const sessionReports = liveObservations(state.evidence).filter((item) =>
    item.occurredAt >= session.generatedAt && session.items.some((part) => part.activityId === item.activityId));
  const reportedAttempts = new Set(sessionReports.map((item) => `${item.activityId}|${item.occurredAt}`)).size;
  const favorites = (state.favoriteActivityIds ?? []).map(activityById).filter((item) => item !== null);
  const pilotCapabilities = pilotCapabilitySnapshots(state);
  return (
    <div className="page-stack today-page">
      <section className="today-focus">
        <div className="today-copy">
          <span className="eyebrow">Learn · {session.totalMinutes}-minute {session.kind === "return" ? "return" : "guided"} session</span>
          <h1>Turn one relationship into music.</h1>
          <p>{session.purpose}</p>
          <label className="personal-goal">My musical goal
            <input maxLength={160} value={state.personalGoal ?? ""} onChange={(event) => dispatch({ type: "setPersonalGoal", goal: event.target.value })} placeholder="For example, make the rests in my rhythm feel deliberate" />
          </label>
          <div className="course-location" aria-label="Current course location">
            <div><small>Stage {unit.stage} of {STAGES.length}</small><strong>{stage.title}</strong></div>
            <i aria-hidden="true">→</i>
            <div><small>Current unit · {unitPosition} of {unitsInStage.length}</small><strong>{unit.title}</strong></div>
            <button className="text-action" onClick={() => navigate("path")}>View Course map</button>
          </div>
          <div className="today-meta"><span>{state.settings.instrument}</span><span>{state.settings.tonicName} {state.settings.mode}</span></div>
          {sessionComplete
            ? <button className="primary-action large" onClick={() => dispatch({ type: "beginSession", plan: buildSession(state) })}>Start another guided session</button>
            : <button className="primary-action large" onClick={() => dispatch({ type: "openActivity", activityId: first.activityId })}>Start with: {first.title}</button>}
          {awayDays !== null && awayDays >= 3 && <button className="text-action" onClick={() => dispatch({ type: "beginSession", plan: buildReturnSession(state) })}>Take a shorter return session · 10–15 min</button>}
          {session.kind !== "return" && session.totalMinutes !== state.settings.dailyMinutes && <button className="text-action" onClick={() => dispatch({ type: "beginSession", plan: buildSession(state) })}>Plan a new {state.settings.dailyMinutes}-minute session</button>}
          {unit.id === "unit-01" && <button className="secondary-action large" onClick={() => dispatch({ type: "openActivity", activityId: "unit-01-rhythm" })}>
            {state.pilotCursor ? "Continue the one-note lesson" : "Start the one-note lesson"}
          </button>}
        </div>
        <div className="session-destination"><span>Today’s music</span><strong>{unit.microStudy.title}</strong><small>{unit.microStudy.tempo} BPM · {unit.microStudy.metre}</small></div>
      </section>

      {sessionComplete && <section className="card session-ending"><span className="eyebrow">Session finished · on your report</span><h2>You worked through this music.</h2><p>You reported {reportedAttempts} attempt{reportedAttempts === 1 ? "" : "s"} across {session.items.length} activities. This records your own observations; it does not claim to have heard or graded your playing.</p><p>Next useful step: repeat one phrase after a break, then try changing just one thing in Free Play.</p><button className="secondary-action" onClick={() => navigate("play")}>Try a Free Play variation</button></section>}
      {unit.id === "unit-01" && <section className="card pilot-capabilities"><span className="eyebrow">What this lesson can show</span><h2>One phrase, several different skills.</h2><p>The whole-phrase check is your report. It does not separately test your hearing, naming or fretboard location, and it does not measure your playing.</p><ul>{pilotCapabilities.map(({ capability, latestReport, status }) => <li key={capability.id}><strong>{capability.title}</strong><small>{capability.action} · {status === "not-checked" ? "No separate check yet" : `${latestReport?.outcome.replace("retry", "needs another pass")} reported for the full phrase on ${latestReport?.localDate ?? latestReport?.occurredAt.slice(0, 10)}`}</small></li>)}</ul></section>}
      <section className="session-plan card">
        <header><div><span className="eyebrow">{session.kind === "return" ? "Short return" : "Guided session"}</span><h2>{session.title}</h2></div><strong>{session.totalMinutes} min guidance</strong></header>
        <ol>
          {session.items.map((item, index) => {
            const complete = sessionActivityComplete(state, session, item.activityId);
            return <li className={complete ? "is-complete" : ""} key={`${item.activityId}-${index}`}><button onClick={() => dispatch({ type: "openActivity", activityId: item.activityId })}><span>{complete ? "✓" : index + 1}</span><div><strong>{item.title}</strong><small>{item.purpose}</small></div><b>{item.minutes}m</b></button></li>;
          })}
        </ol>
      </section>

      {favorites.length > 0 && <section className="card familiar-favorites"><span className="eyebrow">Familiar favourites</span><h2>Return to a sound you chose.</h2><p>These are quick ways back into music; opening one does not mark it complete.</p><div className="action-row">{favorites.slice(0, 4).map((activity) => <button className="secondary-action" key={activity.id} onClick={() => dispatch({ type: "openActivity", activityId: activity.id })}>{activity.title}</button>)}</div>{favorites.length > 4 && <details><summary>Show {favorites.length - 4} more favourites</summary><div className="action-row">{favorites.slice(4).map((activity) => <button className="secondary-action" key={activity.id} onClick={() => dispatch({ type: "openActivity", activityId: activity.id })}>{activity.title}</button>)}</div></details>}</section>}

      <div className="today-lower">
        <section className="card free-play-glance">
          <span className="eyebrow">Play without planning</span>
          <h2>One prompt. Guitar in hand.</h2>
          <p>Follow short chord, riff, scale-degree and groove actions drawn from relationships you have already met. No score and no setup.</p>
          <button className="primary-action" onClick={() => navigate("play")}>Open Free Play</button>
        </section>
        <section className="card project-glance">
          <span className="eyebrow">Current creative work</span>
          {currentProject ? <><h2>{currentProject.name}</h2><p>{currentProject.intention}</p><div className="workflow-mini"><span>{currentProject.status}</span><span>{currentProject.revisions.length} revisions</span><span>{currentProject.takes.length} takes</span></div><button className="secondary-action" onClick={() => { dispatch({ type: "setActiveSketch", id: currentProject.id }); navigate("create"); }}>Continue the sketch</button></> : <><h2>Your first musical sketch</h2><p>Capture two bars before they feel finished. Understanding can follow the sound.</p><button className="secondary-action" onClick={() => dispatch({ type: "createSketch" })}>Create a sketch</button></>}
        </section>
        <section className="card reflection-glance">
          <span className="eyebrow">Learning evidence</span>
          <h2>{summary.completedUnits} of {summary.totalUnits} units complete · {unitProgress(state, unit.id)}% of this unit</h2>
          <p>{state.lastReflection || "After today’s playing, record one specific observation about sound, time, movement or intention."}</p>
          <div className="artifact-stats"><span><strong>{summary.created}</strong> created</span><span><strong>{summary.revised}</strong> revised</span><span><strong>{summary.finished}</strong> finished</span></div>
        </section>
      </div>
    </div>
  );
}
