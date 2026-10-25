import { useId, useState } from "react";
import type { ListeningQuestion } from "../lessons/format";
import { shuffleListeningSet } from "../lessonProgress";

export interface ListeningAnswer {
  question: ListeningQuestion;
  response: string;
}

/** Why a set's answers count as helped: none, a hint, or answers already revealed today. */
export type ListeningHelp = "none" | "hint" | "seen";

interface Props {
  questions: readonly ListeningQuestion[];
  /** Answers to these questions were already revealed today, so this set starts as practice with help. */
  answersSeen: boolean;
  /** Play one example; its notes stay hidden. */
  onHear: (question: ListeningQuestion) => void;
  /** Replay the lesson's own examples. Answers given afterwards in this set count as hinted. */
  onHint: () => void;
  /** Record the whole set, together, once every example is answered. */
  onFinish: (answers: ListeningAnswer[], help: ListeningHelp) => void;
}

/**
 * A listening check: hear a concealed example, choose what it is, and see at
 * once whether that was right and why. The app marks the answer, so nothing
 * here is a self-report. Each run shuffles the examples and their choices;
 * once answers have been revealed, a further run is practice with help.
 */
export function ListeningCheck({ questions, answersSeen, onHear, onHint, onFinish }: Props) {
  const [order, setOrder] = useState(() => shuffleListeningSet(questions));
  const [index, setIndex] = useState(0);
  const [choice, setChoice] = useState<string | null>(null);
  const [answered, setAnswered] = useState<string | null>(null);
  const [answers, setAnswers] = useState<ListeningAnswer[]>([]);
  const [heard, setHeard] = useState(false);
  const [hinted, setHinted] = useState(false);
  const [seen, setSeen] = useState(answersSeen);
  const [finished, setFinished] = useState(false);
  const hearFirst = useId();
  const question = order[index];
  const last = index === order.length - 1;
  const right = answers.filter((item) => item.response === item.question.answer).length;
  const help: ListeningHelp = hinted ? "hint" : seen ? "seen" : "none";

  const restart = () => {
    setOrder(shuffleListeningSet(questions));
    setIndex(0);
    setChoice(null);
    setAnswered(null);
    setAnswers([]);
    setHeard(false);
    setHinted(false);
    // Every answer of the last run was shown, so this run is practice with help.
    setSeen(true);
    setFinished(false);
  };

  const check = () => {
    if (!choice || answered) return;
    setAnswered(choice);
    const all = [...answers, { question, response: choice }];
    setAnswers(all);
    if (last) {
      setFinished(true);
      onFinish(all, help);
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
        Example {index + 1} of {order.length}
      </p>
      {seen && index === 0 && !answered && (
        <p>
          You have seen these answers today, so this round is practice with help. The examples are in a new order; come
          back another day for a clean check.
        </p>
      )}
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
              setHinted(true);
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
        <button
          className="secondary-action"
          disabled={!choice || !heard}
          aria-describedby={!heard ? hearFirst : undefined}
          onClick={check}
        >
          Check my answer
        </button>
      )}
      {!heard && !answered && <small id={hearFirst}>Hear the example before you answer.</small>}
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
            You named {right} of {order.length} correctly
            {help === "hint"
              ? ", after hearing the lesson's version again"
              : help === "seen"
                ? ", having seen the answers earlier today"
                : ""}
            . The app marked each answer, so this is a checked result, not a self-report
            {help === "none" ? "" : ", recorded as practice with help"}.
          </p>
          <button className="text-action" onClick={restart}>
            Try the set again (in a new order, as practice)
          </button>
        </div>
      )}
    </div>
  );
}
