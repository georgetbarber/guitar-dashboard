import { lazy, Suspense, useId, useState } from "react";
import { createPortal } from "react-dom";
import type { FeedbackTarget } from "../notes";
import { effectiveReview, newReviewMark, reviewMarkId, type AuthoredProvenance } from "../provenance";
import { NOTE_LIMITS } from "../limits";
import { useV8Store } from "../store";

const FeedbackDialog = lazy(() => import("./FeedbackDialog").then((module) => ({ default: module.FeedbackDialog })));

function shortDate(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

/**
 * The calm honesty strip on a lesson: whether anyone has played it on a guitar,
 * a way to say something is wrong, and George's "Mark as checked".
 *
 * Review status never locks anything. A draft lesson is fully playable.
 */
export function ContentStatus({
  provenance,
  target,
}: {
  provenance: AuthoredProvenance;
  /** Called when the note dialog opens, so it captures what is showing at that moment. */
  target: () => FeedbackTarget;
}) {
  const { state, dispatch } = useV8Store();
  const review = effectiveReview(provenance, state.reviewMarks);
  const [noteTarget, setNoteTarget] = useState<FeedbackTarget | null>(null);
  const [marking, setMarking] = useState(false);
  const [reviewer, setReviewer] = useState(state.reviewerName ?? "");
  const [message, setMessage] = useState("");
  const nameId = useId();
  const markId = reviewMarkId(provenance.contentId, provenance.contentVersion);

  const saveCheck = () => {
    const name = reviewer.trim();
    if (!name) {
      setMessage("Add your name so the check says who played it.");
      return;
    }
    dispatch({
      type: "markContentChecked",
      mark: newReviewMark(provenance.contentId, provenance.contentVersion, name),
    });
    setMarking(false);
    setMessage("Marked as checked. This lesson no longer shows the draft tag.");
  };

  return (
    <div className="content-status">
      <p className={`content-status__tag content-status__tag--${review.status}`}>
        {review.status === "draft"
          ? "Not yet checked on a guitar"
          : `${review.status === "trialled" ? "Trialled" : "Checked"} by ${review.reviewer} · ${shortDate(review.reviewedAt)}`}
      </p>
      <div className="content-status__actions">
        <button className="text-action" onClick={() => setNoteTarget(target())}>
          Something's wrong here
        </button>
        {review.status === "draft" && !marking && (
          <button
            className="text-action"
            onClick={() => {
              setMarking(true);
              setMessage("");
            }}
          >
            Mark as checked
          </button>
        )}
        {review.fromLearnerMark && (
          <button
            className="text-action"
            onClick={() => {
              dispatch({ type: "withdrawContentCheck", id: markId });
              setMessage("Check undone. The lesson shows the draft tag again.");
            }}
          >
            Undo check
          </button>
        )}
      </div>
      {marking && (
        <div className="content-status__mark" role="group" aria-label="Mark this lesson as checked">
          <p>Use this after you have played the lesson on a guitar and the notes, counts and instructions are right.</p>
          <label htmlFor={nameId}>Checked by</label>
          <input
            id={nameId}
            value={reviewer}
            maxLength={NOTE_LIMITS.reviewer}
            autoComplete="name"
            onChange={(event) => setReviewer(event.target.value)}
          />
          <div className="action-row">
            <button className="secondary-action" onClick={saveCheck}>
              Save check
            </button>
            <button
              className="text-action"
              onClick={() => {
                setMarking(false);
                setMessage("");
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
      {message && (
        <p className="content-status__message" role="status">
          {message}
        </p>
      )}
      {/* Portalled so the dialog does not inherit the lesson header's large type. */}
      {noteTarget &&
        createPortal(
          <Suspense fallback={null}>
            <FeedbackDialog
              target={noteTarget}
              onDone={(saved) => {
                setNoteTarget(null);
                if (saved) setMessage("Note saved. Find it in Settings › Feedback.");
              }}
            />
          </Suspense>,
          document.body,
        )}
    </div>
  );
}
