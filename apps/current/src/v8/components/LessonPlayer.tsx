import { useEffect, useRef, useState, type MutableRefObject } from "react";
import {
  startScorePlayback,
  stopScorePlayback,
  type ScorePlaybackMode,
  type ScorePlaybackProgress,
} from "../../audio/scorePlayer";
import { barAndCount } from "../../core/score/time";
import { totalTicks } from "../../core/score/validate";
import type { Score } from "../../core/score/types";
import { activityById, unitById } from "../curriculum";
import { localDateAt } from "../dates";
import { newId } from "../identity";
import { createEvidence } from "../learning";
import {
  firstLessonSuccess,
  lessonAttempts,
  lessonCursor,
  lessonLaterSuccess,
  lessonRecallDue,
  listeningOutcome,
  madeSomething,
  madeSummary,
  newLessonCursor,
  NOTHING_YET,
  recordLessonAnswer,
  sketchFromScore,
  transferSuccess,
} from "../lessonProgress";
import { loadLesson } from "../lessons/load";
import { discardBrokenPackFiles } from "../lessonPacks";
import { scoreById, type Lesson, type LessonEntry, type ListeningQuestion } from "../lessons/format";
import { PIECE_CATALOG } from "../pieces/catalog";
import { useOpenPiece } from "../pieceOverlay";
import { useV8Store } from "../store";
import type { EvidenceOutcome, LessonAttempt, LessonCursor, LessonStep } from "../types";
import { ContentStatus } from "./ContentStatus";
import { RecordSaveStatus } from "./SaveStatus";
import { ListeningCheck } from "./ListeningCheck";
import { ScoreView } from "./score/ScoreView";
import { useUpdateHold } from "./UpdateNotice";

const LARGE_KEY = "interval.score.large";
const PIECE_TITLES: Record<string, string> = Object.fromEntries(PIECE_CATALOG.map((entry) => [entry.id, entry.title]));
const STEP_NAMES: Record<LessonStep, string> = {
  learn: "1 · Learn it",
  practise: "2 · Practise it",
  try: "3 · Try unaided",
  transfer: "4 · Move it",
  create: "5 · Make it yours",
  return: "6 · Return later",
};
const OUTCOME_LABELS: Record<EvidenceOutcome, string> = {
  retry: "Needs another pass",
  partial: "Partly there",
  successful: "I could do it",
};

function readLarge(): boolean {
  try {
    return localStorage.getItem(LARGE_KEY) === "1";
  } catch {
    return false;
  }
}

function writeLarge(value: boolean) {
  try {
    localStorage.setItem(LARGE_KEY, value ? "1" : "0");
  } catch {
    /* A private window keeps the choice for this view only. */
  }
}

interface PlayerProps {
  onClose?: () => void;
  requestCloseRef?: MutableRefObject<(() => void) | null>;
}

/** Loads one authored lesson's stage, then runs it. */
export function LessonPlayer({ entry, ...props }: PlayerProps & { entry: LessonEntry }) {
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    let alive = true;
    setLesson(null);
    setError("");
    loadLesson(entry).then(
      (loaded) => alive && setLesson(loaded),
      (failure: unknown) => {
        // A page served in place of a missing file must not pass as a saved lesson.
        void discardBrokenPackFiles();
        if (alive) setError(failure instanceof Error ? failure.message : "This lesson couldn't load.");
      },
    );
    return () => {
      alive = false;
    };
  }, [entry]);
  useEffect(() => {
    if (!props.requestCloseRef || lesson) return;
    props.requestCloseRef.current = () => props.onClose?.();
    return () => {
      if (props.requestCloseRef) props.requestCloseRef.current = null;
    };
  });
  if (error)
    return (
      <section className="pilot-episode" aria-labelledby="activity-title">
        <header className="activity-header">
          <button className="icon-button" onClick={props.onClose} aria-label="Close lesson" data-autofocus>
            ←
          </button>
          <div>
            <h1 id="activity-title">{entry.title}</h1>
            <p className="pilot-notice" role="alert">
              {error}
            </p>
          </div>
        </header>
      </section>
    );
  if (!lesson)
    return (
      <section className="pilot-episode" aria-labelledby="activity-title">
        <header className="activity-header">
          <span />
          <h1 id="activity-title">Opening “{entry.title}”…</h1>
        </header>
      </section>
    );
  return <LessonBody lesson={lesson} {...props} />;
}

function LessonBody({ lesson, onClose, requestCloseRef }: PlayerProps & { lesson: Lesson }) {
  const { state, dispatch } = useV8Store();
  // Every hook runs before the early return below, so the order never changes between renders.
  const openPiece = useOpenPiece();
  const unit = unitById(lesson.unitId);
  const activityId = `${lesson.unitId}-${lesson.activityKind}`;
  const cursor = lessonCursor(state, lesson);
  const [progress, setProgress] = useState<ScorePlaybackProgress | null>(null);
  const [playing, setPlaying] = useState(false);
  const [loop, setLoop] = useState(false);
  const [practiseMode, setPractiseMode] = useState<ScorePlaybackMode>("guided");
  const [sectionId, setSectionId] = useState("whole");
  const [played, setPlayed] = useState(false);
  const [observation, setObservation] = useState("");
  const [notice, setNotice] = useState("");
  const [large, setLarge] = useState(readLarge);
  const [evidenceIds, setEvidenceIds] = useState<string[]>([]);
  const stopRef = useRef<(() => void) | null>(null);
  const generation = useRef(0);
  const recording = useRef(false);

  useEffect(() => {
    if (!cursor) dispatch({ type: "beginLesson", cursor: newLessonCursor(lesson) });
  }, [cursor, dispatch, lesson]);
  useEffect(
    () => () => {
      generation.current++;
      stopScorePlayback();
    },
    [],
  );
  useUpdateHold(playing || observation.trim().length > 0, "the lesson you are playing or an unsaved observation");

  const stop = () => {
    generation.current++;
    stopRef.current?.();
    stopRef.current = null;
    setPlaying(false);
    setProgress(null);
  };
  const requestClose = () => {
    if (observation.trim()) {
      setNotice("Record or clear your observation before leaving this lesson.");
      return;
    }
    stop();
    onClose?.();
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

  const attempts = lessonAttempts(state, lesson);
  const firstSuccess = firstLessonSuccess(attempts);
  const transferred = transferSuccess(attempts);
  const laterSuccess = lessonLaterSuccess(lesson, attempts);
  const recallDue = lessonRecallDue(lesson, firstSuccess);
  const step = cursor.step;
  const check = step === "try" || step === "transfer" || step === "return";
  /** A making check: the learner makes their own version in Create and reports on it (checkKind "creating"). */
  const making = lesson.checkKind === "creating" && step === "try";
  /** A listening check: the app plays concealed examples and marks each answer (checkKind "listening"). */
  const listening =
    lesson.checkKind === "listening" && Boolean(lesson.listening) && (step === "try" || step === "return");
  const madeSketch = making && cursor.sketchId ? state.sketches.find((item) => item.id === cursor.sketchId) : undefined;
  // The version starts as the check's music; it counts as made once the learner has added what the lesson asks for.
  const madeIt = Boolean(madeSketch && lesson.making && madeSomething(madeSketch, lesson.making));
  const repair = step === "practise" ? lesson.likelyErrors.find((item) => item.id === cursor.errorId) : undefined;
  const cueFor = (phase: "learn" | "practise" | "try-unaided") =>
    lesson.cueFading.find((item) => item.phase === phase)!;
  const score: Score = scoreById(lesson, cursor.scoreId);
  const section =
    step === "practise" && !repair && sectionId !== "whole"
      ? score.sections.find((item) => item.id === sectionId)
      : undefined;
  const fromTick = repair?.from ?? section?.from ?? 0;
  const toTick = repair?.to ?? section?.to ?? totalTicks(score);
  const ranged = Boolean(repair || section);
  const conceal = check && !making && cursor.assistance !== "reveal";
  const tempo = Math.min(score.tempo.maximum, Math.max(score.tempo.minimum, cursor.tempo));
  const update = (
    patch: Partial<
      Pick<LessonCursor, "step" | "scoreId" | "tempo" | "assistance" | "attemptId" | "errorId" | "sketchId">
    >,
  ) => dispatch({ type: "updateLesson", lessonId: lesson.id, patch });

  const changeStep = (next: LessonStep) => {
    stop();
    recording.current = false;
    setPlayed(false);
    setObservation("");
    setEvidenceIds([]);
    setSectionId("whole");
    setNotice("");
    const scoreId =
      next === "learn"
        ? lesson.demonstration.scoreId
        : next === "practise"
          ? cueFor("practise").scoreId
          : next === "try"
            ? cueFor("try-unaided").scoreId
            : next === "transfer"
              ? lesson.transfer.scoreId
              : next === "return"
                ? lesson.retrieval.scoreId
                : lesson.demonstration.scoreId;
    const target = scoreById(lesson, scoreId);
    update({
      step: next,
      scoreId,
      errorId: undefined,
      assistance: "none",
      tempo:
        next === "return"
          ? lesson.retrieval.tempo
          : Math.min(target.tempo.maximum, Math.max(target.tempo.minimum, cursor.tempo)),
      attemptId: next === "try" || next === "transfer" || next === "return" ? newId("lesson-attempt") : undefined,
    });
  };

  const play = async (mode: ScorePlaybackMode, playScore: Score = score, playTempo = tempo) => {
    stop();
    const mine = generation.current;
    setNotice("");
    try {
      const stopPlayback = await startScorePlayback(
        playScore,
        {
          tempo: playTempo,
          fromTick: playScore === score ? fromTick : 0,
          toTick: playScore === score ? toTick : totalTicks(playScore),
          mode,
          loop: loop && !check,
          countIn: true,
          click: true,
          accompaniment: (lesson.accompaniment?.[playScore.id] ?? []).map((id) => scoreById(lesson, id)),
        },
        setProgress,
        () => {
          if (mine !== generation.current) return;
          setPlaying(false);
          setProgress(null);
          if (mode === "unaided") {
            recording.current = false;
            setPlayed(true);
          }
        },
        () => {
          if (mine !== generation.current) return;
          setPlaying(false);
          setProgress(null);
          setNotice("Playback stopped because other sound started or the tab went into the background.");
        },
      );
      if (mine !== generation.current) {
        stopPlayback();
        return;
      }
      stopRef.current = stopPlayback;
      setPlaying(true);
    } catch (failure) {
      setNotice(
        failure instanceof Error ? failure.message : "Sound could not start. You can still play from the score.",
      );
    }
  };

  const record = (outcome: EvidenceOutcome) => {
    if (
      !check ||
      !(making ? madeIt : played) ||
      observation.trim().length < 8 ||
      !cursor.attemptId ||
      recording.current
    )
      return;
    const artifactId = making ? madeSketch?.id : undefined;
    recording.current = true;
    const now = new Date();
    const kind: LessonAttempt["kind"] =
      step === "try" ? "first-check" : step === "transfer" ? "transfer-check" : "later-check";
    const attempt: LessonAttempt = {
      id: cursor.attemptId,
      cursorId: cursor.id,
      lessonId: lesson.id,
      lessonVersion: lesson.version,
      scoreId: score.id,
      scoreVersion: score.version,
      kind,
      assistance: cursor.assistance,
      method: "self-reported",
      tempo,
      outcome,
      observation: observation.trim(),
      ...(artifactId ? { artifactId } : {}),
      occurredAt: now.toISOString(),
      localDate: localDateAt(now),
    };
    dispatch({ type: "recordLessonAttempt", attempt });
    // The unaided check stands in for the unit's activity; the transfer check for its transfer activity.
    const target =
      kind === "first-check"
        ? activityById(activityId)
        : kind === "transfer-check"
          ? activityById(`${lesson.unitId}-transfer`)
          : null;
    if (target) {
      const evidence = createEvidence(
        target.id,
        target.competencyIds,
        target.source,
        cursor.assistance,
        outcome,
        {},
        now.toISOString(),
        kind === "first-check" ? artifactId : undefined,
      );
      dispatch({ type: "recordActivity", activityId: target.id, evidence });
      setEvidenceIds(evidence.map((item) => item.id));
    }
    setPlayed(false);
    setObservation("");
    update({ attemptId: newId("lesson-attempt") });
    setNotice(
      making
        ? "Your report on your own version was added, linked to the sketch you made. Nothing graded it."
        : outcome === "successful"
          ? "Your self-report was added to this workspace. Nothing measured your playing. Check the save status before leaving."
          : "Your self-report was added. Pick the problem you met under “When something gets stuck”, then try again.",
    );
  };

  /** Play a listening question's example, or the lesson's own version as a hint, at its own tempo. */
  const hearScore = (id: string) => {
    const example = scoreById(lesson, id);
    void play("reference", example, example.tempo.default);
  };

  /** Each answer to a first check is recorded at once, as exact-answer evidence for the unit's activity. */
  const answerQuestion = (question: ListeningQuestion, response: string, usedHint: boolean) => {
    if (step !== "try") return;
    const target = activityById(activityId);
    if (!target) return;
    const evidence = recordLessonAnswer(lesson, question, response, usedHint, target);
    dispatch({ type: "recordActivity", activityId: target.id, evidence });
    setEvidenceIds((ids) => [...ids, ...evidence.map((item) => item.id)]);
  };

  /** The whole set becomes one lesson attempt, marked by the app. */
  const finishListening = (right: number, total: number, usedHint: boolean) => {
    if (!cursor.attemptId) return;
    const now = new Date();
    dispatch({
      type: "recordLessonAttempt",
      attempt: {
        id: cursor.attemptId,
        cursorId: cursor.id,
        lessonId: lesson.id,
        lessonVersion: lesson.version,
        scoreId: score.id,
        scoreVersion: score.version,
        kind: step === "try" ? "first-check" : "later-check",
        assistance: usedHint ? "hint" : "none",
        method: "exact-answer",
        tempo,
        outcome: listeningOutcome(right, total),
        observation: `Named ${right} of ${total} examples correctly${usedHint ? " after hearing the lesson's version again" : ""}.`,
        occurredAt: now.toISOString(),
        localDate: localDateAt(now),
      },
    });
    update({ attemptId: newId("lesson-attempt") });
  };

  /** Start the learner's own version of the check's music in Create, and remember it for the report. */
  const makeMine = () => {
    if (observation.trim()) {
      setNotice("Record or clear your observation before opening Create.");
      return;
    }
    stop();
    if (madeSketch) {
      // Reopen the version already started, never a second copy.
      dispatch({ type: "setActiveSketch", id: madeSketch.id });
      dispatch({ type: "suspendActivity", route: "create" });
      history.pushState({}, "", "/create");
      return;
    }
    const sketch = sketchFromScore(lesson, score, tempo, state.sketches.length);
    sketch.name = `${lesson.title}: my version`;
    if (lesson.making?.adds === "chords") sketch.chords = [];
    update({ sketchId: sketch.id });
    dispatch({ type: "createFromLesson", sketch, returnActivityId: activityId });
    history.pushState({}, "", "/create");
  };

  const playThePiece = () => {
    if (lesson.performance.kind !== "piece") return;
    if (observation.trim()) {
      setNotice("Record or clear your observation before opening the piece.");
      return;
    }
    stop();
    const { pieceId, partId } = lesson.performance;
    onClose?.();
    openPiece({ pieceId, partId });
  };

  const makeYourOwn = () => {
    if (observation.trim()) {
      setNotice("Record or clear your observation before opening Create.");
      return;
    }
    stop();
    const sketch = sketchFromScore(
      lesson,
      scoreById(lesson, lesson.demonstration.scoreId),
      tempo,
      state.sketches.length,
    );
    dispatch({ type: "createFromLesson", sketch, returnActivityId: activityId });
    history.pushState({}, "", "/create");
  };

  const where = () => {
    const tick = progress?.tick;
    const place =
      tick === null || tick === undefined
        ? ""
        : (() => {
            const { bar, count } = barAndCount(tick, score.metre);
            return ` · bar ${bar}, count ${count}`;
          })();
    return `${STEP_NAMES[step]} · ${score.title} (${score.id} v${score.version}) · ${tempo} BPM${place}`;
  };
  const feedbackTarget = () => ({
    contentId: lesson.id,
    contentVersion: lesson.version,
    contentTitle: `Unit ${unit.order} · ${lesson.title}`,
    location: where(),
    showing: [
      repair ? `repairing "${repair.signal}"` : "",
      conceal ? "positions hidden for the check" : "score visible",
      playing ? `playing (${progress?.phase ?? "starting"})` : "not playing",
      large ? "music-stand view" : "",
    ]
      .filter(Boolean)
      .join("; "),
  });

  const cue =
    step === "learn"
      ? cueFor("learn")
      : step === "practise"
        ? cueFor("practise")
        : step === "try"
          ? cueFor("try-unaided")
          : null;
  const heading =
    step === "learn"
      ? "Hear it, see it, find it"
      : step === "practise"
        ? repair
          ? repair.signal
          : "Play beside the count"
        : step === "try"
          ? "Play it without the answer in front of you"
          : step === "transfer"
            ? "Take it somewhere new"
            : step === "create"
              ? "Make it yours"
              : "Can you still play it on another day?";
  const instruction =
    repair?.repair ??
    cue?.instruction ??
    (step === "transfer"
      ? lesson.transfer.instruction
      : step === "return"
        ? lesson.retrieval.instruction
        : lesson.performance.instruction);

  return (
    <section className="pilot-episode" aria-labelledby="activity-title">
      <header className="activity-header">
        <button className="icon-button" onClick={requestClose} aria-label="Close lesson" data-autofocus>
          ←
        </button>
        <div>
          <span>
            Learn · Unit {unit.order} · {unit.title}
          </span>
          <h1 id="activity-title">{lesson.title}</h1>
          <p>{lesson.purpose}</p>
          <p>
            <strong>Where this goes:</strong> {lesson.destination}
          </p>
          <ContentStatus
            provenance={{ contentId: lesson.id, contentVersion: lesson.version, ...lesson.provenance }}
            target={feedbackTarget}
          />
        </div>
      </header>
      {notice && (
        <p className="pilot-notice" role="status">
          {notice}
        </p>
      )}
      {laterSuccess && (
        <p className="pilot-notice" role="status">
          You reported an unaided success on a later day. That is your report; nothing measured your playing.
        </p>
      )}
      <nav className="pilot-steps" aria-label="Lesson steps">
        {(Object.keys(STEP_NAMES) as LessonStep[]).map((name) => (
          <button
            key={name}
            aria-current={step === name ? "step" : undefined}
            disabled={
              (name === "transfer" || name === "create") && !firstSuccess
                ? true
                : name === "return"
                  ? !recallDue
                  : false
            }
            onClick={() => changeStep(name)}
          >
            {STEP_NAMES[name]}
          </button>
        ))}
      </nav>
      <div className="pilot-layout">
        <article className="pilot-main card">
          <span className="eyebrow">
            {step === "practise" && repair ? "A smaller step" : STEP_NAMES[step].slice(4)}
          </span>
          <h2>{heading}</h2>
          <p>{instruction}</p>
          {step === "learn" && (
            <>
              <h3>Your hands</h3>
              <ul className="lesson-guidance">
                {lesson.demonstration.handGuidance.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
              {lesson.demonstration.videoNeeded.length > 0 && (
                <p className="lesson-video-needed">
                  <strong>Demonstration video still needed</strong> for {lesson.demonstration.videoNeeded.join(", ")}.
                  Until then, follow the written guidance and the synthesised sound.
                </p>
              )}
            </>
          )}
          {step === "practise" && !repair && (
            <div className="lesson-study-picker" role="group" aria-label="Choose a study">
              {lesson.studies.map((study) => (
                <button
                  key={study.id}
                  className="secondary-action"
                  aria-pressed={cursor.scoreId === study.scoreId}
                  onClick={() => {
                    stop();
                    setSectionId("whole");
                    const target = scoreById(lesson, study.scoreId);
                    update({
                      scoreId: study.scoreId,
                      tempo: Math.min(target.tempo.maximum, Math.max(target.tempo.minimum, cursor.tempo)),
                    });
                  }}
                >
                  {study.title}
                </button>
              ))}
              <small>{lesson.studies.find((study) => study.scoreId === cursor.scoreId)?.changes}</small>
            </div>
          )}
          {step !== "create" && !listening && (
            <ScoreView
              score={score}
              activeTick={conceal ? null : (progress?.tick ?? null)}
              conceal={conceal}
              range={ranged ? { from: fromTick, to: toTick } : undefined}
              large={large}
              eyebrow={step === "practise" ? "Exact study" : step === "transfer" ? "New context" : undefined}
            />
          )}
          {step !== "create" && !listening && (lesson.accompaniment?.[score.id] ?? []).length > 0 && (
            <p className="lesson-accompaniment">
              {conceal
                ? "While you play, a synthesised second guitar plays along."
                : `While you play, a synthesised second guitar plays: ${(lesson.accompaniment?.[score.id] ?? [])
                    .map((id) => scoreById(lesson, id).title)
                    .join("; ")}.`}
            </p>
          )}
          {step !== "create" && !listening && (
            <div className="pilot-controls">
              <label className="lesson-tempo">
                Tempo · {tempo} BPM
                <input
                  type="range"
                  min={score.tempo.minimum}
                  max={score.tempo.maximum}
                  step={1}
                  value={tempo}
                  disabled={step === "return"}
                  onChange={(event) => {
                    stop();
                    update({ tempo: Number(event.target.value) });
                  }}
                />
              </label>
              {step === "practise" && !repair && score.sections.length > 1 && (
                <label>
                  Play{" "}
                  <select
                    value={sectionId}
                    onChange={(event) => {
                      stop();
                      setSectionId(event.target.value);
                    }}
                  >
                    <option value="whole">Whole study</option>
                    {score.sections.map((section) => (
                      <option key={section.id} value={section.id}>
                        {section.label} only
                      </option>
                    ))}
                  </select>
                </label>
              )}
              {step === "practise" && (
                <label>
                  Sound{" "}
                  <select
                    value={practiseMode}
                    onChange={(event) => setPractiseMode(event.target.value as ScorePlaybackMode)}
                  >
                    <option value="guided">Hear it, then my turn</option>
                    <option value="count-only">Count only</option>
                    <option value="reference">The model, every time</option>
                  </select>
                </label>
              )}
              {!check && (
                <label className="pilot-loop">
                  <input type="checkbox" checked={loop} onChange={(event) => setLoop(event.target.checked)} /> Loop
                </label>
              )}
              <label className="pilot-loop">
                <input
                  type="checkbox"
                  checked={large}
                  onChange={(event) => {
                    setLarge(event.target.checked);
                    writeLarge(event.target.checked);
                  }}
                />{" "}
                Music-stand view
              </label>
            </div>
          )}
          {step !== "create" && !listening && (
            <div className="pilot-play-actions">
              <button
                className="primary-action large"
                onClick={() =>
                  void play(step === "learn" || making ? "reference" : step === "practise" ? practiseMode : "unaided")
                }
              >
                {step === "learn"
                  ? "Hear the exact music"
                  : making
                    ? "Hear what you are working with"
                    : step === "practise"
                      ? "Count in and play"
                      : "Count in, then I play"}
              </button>
              {check && (
                <button
                  className="secondary-action"
                  onClick={() => {
                    if (cursor.assistance !== "reveal") update({ assistance: "reveal" });
                    void play("reference", making ? scoreById(lesson, lesson.demonstration.scoreId) : score);
                  }}
                >
                  {making ? "Hear the lesson's version" : "Hear the answer"}
                </button>
              )}
              <button className="secondary-action" disabled={!playing} onClick={stop}>
                Stop sound
              </button>
            </div>
          )}
          {step !== "create" && (
            <p className="pilot-playing" role="status" aria-live="off">
              {progress
                ? progress.phase === "count-in"
                  ? `Count in: ${progress.count}`
                  : `${progress.phase === "your-turn" ? "Your turn" : "Reference"} · count ${progress.count}`
                : "Ready when you are."}
            </p>
          )}
          {step !== "create" && (
            <small>
              The sound is a synthesised guitar for timing and pitch, not a recording of real hands. Play along on your
              own guitar.
            </small>
          )}
          {step === "learn" && (
            <button className="secondary-action" onClick={() => changeStep("practise")}>
              Practise with the count →
            </button>
          )}
          {step === "practise" && repair && (
            <button className="secondary-action" onClick={() => update({ errorId: undefined })}>
              Return to the whole study →
            </button>
          )}
          {step === "practise" && !repair && (
            <button className="secondary-action" onClick={() => changeStep("try")}>
              Try without the notes →
            </button>
          )}
          {check && (
            <div className="pilot-check">
              {step === "try" && (
                <ul className="lesson-guidance" aria-label="Success means">
                  {lesson.successCriteria.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              )}
              {listening && lesson.listening ? (
                <ListeningCheck
                  key={cursor.attemptId}
                  questions={lesson.listening.questions}
                  onHear={(question) => hearScore(question.scoreId)}
                  onHint={() => hearScore(lesson.demonstration.scoreId)}
                  onAnswer={answerQuestion}
                  onFinish={finishListening}
                />
              ) : (
                <>
                  {making ? (
                    <div className="lesson-making">
                      <button className="secondary-action" onClick={makeMine}>
                        {madeSketch ? "Open my version in Create again →" : "Make my version in Create →"}
                      </button>
                      <p role="status">
                        {madeSketch && lesson.making
                          ? madeIt
                            ? `Your version: “${madeSketch.name}”, ${madeSummary(madeSketch, lesson.making)}. Report on it below.`
                            : `“${madeSketch.name}” has nothing of yours in it yet. ${NOTHING_YET[lesson.making.adds]}`
                          : cursor.sketchId
                            ? "The version you started is no longer in Create. Make a new one."
                            : lesson.making?.start}
                      </p>
                    </div>
                  ) : (
                    !played && (
                      <button
                        className="text-action"
                        onClick={() => {
                          recording.current = false;
                          setPlayed(true);
                        }}
                      >
                        I played it without the app sound
                      </button>
                    )
                  )}
                  {!making && cursor.assistance !== "reveal" && (
                    <button className="text-action" onClick={() => update({ assistance: "reveal" })}>
                      Show the notes to help me
                    </button>
                  )}
                  <label>
                    One concrete observation{" "}
                    <textarea
                      maxLength={1000}
                      value={observation}
                      onChange={(event) => setObservation(event.target.value)}
                      placeholder={
                        making ? lesson.making?.prompt : "What happened at the change, the third, or the count?"
                      }
                    />
                  </label>
                  <small>
                    {making
                      ? cursor.assistance === "none"
                        ? "This is your own version, made without replaying the lesson's version during this check."
                        : "You heard the lesson's version first; this is recorded as assisted."
                      : cursor.assistance === "none"
                        ? "This check is unaided if you keep the notes hidden."
                        : "You used the notes or the sound; this check is recorded as assisted."}{" "}
                    {making
                      ? "The result is your report on what you made; nothing graded it."
                      : "The result is your report, not a score from the microphone."}
                  </small>
                  <div className="pilot-outcomes">
                    {(["retry", "partial", "successful"] as const).map((outcome) => (
                      <button
                        key={outcome}
                        disabled={!(making ? madeIt : played) || observation.trim().length < 8}
                        onClick={() => record(outcome)}
                      >
                        {OUTCOME_LABELS[outcome]}
                      </button>
                    ))}
                  </div>
                </>
              )}
              {evidenceIds.length > 0 && <RecordSaveStatus evidenceIds={evidenceIds} />}
            </div>
          )}
          {step === "create" && lesson.performance.kind === "piece" && (
            <div className="pilot-variation">
              <button className="primary-action" onClick={playThePiece}>
                Play it in {PIECE_TITLES[lesson.performance.pieceId] ?? "the piece"} →
              </button>
              <small>
                The piece opens with its second guitar. Come back to this lesson any time from the course map.
              </small>
            </div>
          )}
          {step === "create" && (
            <div className="pilot-variation">
              {lesson.performance.kind === "piece" && <h3>Or make your own version</h3>}
              <button
                className={lesson.performance.kind === "piece" ? "secondary-action" : "primary-action"}
                onClick={makeYourOwn}
              >
                Make an editable copy in Create →
              </button>
              <small>The lesson stays as it is here. Your copy is yours to change, and Create brings you back.</small>
            </div>
          )}
        </article>
        <aside className="pilot-side card">
          {(step === "practise" || step === "learn") && (
            <>
              <h2>When something gets stuck</h2>
              <p>Choose the problem you actually met. Work on a smaller part, then return to the whole study.</p>
              {lesson.likelyErrors.map((error) => (
                <button
                  className="secondary-action"
                  key={error.id}
                  aria-pressed={cursor.errorId === error.id}
                  onClick={() => {
                    stop();
                    setSectionId("whole");
                    setNotice("");
                    const target = scoreById(lesson, error.scoreId);
                    update({
                      step: "practise",
                      errorId: error.id,
                      scoreId: error.scoreId,
                      assistance: "none",
                      attemptId: undefined,
                      tempo: target.tempo.minimum,
                    });
                  }}
                >
                  {error.signal}
                </button>
              ))}
            </>
          )}
          <h2>What this builds</h2>
          <ul className="lesson-guidance">
            {lesson.capabilities.map((capability) => (
              <li key={capability.id}>
                <strong>{capability.title}.</strong> {capability.criterion}
              </li>
            ))}
          </ul>
          <p>
            <strong>The one thing that changes:</strong> {lesson.variable}
          </p>
          {firstSuccess && (
            <p className="pilot-return">
              {recallDue
                ? "A later check is ready. Try it before looking."
                : `Come back on a later day for the recall check. A success today is a start, not lasting mastery.`}
            </p>
          )}
          {transferred && <small>You reported moving it to a new context.</small>}
          {attempts.length > 0 && (
            <small>
              {attempts.length} reported attempt{attempts.length === 1 ? "" : "s"} on this device.
            </small>
          )}
          <button
            className="text-action"
            onClick={() => {
              stop();
              setPlayed(false);
              setObservation("");
              setEvidenceIds([]);
              dispatch({ type: "restartLesson", cursor: newLessonCursor(lesson) });
            }}
          >
            Start this lesson again
          </button>
        </aside>
      </div>
    </section>
  );
}
