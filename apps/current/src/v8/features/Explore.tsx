import { useEffect, useMemo, useState } from "react";
import { playChord, playRelationship } from "../../audio/engine";
import { Fretboard } from "../../components/Fretboard";
import { assessFingering } from "../../core/instrument/fingering";
import { analyzeChromaticPitch } from "../../core/music/chromatic";
import { buildChords, buildScale, createContext, normalize, noteName } from "../../core/music/theory";
import { generateShapes } from "../../core/instrument/guitar";
import type { PitchClass } from "../../core/music/types";
import { GLOSSARY } from "../glossary";
import { MODE_OPTIONS, TONAL_ROOTS } from "../validation";
import { useV8Store } from "../store";
import { PilotExploreContext } from "../components/PilotExploreContext";

export function Explore() {
  const { state } = useV8Store();
  const [localKey, setLocalKey] = useState(state.exploreFocus ? "E" : state.settings.tonicName);
  const [localMode, setLocalMode] = useState(state.exploreFocus ? "major" : state.settings.mode);
  const [selectedPitch, setSelectedPitch] = useState<PitchClass>(0);
  const [chordDegree, setChordDegree] = useState(1);
  const [nextPitch, setNextPitch] = useState<PitchClass | undefined>(undefined);
  const [sevenths, setSevenths] = useState(false);
  const context = useMemo(() => createContext(localKey, localMode), [localKey, localMode]);
  const scale = useMemo(() => buildScale(context), [context]);
  const chords = useMemo(() => buildChords(context, sevenths), [context, sevenths]);
  const chord = chords.find((item) => item.degree === chordDegree) ?? chords[0];
  useEffect(() => {
    if (!chords.some((item) => item.degree === chordDegree)) setChordDegree(1);
  }, [chords]); // chordDegree deliberately omitted; reset only when the chord collection changes.
  useEffect(() => {
    if (state.exploreFocus) { setLocalKey("E"); setLocalMode("major"); setSelectedPitch(4); }
  }, [state.exploreFocus?.openedAt]);
  const shape = generateShapes(chord)[0];
  const fingering = shape ? assessFingering(shape) : null;
  const chromatic = analyzeChromaticPitch(context, selectedPitch, nextPitch);
  return (
    <div className="page-stack">
      <PilotExploreContext />
      <header className="page-header compact"><div><span className="eyebrow">Relationship explorer</span><h1>Use theory as a reference, not a fence.</h1><p>Start from a sound, pitch, chord or physical location. Several meanings can remain visible when the musical context is genuinely ambiguous.</p></div><div className="context-controls"><label>Key<select value={localKey} onChange={(event) => setLocalKey(event.target.value)}>{TONAL_ROOTS.map((root) => <option key={root}>{root}</option>)}</select></label><label>Mode<select value={localMode} onChange={(event) => setLocalMode(event.target.value as typeof localMode)}>{MODE_OPTIONS.map(([id, label]) => <option value={id} key={id}>{label}</option>)}</select></label><label className="toggle"><input type="checkbox" checked={sevenths} onChange={() => setSevenths(!sevenths)} />Add sevenths</label></div></header>
      <section className="relationship-ribbon card"><span className="eyebrow">Scale degrees around {context.tonicName}</span><div>{scale.map((tone) => <button className={selectedPitch === tone.pitchClass ? "is-active" : ""} onClick={() => setSelectedPitch(tone.pitchClass)} key={tone.degree}><small>{tone.degreeLabel}</small><strong>{tone.name}</strong><span>{tone.intervalName}</span></button>)}</div></section>
      <div className="explore-grid">
        <section className="card pitch-analysis"><span className="eyebrow">Selected pitch</span><h2>{scale.find((tone) => tone.pitchClass === selectedPitch)?.name ?? `Pitch class ${selectedPitch}`}</h2><p>{chromatic.explanation}</p><div className={`chromatic-label relation-${chromatic.relationship}`}><strong>{chromatic.label}</strong><span>{chromatic.possibleTargets.length ? `Possible semitone targets: ${chromatic.possibleTargets.map((pitchClass) => scale.find((tone) => tone.pitchClass === pitchClass)?.name ?? noteName(pitchClass, context.tonicName.includes("b"))).join(", ")}` : "Meaning also depends on rhythm, register and harmony."}</span></div><div className="action-row"><button className="secondary-action" onClick={() => playRelationship(context.tonic, selectedPitch)}>Hear against tonic</button><button className="text-action" onClick={() => setSelectedPitch(normalize(selectedPitch + 1))}>Move one semitone</button><button className="text-action" onClick={() => setNextPitch(scale[1]?.pitchClass)}>Aim at degree 2</button></div></section>
        <section className="card chord-analysis"><span className="eyebrow">Harmony as moving voices</span><div className="chord-picker">{chords.map((item) => <button className={item.degree === chord.degree ? "is-active" : ""} onClick={() => setChordDegree(item.degree)} key={item.id}>{item.roman}<small>{item.symbol}</small></button>)}</div><h2>{chord.roman} · {chord.symbol}</h2><p>{chord.explanation}</p>{shape && <div className="shape-assessment"><strong>{fingering?.feasible ? "Fingering-checked voicing" : "Compact note layout"}</strong><span>{shape.fretPattern} · difficulty {fingering?.difficulty}/10</span>{fingering?.warnings.map((warning) => <small key={warning}>{warning}</small>)}</div>}<button className="secondary-action" onClick={() => playChord(chord.tones.map((tone) => tone.pitchClass))}>Hear chord structure</button></section>
      </div>
      <section className="card fretboard-explorer"><header><div><span className="eyebrow">Physical identity</span><h2>See the same relationships across the neck.</h2></div></header><Fretboard scale={scale} chord={chord} shape={shape} selectedPitch={selectedPitch} labelMode="relationships" visible="scale" onPosition={(position) => setSelectedPitch(position.pitchClass)} /></section>
      <section className="card glossary-card"><header><div><span className="eyebrow">Plain-language reference</span><h2>Terms, in everyday words</h2><p>Every word the app uses, defined simply. Skim it once, or come back when a term trips you up.</p></div></header><dl className="glossary-list">{GLOSSARY.map((entry) => <div key={entry.term}><dt>{entry.term}</dt><dd>{entry.plain}</dd></div>)}</dl></section>
    </div>
  );
}
