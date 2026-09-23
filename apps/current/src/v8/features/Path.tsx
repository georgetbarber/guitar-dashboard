import { CURRICULUM, STAGES } from "../curriculum";
import { nextUnit, unitProgress } from "../learning";
import { useV8Store } from "../store";
import type { ActivityKind, CurriculumUnit } from "../types";
import { OfflineLessonStatus } from "../components/OfflineLessonStatus";

const ACTIVITY_LABELS: Record<ActivityKind, string> = {
  "listen-compare": "Listen",
  "sing-predict": "Predict",
  technique: "Play",
  rhythm: "Keep time",
  relationship: "Understand",
  "play-reveal": "Play",
  variation: "Vary",
  creative: "Create",
  transfer: "Transfer",
  reflection: "Reflect"
};

export function Path() {
  const { state, dispatch } = useV8Store();
  const active = CURRICULUM.find((unit) => unit.id === state.activeUnitId) ?? CURRICULUM[0];
  const current = nextUnit(state);
  const isLocked = (unit: CurriculumUnit) => unit.order > current.order + 1
    && unit.prerequisiteIds.some((id) => unitProgress(state, id) < 100);
  const blockerFor = (unit: CurriculumUnit) => unit.prerequisiteIds
    .map((id) => CURRICULUM.find((candidate) => candidate.id === id))
    .find((candidate) => candidate && unitProgress(state, candidate.id) < 100);
  const activeLocked = isLocked(active);
  const activeBlocker = blockerFor(active);

  return (
    <div className="page-stack">
      <header className="page-header"><div><span className="eyebrow">Learn · Course map</span><h1>See how your learning connects.</h1><p>Eight stages contain forty-eight units. Each unit develops one musical outcome through short listening, playing, understanding, creative and reflective activities. Dates never gate your progress.</p></div><div className="path-total"><strong>{CURRICULUM.filter((unit) => unitProgress(state, unit.id) === 100).length}</strong><span>of 48 units</span></div></header>
      <div className="path-layout">
        <nav className="stage-list card" aria-label="Curriculum stages">
          <header><strong>Stages</strong><small>Choose a chapter to see its units.</small></header>
          {STAGES.map((stage, index) => {
            const stageNumber = index + 1;
            const units = CURRICULUM.filter((unit) => unit.stage === stageNumber);
            const progress = Math.round(units.reduce((sum, unit) => sum + unitProgress(state, unit.id), 0) / units.length);
            const status = progress === 100 ? "Complete" : current.stage === stageNumber ? "Current" : progress > 0 ? `${progress}%` : stageNumber < current.stage ? "Available" : "Later";
            return <button className={active.stage === stageNumber ? "is-active" : ""} key={stage.title} onClick={() => dispatch({ type: "openUnit", unitId: units.find((unit) => unitProgress(state, unit.id) < 100)?.id ?? units[0].id })}><span className="stage-order">Stage {stageNumber}</span><div><strong>{stage.title}</strong><small>{stage.purpose}</small></div><b>{status}</b></button>;
          })}
        </nav>
        <section className="unit-stage">
          <header><span className="eyebrow">Stage {active.stage} of {STAGES.length}</span><h2>{STAGES[active.stage - 1].title}</h2><p>{STAGES[active.stage - 1].purpose}</p></header>
          <div className="unit-grid">
            {CURRICULUM.filter((unit) => unit.stage === active.stage).map((unit) => {
              const progress = unitProgress(state, unit.id);
              const locked = isLocked(unit);
              const blocker = blockerFor(unit);
              const status = progress === 100 ? "Complete" : unit.id === current.id ? "Current" : progress > 0 ? "In progress" : locked ? "Later" : unit.order === current.order + 1 ? "Up next" : "Available";
              return <article className={`unit-card card ${unit.id === active.id ? "is-active" : ""} ${locked ? "is-locked" : ""}`} key={unit.id}><div className="unit-status"><span>{status}</span><i style={{ "--progress": `${progress}%` } as React.CSSProperties} /></div><h3>{unit.title}</h3><p>{unit.outcome}</p><div className="competency-tags">{unit.competencyIds.map((id) => <span key={id}>{id.split(":")[0]}</span>)}</div><button disabled={locked} className="secondary-action" title={blocker ? `Available after “${blocker.title}”` : undefined} onClick={() => dispatch({ type: "openUnit", unitId: unit.id })}>{locked ? "Later in the course" : progress ? "Continue unit" : "Open unit"}</button>{locked && blocker && <small className="lock-note">Available after “{blocker.title}”</small>}</article>;
            })}
          </div>
          {activeLocked
            ? <section className="unit-detail locked-unit-detail card">
                <header><div><span className="eyebrow">Later in the course</span><h2>{active.title}</h2><p>{active.outcome}</p></div><strong>Preview only</strong></header>
                <div className="locked-unit-summary"><p>{activeBlocker ? <>This unit becomes available after <strong>“{activeBlocker.title}”</strong>. Its activities stay folded away until then, so your current learning remains clear.</> : "This unit’s activities are not available yet."}</p><button className="primary-action" onClick={() => dispatch({ type: "openUnit", unitId: current.id })}>Return to current unit</button></div>
              </section>
            : <section className="unit-detail card">
                <header><div><span className="eyebrow">{active.id === current.id ? "Current unit" : "Selected unit"} · {unitProgress(state, active.id)}% complete</span><h2>{active.title}</h2><p>{active.outcome}</p></div><strong>{active.activities.length} activities</strong></header>
                <OfflineLessonStatus />
                <ol className="activity-list">{active.activities.map((activity) => {
                  const complete = state.completedActivityIds.includes(activity.id);
                  const label = ACTIVITY_LABELS[activity.kind];
                  return <li className={complete ? "is-complete" : ""} key={activity.id}><button onClick={() => dispatch({ type: "openActivity", activityId: activity.id })}><span>{complete ? `✓ ${label}` : label}</span><div><strong>{activity.title}</strong><small>{activity.minutes} min</small></div><b>Open</b></button></li>;
                })}</ol>
              </section>}
        </section>
      </div>
    </div>
  );
}
