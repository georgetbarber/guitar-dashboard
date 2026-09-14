import { useEffect, useReducer } from "react";
import { cancelQueuedUpdate, holdUpdates, requestUpdate, subscribeUpdates, updateApplying, updateHoldReasons, updateReady } from "../updates";

function useUpdateState() {
  const [, changed] = useReducer((count: number) => count + 1, 0);
  useEffect(() => subscribeUpdates(changed), []);
  return { ready: updateReady(), applying: updateApplying(), reasons: updateHoldReasons() };
}

/**
 * Hold a waiting update off while `active`. The reason is shown to the learner,
 * so phrase it as the activity: "a recording is in progress".
 */
export function useUpdateHold(active: boolean, reason: string) {
  useEffect(() => {
    if (!active) return;
    return holdUpdates(reason);
  }, [active, reason]);
}

/**
 * Offers a new build rather than imposing one.
 *
 * The previous behaviour reloaded the page the moment a new worker took
 * control, which a focus-triggered update check made most likely just as the
 * learner returned to the tab. Nothing here reloads on its own: an update waits
 * until it is asked for, and a request made while work is in flight is queued
 * until that work finishes rather than interrupting it.
 */
export function UpdateNotice() {
  const { ready, applying, reasons } = useUpdateState();
  if (!ready) return null;

  if (applying) {
    return (
      <section className="update-notice" role="status" aria-label="Update waiting">
        <div className="save-failure-copy">
          <strong>{reasons.length ? "The update will apply as soon as you finish." : "Applying the update…"}</strong>
          {reasons.length > 0 && <p>Waiting for {reasons.join(" and ")}. Nothing will be interrupted.</p>}
        </div>
        {reasons.length > 0 && (
          <div className="save-failure-actions">
            <button className="secondary-action" onClick={cancelQueuedUpdate}>Not now</button>
          </div>
        )}
      </section>
    );
  }

  return (
    <section className="update-notice" role="status" aria-label="Update available">
      <div className="save-failure-copy">
        <strong>A new version of Guitar Academy is ready.</strong>
        <p>
          {reasons.length
            ? `It will not interrupt ${reasons.join(" or ")} — choose it and it will apply the moment that finishes.`
            : "Applying it reloads the page. Your saved work is not affected."}
        </p>
      </div>
      <div className="save-failure-actions">
        <button className="primary-action" onClick={() => requestUpdate()}>
          {reasons.length ? "Update when I'm finished" : "Update now"}
        </button>
      </div>
    </section>
  );
}
