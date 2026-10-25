import { useState } from "react";
import { FEEDBACK_CATEGORY_LABELS, feedbackMarkdown, sortNotes } from "../notes";
import { useV8Store } from "../store";

/** Settings › Feedback: every note, newest first, with a Markdown export for an agent session. */
export function FeedbackView({ onBack }: { onBack: () => void }) {
  const { state, dispatch } = useV8Store();
  const [showResolved, setShowResolved] = useState(false);
  const [message, setMessage] = useState("");
  const notes = sortNotes(state.feedbackNotes ?? []).reverse();
  const open = notes.filter((note) => !note.resolvedAt);
  const visible = showResolved ? notes : open;
  const markdown = () =>
    feedbackMarkdown(state.feedbackNotes ?? [], { includeResolved: showResolved, appVersion: __APP_VERSION__ });

  const download = () => {
    const blob = new Blob([markdown()], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `interval-feedback-${new Date().toISOString().slice(0, 10)}.md`;
    anchor.click();
    URL.revokeObjectURL(url);
    setMessage("Downloaded. Paste the file's contents into an agent session.");
  };
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(markdown());
      setMessage("Copied as Markdown. Paste it into an agent session.");
    } catch {
      setMessage("This browser would not copy to the clipboard. Use Download instead.");
    }
  };

  return (
    <section className="settings-subview" aria-labelledby="feedback-view-title">
      <button className="text-action" onClick={onBack} data-autofocus>
        ← Back to settings
      </button>
      <h3 id="feedback-view-title">Feedback notes</h3>
      <p>
        {open.length} open{notes.length > open.length ? `, ${notes.length - open.length} dealt with` : ""}. Leave a note
        from any lesson with “Something's wrong here”.
      </p>
      <div className="action-row">
        <button className="secondary-action" disabled={!notes.length} onClick={() => void copy()}>
          Copy as Markdown
        </button>
        <button className="secondary-action" disabled={!notes.length} onClick={download}>
          Download Markdown
        </button>
        <label className="check-line">
          <input type="checkbox" checked={showResolved} onChange={(event) => setShowResolved(event.target.checked)} />{" "}
          Include notes already dealt with
        </label>
      </div>
      {message && (
        <p role="status" className="settings-subview__message">
          {message}
        </p>
      )}
      {!visible.length && (
        <p className="settings-subview__empty">{notes.length ? "Every note has been dealt with." : "No notes yet."}</p>
      )}
      <ol className="feedback-list">
        {visible.map((note) => (
          <li key={note.id} className={note.resolvedAt ? "is-resolved" : ""}>
            <p className="feedback-list__meta">
              {note.localDate} · {note.category ? FEEDBACK_CATEGORY_LABELS[note.category] : "No category"}
              {note.resolvedAt ? " · dealt with" : ""}
            </p>
            <h4>{note.contentTitle}</h4>
            {note.location && <p className="feedback-list__where">{note.location}</p>}
            <p className="feedback-list__text">{note.text}</p>
            <button
              className="text-action"
              onClick={() => dispatch({ type: "setFeedbackResolved", id: note.id, resolved: !note.resolvedAt })}
            >
              {note.resolvedAt ? "Reopen" : "Mark as dealt with"}
            </button>
          </li>
        ))}
      </ol>
    </section>
  );
}
