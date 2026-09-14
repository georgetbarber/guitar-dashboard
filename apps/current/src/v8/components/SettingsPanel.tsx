import { useEffect, useRef, useState } from "react";
import { activateRestore, cancelRestore, clearStoredRecordings, exportArchive, prepareRestore, requestPersistentStorage, retainedRecordingBytes, storageEstimate, storagePersistenceStatus } from "../repository";
import type { RestorePreview } from "../repository";
import { useCloudSync } from "../cloud";
import { currentInstallPrompt, currentStandaloneMode, showInstallPrompt, subscribeInstallPrompt, subscribeStandaloneMode, type InstallPromptEvent } from "../install";
import { useV8Store } from "../store";
import { MODE_OPTIONS, TONAL_ROOTS } from "../validation";
import { useUpdateHold } from "./UpdateNotice";

export function SettingsPanel({ onClose }: { onClose: () => void }) {
  const { state, dispatch, workspaceId, holdRestoreFromAccount } = useV8Store();
  const [restore, setRestore] = useState<RestorePreview | null>(null);
  const [restoreBusy, setRestoreBusy] = useState<"restoring" | "cancelling" | null>(null);
  // A staged restore is durable, but reloading mid-activation would discard it
  // on the next start, and the learner would have to prepare it again.
  useUpdateHold(Boolean(restore), "a backup you are restoring");
  const cloud = useCloudSync();
  const fileRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState("Progress stays local first and synchronises after sign-in. Recordings stay private unless you explicitly share one finished-project take.");
  const [installPrompt, setInstallPrompt] = useState<InstallPromptEvent | null>(currentInstallPrompt());
  const [standalone, setStandalone] = useState(currentStandaloneMode());
  useEffect(() => subscribeInstallPrompt(setInstallPrompt), []);
  useEffect(() => subscribeStandaloneMode(setStandalone), []);
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
    <div className="settings-backdrop" role="presentation" onMouseDown={(event) => { if (event.currentTarget === event.target) onClose(); }}>
      <section className="settings-panel" role="dialog" aria-modal="true" aria-labelledby="settings-title">
        <header><div><span>Device and account settings</span><h2 id="settings-title">Your instrument, sync and storage</h2></div><button className="icon-button" onClick={onClose} aria-label="Close settings">×</button></header>
        <section className={`sync-panel sync-${cloud.status}`} aria-label="Device synchronisation">
          <div><span className="eyebrow">Across your devices</span><h3>{cloud.user ? `Signed in as ${cloud.user.email ?? "your Google account"}` : cloud.configured ? "Sign in to synchronise" : "Firebase connection required"}</h3><p>{cloud.message}</p></div>
          {cloud.user ? <button className="secondary-action" onClick={() => { if (confirm("Sign out and open this device's separate guest workspace? The signed-in account's offline history will remain isolated on this device.")) void cloud.signOut(); }}>Sign out</button> : cloud.configured ? <button className="primary-action" onClick={() => void cloud.signIn()}>Continue with Google</button> : <span className="configuration-note">Add the Firebase web configuration to <code>.env.local</code>.</span>}
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
          <button className="secondary-action" onClick={() => fileRef.current?.click()}>Import backup</button>
          <button className="text-action" onClick={inspectStorage}>Check local storage</button>
          <button className="text-action" onClick={() => void protectOfflineData()}>Protect offline data</button>
          <button className="danger-action" disabled={!state.sketches.some((sketch) => sketch.takes.some((take) => take.blobId))} onClick={async () => {
            if (!confirm("Delete every retained recording from this device? Learning progress and sketches will remain.")) return;
            await clearStoredRecordings(state);
            dispatch({ type: "clearRecordings" });
            setMessage("All retained recordings were removed. Progress and sketches were not changed.");
          }}>Delete retained recordings</button>
          <button className="danger-action" onClick={async () => {
            if (!confirm("Erase every Guitar Academy workspace, recording and offline account copy from this device? Cloud data will remain. Export a backup first if you need one.")) return;
            if (!confirm("This device data cannot be recovered after erasing. Continue?")) return;
            try { await cloud.eraseDeviceData(); }
            catch (error) { setMessage(error instanceof Error ? error.message : "This device could not be erased."); }
          }}>Erase all Guitar Academy data from this device</button>
          <input ref={fileRef} hidden type="file" accept=".guitar-academy,application/json" onChange={async (event) => {
            const file = event.target.files?.[0];
            if (!file) return;
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
            finally { event.target.value = ""; }
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
                const restored = await activateRestore(restore.operationId);
                // Held before the state lands, so the upload loop never sees the
                // restored workspace as an ordinary change to push to the account.
                holdRestoreFromAccount();
                dispatch({ type: "replaceState", state: restored });
                setRestore(null);
                setMessage(`Backup restored: ${restored.sketches.length} sketches and ${restored.evidence.length} observations.`);
              }
              catch (error) { setMessage(error instanceof Error ? error.message : "The restore could not be completed. This workspace is unchanged."); }
              finally { setRestoreBusy(null); }
            }}>{restoreBusy === "restoring" ? "Restoring…" : "Restore this backup"}</button>
            <button className="secondary-action" disabled={Boolean(restoreBusy)} onClick={async () => {
              setRestoreBusy("cancelling");
              try { await cancelRestore(restore.operationId); }
              finally { setRestore(null); setRestoreBusy(null); setMessage("Restore cancelled. This workspace was not changed."); }
            }}>{restoreBusy === "cancelling" ? "Cancelling…" : "Cancel"}</button>
          </div>
        </section>}
        <p className="privacy-message">{message} Audio uploads only when you choose one retained take from a finished project; other recordings never synchronise. Account and guest workspaces stay separate on this device.</p>
      </section>
    </div>
  );
}
