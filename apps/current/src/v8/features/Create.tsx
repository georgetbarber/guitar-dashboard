import { useEffect, useMemo, useRef, useState } from "react";
import { playClick, playMidi, startVoicingProgression, stopAudio } from "../../audio/engine";
import { openMicrophone, startTakeRecording } from "../../audio/microphone";
import type { MicrophoneSession, TakeRecorder } from "../../audio/microphone";
import { buildChords, createContext } from "../../core/music/theory";
import { generateShapes } from "../../core/instrument/guitar";
import { newId } from "../identity";
import { clearSketchRecordings, loadBlob, saveBlob } from "../repository";
import { useCloudSync } from "../cloudFacade";
import { SKETCH_LIMITS, admitSketchEdit, boundTempo, describeExceedances } from "../limits";
import { MODE_OPTIONS, TONAL_ROOTS } from "../validation";
import { ONE_NOTE_QUESTION_ANSWER } from "../pilotEpisode";
import { hearEditedGroove, hearFreePlayPreview } from "../freePlayAudio";
import { EXPERIMENTS, previewExperiment } from "../creativeExperiments";
import type { ExperimentId, ExperimentResult } from "../creativeExperiments";
import { useV8Store } from "../store";
import { useUpdateHold } from "../components/UpdateNotice";
import { SKETCH_SYNC_FIELDS } from "../types";
import type { ChordEvent, RecordedTake, Sketch, SketchRevision, SketchSyncField } from "../types";

const WORKFLOW: Sketch["status"][] = ["capture", "understand", "vary", "arrange", "record", "compare", "revise", "finished"];
function snapshot(sketch: Sketch, summary: string): SketchRevision {
  return { id: newId("revision"), createdAt: new Date().toISOString(), summary, snapshot: { chords: sketch.chords, melody: sketch.melody, rhythmPattern: sketch.rhythmPattern, sections: sketch.sections, notes: sketch.notes, key: sketch.key, mode: sketch.mode, tempo: sketch.tempo, metre: sketch.metre } };
}

function describeOneNoteRhythm(beats: readonly number[], section: "whole" | "question" | "answer"): string {
  const heard = new Set(beats);
  const bar = (from: number) => Array.from({ length: 4 }, (_, count) => heard.has(from + count) ? String(count + 1) : "·").join(" ");
  return section === "whole" ? `Question: ${bar(0)} | Answer: ${bar(4)}` : `${section}: ${bar(0)}`;
}
function countLabel(beat: number): string {
  return `${Math.floor(beat / 4) + 1}.${Math.floor(beat % 4) + 1}${beat % 1 ? " &" : ""}`;
}

export function Create() {
  const { state, dispatch } = useV8Store();
  const active = state.sketches.find((sketch) => sketch.id === state.activeSketchId) ?? state.sketches[0] ?? null;
  return (
    <div className="create-shell">
      <aside className="sketch-list">
        <header><div><span className="eyebrow">Local sketchbook</span><h1>Create</h1></div><button className="icon-button" onClick={() => dispatch({ type: "createSketch" })} aria-label="Create new sketch"><svg className="glyph" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg></button></header>
        {state.sketches.length ? state.sketches.map((sketch) => <button className={sketch.id === active?.id ? "is-active" : ""} onClick={() => dispatch({ type: "setActiveSketch", id: sketch.id })} key={sketch.id}><strong>{sketch.name}</strong><span>{sketch.status} · {sketch.tempo} BPM</span><small>{sketch.chords.length} chords · {sketch.revisions.length} revisions</small></button>) : <div className="empty-sketch"><p>Capture an unfinished idea. Understanding can follow the sound.</p><button className="primary-action" onClick={() => dispatch({ type: "createSketch" })}>Start your first sketch</button></div>}
      </aside>
      <div className="studio-main">
        {state.resumeActivityId && <button className="resume-learning" onClick={() => dispatch({ type: "resumeActivity" })}>← Return to the creative learning activity</button>}
        {active ? <SketchEditor sketch={active} /> : <section className="studio-empty"><span className="eyebrow">Capture → understand → vary → arrange → record → compare → revise → finish</span><h2>Your work becomes the curriculum.</h2><p>Save exact choices, listen back, preserve versions and let theory describe what you made without grading creativity.</p></section>}
      </div>
    </div>
  );
}

function SketchEditor({ sketch }: { sketch: Sketch }) {
  const { state, dispatch } = useV8Store();
  const cloud = useCloudSync();
  const context = useMemo(() => createContext(sketch.key ?? state.settings.tonicName, sketch.mode ?? state.settings.mode), [sketch.key, sketch.mode, state.settings]);
  const [sevenths, setSevenths] = useState(false);
  const [guideDismissed, setGuideDismissed] = useState(false);
  const showGuide = !guideDismissed && sketch.chords.length === 0 && !sketch.origin;
  const chords = useMemo(() => buildChords(context, sevenths), [context, sevenths]);
  const [message, setMessage] = useState("Recordings stay on this device unless you deliberately keep and then share one.");
  const sessionRef = useRef<MicrophoneSession | null>(null);
  const recorderRef = useRef<TakeRecorder | null>(null);
  const [recording, setRecording] = useState(false);
  const [pendingTake, setPendingTake] = useState<{ blob: Blob; url: string } | null>(null);
  const [keepingTake, setKeepingTake] = useState(false);
  /*
   * Tempo is held as text while the field has focus. Committing on every
   * keystroke would put partial input through the reducer's clamp, so clearing
   * the box to retype it would snap to the fallback and typing "120" would pass
   * through "1" -> 20. The clamp applies on blur, where the value is complete.
   */
  const [tempoDraft, setTempoDraft] = useState<string | null>(null);
  const [experiment, setExperiment] = useState<ExperimentResult | null>(null);
  /*
   * A temporary take lives only in this tab's memory — no chunk persistence
   * exists — so a reload destroys it. Holding the update off is the whole
   * protection; there is no recovery to fall back on.
   */
  useUpdateHold(recording, "a recording in progress");
  useUpdateHold(Boolean(pendingTake), "a temporary take you have not kept or discarded");
  useEffect(() => () => { sessionRef.current?.close(); stopAudio(); }, []);
  useEffect(() => () => { if (pendingTake) URL.revokeObjectURL(pendingTake.url); }, [pendingTake]);
  useEffect(() => setExperiment(null), [sketch.id, sketch.updatedAt]);
  const update = (changes: Partial<Sketch>) => {
    const updatedAt = new Date().toISOString();
    const fieldUpdatedAt = { ...sketch.fieldUpdatedAt };
    for (const field of Object.keys(changes)) if ((SKETCH_SYNC_FIELDS as readonly string[]).includes(field)) fieldUpdatedAt[field as SketchSyncField] = updatedAt;
    /*
     * Refused here rather than truncated later. The text inputs cap themselves,
     * so what actually reaches a limit is accumulated work — the experiment
     * buttons appending to `notes`, or a long chord track — and the learner
     * should be told while they can still act on it.
     */
    const decision = admitSketchEdit(sketch, { ...sketch, ...changes, fieldUpdatedAt, updatedAt });
    if (decision.refused.length) {
      setMessage(`That change was not applied: ${describeExceedances(decision.refused)}. Nothing was removed — shorten it here, or carry the idea into a new sketch.`);
    }
    dispatch({ type: "updateSketch", sketch: decision.admitted });
  };
  const revise = (summary: string, changes: Partial<Sketch>) => update({
    ...changes,
    revisions: [...sketch.revisions, snapshot(sketch, summary)],
    status: changes.status ?? (sketch.status === "capture" ? "vary" : sketch.status)
  });
  const addChord = (symbol: string) => {
    const chord = chords.find((item) => item.symbol === symbol) ?? chords[0];
    const shape = generateShapes(chord)[0];
    const event: ChordEvent = { id: newId("chord"), symbol: chord.symbol, beats: 4, voicing: Array.from({ length: 6 }, (_, string) => shape?.positions.find((position) => position.string === string)?.fret ?? null) };
    update({ chords: [...sketch.chords, event] });
  };
  const playVersion = (version: Sketch) => {
    stopAudio();
    const voicings = version.chords.map((event) => event.voicing.flatMap((fret, string) => fret === null ? [] : [([64, 59, 55, 50, 45, 40][string] + fret)]));
    if (voicings.length) startVoicingProgression(voicings, version.tempo, () => undefined, version.chords.map((event) => event.beats));
    else if (version.melody.length) {
      const beat = 60 / version.tempo;
      const countIn = version.metre === "3/4" ? 3 : version.metre === "6/8" ? 6 : 4;
      for (let count = 0; count < countIn; count++) playClick(count * beat, count === 0);
      for (const note of version.melody) playMidi([64, 59, 55, 50, 45, 40][note.string] + note.fret,
        (countIn + note.beat) * beat, Math.max(.08, note.duration * beat - .04));
    }
    else if (version.origin?.preview?.kind === "groove" && !hearEditedGroove(version.rhythmPattern, version.tempo)) {
      setMessage("Use the accent controls below to make a playable groove. Free-form rhythm notes remain annotations.");
    }
  };
  const play = () => playVersion(sketch);
  const playOriginal = () => {
    if (sketch.origin?.kind === "free-play" && sketch.origin.preview) {
      hearFreePlayPreview(sketch.origin.preview);
      return;
    }
    if (sketch.origin?.kind !== "pilot") return;
    if (sketch.origin.sourceId !== ONE_NOTE_QUESTION_ANSWER.id || sketch.origin.sourceVersion !== ONE_NOTE_QUESTION_ANSWER.version) {
      setMessage("This sketch links to a different material version. The stored notes remain editable, but that original cannot be previewed here.");
      return;
    }
    stopAudio();
    const beat = 60 / sketch.origin.referenceTempo;
    const from = sketch.origin.sectionId === "answer" ? 4 : 0;
    const until = sketch.origin.sectionId === "question" ? 4 : 8;
    for (let count = 0; count < 4; count++) playClick(count * beat, count === 0);
    for (const event of ONE_NOTE_QUESTION_ANSWER.events) if (event.kind === "note" && event.atBeat >= from && event.atBeat < until) playMidi(event.midi, (4 + event.atBeat - from) * beat, event.beats * beat - .04);
  };
  const moveMelodyNote = (id: string, beat: number) => {
    const melody = sketch.melody.map((item) => item.id === id ? { ...item, beat } : item);
    if (sketch.origin?.kind === "pilot" && melody.some((note, index) => melody.some((other, otherIndex) =>
      index !== otherIndex && note.string === other.string && note.beat < other.beat + other.duration && other.beat < note.beat + note.duration))) {
      setMessage("Two notes would overlap on the same string. Choose a free count so both attacks stay clear.");
      return;
    }
    revise("Moved one melody attack", {
      melody,
      ...(sketch.origin?.kind === "pilot" ? { rhythmPattern: describeOneNoteRhythm(melody.map((note) => note.beat), sketch.origin.sectionId ?? "whole") } : {}),
    });
  };
  const undo = () => {
    const previous = sketch.revisions.at(-1);
    if (previous) revise(`Returned to version before: ${previous.summary}`, previous.snapshot);
  };
  const grooveSymbols = sketch.origin?.preview?.kind === "groove" ? sketch.rhythmPattern.trim().split(/\s+/) : [];
  const grooveEditable = grooveSymbols.length > 0 && grooveSymbols.every((symbol) => symbol === "●" || symbol === "·");
  const lastMelodyBeat = Math.max(0, ...sketch.melody.map((note) => note.beat + note.duration));
  const lastMelodyFret = Math.min(36, Math.max(12, ...sketch.melody.map((note) => note.fret)));
  const beatOptions = sketch.origin?.preview?.kind === "notes"
    ? Array.from({ length: Math.max(16, Math.ceil(lastMelodyBeat * 2) + 2) }, (_, index) => index * .5)
    : Array.from({ length: Math.max(sketch.origin?.sectionId === "whole" ? 8 : 4, Math.ceil(lastMelodyBeat) + 1) }, (_, index) => index);
  const chooseExperiment = (id: ExperimentId) => setExperiment(previewExperiment(sketch, id));
  const confirmExperiment = () => {
    if (!experiment?.available) return;
    revise(experiment.title, experiment.changes);
    setExperiment(null);
  };
  const startRecording = async () => {
    try {
      const session = sessionRef.current ?? await openMicrophone();
      sessionRef.current = session;
      recorderRef.current = startTakeRecording(session.stream);
      setRecording(true); setMessage("Recording locally. Play the idea, then stop and compare.");
    } catch (error) { setMessage(error instanceof Error ? `Microphone unavailable: ${error.message}` : "Microphone unavailable."); }
  };
  const stopRecording = async () => {
    if (!recorderRef.current) return;
    const blob = await recorderRef.current.stop();
    setPendingTake({ blob, url: URL.createObjectURL(blob) });
    recorderRef.current = null; setRecording(false); setMessage("Temporary take ready, held only in this tab. Compare it now, then keep it on this device or discard it — closing or reloading this tab loses it.");
  };
  const keepPendingTake = async () => {
    if (!pendingTake || keepingTake) return;
    const id = newId("take");
    const takes = [...sketch.takes, { id, blobId: id, name: `Take ${sketch.takes.length + 1}`, createdAt: new Date().toISOString(), note: "Kept on this device for intentional comparison." }];
    const decision = admitSketchEdit(sketch, { ...sketch, takes, status: "compare" });
    if (decision.refused.length) {
      setMessage(`This take could not be kept: ${describeExceedances(decision.refused)}. The temporary take is still in this tab.`);
      return;
    }
    setKeepingTake(true);
    try {
      await saveBlob(id, pendingTake.blob);
      update({ takes, status: "compare" });
      setPendingTake(null);
      setMessage("Take retained privately on this device. Finish the project to make an explicit cross-device copy available.");
    } catch (error) {
      setMessage(`This take could not be kept: ${error instanceof Error ? error.message : "This device refused the recording."} The temporary take is still in this tab. Try keeping it again before closing.`);
    } finally { setKeepingTake(false); }
  };
  const visibleTakes = sketch.takes.filter((take) => take.blobId || take.cloud);
  return (
    <div className="studio-stack">
      <header className="studio-header">
        <div><span className="eyebrow">Creative workflow · {sketch.status}</span><input className="title-input" maxLength={SKETCH_LIMITS.name} value={sketch.name} onChange={(event) => update({ name: event.target.value })} aria-label="Sketch name" /></div>
        <div className="studio-actions"><button className="secondary-action" disabled={!sketch.chords.length && !sketch.melody.length && !grooveEditable} onClick={play}>Play sketch</button><button className="text-action" onClick={stopAudio}>Stop sound</button>{recording ? <button className="primary-action" onClick={stopRecording}>Stop and compare</button> : <button className="primary-action" disabled={Boolean(pendingTake)} onClick={startRecording}>Record a temporary take</button>}</div>
      </header>
      {sketch.origin && <section className="card sketch-origin"><span className="eyebrow">Started from actual music</span><h2>{sketch.origin.label}</h2><p>{sketch.origin.kind === "pilot" ? `A ${sketch.origin.sectionId ?? "whole"} phrase at ${sketch.origin.referenceTempo} BPM. The original remains in Learn; this is your editable copy.` : `A Free Play ${sketch.origin.preview?.kind ?? "prompt"} guide at ${sketch.origin.referenceTempo} BPM. Its exact guide and context were kept, and this is your editable version.`} The source link is kept in this device's backup.</p><button className="secondary-action" onClick={playOriginal}>Hear preserved original</button></section>}
      {showGuide && <aside className="create-guide"><div><strong>New here? Start with just this.</strong><ol><li>Give the sketch a name above.</li><li>Open “Add a chord…” below and pick two chords.</li><li>Press <b>Play sketch</b> to hear them. That's a start — everything else is optional.</li></ol></div><button className="text-action" onClick={() => setGuideDismissed(true)}>Got it, hide this</button></aside>}
      <details className="workflow-details"><summary>Creative stages · current: {sketch.status}</summary><nav className="workflow" aria-label="Composition workflow">{WORKFLOW.map((step) => <button className={sketch.status === step ? "is-active" : ""} onClick={() => update({ status: step })} key={step}>{step}</button>)}</nav></details>
      <section className="studio-intention card"><label>What should this music do or feel like?<textarea maxLength={SKETCH_LIMITS.intention} value={sketch.intention} onChange={(event) => update({ intention: event.target.value })} /></label><div className="studio-settings"><label>Tempo<input type="number" min={SKETCH_LIMITS.tempoMin} max={SKETCH_LIMITS.tempoMax} value={tempoDraft ?? String(sketch.tempo)} onChange={(event) => setTempoDraft(event.target.value)} onBlur={() => { if (tempoDraft !== null) { update({ tempo: boundTempo(Number(tempoDraft)) }); setTempoDraft(null); } }} /></label><label>Metre<select value={sketch.metre} onChange={(event) => update({ metre: event.target.value as Sketch["metre"] })}><option>4/4</option><option>3/4</option><option>6/8</option></select></label><label>Reference key<select value={sketch.key ?? "none"} onChange={(event) => update({ key: event.target.value === "none" ? null : event.target.value })}><option value="none">No declared key</option>{TONAL_ROOTS.map((key) => <option key={key}>{key}</option>)}</select></label><label>Mode<select value={sketch.mode ?? "none"} onChange={(event) => update({ mode: event.target.value === "none" ? null : event.target.value as Sketch["mode"] })}><option value="none">No declared mode</option>{MODE_OPTIONS.map(([id, label]) => <option value={id} key={id}>{label}</option>)}</select></label></div></section>
      {sketch.melody.length > 0 && <section className="card sketch-melody"><span className="eyebrow">First useful edit</span><h2>Move one note, then listen</h2><p>Each attack has a beat and a guitar position. The pauses between these notes stay silent. Try one change; the previous version remains available below.</p><div className="sketch-melody-events">{sketch.melody.map((note, index) => <div key={note.id}><strong>Note {index + 1}</strong><label>Count <select value={note.beat} onChange={(event) => moveMelodyNote(note.id, Number(event.target.value))}>{beatOptions.map((beat) => <option key={beat} value={beat}>{countLabel(beat)}</option>)}</select></label><label>Fret <select value={note.fret} onChange={(event) => revise("Changed one guitar pitch", { melody: sketch.melody.map((item) => item.id === note.id ? { ...item, fret: Number(event.target.value) } : item) })}>{Array.from({ length: lastMelodyFret + 1 }, (_, fret) => <option key={fret} value={fret}>{fret}</option>)}</select></label><span>String {note.string + 1}</span></div>)}</div><div className="action-row"><button className="secondary-action" disabled={!sketch.revisions.length} onClick={undo}>Undo most recent edit</button><button className="secondary-action" onClick={play}>Hear my version</button></div></section>}
      {grooveEditable && <section className="card sketch-melody"><span className="eyebrow">First useful edit</span><h2>Move one accent</h2><p>The click spacing stays fixed; choose which count feels stronger. This is still a muted-string timing guide, not a pitched melody.</p><div className="sketch-melody-events">{grooveSymbols.map((symbol, index) => <button key={index} className="secondary-action" aria-pressed={symbol === "●"} onClick={() => revise("Moved a groove accent", { rhythmPattern: grooveSymbols.map((item, at) => at === index ? item === "●" ? "·" : "●" : item).join(" ") })}>Count {index + 1}: {symbol === "●" ? "strong" : "quiet"}</button>)}</div><div className="action-row"><button className="secondary-action" disabled={!sketch.revisions.length} onClick={undo}>Undo most recent edit</button><button className="secondary-action" onClick={play}>Hear my version</button></div></section>}
      <div className="studio-grid">
        <section className="card chord-track"><header><div><span className="eyebrow">Harmony and exact voicings</span><h2>Chord track</h2></div><label className="toggle"><input type="checkbox" checked={sevenths} onChange={() => setSevenths(!sevenths)} />Add sevenths</label><select aria-label="Add chord" defaultValue="" onChange={(event) => { if (event.target.value) addChord(event.target.value); event.target.value = ""; }}><option value="" disabled>Add a chord…</option>{chords.map((chord) => <option value={chord.symbol} key={chord.id}>{chord.roman} · {chord.symbol}</option>)}</select></header>{sketch.chords.length ? <div className="chord-events">{sketch.chords.map((event, index) => <article key={event.id}><small>{index + 1}</small><strong>{event.symbol}</strong><span>{event.voicing.map((fret) => fret === null ? "x" : fret).reverse().join(" · ")}</span><label>beats<input type="number" min="1" max="16" value={event.beats} onChange={(change) => update({ chords: sketch.chords.map((item) => item.id === event.id ? { ...item, beats: Number(change.target.value) } : item) })} /></label><button aria-label={`Remove ${event.symbol}`} onClick={() => update({ chords: sketch.chords.filter((item) => item.id !== event.id) })}>×</button></article>)}</div> : <p>Add a chord or begin with rhythm and intention. Harmony is one layer, not the definition of the piece.</p>}</section>
        <section className="card rhythm-track"><span className="eyebrow">Time relationships</span><h2>Rhythm identity</h2><label>Count, rests, accents or groove words<textarea maxLength={SKETCH_LIMITS.rhythmPattern} value={sketch.rhythmPattern} onChange={(event) => update({ rhythmPattern: event.target.value })} /></label><label>Bass movement<textarea maxLength={SKETCH_LIMITS.bassMovement} value={sketch.bassMovement} onChange={(event) => update({ bassMovement: event.target.value })} placeholder="Describe or enter a bass line…" /></label></section>
      </div>
      <section className="card transformation-panel">
        <header><div><span className="eyebrow">Optional experiments</span><h2>Keep one relationship; change another.</h2><p>Choose a musical edit to inspect and hear before applying it. Each applied edit keeps a version you can return to.</p></div></header>
        <div className="transformation-grid">{EXPERIMENTS.map(({ id, title }) => <button aria-pressed={experiment?.available && experiment.id === id} onClick={() => chooseExperiment(id)} key={id}><strong>{title}</strong><span>Preview this change</span></button>)}</div>
        {experiment && <div className="experiment-preview" role="region" aria-label="Experiment preview">
          {experiment.available ? <><h3>{experiment.title}</h3><p>{experiment.explanation}</p><div className="experiment-comparison"><div><strong>Current</strong><p>{experiment.before}</p></div><div><strong>Possible edit</strong><p>{experiment.after}</p></div></div><div className="action-row"><button className="secondary-action" onClick={play}>Hear current</button><button className="secondary-action" onClick={() => playVersion({ ...sketch, ...experiment.changes })}>Hear possible edit</button><button className="primary-action" onClick={confirmExperiment}>Apply this edit</button><button className="text-action" onClick={() => setExperiment(null)}>Cancel</button></div></>
            : <><p>{experiment.reason}</p><button className="text-action" onClick={() => setExperiment(null)}>Close preview</button></>}
        </div>}
        <button className="secondary-action" disabled={!sketch.revisions.length} onClick={undo}>Return to previous version</button>
      </section>
      <div className="studio-grid">
        <section className="card notes-panel"><span className="eyebrow">Arrangement and reflection</span><h2>Notes to your future self</h2><textarea maxLength={SKETCH_LIMITS.notes} value={sketch.notes} onChange={(event) => update({ notes: event.target.value })} placeholder="What should stay? What is the next deliberate change?" /><label>Ambiguity or alternate readings<textarea maxLength={SKETCH_LIMITS.ambiguityNotes} value={sketch.ambiguityNotes} onChange={(event) => update({ ambiguityNotes: event.target.value })} placeholder="Outside the key is information, not an error…" /></label></section>
        <section className="card take-panel"><span className="eyebrow">Optional listening evidence</span><h2>{visibleTakes.length} retained takes</h2><p>{message}</p>{pendingTake && <div className="pending-take"><strong>Temporary take — held in this tab only, not stored</strong><audio controls src={pendingTake.url} /><div className="action-row"><button className="primary-action" disabled={keepingTake} onClick={() => void keepPendingTake()}>{keepingTake ? "Keeping…" : "Keep on this device"}</button><button className="secondary-action" disabled={keepingTake} onClick={() => { setPendingTake(null); setMessage("Temporary take discarded. No storage was used."); }}>Discard</button></div><small>A kept take stays private unless you later finish the project and explicitly share that individual take.</small></div>}{visibleTakes.map((take) => <TakePlayer sketch={sketch} take={take} key={take.id} />)}{sketch.status !== "finished" && visibleTakes.length > 0 && <small>Finish this version before choosing any individual take to share across signed-in devices.</small>}<div className="revision-count"><strong>{sketch.revisions.length}</strong><span>preserved revisions</span></div></section>
      </div>
      <footer className="studio-footer"><button className="danger-action" onClick={async () => { if (confirm(`Delete “${sketch.name}”? Its device recordings and any explicitly shared takes will also be deleted.`)) { try { await cloud.deleteUploadedTakes(sketch); await clearSketchRecordings(sketch); dispatch({ type: "deleteSketch", id: sketch.id }); } catch (error) { setMessage(error instanceof Error ? error.message : "The shared recordings could not be removed."); } } }}>Delete sketch</button><button className="primary-action" onClick={() => revise("Marked finished after comparative listening", { status: "finished" })}>Finish this version</button></footer>
    </div>
  );
}

function TakePlayer({ sketch, take }: { sketch: Sketch; take: RecordedTake }) {
  const cloud = useCloudSync();
  const [url, setUrl] = useState<string | null>(null);
  const [transfer, setTransfer] = useState<string>("");
  useEffect(() => {
    if (!take.blobId && !take.cloud) return;
    let active = true; let objectUrl: string | null = null;
    setUrl(null);
    void (async () => {
      const blob = take.blobId ? await loadBlob(take.blobId) : await cloud.uploadedTakeBlob(take);
      if (active && blob) { objectUrl = URL.createObjectURL(blob); setUrl(objectUrl); return; }
    })();
    return () => { active = false; if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [take.blobId, take.cloud?.storagePath, cloud.user?.uid]);
  const upload = async () => {
    setTransfer("Uploading the explicitly selected take…");
    try { await cloud.uploadFinishedTake(sketch.id, take.id); setTransfer("Available on your signed-in devices."); }
    catch (error) { setTransfer(error instanceof Error ? error.message : "The take could not be shared."); }
  };
  const remove = async () => {
    setTransfer("Removing the cross-device copy…");
    try { await cloud.removeUploadedTake(sketch.id, take.id); setTransfer("Cloud copy removed; any device copy remains private."); }
    catch (error) { setTransfer(error instanceof Error ? error.message : "The shared copy could not be removed."); }
  };
  return <div className="take-player"><div><strong>{take.name}</strong>{take.cloud && <span>Shared deliberately · {(take.cloud.bytes / 1_048_576).toFixed(1)} MB</span>}</div>{url ? <audio controls src={url} /> : <small>{take.name} recording unavailable</small>}<div className="take-sharing">{cloud.sharingAvailable && sketch.status === "finished" && take.blobId && !take.cloud && <button className="secondary-action" disabled={!cloud.user || Boolean(transfer.startsWith("Uploading"))} onClick={() => void upload()}>{cloud.user ? "Share this take across devices" : "Sign in to share this take"}</button>}{cloud.sharingAvailable && take.cloud && <button className="text-action" onClick={() => void remove()}>Remove cross-device copy</button>}{transfer && <small>{transfer}</small>}</div></div>;
}
