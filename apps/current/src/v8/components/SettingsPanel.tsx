import { useEffect, useRef, useState } from "react";
import { cancelRestore, clearStoredRecordings, exportArchive, prepareRestore, requestPersistentStorage, retainedRecordingBytes, storageEstimate, storagePersistenceStatus } from "../repository";
import type { RestorePreview } from "../repository";
import { useCloudSync } from "../cloud";
import { currentInstallPrompt, currentStandaloneMode, showInstallPrompt, subscribeInstallPrompt, subscribeStandaloneMode, type InstallPromptEvent } from "../install";
import { useV8Store } from "../store";
import { MODE_OPTIONS, TONAL_ROOTS } from "../validation";
import { useUpdateHold } from "./UpdateNotice";
import { Modal } from "./Modal";

export function SettingsPanel({ onClose }: { onClose: () => void }) {
  const { state, dispatch, workspaceId, restoreWorkspace } = useV8Store();
  const [restore, setRestore] = useState<RestorePreview | null>(null);
  const [restoreBusy, setRestoreBusy] = useState<"preparing" | "restoring" | "cancelling" | null>(null);
  // A staged restore is durable, but reloading mid-activation would discard it
  // on the next start, and the learner would have to prepare it again.
  useUpdateHold(Boolean(restore || restoreBusy), "a backup you are restoring");
  const cloud = useCloudSync();
  const fileRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState(cloud.configured
    ? "Progress stays local first and synchronises after sign-in."
    : "Progress stays on this device.");
  const [installPrompt, setInstallPrompt] = useState<InstallPromptEvent | null>(currentInstallPrompt());
  const [standalone, setStandalone] = useState(currentStandaloneMode());
  useEffect(() => subscribeInstallPrompt(setInstallPrompt), []);
  useEffect(() => subscribeStandaloneMode(setStandalone), []);
  const close = () => {
    if (restoreBusy) { setMessage("Please wait for the backup operation to finish."); return; }
    if (restore) { setMessage("Restore this backup or cancel it before closing settings."); return; }
    onClose();
  };
  const download = async () => {
    const blob = await exportArchive(state);
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `guitar-academy-${new Date().toISOString().slice(0, 10)}.guitar-academy`;
    anchor.click();
    URL.revokeObjectURL(url);
    const retained = state.sketches.reduce((count, sketch) => count + sketch.takes.filter((take) => take.blobId).length, 0);
    setMessage(`Complete backup created with ${state.sketches.length} sketches, ${state.evidence.length} evidence records and ${retained} device recording${retained === 1 ? "" : "s"}.`);
  };
  const inspectStorage = async () => {
    const estimate = await storageEstimate();
    const recordings = await retainedRecordingBytes(state);
    setMessage(estimate ? `${(estimate.usage / 1_048_576).toFixed(1)} MB total local use; retained recordings use ${(recordings / 1_048_576).toFixed(1)} MB.` : `Retained recordings use ${(recordings / 1_048_576).toFixed(1)} MB. This browser does not report its total quota.`);
  };
  const protectOfflineData = async () => {
    const current = await storagePersistenceStatus();
    if (current) { setMessage("This browser already protects Guitar Academy's offline data from routine storage cleanup."); return; }
    const granted = await requestPersistentStorage();
    setMessage(granted === null ? "This browser does not offer persistent offline storage." : granted ? "Offline learning data is now protected from routine browser cleanup." : "The browser did not grant protected storage. Complete backups remain the safest long-term copy.");
  };
  return (
    <Modal className="settings-backdrop" labelledBy="settings-title" onRequestClose={close} closeOnBackdrop>
      <section className="settings-panel">
        <header><div><span>Device and account settings</span><h2 id="settings-title">Your instrument, sync and storage</h2></div><button className="icon-button" onClick={close} aria-label="Close settings" data-autofocus>×</button></header>
        <section className={`sync-panel sync-${cloud.status}`} aria-label="Device synchronisation">
          <div><span className="eyebrow">Across your devices</span><h3>{cloud.user ? `Signed in as ${cloud.user.email ?? "your Google account"}` : cloud.configured ? "Sign in to synchronise" : "Sync is not set up"}</h3><p>{cloud.message}</p></div>
          {cloud.user ? <button className="secondary-action" disabled={Boolean(restore || restoreBusy)} onClick={() => { if (confirm("Sign out and open this device's separate guest workspace? The signed-in account's offline history will remain isolated on this device.")) void cloud.signOut(); }}>Sign out</button> : cloud.configured ? <button className="primary-action" disabled={Boolean(restore || restoreBusy)} onClick={() => void cloud.signIn()}>Continue with Google</button> : null}
        </section>
        <section className="install-panel" aria-label="Install Guitar Academy">
          <div><span className="eyebrow">Pixel and offline use</span><h3>{standalone ? "Opened in app mode" : "Install Guitar Academy"}</h3><p>The app shell works offline. Learning changes queue safely and synchronise when the connection returns.</p></div>
          {standalone && <span>If you removed the installation while this window was open, close it completely. Then open <strong>learn-the-guitar.web.app</strong> in Chrome and choose <strong>Install app</strong>.</span>}
          {!standalone && installPrompt && <button className="primary-action" onClick={() => void showInstallPrompt()}>Install app</button>}
          {!standalone && !installPrompt && <span>In Chrome, open the browser menu and choose <strong>Install app</strong> or <strong>Add to Home screen</strong>.</span>}
        </section>
        <div className="settings-grid">
          <label>Primary instrument<select value={state.settings.instrument} onChange={(event) => dispatch({ type: "updateSettings", settings: { instrument: event.target.value as "electric" | "acoustic" } })}><option value="electric">Electric</option><option value="acoustic">Acoustic</option></select></label>
          <label>Practice minutes<input type="number" min="10" max="90" step="5" value={state.settings.dailyMinutes} onChange={(event) => dispatch({ type: "updateSettings", settings: { dailyMinutes: Number(event.target.value) } })} /></label>
          <label>Tonal centre<select value={state.settings.tonicName} onChange={(event) => dispatch({ type: "updateSettings", settings: { tonicName: event.target.value } })}>{TONAL_ROOTS.map((root) => <option key={root}>{root}</option>)}</select></label>
          <label>Mode<select value={state.settings.mode} onChange={(event) => dispatch({ type: "updateSettings", settings: { mode: event.target.value as typeof state.settings.mode } })}>{MODE_OPTIONS.map(([id, label]) => <option value={id} key={id}>{label}</option>)}</select></label>
          <label>Theme<select value={state.settings.theme} onChange={(event) => dispatch({ type: "updateSettings", settings: { theme: event.target.value as "light" | "dark" } })}><option value="light">Light</option><option value="dark">Dark</option></select></label>
          <label className="check-line"><input type="checkbox" checked={state.settings.reducedMotion} onChange={(event) => dispatch({ type: "updateSettings", settings: { reducedMotion: event.target.checked } })} /> Reduce interface motion</label>
        </div>
        <div className="data-actions">
          <button className="secondary-action" onClick={download}>Export complete backup</button>
          <button className="secondary-action" disabled={Boolean(restore || restoreBusy)} onClick={() => fileRef.current?.click()}>Import backup</button>
          <button className="text-action" onClick={inspectStorage}>Check local storage</button>
          <button className="text-action" onClick={() => void protectOfflineData()}>Protect offline data</button>
          <button className="danger-action" disabled={Boolean(restore || restoreBusy) || !state.sketches.some((sketch) => sketch.takes.some((take) => take.blobId))} onClick={async () => {
            if (!confirm("Delete every retained recording from this device? Learning progress and sketches will remain.")) return;
            await clearStoredRecordings(state);
            dispatch({ type: "clearRecordings" });
            setMessage("All retained recordings were removed. Progress and sketches were not changed.");
          }}>Delete retained recordings</button>
          <button className="danger-action" disabled={Boolean(restore || restoreBusy)} onClick={async () => {
            if (!confirm("Erase every Guitar Academy workspace, recording and offline account copy from this device? Cloud data will remain. Export a backup first if you need one.")) return;
            if (!confirm("This device data cannot be recovered after erasing. Continue?")) return;
            try { await cloud.eraseDeviceData(); }
            catch (error) { setMessage(error instanceof Error ? error.message : "This device could not be erased."); }
          }}>Erase all Guitar Academy data from this device</button>
          <input ref={fileRef} hidden type="file" accept=".guitar-academy,application/json" onChange={async (event) => {
            const file = event.target.files?.[0];
            if (!file || restore || restoreBusy) return;
            const input = event.currentTarget;
            setRestoreBusy("preparing");
            setMessage("Preparing the backup. This workspace has not changed.");
            try {
              /*
               * Staging only. Nothing in the current workspace changes here, so the
               * learner sees exactly what they would be replacing, and in which
               * workspace, before anything is at risk.
               */
              setRestore(await prepareRestore(file, workspaceId));
              setMessage("");
            }
            catch (error) { setMessage(error instanceof Error ? error.message : "The backup could not be read."); }
            finally { input.value = ""; setRestoreBusy(null); }
          }} />
        </div>
        {restore && <section className="restore-preview" role="group" aria-label="Confirm this restore">
          <div>
            <span className="eyebrow">Nothing has changed yet</span>
            <h3>Restore this backup into {workspaceId === "anonymous" ? "this device's guest workspace" : "your signed-in workspace on this device"}?</h3>
            <p>
              Exported {new Date(restore.exportedAt).toLocaleDateString()}. It holds {restore.sketches} sketch{restore.sketches === 1 ? "" : "es"},{" "}
              {restore.evidence} observation{restore.evidence === 1 ? "" : "s"} and {restore.recordings} recording{restore.recordings === 1 ? "" : "s"}
              {restore.recordings ? ` (${(restore.recordingBytes / 1_048_576).toFixed(1)} MB)` : ""}.
            </p>
            <p>
              Restoring replaces that workspace's learning history. {restore.supersededRecordings
                ? `${restore.supersededRecordings} recording${restore.supersededRecordings === 1 ? "" : "s"} on this device are not in the backup and will be removed once the restore completes.`
                : "No recordings on this device would be removed."} Your other workspaces and any cloud history are untouched.
            </p>
          </div>
          <div className="action-row">
            <button className="primary-action" disabled={Boolean(restoreBusy)} onClick={async () => {
              setRestoreBusy("restoring");
              try {
                const restored = await restoreWorkspace(restore.operationId);
                setRestore(null);
                setMessage(`Backup restored: ${restored.sketches.length} sketches and ${restored.evidence.length} observations.`);
              }
              catch (error) { setMessage(error instanceof Error ? error.message : "The restore could not be completed. This workspace is unchanged."); }
              finally { setRestoreBusy(null); }
            }}>{restoreBusy === "restoring" ? "Restoring…" : "Restore this backup"}</button>
            <button className="secondary-action" disabled={Boolean(restoreBusy)} onClick={async () => {
              setRestoreBusy("cancelling");
              try {
                await cancelRestore(restore.operationId);
                setRestore(null);
                setMessage("Restore cancelled. This workspace was not changed.");
              }
              catch (error) { setMessage(error instanceof Error ? error.message : "The restore could not be cancelled. Try again."); }
              finally { setRestoreBusy(null); }
            }}>{restoreBusy === "cancelling" ? "Cancelling…" : "Cancel"}</button>
          </div>
        </section>}
        <p className="privacy-message">{message} {cloud.sharingAvailable ? "Audio uploads only when you choose one retained take from a finished project; other recordings never synchronise." : "Recordings never leave this device."} Account and guest workspaces stay separate on this device.</p>
        {/* Diagnostics live here, not in learner-facing copy. */}
        <details className="about-app">
          <summary>About this app</summary>
          <dl>
            <div><dt>Version</dt><dd>{__APP_VERSION__}</dd></div>
            <div><dt>Build</dt><dd>{import.meta.env.MODE}</dd></div>
            <div><dt>Sync across devices</dt><dd>{cloud.configured ? "Configured in this build" : "Not configured: this build has no Firebase web configuration"}</dd></div>
            <div><dt>Recording sharing</dt><dd>{cloud.sharingAvailable ? "Enabled in this build" : "Not enabled: recordings stay on each device"}</dd></div>
            <div><dt>Window</dt><dd>{standalone ? "Installed app window" : "Browser tab"}</dd></div>
          </dl>
        </details>
      </section>
    </Modal>
  );
}
