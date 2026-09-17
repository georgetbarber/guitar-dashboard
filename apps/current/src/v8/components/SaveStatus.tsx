import { useState } from "react";
import { useCloudSync } from "../cloud";
import { useV8Store } from "../store";
import { UpdateNotice, useUpdateHold } from "./UpdateNotice";

/**
 * The quiet half of the local save contract: a small, permanently visible
 * statement of whether this device is holding the learner's work. It is
 * deliberately separate from the cloud badge, because "saved here" and
 * "synchronised" fail independently and a learner who conflates them can lose
 * an evening's work believing a green tick covered it.
 */
export function SaveIndicator() {
  const { save } = useV8Store();
  // The store owns the update hold from the instant a save begins, including
  // the interval before this status is rendered.
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

/**
 * Shown when this device holds stored bytes that do not describe a workspace.
 *
 * Saving is suspended while this is on screen, so the notice has to be
 * unmissable and has to explain why the app looks empty: silently starting
 * fresh is indistinguishable from total data loss, and the first autosave would
 * then make it total data loss for real.
 */
export function WorkspaceRecoveryNotice() {
  const { workspaceIssue, downloadUnreadableWorkspace, discardUnreadableWorkspace } = useV8Store();
  const [exported, setExported] = useState(false);
  if (!workspaceIssue) return null;
  return (
    <section className="workspace-recovery" role="alert" aria-label="Saved workspace could not be read">
      <div className="save-failure-copy">
        <strong>This device's saved work could not be read, so nothing is being saved right now.</strong>
        <p>{workspaceIssue.reason}</p>
        <p>
          The stored copy has not been changed or deleted. Download it first — a later version of Guitar Academy may be
          able to read it, and it is the only copy. Starting fresh replaces it as soon as you make your next change.
        </p>
      </div>
      <div className="save-failure-actions">
        <button className="primary-action" onClick={() => { downloadUnreadableWorkspace(); setExported(true); }}>
          {exported ? "Download again" : "Download the stored copy"}
        </button>
        <button
          className="danger-action"
          onClick={() => {
            if (confirm("Start a fresh workspace on this device? The copy that could not be read will be replaced by your next change, and this cannot be undone.")) {
              discardUnreadableWorkspace();
            }
          }}
        >
          Start fresh on this device
        </button>
      </div>
      {exported && <small>Downloaded. Keep that file somewhere safe before you start fresh.</small>}
    </section>
  );
}

/**
 * Shown after a backup is restored while signed in.
 *
 * A restore is a local operation on one device. Without this pause the ordinary
 * upload loop would push the restored workspace into the account and overwrite
 * whatever history was there — silently, and with nothing to undo it with. The
 * two choices are normal merge with the account, or keeping this copy paused.
 * This is not an account-history replacement operation.
 */
export function RestoreHoldNotice() {
  const { restoreHold, releaseRestoreToAccount } = useV8Store();
  const cloud = useCloudSync();
  // The decision survives reloads, but do not interrupt a choice in progress.
  useUpdateHold(restoreHold && Boolean(cloud.user), "your choice about the restored backup");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  if (!restoreHold || !cloud.user) return null;
  return (
    <section className="restore-hold" role="alert" aria-label="Restored backup is not in your account">
      <div className="save-failure-copy">
        <strong>This device holds a restored backup. Account sync is paused.</strong>
        <p>
          The restored work has not been uploaded, and incoming account changes are paused.
          Merging keeps other account records and uses the newer version where the same record differs.
          It does not replace your whole account history. Export this restored copy first if you want to keep it separately.
        </p>
        <p>This choice stays with this workspace if you reload or sign out.</p>
        {error && <p role="alert">{error}</p>}
      </div>
      <div className="save-failure-actions">
        <button className="primary-action" disabled={busy} onClick={async () => {
          if (!confirm("Merge this restored work with your account? Other records stay; newer versions win where the same record differs.")) return;
          setBusy(true); setError("");
          try { await releaseRestoreToAccount(); }
          catch (failure) { setError(failure instanceof Error ? failure.message : "The choice could not be saved. Account sync is still paused."); }
          finally { setBusy(false); }
        }}>Merge with my account</button>
        <button className="secondary-action" disabled={busy} onClick={async () => {
          setBusy(true);
          setError("");
          try { await cloud.signOut(); }
          catch (failure) { setError(failure instanceof Error ? failure.message : "Sign-out failed. Account sync is still paused."); }
          finally { setBusy(false); }
        }}>Sign out and leave this copy paused</button>
      </div>
    </section>
  );
}

/**
 * Every notice that can require the learner to act, in priority order. Render
 * it exactly once per screen: on the page, or inside an open dialog through
 * NoticeHost, and on the onboarding screens too — an unreadable workspace opens
 * with default settings, which is the onboarding screen, and that is precisely
 * when silently looking empty would be mistaken for data loss.
 */
export function AppNotices() {
  return <>
    <WorkspaceRecoveryNotice />
    <SaveFailureAlert />
    <RestoreHoldNotice />
    <UpdateNotice />
  </>;
}

/**
 * The save status of observations the learner has just recorded. The
 * interface must not describe a record as saved before the write holding it
 * has completed, nor go on saying "saving" once saving has stopped.
 */
export function RecordSaveStatus({ evidenceIds }: { evidenceIds: readonly string[] }) {
  const { save, workspaceIssue, isEvidenceSaved } = useV8Store();
  const [text, status] =
    isEvidenceSaved(evidenceIds)
      ? [save.medium === "fallback" ? "Saved to this browser's limited backup store." : "Saved on this device.", "saved"]
    : workspaceIssue
      ? ["Not saved: this device's stored work could not be read, so saving is paused. See the notice at the top.", "failed"]
    : save.status === "failed"
      ? ["Not saved on this device yet. It is still on screen — use the notice at the top to try again or download a recovery file.", "failed"]
      : ["Saving on this device…", "saving"];
  return <p className="record-save-status" data-status={status} role="status">{text}</p>;
}
