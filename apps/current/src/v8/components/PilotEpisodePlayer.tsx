import { useEffect, useRef, useState, type MutableRefObject } from "react";
import { startEpisodePlayback, stopEpisodePlayback, type PlaybackProgress } from "../../audio/episodePlayback";
import { openMicrophone, startTakeRecording, type MicrophoneSession, type TakeRecorder } from "../../audio/microphone";
import { newId } from "../identity";
import { createEvidence } from "../learning";
import { ONE_NOTE_ANSWER_SHIFT, ONE_NOTE_QUESTION_ANSWER, PILOT_EPISODE } from "../pilotEpisode";
import { firstPilotSuccess, isLaterCheckDue, pilotAttempts, pilotLaterSuccess } from "../pilotProgress";
import { useV8Store } from "../store";
import type { EvidenceOutcome, PilotAttempt, PilotCursor } from "../types";
import { PilotStudy } from "./PilotStudy";
import { RecordSaveStatus } from "./SaveStatus";
import { useUpdateHold } from "./UpdateNotice";

const MATERIAL = ONE_NOTE_QUESTION_ANSWER;
const RHYTHM_ACTIVITY_ID = "unit-01-rhythm";

function newCursor(): PilotCursor {
  return {
    id: newId("episode-session"),
    episodeId: PILOT_EPISODE.id,
    episodeVersion: PILOT_EPISODE.version,
    materialId: MATERIAL.id,
    materialVersion: MATERIAL.version,
    step: "learn",
    sectionId: "whole",
    tempo: MATERIAL.tempo.default,
    assistance: "none",
    updatedAt: new Date().toISOString(),
  };
}

export function PilotEpisodePlayer({
  onClose,
  requestCloseRef,
}: {
  onClose?: () => void;
  requestCloseRef?: MutableRefObject<(() => void) | null>;
}) {
  const { state, dispatch } = useV8Store();
  const cursor =
    state.pilotCursor?.episodeId === PILOT_EPISODE.id &&
    state.pilotCursor.episodeVersion === PILOT_EPISODE.version &&
    state.pilotCursor.materialId === MATERIAL.id &&
    state.pilotCursor.materialVersion === MATERIAL.version
      ? state.pilotCursor
      : null;
  const [progress, setProgress] = useState<PlaybackProgress | null>(null);
  const [playing, setPlaying] = useState(false);
  const [loop, setLoop] = useState(false);
  const [played, setPlayed] = useState(false);
  const [observation, setObservation] = useState("");
  const [notice, setNotice] = useState("");
  const [recording, setRecording] = useState(false);
  const [takeUrl, setTakeUrl] = useState<string | null>(null);
  const [takeDownloaded, setTakeDownloaded] = useState(false);
  const [takeFilename, setTakeFilename] = useState("one-note-question-answer.webm");
  const [evidenceIds, setEvidenceIds] = useState<string[]>([]);
  const [now, setNow] = useState(() => new Date());
  const stopRef = useRef<(() => void) | null>(null);
  const playGeneration = useRef(0);
  const micGeneration = useRef(0);
  const micRef = useRef<MicrophoneSession | null>(null);
  const recorderRef = useRef<TakeRecorder | null>(null);
  const takeUrlRef = useRef<string | null>(null);
  const recordingAttemptRef = useRef(false);

  useEffect(() => {
    if (!cursor) dispatch({ type: "beginPilot", cursor: newCursor() });
  }, [cursor, dispatch]);
  useEffect(() => {
    const refresh = () => setNow(new Date());
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, []);
  useEffect(
    () => () => {
      playGeneration.current++;
      micGeneration.current++;
      stopEpisodePlayback();
      micRef.current?.close();
      if (takeUrlRef.current) URL.revokeObjectURL(takeUrlRef.current);
    },
    [],
  );
  useUpdateHold(playing || recording || Boolean(takeUrl), "the pilot lesson or a temporary recording");

  const stop = () => {
    playGeneration.current++;
    stopRef.current?.();
    stopRef.current = null;
    setPlaying(false);
    setProgress(null);
  };
  const requestClose = () => {
    if (recording) {
      setNotice("Stop the recording before leaving this lesson.");
      return;
    }
    if (takeUrl && !takeDownloaded) {
      setNotice("This take lives only in this tab. Download it or discard it before leaving.");
      return;
    }
    stop();
    onClose?.();
  };
  const explorePhrase = () => {
    if (recording || (takeUrl && !takeDownloaded)) {
      setNotice("Stop and download or discard your temporary take before opening Explore.");
      return;
    }
    if (!cursor) return;
    stop();
    dispatch({
      type: "openExploreFocus",
      focus: {
        materialId: cursor.materialId,
        materialVersion: cursor.materialVersion,
        sectionId: cursor.sectionId,
        tempo: cursor.tempo,
        returnActivityId: RHYTHM_ACTIVITY_ID,
        returnRoute: state.activityOrigin ?? state.route,
        openedAt: new Date().toISOString(),
      },
    });
    history.pushState({}, "", "/explore");
  };
  useEffect(() => {
    if (!requestCloseRef) return;
    requestCloseRef.current = requestClose;
    return () => {
      requestCloseRef.current = null;
    };
  });

  if (!cursor)
    return (
      <section className="pilot-episode card" role="status">
        Opening your lesson…
      </section>
    );
  const attempts = pilotAttempts(state);
  const firstSuccess = firstPilotSuccess(attempts);
  const laterSuccess = pilotLaterSuccess(attempts);
  const due = isLaterCheckDue(firstSuccess, now);
  const variationSaved = (state.pilotVariations ?? []).some(
    (item) => item.sourceMaterialId === MATERIAL.id && item.sourceVersion === MATERIAL.version,
  );
  const move = PILOT_EPISODE.moves.find(
    (item) =>
      item.phase ===
      (cursor.step === "try" || cursor.step === "return"
        ? "try-unaided"
        : cursor.step === "learn"
          ? "learn"
          : "practise"),
  );
  const repair = PILOT_EPISODE.obstacles.find((item) => item.id === cursor.repairId);
  const check = cursor.step === "try" || cursor.step === "return";

  const changeStep = (step: PilotCursor["step"], repairId?: string) => {
    stop();
    recordingAttemptRef.current = false;
    setPlayed(false);
    setObservation("");
    setEvidenceIds([]);
    dispatch({
      type: "updatePilot",
      patch: {
        step,
        repairId,
        sectionId: repairId ? "question" : "whole",
        tempo: step === "return" ? PILOT_EPISODE.delayedCheck.tempo : cursor.tempo,
        assistance: "none",
        attemptId: step === "try" || step === "return" ? newId("episode-attempt") : undefined,
      },
    });
  };
  const play = async (material = MATERIAL, forcedMode?: "reference") => {
    stop();
    const generation = playGeneration.current;
    setNotice("");
    try {
      const mode =
        forcedMode ?? (cursor.step === "learn" || cursor.step === "vary" ? "reference" : check ? "unaided" : "guided");
      const stopPlayback = await startEpisodePlayback(
        material,
        {
          tempo: cursor.tempo,
          section: forcedMode ? "whole" : cursor.sectionId,
          mode,
          loop: !forcedMode && !check && loop,
          pulse: Boolean(forcedMode) || !check,
          range:
            !forcedMode && cursor.step === "repair" && repair
              ? { fromBeat: repair.fromBeat, toBeat: repair.toBeat }
              : undefined,
        },
        setProgress,
        () => {
          if (generation !== playGeneration.current) return;
          setPlaying(false);
          setProgress(null);
          if (mode !== "reference") setPlayed(true);
        },
        () => {
          if (generation !== playGeneration.current) return;
          setPlaying(false);
          setProgress(null);
          setNotice("Playback stopped when this tab went into the background. Start again when ready.");
        },
      );
      if (generation !== playGeneration.current) {
        stopPlayback();
        return;
      }
      stopRef.current = stopPlayback;
      setPlaying(true);
    } catch (error) {
      setNotice(
        error instanceof Error ? error.message : "Audio could not start. You can still play the phrase on your guitar.",
      );
    }
  };
  const recordAttempt = (outcome: EvidenceOutcome) => {
    if (!played || observation.trim().length < 8 || !check || !cursor.attemptId || recordingAttemptRef.current) return;
    recordingAttemptRef.current = true;
    const attempt: PilotAttempt = {
      id: cursor.attemptId,
      cursorId: cursor.id,
      episodeId: cursor.episodeId,
      episodeVersion: cursor.episodeVersion,
      materialId: cursor.materialId,
      materialVersion: cursor.materialVersion,
      kind: cursor.step === "return" ? "later-check" : "first-check",
      assistance: cursor.assistance,
      method: "self-reported",
      tempo: cursor.tempo,
      outcome,
      observation: observation.trim(),
      occurredAt: new Date().toISOString(),
    };
    dispatch({ type: "recordPilotAttempt", attempt });
    if (attempt.kind === "first-check") {
      const evidence = createEvidence(
        RHYTHM_ACTIVITY_ID,
        [`rhythm:${PILOT_EPISODE.unitId}`],
        "performance",
        cursor.assistance,
        outcome,
        { key: "E", tempo: cursor.tempo, instrument: state.settings.instrument, fretRegion: [0, 0] },
      );
      dispatch({ type: "recordActivity", activityId: RHYTHM_ACTIVITY_ID, evidence });
      setEvidenceIds(evidence.map((item) => item.id));
    }
    setPlayed(false);
    setObservation("");
    setNotice(
      outcome === "successful"
        ? "Your self-report was added to this workspace, not measured. Check the save status before leaving."
        : "This self-report was added to this workspace. Choose a specific repair and try the phrase again.",
    );
  };
  const startRecording = async () => {
    if (takeUrl) return;
    stop();
    const generation = ++micGeneration.current;
    try {
      const mic = await openMicrophone();
      if (generation !== micGeneration.current) {
        mic.close();
        return;
      }
      micRef.current = mic;
      recorderRef.current = startTakeRecording(mic.stream);
      setRecording(true);
      setNotice("Recording only in this tab. Stop it to compare; nothing uploads.");
    } catch (error) {
      micRef.current?.close();
      micRef.current = null;
      setNotice(error instanceof Error ? error.message : "Microphone unavailable.");
    }
  };
  const stopRecording = async () => {
    if (!recorderRef.current) return;
    try {
      const blob = await recorderRef.current.stop();
      const url = URL.createObjectURL(blob);
      setTakeFilename(
        `one-note-question-answer.${blob.type.includes("mp4") ? "m4a" : blob.type.includes("ogg") ? "ogg" : "webm"}`,
      );
      takeUrlRef.current = url;
      setTakeUrl(url);
      setTakeDownloaded(false);
      setNotice("Temporary take ready. Play it beside the reference, then download or discard it.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "The recording could not be saved. Please try again.");
    } finally {
      recorderRef.current = null;
      micRef.current?.close();
      micRef.current = null;
      setRecording(false);
    }
  };
  const discardTake = () => {
    if (takeUrlRef.current) URL.revokeObjectURL(takeUrlRef.current);
    takeUrlRef.current = null;
    setTakeUrl(null);
    setTakeDownloaded(false);
    setNotice("Temporary take discarded.");
  };

  return (
    <section className="pilot-episode" aria-labelledby="activity-title">
      <header className="activity-header">
        <button className="icon-button" onClick={requestClose} aria-label="Close lesson" data-autofocus>
          ←
        </button>
        <div>
          <span>Learn · Your musical baseline</span>
          <h1 id="activity-title">One-note question and answer</h1>
          <p>{PILOT_EPISODE.objective}</p>
        </div>
      </header>
      {notice && (
        <p className="pilot-notice" role="status">
          {notice}
        </p>
      )}
      {laterSuccess && (
        <p className="pilot-notice" role="status">
          You reported a later unaided success. This pilot journey is complete on your report; your playing has not been
          measured or independently reviewed.
        </p>
      )}
      <nav className="pilot-steps" aria-label="Lesson steps">
        <button aria-current={cursor.step === "learn" ? "step" : undefined} onClick={() => changeStep("learn")}>
          1 · Learn it
        </button>
        <button
          aria-current={cursor.step === "practise" || cursor.step === "repair" ? "step" : undefined}
          onClick={() => changeStep("practise")}
        >
          2 · Practise it
        </button>
        <button aria-current={cursor.step === "try" ? "step" : undefined} onClick={() => changeStep("try")}>
          3 · Try unaided
        </button>
        <button
          aria-current={cursor.step === "vary" ? "step" : undefined}
          disabled={!firstSuccess}
          onClick={() => changeStep("vary")}
        >
          4 · Make it yours
        </button>
        <button
          aria-current={cursor.step === "return" ? "step" : undefined}
          disabled={!due || !variationSaved}
          onClick={() => changeStep("return")}
        >
          5 · Return later
        </button>
      </nav>
      <div className="pilot-layout">
        <article className="pilot-main card">
          <span className="eyebrow">
            {cursor.step === "repair"
              ? "A smaller step"
              : cursor.step === "vary"
                ? "Change one thing"
                : cursor.step === "return"
                  ? "Later check"
                  : move?.phase.replace("-", " ")}
          </span>
          <h2>
            {cursor.step === "repair"
              ? repair?.learnerSignal
              : cursor.step === "vary"
                ? "Move one answer note"
                : cursor.step === "return"
                  ? "Can you still play it tomorrow?"
                  : cursor.step === "learn"
                    ? "Hear the question; hear the answer"
                    : cursor.step === "practise"
                      ? "Play beside the count"
                      : "Play without the answer in front of you"}
          </h2>
          <p>
            {cursor.step === "repair"
              ? repair?.changedSupport
              : cursor.step === "vary"
                ? "Keep the question and the pitch. Move the answer's middle note from count 2 to count 3; hear what that changes."
                : cursor.step === "return"
                  ? PILOT_EPISODE.delayedCheck.instruction
                  : move?.instruction}
          </p>
          <PilotStudy
            material={cursor.step === "vary" ? ONE_NOTE_ANSWER_SHIFT : MATERIAL}
            tempo={cursor.tempo}
            activeBeat={check ? null : progress?.beat}
            sectionId={cursor.sectionId}
            range={
              cursor.step === "repair" && repair ? { fromBeat: repair.fromBeat, toBeat: repair.toBeat } : undefined
            }
            conceal={check && cursor.assistance !== "reveal"}
          />
          <button className="text-action" onClick={explorePhrase}>
            Explore why this phrase works →
          </button>
          <div className="pilot-controls">
            <label>
              Tempo{" "}
              <select
                value={cursor.tempo}
                disabled={cursor.step === "return"}
                onChange={(event) => {
                  stop();
                  dispatch({ type: "updatePilot", patch: { tempo: Number(event.target.value) } });
                }}
              >
                {[50, 60, 72, 88].map((tempo) => (
                  <option key={tempo} value={tempo}>
                    {tempo} BPM{tempo === 50 ? " · slower" : ""}
                  </option>
                ))}
              </select>
            </label>
            {!check && (
              <label>
                Play{" "}
                <select
                  value={cursor.sectionId}
                  onChange={(event) => {
                    stop();
                    dispatch({
                      type: "updatePilot",
                      patch: { sectionId: event.target.value as PilotCursor["sectionId"] },
                    });
                  }}
                >
                  <option value="whole">Both bars</option>
                  <option value="question">Question only</option>
                  <option value="answer">Answer only</option>
                </select>
              </label>
            )}
            {!check && (
              <label className="pilot-loop">
                <input type="checkbox" checked={loop} onChange={(event) => setLoop(event.target.checked)} /> Loop
              </label>
            )}
          </div>
          <div className="pilot-play-actions">
            <button className="primary-action large" onClick={() => void play()}>
              {cursor.step === "learn" || cursor.step === "vary"
                ? "Hear the exact phrase"
                : check
                  ? "Count in, then I play"
                  : "Hear it, then my turn"}
            </button>
            <button className="secondary-action" disabled={!playing} onClick={stop}>
              Stop sound
            </button>
          </div>
          <p className="pilot-playing" role="status" aria-live="off">
            {progress
              ? progress.phase === "count-in"
                ? `Count in: ${progress.count}`
                : check
                  ? "Your turn — play both bars"
                  : `${progress.phase === "your-turn" ? "Your turn" : "Reference"} · count ${progress.count}`
              : "Ready when you are."}
          </p>
          <small>
            The sound here is a synthesised timing reference, not a human guitar technique demonstration. Play the open
            high E on your guitar and stop it at each rest.
          </small>
          {cursor.step === "learn" && (
            <button className="secondary-action" onClick={() => changeStep("practise")}>
              Practise with the count →
            </button>
          )}
          {cursor.step === "practise" && (
            <button className="secondary-action" onClick={() => changeStep("try")}>
              Try without the notes →
            </button>
          )}
          {cursor.step === "repair" && (
            <button className="secondary-action" onClick={() => changeStep("practise")}>
              Return to both bars →
            </button>
          )}
          {cursor.step === "repair" && (
            <button className="text-action" onClick={requestClose}>
              Pause here and come back later
            </button>
          )}
          {check && (
            <div className="pilot-check">
              <p>
                <strong>Success means:</strong> At {cursor.tempo} BPM, play both bars. {PILOT_EPISODE.successCriterion}
              </p>
              {!played && (
                <button className="text-action" onClick={() => setPlayed(true)}>
                  I played both bars without the app sound
                </button>
              )}
              {cursor.assistance !== "reveal" && (
                <button
                  className="text-action"
                  onClick={() => dispatch({ type: "updatePilot", patch: { assistance: "reveal" } })}
                >
                  Show the notes to help me
                </button>
              )}
              <label>
                One concrete observation{" "}
                <textarea
                  maxLength={1000}
                  value={observation}
                  onChange={(event) => setObservation(event.target.value)}
                  placeholder="What happened to the rests or the pulse?"
                />
              </label>
              <small>
                {cursor.assistance === "none"
                  ? "This check is unaided if you keep the notes hidden."
                  : "The notes were shown; this check will be recorded as assisted."}{" "}
                The result is your report, not a score from the microphone.
              </small>
              <div className="pilot-outcomes">
                {(["retry", "partial", "successful"] as const).map((outcome) => (
                  <button
                    key={outcome}
                    disabled={!played || observation.trim().length < 8}
                    onClick={() => recordAttempt(outcome)}
                  >
                    {outcome === "retry"
                      ? "Needs another pass"
                      : outcome === "partial"
                        ? "Partly there"
                        : "I could do it"}
                  </button>
                ))}
              </div>
              {evidenceIds.length > 0 && <RecordSaveStatus evidenceIds={evidenceIds} />}
            </div>
          )}
          {cursor.step === "vary" && (
            <div className="pilot-variation">
              <p>
                Original answer: play on 1, 2, 4. Your changed answer: play on 1, 3, 4. The question, pitch and pulse
                stay the same.
              </p>
              <button className="secondary-action" onClick={() => void play(MATERIAL)}>
                Hear original
              </button>
              <button className="secondary-action" onClick={() => void play(ONE_NOTE_ANSWER_SHIFT)}>
                Hear my variation
              </button>
              <button
                className="primary-action"
                disabled={variationSaved}
                onClick={() =>
                  dispatch({
                    type: "savePilotVariation",
                    variation: {
                      id: newId("pilot-variation"),
                      sourceMaterialId: MATERIAL.id,
                      sourceVersion: MATERIAL.version,
                      materialId: ONE_NOTE_ANSWER_SHIFT.id,
                      materialVersion: ONE_NOTE_ANSWER_SHIFT.version,
                      answerMiddleCount: 3,
                      createdAt: new Date().toISOString(),
                    },
                  })
                }
              >
                {variationSaved ? "Variation added to this workspace" : "Keep this variation"}
              </button>
              {variationSaved && (
                <p>
                  Variation added to this workspace. Once the device save finishes, an exported backup will include it.
                  Return on a later day for the original phrase.
                </p>
              )}
            </div>
          )}
        </article>
        <aside className="pilot-side card">
          <h2>When something gets stuck</h2>
          <p>Choose the problem you actually met. Work on a smaller part, then return to both bars.</p>
          {PILOT_EPISODE.obstacles.map((obstacle) => (
            <button className="secondary-action" key={obstacle.id} onClick={() => changeStep("repair", obstacle.id)}>
              {obstacle.learnerSignal}
            </button>
          ))}
          <div className="pilot-recording">
            <h3>Compare your sound</h3>
            <p>Optional. A recording stays in this tab unless you download it. Nothing uploads.</p>
            {recording ? (
              <button className="primary-action" onClick={() => void stopRecording()}>
                Stop recording
              </button>
            ) : (
              <button className="secondary-action" disabled={Boolean(takeUrl)} onClick={() => void startRecording()}>
                Record a temporary take
              </button>
            )}
            {takeUrl && (
              <>
                <button
                  className="secondary-action"
                  onClick={() => {
                    if (check) dispatch({ type: "updatePilot", patch: { assistance: "reveal" } });
                    void play(MATERIAL, "reference");
                  }}
                >
                  Hear reference for comparison
                </button>
                <audio controls src={takeUrl} aria-label="Your temporary take" />
                <small>Play the reference, then your take. Listen for where each sound starts and stops.</small>
                <a href={takeUrl} download={takeFilename} onClick={() => setTakeDownloaded(true)}>
                  Download take
                </a>
                <button className="text-action" onClick={discardTake}>
                  Discard take
                </button>
              </>
            )}
          </div>
          {firstSuccess && (
            <p className="pilot-return">
              {due
                ? variationSaved
                  ? "A later check is ready. Try the original before looking."
                  : "Keep your variation, then come back for the later check."
                : "Come back on a later day for one unaided check. A success today is a start, not lasting mastery."}
            </p>
          )}
          {attempts.length > 0 && (
            <small>
              {attempts.length} reported attempt{attempts.length === 1 ? "" : "s"} on this device. Earlier broad
              activity records remain separate.
            </small>
          )}
          <button
            className="text-action"
            onClick={() => {
              stop();
              recordingAttemptRef.current = false;
              setPlayed(false);
              setObservation("");
              setEvidenceIds([]);
              dispatch({ type: "restartPilot", cursor: newCursor() });
            }}
          >
            Start the pilot again
          </button>
        </aside>
      </div>
    </section>
  );
}
