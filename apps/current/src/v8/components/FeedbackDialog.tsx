import { useId, useState } from "react";
import { NOTE_LIMITS } from "../limits";
import { FEEDBACK_CATEGORY_LABELS, feedbackRefusal, newFeedbackNote, type FeedbackTarget } from "../notes";
import { useV8Store } from "../store";
import { FEEDBACK_CATEGORIES, type FeedbackCategory } from "../types";
import { Modal } from "./Modal";
import { useUpdateHold } from "./UpdateNotice";

/**
 * "Something's wrong here". Captures what the learner was looking at, their
 * own words and an optional category. The note is its own record: it never
 * counts as practice, success or evidence.
 */
export function FeedbackDialog({ target, onDone }: { target: FeedbackTarget; onDone: (saved: boolean) => void }) {
  const { state, dispatch } = useV8Store();
  const [text, setText] = useState("");
  const [category, setCategory] = useState<FeedbackCategory | "">("");
  const [problem, setProblem] = useState("");
  const textId = useId();
  const unsaved = text.trim().length > 0;
  useUpdateHold(unsaved, "the note you are writing");

  const save = () => {
    const refusal = feedbackRefusal(state, text);
    if (refusal) {
      setProblem(refusal);
      return;
    }
    dispatch({
      type: "addFeedbackNote",
      note: newFeedbackNote(target, text.trim(), category || undefined, __APP_VERSION__),
    });
    onDone(true);
  };
  const requestClose = () => {
    if (unsaved) {
      setProblem("Your note is not saved yet. Save it, or choose Discard.");
      return;
    }
    onDone(false);
  };

  return (
    <Modal className="settings-backdrop feedback-backdrop" labelledBy="feedback-title" onRequestClose={requestClose}>
      <section className="settings-panel feedback-panel">
        <header>
          <div>
            <span>Something's wrong here</span>
            <h2 id="feedback-title">Leave a note about this</h2>
          </div>
          <button className="icon-button" onClick={requestClose} aria-label="Close note">
            ×
          </button>
        </header>
        <dl className="feedback-context">
          <div>
            <dt>About</dt>
            <dd>
              {target.contentTitle}
              {target.contentVersion !== undefined ? ` (version ${target.contentVersion})` : ""}
            </dd>
          </div>
          {target.location && (
            <div>
              <dt>Where</dt>
              <dd>{target.location}</dd>
            </div>
          )}
          <div>
            <dt>Showing</dt>
            <dd>{target.showing}</dd>
          </div>
        </dl>
        <label className="feedback-text" htmlFor={textId}>
          What is wrong, or what did you expect?
        </label>
        <textarea
          id={textId}
          data-autofocus
          value={text}
          maxLength={NOTE_LIMITS.text}
          onChange={(event) => {
            setText(event.target.value);
            setProblem("");
          }}
          placeholder="For example: the G on beat 2 sounds wrong, or the stretch from fret 1 to 5 is too wide for me."
        />
        <fieldset className="feedback-categories">
          <legend>Kind of problem (optional)</legend>
          {FEEDBACK_CATEGORIES.map((id) => (
            <label key={id} className="check-line">
              <input
                type="radio"
                name="feedback-category"
                value={id}
                checked={category === id}
                onChange={() => setCategory(id)}
              />
              {FEEDBACK_CATEGORY_LABELS[id]}
            </label>
          ))}
        </fieldset>
        <p className="feedback-privacy">
          Notes stay on this device and in your backups, and sync to your other signed-in devices. They never count as
          practice or progress.
        </p>
        {problem && (
          <p className="feedback-problem" role="alert">
            {problem}
          </p>
        )}
        <div className="action-row">
          <button className="primary-action" onClick={save}>
            Save note
          </button>
          {unsaved ? (
            <button className="text-action" onClick={() => onDone(false)}>
              Discard
            </button>
          ) : (
            <button className="text-action" onClick={() => onDone(false)}>
              Cancel
            </button>
          )}
        </div>
      </section>
    </Modal>
  );
}
