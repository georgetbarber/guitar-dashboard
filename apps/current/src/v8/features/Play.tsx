import { useEffect, useMemo, useRef, useState } from "react";
import { stopAudio } from "../../audio/engine";
import {
  FREE_PLAY_MODE_INFO,
  availableFreePlayModes,
  buildFreePlayPrompt,
  buildFreePlaySequence,
  freePlayAbilityLevel,
  type FreePlayFocus,
  type FreePlayMode,
  type FreePlayPrompt
} from "../freePlay";
import { useV8Store } from "../store";
import { sketchFromFreePlay } from "../freePlayFragment";
import { hearFreePlayPreview } from "../freePlayAudio";

const SESSION_LENGTH = 8;

function PromptRelationship({ prompt }: { prompt: FreePlayPrompt }) {
  return (
    <div className={`play-relationship play-relationship-${prompt.mode}`} aria-label={`${prompt.mode} relationship`}>
      {prompt.displayTokens.map((token, index) => <span className={token === "·" ? "is-space" : ""} key={`${token}-${index}`}><i>{index > 0 ? "→" : ""}</i><strong>{token}</strong></span>)}
    </div>
  );
}

export function Play() {
  const { state, dispatch, navigate } = useV8Store();
  const availableModes = useMemo(() => availableFreePlayModes(state), [state]);
  const level = freePlayAbilityLevel(state);
  const [phase, setPhase] = useState<"choose" | "playing" | "complete">("choose");
  const [focus, setFocus] = useState<FreePlayFocus>("mix");
  const [sessionNumber, setSessionNumber] = useState(0);
  const [prompts, setPrompts] = useState<FreePlayPrompt[]>([]);
  const [position, setPosition] = useState(0);
  const [followed, setFollowed] = useState(0);
  const [skipped, setSkipped] = useState(0);
  const [unreported, setUnreported] = useState(0);
  const [repeatGuide, setRepeatGuide] = useState(false);
  const [autoAdvance, setAutoAdvance] = useState(false);
  const boundaryTimer = useRef<number | null>(null);
  const [hintOpen, setHintOpen] = useState(false);
  const [physicalOpen, setPhysicalOpen] = useState(false);
  const [variationOpen, setVariationOpen] = useState(false);
  const [captureError, setCaptureError] = useState("");
  useEffect(() => () => {
    if (boundaryTimer.current !== null) window.clearTimeout(boundaryTimer.current);
    stopAudio();
  }, []);
  useEffect(() => {
    const pauseHiddenGuide = () => {
      if (document.visibilityState !== "hidden") return;
      if (boundaryTimer.current !== null) window.clearTimeout(boundaryTimer.current);
      boundaryTimer.current = null;
      stopAudio();
    };
    document.addEventListener("visibilitychange", pauseHiddenGuide);
    return () => document.removeEventListener("visibilitychange", pauseHiddenGuide);
  }, []);

  const clearBoundary = () => {
    if (boundaryTimer.current !== null) window.clearTimeout(boundaryTimer.current);
    boundaryTimer.current = null;
  };

  const start = (nextFocus: FreePlayFocus) => {
    const nextSession = sessionNumber + 1;
    clearBoundary();
    stopAudio();
    setFocus(nextFocus);
    setSessionNumber(nextSession);
    setPrompts(buildFreePlaySequence(state, nextFocus, nextSession, SESSION_LENGTH));
    setPosition(0); setFollowed(0); setSkipped(0); setUnreported(0);
    setHintOpen(false); setPhysicalOpen(false); setVariationOpen(false);
    setPhase("playing");
  };

  const resetHandholds = () => { setHintOpen(false); setPhysicalOpen(false); setVariationOpen(false); };
  const advance = (report: "played" | "skipped" | "unreported") => {
    clearBoundary();
    stopAudio();
    if (report === "played") setFollowed((value) => value + 1);
    else if (report === "skipped") setSkipped((value) => value + 1);
    else setUnreported((value) => value + 1);
    if (position >= prompts.length - 1) { setPhase("complete"); return; }
    setPosition((value) => value + 1);
    resetHandholds();
  };

  const switchCurrentMode = (mode: FreePlayMode) => {
    clearBoundary();
    stopAudio();
    setPrompts((current) => current.map((prompt, index) => index === position ? buildFreePlayPrompt(state, mode, sessionNumber * SESSION_LENGTH + position + 37) : prompt));
    resetHandholds();
  };
  const capture = (prompt: FreePlayPrompt) => {
    const sketch = sketchFromFreePlay(state, prompt);
    if (!sketch) {
      setCaptureError("No checked guitar voicing is available for this chord prompt. Try a riff or groove fragment, or make a blank sketch.");
      return;
    }
    clearBoundary();
    stopAudio();
    dispatch({ type: "importFragment", sketch });
    navigate("create");
  };
  const playGuide = (prompt: FreePlayPrompt) => {
    clearBoundary();
    const duration = hearFreePlayPreview(prompt.preview, repeatGuide ? 4 : 1);
    if (autoAdvance) boundaryTimer.current = window.setTimeout(() => advance("unreported"), duration);
  };

  if (phase === "choose") return (
    <div className="play-page page-stack">
      <section className="play-hero">
        <div className="play-hero-copy">
          <span className="eyebrow">Free play · guided, never graded</span>
          <h1>Put the guitar in your hands.</h1>
          <p>One playable instruction at a time. No lesson to choose, no result to submit and no planning between prompts.</p>
          <div className="play-hero-actions"><button className="primary-action large" onClick={() => start("mix")}>Start a mixed flow</button><span>{SESSION_LENGTH} prompts · about 8 minutes · stop whenever you like</span></div>
        </div>
        <div className="play-orbit" aria-hidden="true"><span>hear</span><span>find</span><strong>play</strong><span>move</span><span>vary</span></div>
      </section>

      <section className="play-mode-section">
        <header><div><span className="eyebrow">Choose a flavour, or let the app mix them</span><h2>What feels inviting?</h2></div><span className="ability-badge">Prompts matched to ability step {level}</span></header>
        <div className="play-mode-grid">
          {(Object.keys(FREE_PLAY_MODE_INFO) as FreePlayMode[]).map((mode) => {
            const info = FREE_PLAY_MODE_INFO[mode];
            const ready = availableModes.includes(mode);
            return <article className={`play-mode-card mode-${mode} ${ready ? "is-ready" : "is-locked"}`} key={mode}><div><small>{ready ? "Ready now" : info.unlock}</small><h3>{info.label}</h3><p>{info.invitation}</p></div><button className={ready ? "secondary-action" : "text-action"} disabled={!ready} onClick={() => start(mode)}>{ready ? `Play ${info.label}` : "Build this relationship in Learn"}</button></article>;
          })}
        </div>
      </section>

      <section className="play-promise card">
        <div><span>01</span><strong>One action appears</strong><p>The key, tempo and difficulty come from your learning history.</p></div>
        <div><span>02</span><strong>Hear, play or reveal</strong><p>Use an audio guide or physical cue only when it helps.</p></div>
        <div><span>03</span><strong>Keep flowing</strong><p>Skip freely. These prompts create no score and never gate the Course map.</p></div>
      </section>
    </div>
  );

  if (phase === "complete") {
    const usedModes = [...new Set(prompts.slice(0, position + 1).map((prompt) => FREE_PLAY_MODE_INFO[prompt.mode].label))];
    return (
      <div className="play-page page-stack">
        <section className="play-complete">
          <span className="eyebrow">Flow complete · nothing was graded</span>
          <h1>You kept music moving.</h1>
          <p>You marked {followed} prompt{followed === 1 ? "" : "s"} as played{skipped ? `, skipped ${skipped}` : ""}{unreported ? `, and moved past ${unreported} automatically after the guide` : ""}. These are your choices, not a measured record of playing.</p>
          <div className="play-complete-modes">{usedModes.map((mode) => <span key={mode}>{mode}</span>)}</div>
          <div className="play-complete-actions"><button className="primary-action large" onClick={() => start("mix")}>Keep playing</button><button className="secondary-action" onClick={() => start(focus)}>Another {focus === "mix" ? "mixed" : FREE_PLAY_MODE_INFO[focus].label} set</button><button className="text-action" onClick={() => setPhase("choose")}>Choose a different flavour</button></div>
          <aside><div><strong>Did the last fragment stick?</strong><span>Carry its exact guide and context into an editable sketch.</span></div><button className="secondary-action" onClick={() => capture(prompts[position])}>Take the last fragment to Create</button></aside>
          {captureError && <p role="alert">{captureError}</p>}
        </section>
      </div>
    );
  }

  const prompt = prompts[position];
  const tempo = prompt.preview.kind === "notes" || prompt.preview.kind === "groove" ? `${prompt.preview.bpm} BPM` : `${state.settings.tonicName} ${state.settings.mode}`;
  return (
    <div className="play-session">
      <header className="play-session-header">
        <button className="text-action" onClick={() => { clearBoundary(); stopAudio(); setPhase("choose"); }}>← Leave the flow</button>
        <div className="play-progress" aria-label={`Prompt ${position + 1} of ${prompts.length}`}><span>{position + 1} of {prompts.length}</span><div>{prompts.map((_, index) => <i className={index < position ? "is-complete" : index === position ? "is-current" : ""} key={index} />)}</div></div>
        <span className="play-session-context">{state.settings.tonicName} {state.settings.mode} · {state.settings.instrument}</span>
      </header>
      <div className="play-session-layout">
        <aside className="play-mode-rail">
          <span className="eyebrow">Change the next action</span>
          {(Object.keys(FREE_PLAY_MODE_INFO) as FreePlayMode[]).map((mode) => <button className={prompt.mode === mode ? "is-active" : ""} disabled={!availableModes.includes(mode)} onClick={() => switchCurrentMode(mode)} key={mode}><span><strong>{FREE_PLAY_MODE_INFO[mode].label}</strong><small>{availableModes.includes(mode) ? "Ready at your level" : FREE_PLAY_MODE_INFO[mode].unlock}</small></span></button>)}
        </aside>
        <main className={`play-stage mode-${prompt.mode}`}>
          <div className="play-stage-top"><span>{FREE_PLAY_MODE_INFO[prompt.mode].label}</span><span>{tempo}{prompt.stretch ? " · gentle stretch" : ""}</span></div>
          <PromptRelationship prompt={prompt} />
          <div className="play-instruction"><span className="eyebrow">Your one instruction</span><h1>{prompt.title}</h1><p>{prompt.instruction}</p></div>
          <div className="play-listen-for"><span>Listen for</span><strong>{prompt.relationship}</strong></div>
          <div className="play-handholds">
            {hintOpen && <aside><span>Reveal the names</span><p>{prompt.hint}</p></aside>}
            {physicalOpen && <aside><span>Connect it to the hand</span><p>{prompt.physicalCue}</p></aside>}
            {variationOpen && <aside className="is-variation"><span>Make it yours</span><p>{prompt.variation}</p></aside>}
          </div>
          <div className="play-sound-actions"><button className="secondary-action" onClick={() => playGuide(prompt)}>▶ Hear the guide</button><button aria-pressed={physicalOpen} onClick={() => setPhysicalOpen((value) => !value)}>Hand cue</button><button aria-pressed={hintOpen} onClick={() => setHintOpen((value) => !value)}>Reveal names</button><button aria-pressed={variationOpen} onClick={() => setVariationOpen((value) => !value)}>Make it mine</button></div>
          <div className="play-flow-options"><button aria-pressed={repeatGuide} onClick={() => setRepeatGuide((value) => !value)}>Repeat the guide 4 times</button><button aria-pressed={autoAdvance} onClick={() => { setAutoAdvance((value) => !value); clearBoundary(); }}>Move to the next prompt when the guide ends</button><small>Automatic movement never marks a prompt as played. Press Hear the guide to use these options.</small></div>
          <button className="text-action" onClick={() => capture(prompt)}>Keep this fragment in Create →</button>
          {captureError && <p role="alert">{captureError}</p>}
        </main>
      </div>
      <footer className="play-session-footer"><button className="text-action" onClick={() => advance("skipped")}>Not this one — skip</button><span>There is no right response to submit. Play, listen, then move when ready.</span><button className="primary-action large" onClick={() => advance("played")}>Played it — keep flowing →</button></footer>
    </div>
  );
}
