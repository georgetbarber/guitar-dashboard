import { useState } from "react";
import { useV8Store } from "../store";

/**
 * The quiet half of the local save contract: a small, permanently visible
 * statement of whether this device is holding the learner's work. It is
 * deliberately separate from the cloud badge, because "saved here" and
 * "synchronised" fail independently and a learner who conflates them can lose
 * an evening's work believing a green tick covered it.
 */
export function SaveIndicator() {
  const { save } = useV8Store();
  const label =
    save.status === "saving" ? "Saving on this device…"
    : save.status === "failed" ? "Not saved on this device"
    : save.status === "saved"
      ? save.medium === "fallback"
        ? "Saved to this browser's limited backup store"
        : "Saved on this device"
      : "Nothing to save yet";
  return <p className="save-indicator" data-status={save.status} role="status">{label}</p>;
}

/**
 * The loud half. Only rendered on failure, and it never claims the work is
 * safe — it says exactly what is and is not true, and offers the two actions
 * that can still change the outcome: try the same write again, or take the work
 * off this device entirely.
 */
export function SaveFailureAlert() {
  const { save, retrySave, downloadRecoveryArchive } = useV8Store();
  const [busy, setBusy] = useState<"retry" | "export" | null>(null);
  const [exportError, setExportError] = useState("");
  if (save.status !== "failed") return null;

  const retry = async () => {
    setBusy("retry");
    setExportError("");
    try { await retrySave(); } finally { setBusy(null); }
  };

  const exportRecovery = async () => {
    setBusy("export");
    setExportError("");
    try { await downloadRecoveryArchive(); }
    catch (error) { setExportError(error instanceof Error ? error.message : "The recovery file could not be created on this device."); }
    finally { setBusy(null); }
  };

  return (
    <section className="save-failure" role="alert" aria-label="Local save failure">
      <div className="save-failure-copy">
        <strong>This device did not save your latest changes.</strong>
        <p>{save.error}</p>
        <p>
          Your work is still on screen and you can carry on, but it will go when this tab closes.{" "}
          {save.lastSavedAt
            ? `The copy this device stored at ${new Date(save.lastSavedAt).toLocaleTimeString()} is untouched and will still be here.`
            : "This device has not managed to store anything yet in this session."}
        </p>
        {exportError && <p className="save-failure-detail">{exportError}</p>}
        {save.failedAttempts > 1 && <p className="save-failure-detail">{save.failedAttempts} attempts have failed. A recovery file is the more reliable option now.</p>}
      </div>
      <div className="save-failure-actions">
        <button className="primary-action" disabled={busy !== null} onClick={() => void retry()}>
          {busy === "retry" ? "Trying again…" : "Try saving again"}
        </button>
        <button className="secondary-action" disabled={busy !== null} onClick={() => void exportRecovery()}>
          {busy === "export" ? "Preparing…" : "Download a recovery file"}
        </button>
      </div>
      <small>
        The recovery file holds your sketches, progress and any recordings this device can still read. Restore it later
        through Settings → Import backup.
      </small>
    </section>
  );
}
