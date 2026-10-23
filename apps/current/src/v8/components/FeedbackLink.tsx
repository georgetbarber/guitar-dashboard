import { lazy, Suspense, useState } from "react";
import { createPortal } from "react-dom";
import type { FeedbackTarget } from "../notes";

const FeedbackDialog = lazy(() => import("./FeedbackDialog").then((module) => ({ default: module.FeedbackDialog })));

/**
 * "Something's wrong here" on its own: a text action that opens the note dialog
 * with whatever the screen says it is showing at that moment.
 */
export function FeedbackLink({ target, onSaved }: { target: () => FeedbackTarget; onSaved?: () => void }) {
  const [noteTarget, setNoteTarget] = useState<FeedbackTarget | null>(null);
  return (
    <>
      <button className="text-action" onClick={() => setNoteTarget(target())}>
        Something's wrong here
      </button>
      {/* Portalled so the dialog does not inherit the surrounding panel's type. */}
      {noteTarget &&
        createPortal(
          <Suspense fallback={null}>
            <FeedbackDialog
              target={noteTarget}
              onDone={(saved) => {
                setNoteTarget(null);
                if (saved) onSaved?.();
              }}
            />
          </Suspense>,
          document.body,
        )}
    </>
  );
}
