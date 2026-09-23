// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DEFAULT_STATE, V8StoreProvider, useV8Store } from "./store";
import { SaveFailureAlert, SaveIndicator, WorkspaceRecoveryNotice, RestoreHoldNotice } from "./components/SaveStatus";
import { UpdateNotice } from "./components/UpdateNotice";
import { SettingsPanel } from "./components/SettingsPanel";
import { Create } from "./features/Create";
import * as repository from "./repository";
import { openMicrophone, startTakeRecording } from "../audio/microphone";
import { noteUpdateReady, resetUpdateStateForTests } from "./updates";
import type { V8State } from "./types";

vi.mock("./repository", async (original) => ({
  ...await original<typeof import("./repository")>(),
  loadWorkspace: vi.fn(), savePersistedState: vi.fn(), discardIncompleteStaging: vi.fn(),
  exportArchive: vi.fn(), prepareRestore: vi.fn(), activateRestore: vi.fn(), cancelRestore: vi.fn(),
  saveBlob: vi.fn(), loadBlob: vi.fn(), confirmRestoreMerge: vi.fn(),
}));
vi.mock("./cloudFacade", () => ({ useCloudSync: () => ({ user: { email: "learner@example.test" }, status: "synced", signOut: vi.fn() }) }));
vi.mock("../audio/microphone", () => ({ openMicrophone: vi.fn(), startTakeRecording: vi.fn() }));
vi.mock("../audio/engine", () => ({ stopAudio: vi.fn(), startVoicingProgression: vi.fn() }));

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}

function Probe() {
  const { state, dispatch, hydrated, workspaceId, switchWorkspace, restoreHold } = useV8Store();
  return <>
    <output data-testid="workspace">{hydrated ? workspaceId : "opening"}</output>
    <output data-testid="reflection">{state.lastReflection}</output>
    <output data-testid="restore-hold">{String(restoreHold)}</output>
    <button onClick={() => dispatch({ type: "updateSettings", settings: { dailyMinutes: 40 } })}>Edit practice time</button>
    <button onClick={() => void switchWorkspace("account:other")}>Open other workspace</button>
  </>;
}

function mount(child?: React.ReactNode) {
  return render(<V8StoreProvider><Probe /><SaveIndicator /><SaveFailureAlert /><WorkspaceRecoveryNotice /><RestoreHoldNotice /><UpdateNotice />{child}</V8StoreProvider>);
}

async function saved() { await screen.findByText("Saved on this device"); }
function offerUpdate() {
  const activate = vi.fn();
  act(() => noteUpdateReady(activate));
  return activate;
}

beforeEach(() => {
  vi.resetAllMocks();
  // jsdom has no modal top layer. Browser tests verify its focus/inert behaviour.
  Object.defineProperty(HTMLDialogElement.prototype, "showModal", { configurable: true, value: function (this: HTMLDialogElement) { this.setAttribute("open", ""); } });
  Object.defineProperty(HTMLDialogElement.prototype, "close", { configurable: true, value: function (this: HTMLDialogElement) { this.removeAttribute("open"); } });
  resetUpdateStateForTests();
  repository.setActiveWorkspace("anonymous");
  vi.mocked(repository.loadWorkspace).mockResolvedValue({ status: "ok", state: structuredClone(DEFAULT_STATE) });
  vi.mocked(repository.savePersistedState).mockResolvedValue("indexeddb");
  vi.mocked(repository.discardIncompleteStaging).mockResolvedValue(0);
  vi.mocked(repository.confirmRestoreMerge).mockResolvedValue(undefined);
  vi.stubGlobal("matchMedia", () => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() }));
  vi.stubGlobal("confirm", vi.fn(() => true));
  URL.createObjectURL = vi.fn(() => "blob:test-recording");
  URL.revokeObjectURL = vi.fn();
});
afterEach(() => { cleanup(); resetUpdateStateForTests(); vi.unstubAllGlobals(); });

describe("the rendered local save contract", () => {
  it("reports failed edits, exports the unsaved state, retries it and releases a requested update only after saving", async () => {
    const user = userEvent.setup();
    mount(); await saved();
    vi.mocked(repository.savePersistedState).mockRejectedValueOnce(new DOMException("Full", "QuotaExceededError"));
    await user.click(screen.getByText("Edit practice time"));
    expect((await screen.findByRole("alert", { name: "Local save failure" })).textContent).toContain("no storage space");
    const activate = offerUpdate();
    await user.click(screen.getByText("Update when I'm finished"));
    expect(activate).not.toHaveBeenCalled();
    vi.mocked(repository.exportArchive).mockRejectedValueOnce(new Error("Export unavailable"));
    await user.click(screen.getByText("Download a recovery file"));
    expect(repository.exportArchive).toHaveBeenCalledWith(expect.objectContaining({ settings: expect.objectContaining({ dailyMinutes: 40 }) }));
    await screen.findByText("Export unavailable");
    const retry = deferred<repository.SaveMedium>();
    vi.mocked(repository.savePersistedState).mockReturnValueOnce(retry.promise);
    await user.click(screen.getByText("Try saving again"));
    await screen.findByText("Saving on this device…");
    expect(activate).not.toHaveBeenCalled();
    await act(async () => retry.resolve("indexeddb"));
    await saved();
    expect(repository.savePersistedState).toHaveBeenLastCalledWith(expect.objectContaining({ settings: expect.objectContaining({ dailyMinutes: 40 }) }), "anonymous");
    expect(activate).toHaveBeenCalledOnce();
    expect(screen.queryByRole("alert", { name: "Local save failure" })).toBeNull();
  });

  it("labels a browser fallback separately from an IndexedDB save", async () => {
    vi.mocked(repository.savePersistedState).mockResolvedValue("fallback");
    mount();
    await screen.findByText("Saved to this browser's limited backup store");
    expect(screen.queryByText("Saved on this device")).toBeNull();
  });

  it("does not report a previous workspace's late failure against the current workspace", async () => {
    const oldSave = deferred<repository.SaveMedium>();
    vi.mocked(repository.savePersistedState).mockReturnValueOnce(oldSave.promise);
    mount(); await screen.findByText("Saving on this device…");
    await userEvent.click(screen.getByText("Open other workspace"));
    await saved();
    await act(async () => oldSave.reject(new Error("Previous workspace failed")));
    expect(screen.getByTestId("workspace").textContent).toBe("account:other");
    expect(screen.queryByText("Not saved on this device")).toBeNull();
    expect(repository.savePersistedState).toHaveBeenLastCalledWith(expect.anything(), "account:other");
  });

  it("keeps unreadable stored bytes untouched until the learner deliberately starts fresh", async () => {
    vi.mocked(repository.loadWorkspace).mockResolvedValue({ status: "unreadable", raw: { futureVersion: 99 }, reason: "Newer workspace format" });
    mount(); await screen.findByRole("alert", { name: "Saved workspace could not be read" });
    await userEvent.click(screen.getByText("Edit practice time"));
    expect(repository.savePersistedState).not.toHaveBeenCalled();
    vi.mocked(confirm).mockReturnValueOnce(false);
    await userEvent.click(screen.getByText("Start fresh on this device"));
    expect(repository.savePersistedState).not.toHaveBeenCalled();
    await userEvent.click(screen.getByText("Start fresh on this device"));
    await saved();
    expect(screen.queryByRole("alert", { name: "Saved workspace could not be read" })).toBeNull();
  });
});

describe("recording and restore controls protect a requested update", () => {
  it.each(["discard", "keep"])("holds continuously from recording to temporary take to %s", async (choice) => {
    const sketch = repository.newSketch(0);
    vi.mocked(repository.loadWorkspace).mockResolvedValue({ status: "ok", state: { ...DEFAULT_STATE, sketches: [sketch], activeSketchId: sketch.id } });
    const close = vi.fn();
    vi.mocked(openMicrophone).mockResolvedValue({ stream: {}, close } as unknown as Awaited<ReturnType<typeof openMicrophone>>);
    const stop = deferred<Blob>();
    vi.mocked(startTakeRecording).mockReturnValue({ stop: () => stop.promise } as ReturnType<typeof startTakeRecording>);
    mount(<Create />); await saved();
    await userEvent.click(screen.getByText("Record a temporary take"));
    await screen.findByText("Stop and compare");
    const activate = offerUpdate();
    await userEvent.click(screen.getByText("Update when I'm finished"));
    await userEvent.click(screen.getByText("Stop and compare"));
    expect(activate).not.toHaveBeenCalled();
    await act(async () => stop.resolve(new Blob(["take"], { type: "audio/webm" })));
    await screen.findByText("Temporary take — held in this tab only, not stored");
    expect(activate).not.toHaveBeenCalled();
    if (choice === "discard") {
      await userEvent.click(screen.getByText("Discard", { exact: true }));
    } else {
      vi.mocked(repository.saveBlob).mockRejectedValueOnce(new DOMException("No room for this take", "QuotaExceededError"));
      await userEvent.click(screen.getByText("Keep on this device"));
      await screen.findByText(/This take could not be kept/);
      expect(activate).not.toHaveBeenCalled();
      expect(screen.getByText("Temporary take — held in this tab only, not stored")).toBeTruthy();
      const save = deferred<repository.SaveMedium>();
      vi.mocked(repository.saveBlob).mockResolvedValue(undefined);
      vi.mocked(repository.savePersistedState).mockReturnValueOnce(save.promise);
      await userEvent.click(screen.getByText("Keep on this device"));
      await screen.findByText("Saving on this device…");
      expect(activate).not.toHaveBeenCalled();
      await act(async () => save.resolve("indexeddb"));
    }
    await waitFor(() => expect(activate).toHaveBeenCalledOnce());
  });

  it("ignores cloud data dispatched after a restore decision, even in the same update", async () => {
    function MergeProbe() {
      const { state, dispatch } = useV8Store();
      return <>
        <output data-testid="sketch-count">{state.sketches.length}</output>
        <button onClick={() => {
          dispatch({ type: "setRestoreDecision", id: "restore-in-flight" });
          dispatch({ type: "mergeCloud", snapshot: { sketches: [{ ...repository.newSketch(0), id: "account-sketch" }] } });
        }}>Decide then merge</button>
      </>;
    }
    mount(<MergeProbe />); await saved();
    await userEvent.click(screen.getByText("Decide then merge"));
    expect(screen.getByTestId("restore-hold").textContent).toBe("true");
    expect(screen.getByTestId("sketch-count").textContent).toBe("0");
  });

  it("keeps a failed activation retryable, and cancellation releases the update without replacing work", async () => {
    vi.mocked(repository.prepareRestore).mockResolvedValue({ operationId: "retry-restore", workspaceId: "anonymous", exportedAt: "2026-09-10T12:00:00Z", sketches: 0, evidence: 0, recordings: 0, recordingBytes: 0, supersededRecordings: 0 });
    vi.mocked(repository.activateRestore).mockRejectedValue(new Error("Activation failed"));
    const view = mount(<SettingsPanel onClose={vi.fn()} />); await saved();
    fireEvent.change(view.container.querySelector('input[type="file"]')!, { target: { files: [new File(["archive"], "backup.guitar-academy")] } });
    await screen.findByText("Restore this backup");
    const apply = offerUpdate();
    await userEvent.click(screen.getByText("Update when I'm finished"));
    await userEvent.click(screen.getByText("Restore this backup"));
    await screen.findByText(/Activation failed/);
    expect(screen.getByTestId("restore-hold").textContent).toBe("false");
    expect(screen.getByTestId("reflection").textContent).toBe("");
    expect(apply).not.toHaveBeenCalled();
    vi.mocked(repository.cancelRestore).mockRejectedValueOnce(new Error("Cancellation failed"));
    await userEvent.click(screen.getByText("Cancel", { exact: true }));
    await screen.findByText(/Cancellation failed/);
    expect(screen.getByText("Restore this backup")).toBeTruthy();
    expect(apply).not.toHaveBeenCalled();
    vi.mocked(repository.cancelRestore).mockResolvedValueOnce(undefined);
    await userEvent.click(screen.getByText("Cancel", { exact: true }));
    await screen.findByText(/Restore cancelled/);
    await waitFor(() => expect(apply).toHaveBeenCalledOnce());
    expect(screen.getByTestId("restore-hold").textContent).toBe("false");
  });

  it("holds from file preparation through activation and raises the account choice before restored state is visible", async () => {
    const preview = { operationId: "restore-test", workspaceId: "anonymous" as const, exportedAt: "2026-09-10T12:00:00Z", sketches: 0, evidence: 0, recordings: 0, recordingBytes: 0, supersededRecordings: 0 };
    const preparation = deferred<repository.RestorePreview>();
    const activation = deferred<V8State>();
    vi.mocked(repository.prepareRestore).mockReturnValue(preparation.promise);
    vi.mocked(repository.activateRestore).mockReturnValue(activation.promise);
    const close = vi.fn();
    const view = mount(<SettingsPanel onClose={close} />); await saved();
    fireEvent.change(view.container.querySelector('input[type="file"]')!, { target: { files: [new File(["archive"], "backup.guitar-academy")] } });
    const apply = offerUpdate();
    await userEvent.click(screen.getByText("Update when I'm finished"));
    expect(apply).not.toHaveBeenCalled();
    await userEvent.click(screen.getByLabelText("Close settings"));
    expect(close).not.toHaveBeenCalled();
    await act(async () => preparation.resolve(preview));
    const previousSave = deferred<repository.SaveMedium>();
    vi.mocked(repository.savePersistedState).mockReturnValueOnce(previousSave.promise);
    await userEvent.click(screen.getByText("Edit practice time"));
    await userEvent.click(screen.getByText("Restore this backup"));
    expect(screen.getByTestId("reflection").textContent).toBe("");
    expect(repository.activateRestore).not.toHaveBeenCalled();
    await act(async () => previousSave.resolve("indexeddb"));
    expect(repository.activateRestore).toHaveBeenCalledWith("restore-test", "anonymous");
    await userEvent.click(screen.getByLabelText("Close settings"));
    expect(close).not.toHaveBeenCalled();
    await act(async () => activation.resolve({ ...DEFAULT_STATE, pendingRestoreId: "restore-test", lastReflection: "Restored work" }));
    await screen.findByText("Restored work");
    expect(screen.getByTestId("restore-hold").textContent).toBe("true");
    await screen.findByRole("alert", { name: "Restored backup is not in your account" });
    // A local restore still needs an account decision, even after the save succeeds.
    expect(apply).not.toHaveBeenCalled();
    await userEvent.click(screen.getByText("Merge with my account"));
    expect(screen.getByTestId("restore-hold").textContent).toBe("false");
    await waitFor(() => expect(apply).toHaveBeenCalledOnce());
  });
});
