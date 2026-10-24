import { useState } from "react";
import type { ListeningQuestion } from "../lessons/format";

interface Props {
  questions: readonly ListeningQuestion[];
  /** Play one example; its notes stay hidden. */
  onHear: (question: ListeningQuestion) => void;
  /** Replay the lesson's own examples. Answers given afterwards in this set count as hinted. */
  onHint: () => void;
  /** Record one answer the moment it is checked. */
  onAnswer: (question: ListeningQuestion, response: string, usedHint: boolean) => void;
  /** Record the whole set once every example is answered. */
  onFinish: (right: number, total: number, usedHint: boolean) => void;
}

/**
 * A listening check: hear a concealed example, choose what it is, and see at
 * once whether that was right and why. The app marks the answer, so nothing
 * here is a self-report.
 */
export function ListeningCheck({ questions, onHear, onHint, onAnswer, onFinish }: Props) {
  const [index, setIndex] = useState(0);
  const [choice, setChoice] = useState<string | null>(null);
  const [answered, setAnswered] = useState<string | null>(null);
  const [right, setRight] = useState(0);
  const [heard, setHeard] = useState(false);
  const [usedHint, setUsedHint] = useState(false);
  const [finished, setFinished] = useState(false);
  const question = questions[index];
  const last = index === questions.length - 1;

  const restart = () => {
    setIndex(0);
    setChoice(null);
    setAnswered(null);
    setRight(0);
    setHeard(false);
    setUsedHint(false);
    setFinished(false);
  };

  const check = () => {
    if (!choice || answered) return;
    setAnswered(choice);
    const nowRight = right + (choice === question.answer ? 1 : 0);
    setRight(nowRight);
    onAnswer(question, choice, usedHint);
    if (last) {
      setFinished(true);
      onFinish(nowRight, questions.length, usedHint);
    }
  };

  const next = () => {
    setIndex(index + 1);
    setChoice(null);
    setAnswered(null);
    setHeard(false);
  };

  return (
    <div className="listening-check">
      <p className="listening-check__count">
        Example {index + 1} of {questions.length}
      </p>
      <p>{question.prompt}</p>
      <div className="pilot-play-actions">
        <button
          className="primary-action large"
          onClick={() => {
            setHeard(true);
            onHear(question);
          }}
        >
          {heard ? `Hear example ${index + 1} again` : `Hear example ${index + 1}`}
        </button>
        {!answered && (
          <button
            className="text-action"
            onClick={() => {
              setUsedHint(true);
              onHint();
            }}
          >
            Hear the lesson's version again (counts as a hint)
          </button>
        )}
      </div>
      <fieldset className="listening-check__choices" disabled={Boolean(answered)}>
        <legend>Your answer</legend>
        {question.choices.map((item) => (
          <label key={item}>
            <input
              type="radio"
              name={`listening-${question.id}`}
              value={item}
              checked={choice === item}
              onChange={() => setChoice(item)}
            />{" "}
            {item}
          </label>
        ))}
      </fieldset>
      {!answered && (
        <button className="secondary-action" disabled={!choice || !heard} onClick={check}>
          Check my answer
        </button>
      )}
      {!heard && !answered && <small>Hear the example before you answer.</small>}
      {answered && (
        <div role="status" className="listening-check__result">
          <p>
            <strong>{answered === question.answer ? "Right." : `Not this time: it was ${question.answer}.`}</strong>{" "}
            {question.explanation}
          </p>
        </div>
      )}
      {answered && !last && (
        <button className="secondary-action" onClick={next}>
          Next example →
        </button>
      )}
      {finished && (
        <div className="listening-check__summary">
          <p>
            You named {right} of {questions.length} correctly
            {usedHint ? ", after hearing the lesson's version again" : ""}. The app marked each answer, so this is a
            checked result, not a self-report.
          </p>
          <button className="text-action" onClick={restart}>
            Try the set again
          </button>
        </div>
      )}
    </div>
  );
}
