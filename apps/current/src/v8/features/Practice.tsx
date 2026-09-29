import { useMemo, useState } from "react";
import { ACTIVITIES, STAGES, unitById } from "../curriculum";
import { liveObservations, masteryFor, masteryNextStep, nextUnit, recommendPractice, recommendedPracticeStrand, repairFor } from "../learning";
import { useV8Store } from "../store";
import { COMPETENCY_STRANDS } from "../types";
import type { ActivityDefinition, CompetencyStrand, MasteryState, V8State } from "../types";
import { ConceptChecks } from "../components/ConceptChecks";

interface SkillFocus {
  strand: CompetencyStrand;
  title: string;
  purpose: string;
}

const SKILL_FOCUSES: SkillFocus[] = [
  { strand: "sound", title: "Tone control", purpose: "Attack, release, muting, touch and relaxed movement." },
  { strand: "rhythm", title: "Timing and groove", purpose: "Pulse, subdivisions, rests, accents and changes." },
  { strand: "fretboard", title: "Neck navigation", purpose: "Landmarks, intervals and movable physical structures." },
  { strand: "ear", title: "Ear to hand", purpose: "Predict, sing, imitate and locate before naming." },
  { strand: "melody", title: "Melody and phrasing", purpose: "Contour, destination, articulation and variation." },
  { strand: "harmony", title: "Harmony", purpose: "Chord tones, movement, function and connected voices." },
  { strand: "composition", title: "Composition", purpose: "Develop, arrange and preserve musical choices." },
  { strand: "reflection", title: "Reflection and transfer", purpose: "Review evidence and move learning into a new context." }
];

const MASTERY_RANK: Record<MasteryState, number> = { introduced: 0, practising: 1, secure: 2, "transfer-ready": 3 };

function skillEvidence(strand: CompetencyStrand, state: V8State) {
  const evidence = liveObservations(state.evidence).filter((item) => item.competencyId.startsWith(`${strand}:`));
  const competencyIds = [...new Set(evidence.map((item) => item.competencyId))];
  const weakest = competencyIds.map((id) => masteryFor(id, state.evidence)).sort((a, b) => MASTERY_RANK[a.state] - MASTERY_RANK[b.state])[0];
  return { observations: evidence.length, state: weakest?.state };
}

function recommendationReason(activity: ActivityDefinition, strand: CompetencyStrand, state: V8State): string {
  const competencyIds = activity.competencyIds.filter((id) => id.startsWith(`${strand}:`));
  const evidence = liveObservations(state.evidence).filter((item) => competencyIds.includes(item.competencyId));
  const attempts = (items: typeof evidence) => new Set(items.map((item) => `${item.activityId}|${item.occurredAt}`)).size;
  const retries = attempts(evidence.filter((item) => item.outcome !== "successful"));
  const assisted = attempts(evidence.filter((item) => item.assistance !== "none"));
  const weakest = competencyIds.map((id) => masteryFor(id, state.evidence)).sort((a, b) => MASTERY_RANK[a.state] - MASTERY_RANK[b.state])[0];
  if (retries) return `${retries} attempt${retries === 1 ? " was" : "s were"} reported as partial or needing another pass. Try a smaller version before returning to this music.`;
  if (assisted) return `${assisted} assisted attempt${assisted === 1 ? " was" : "s were"} reported. Try the same relationship after hiding the help.`;
  if (weakest?.state === "secure") return "This skill is secure in one context but has not yet transferred. Revisit it here before moving it to a new key, region or tempo.";
  if (weakest?.state === "transfer-ready") return "This relationship is already transfer-ready. The suggestion keeps it active without introducing material from later in the course.";
  return "This is a relationship you have already encountered. Your reports show practice, not a verified skill check.";
}

export function Practice() {
  const { state, dispatch, navigate } = useV8Store();
  const recommendedStrand = recommendedPracticeStrand(state);
  const [mode, setMode] = useState<CompetencyStrand>(() => recommendedStrand ?? "sound");
  const selected = SKILL_FOCUSES.find((item) => item.strand === mode) ?? SKILL_FOCUSES[0];
  const current = nextUnit(state);
  const observations = useMemo(() => liveObservations(state.evidence).filter((item) =>
    COMPETENCY_STRANDS.some((strand) => item.competencyId.startsWith(`${strand}:`))), [state.evidence]);
  const observedCompetencyIds = useMemo(() => new Set(observations.map((item) => item.competencyId)), [observations]);
  const available = useMemo(() => ACTIVITIES.filter((activity) => {
    const unit = unitById(activity.unitId);
    return unit.order <= current.order + 1 && activity.competencyIds.some((id) => id.startsWith(`${selected.strand}:`) && observedCompetencyIds.has(id));
  }), [current.order, observedCompetencyIds, selected.strand]);
  const next = recommendPractice(available, state, [selected.strand]);
  const recommendationUnit = next ? unitById(next.unitId) : null;
  const competencyIds = [...new Set(observations.map((item) => item.competencyId))];
  const mastery = competencyIds.map((id) => masteryFor(id, state.evidence));

  return (
    <div className="page-stack">
      <header className="page-header compact"><div><span className="eyebrow">Learn · Strengthen</span><h1>Strengthen what your attempts suggest.</h1><p>Playing suggestions use relationships you have already encountered. They respond to the results you reported, including where help was used; they are not a judgement of your playing.</p></div></header>
      <ConceptChecks />

      {!observations.length
        ? <section className="strengthen-empty card"><div><span className="eyebrow">No playing-practice report yet</span><h2>Nothing to strengthen from playing yet.</h2><p>Complete your first musical attempt in Continue. A correct on-screen theory answer remains separate from what happened on the guitar.</p></div><button className="primary-action" onClick={() => navigate("today")}>Go to Continue</button></section>
        : <>
            <div className="practice-section-heading"><div><span className="eyebrow">Choose a skill</span><h2>Review by musical ability, not lesson category.</h2></div><p>The suggested focus is selected automatically; you can choose another skill whenever you have evidence for it.</p></div>
            <section className="practice-modes" aria-label="Skill focuses">
              {SKILL_FOCUSES.map((item) => {
                const summary = skillEvidence(item.strand, state);
                const suggested = item.strand === recommendedStrand;
                return <button className={mode === item.strand ? "is-active" : ""} onClick={() => setMode(item.strand)} key={item.strand}><span>{item.title}</span><small>{item.purpose}</small><b>{suggested ? "Suggested · " : ""}{summary.observations ? `${summary.observations} observations · ${summary.state?.replace("-", " ")}` : "No evidence yet"}</b></button>;
              })}
            </section>

            {next && recommendationUnit
              ? <section className="practice-focus card">
                  <div><span className="eyebrow">Suggestion from your reports · {selected.title}</span><h2>{next.title}</h2><small className="recommendation-context">Stage {recommendationUnit.stage} · {STAGES[recommendationUnit.stage - 1].title} → {recommendationUnit.title}</small><p className="recommendation-reason"><strong>Why this now:</strong> {recommendationReason(next, selected.strand, state)}</p>{repairFor(next, state.evidence) && <p className="recommendation-reason"><strong>Change the task:</strong> {repairFor(next, state.evidence)}</p>}<p>{next.why}</p><div className="competency-tags">{next.competencyIds.map((id) => <span key={id}>{id.split(":")[0]}</span>)}</div></div>
                  <button className="primary-action" onClick={() => dispatch({ type: "openActivity", activityId: next.id })}>Start strengthening</button>
                </section>
              : <section className="practice-focus card"><div><span className="eyebrow">No available evidence · {selected.title}</span><h2>Meet this skill in Continue first.</h2><p>Strengthen does not pull in unseen or later-course activities. Once you attempt this skill in your guided learning, its evidence-led review will appear here.</p></div><button className="primary-action" onClick={() => navigate("today")}>Go to Continue</button></section>}

            <section className="evidence-panel card">
              <header><div><span className="eyebrow">Reports behind the suggestions</span><h2>Your developing relationships</h2></div><span>{observations.length} observations</span></header>
              <div className="mastery-grid">{mastery.slice(-12).map((item) => <article key={item.competencyId}><strong>{item.competencyId.split(":")[0]}</strong><span className={`mastery-state state-${item.state}`}>{item.state.replace("-", " ")}</span><small>{item.reportedSuccessDays} day{item.reportedSuccessDays === 1 ? "" : "s"} with an unaided success reported</small>{item.lastAttemptAt && <small>Last attempt: {item.lastAttemptLocalDate ?? item.lastAttemptAt.slice(0, 10)}</small>}{item.assistedAttempts > 0 && <small>{item.assistedAttempts} assisted observation{item.assistedAttempts === 1 ? "" : "s"} kept separate</small>}<small className="mastery-next">{masteryNextStep(item)}</small></article>)}</div>
            </section>
          </>}
    </div>
  );
}
