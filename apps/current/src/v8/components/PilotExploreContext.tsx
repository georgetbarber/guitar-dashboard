import { useEffect, useRef, useState } from "react";
import { playMidi, stopAudio } from "../../audio/engine";
import { startEpisodePlayback, stopEpisodePlayback } from "../../audio/episodePlayback";
import { ONE_NOTE_QUESTION_ANSWER } from "../pilotEpisode";
import { useV8Store } from "../store";
import { PilotStudy } from "./PilotStudy";

/** The explanation is attached to the version and region the learner was playing. */
export function PilotExploreContext() {
  const { state, dispatch, navigate } = useV8Store();
  const focus = state.exploreFocus;
  const [playing, setPlaying] = useState(false);
  const stopRef = useRef<(() => void) | null>(null);
  useEffect(
    () => () => {
      stopRef.current?.();
      stopEpisodePlayback();
      stopAudio();
    },
    [],
  );
  if (
    !focus ||
    focus.materialId !== ONE_NOTE_QUESTION_ANSWER.id ||
    focus.materialVersion !== ONE_NOTE_QUESTION_ANSWER.version
  )
    return null;

  const hear = async () => {
    stopRef.current?.();
    setPlaying(true);
    try {
      stopRef.current = await startEpisodePlayback(
        ONE_NOTE_QUESTION_ANSWER,
        {
          tempo: focus.tempo,
          section: focus.sectionId,
          mode: "reference",
          loop: false,
          pulse: true,
        },
        () => undefined,
        () => setPlaying(false),
        () => setPlaying(false),
      );
    } catch {
      setPlaying(false);
    }
  };
  const compareThird = (semitones: 3 | 4) => {
    stopRef.current?.();
    setPlaying(false);
    stopAudio();
    // Keep root and onset spacing identical. Only the target interval changes.
    playMidi(64, 0, 0.45);
    playMidi(64 + semitones, 0.65, 0.45);
    playMidi(64, 1.3, 0.6);
  };
  const returnToLesson = () => {
    stopRef.current?.();
    stopAudio();
    navigate(focus.returnRoute);
    dispatch({ type: "clearExploreFocus" });
    dispatch({ type: "resumeActivity" });
  };

  return (
    <section className="card pilot-context">
      <span className="eyebrow">From your lesson · exact music</span>
      <h2>The rest is part of the answer</h2>
      <p>
        At {focus.tempo} BPM in 4/4, the question plays open high E on counts 1 and 3. The answer plays the same pitch
        on 1, 2 and 4. Silence changes the shape without changing pitch. Touch string 1 lightly to end a note at a rest.
      </p>
      <PilotStudy material={ONE_NOTE_QUESTION_ANSWER} sectionId={focus.sectionId} tempo={focus.tempo} />
      <div className="action-row">
        <button className="secondary-action" onClick={() => void hear()}>
          Hear this {focus.sectionId === "whole" ? "phrase" : focus.sectionId} again
        </button>
        <button
          className="text-action"
          disabled={!playing}
          onClick={() => {
            stopRef.current?.();
            setPlaying(false);
          }}
        >
          Stop sound
        </button>
        <button className="primary-action" onClick={returnToLesson}>
          Return to the same lesson step →
        </button>
      </div>
      <details>
        <summary>Why is this E called home?</summary>
        <p>
          For this phrase, E is the tonal centre: the note everything is heard against. The played note is E4, string 1
          open. There is no chord here, so it is a tonal-centre note, not a “chord tone” of an invented chord.
        </p>
      </details>
      <div className="pilot-third-comparison">
        <h3>A separate comparison: move 3 to ♭3</h3>
        <p>
          This is a new three-note example, not a change to your rhythm lesson. Keep the E root and the rhythm fixed. G♯
          is four semitones above E (3); G is three semitones above E (♭3). On the high E string, those are frets 4 and
          3. Listen for the difference without assigning one fixed emotion.
        </p>
        <div className="action-row">
          <button onClick={() => compareThird(4)}>Hear E–G♯–E · 3</button>
          <button onClick={() => compareThird(3)}>Hear E–G–E · ♭3</button>
        </div>
        <details>
          <summary>What does ♭3 mean?</summary>
          <p>
            It means a minor third measured from this example's E root. It does not mean lowering every third in the
            current lesson, which contains only E.
          </p>
        </details>
      </div>
    </section>
  );
}
