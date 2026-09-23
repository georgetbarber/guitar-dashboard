// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { Modal } from "./Modal";
import { DialogNoticesContext, PageNotices } from "./NoticeHost";
import { AppNotices, RecordSaveStatus } from "./SaveStatus";
import { ActivityPlayer } from "./ActivityPlayer";
import { ACTIVITIES } from "../curriculum";
import { DEFAULT_STATE, V8StoreProvider, useV8Store } from "../store";
import * as repository from "../repository";
import { noteUpdateReady, requestUpdate, resetUpdateStateForTests } from "../updates";

vi.mock("../repository", async (original) => ({
  ...await original<typeof import("../repository")>(),
  loadWorkspace: vi.fn(), savePersistedState: vi.fn(), discardIncompleteStaging: vi.fn(), exportArchive: vi.fn()
}));
vi.mock("../cloudFacade", () => ({ useCloudSync: () => ({ user: null, status: "local" }) }));
vi.mock("../../audio/engine", () => ({ playHarmonicRelationship: vi.fn(), playMelodicRelationship: vi.fn() }));

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}

beforeEach(() => {
  vi.resetAllMocks();
  resetUpdateStateForTests();
  Object.defineProperty(HTMLDialogElement.prototype, "showModal", { configurable: true, value: function (this: HTMLDialogElement) { this.setAttribute("open", ""); } });
  Object.defineProperty(HTMLDialogElement.prototype, "close", { configurable: true, value: function (this: HTMLDialogElement) { this.removeAttribute("open"); } });
  vi.mocked(repository.loadWorkspace).mockResolvedValue({ status: "ok", state: { ...structuredClone(DEFAULT_STATE), settings: { ...DEFAULT_STATE.settings, diagnosticComplete: true } } });
  vi.mocked(repository.savePersistedState).mockResolvedValue("indexeddb");
  vi.mocked(repository.discardIncompleteStaging).mockResolvedValue(0);
});
afterEach(() => { cleanup(); resetUpdateStateForTests(); });

const reflection = ACTIVITIES.find((activity) => activity.kind === "reflection")!;

/** The application shell's arrangement: notices on the page, supplied to any dialog. */
function Shell({ startOpen = false }: { startOpen?: boolean }) {
  const [open, setOpen] = useState(startOpen);
  const { dispatch } = useV8Store();
  return <DialogNoticesContext.Provider value={<AppNotices />}>
    <main data-testid="page"><PageNotices><AppNotices /></PageNotices></main>
    <button onClick={() => setOpen(true)}>Open activity</button>
    <button onClick={() => dispatch({ type: "updateSettings", settings: { dailyMinutes: 45 } })}>Edit settings</button>
    {open && <Modal className="activity-overlay" labelledBy="activity-title" onRequestClose={() => setOpen(false)}>
      <ActivityPlayer activityId={reflection.id} onClose={() => setOpen(false)} />
    </Modal>}
  </DialogNoticesContext.Provider>;
}

async function mountShell(startOpen = false) {
  render(<V8StoreProvider><Shell startOpen={startOpen} /></V8StoreProvider>);
  await act(async () => {});
}

describe("urgent notices follow the learner into a dialog (2A-2)", () => {
  it("moves a save failure into the open dialog, shows it once, and returns it to the page on close", async () => {
    await mountShell();
    vi.mocked(repository.savePersistedState).mockRejectedValue(new DOMException("Full", "QuotaExceededError"));
    await userEvent.click(screen.getByText("Edit settings"));
    const pageAlert = await screen.findByRole("alert", { name: "Local save failure" });
    expect(screen.getByTestId("page").contains(pageAlert)).toBe(true);
    await userEvent.click(screen.getByText("Open activity"));
    const dialog = screen.getByRole("dialog");
    await waitFor(() => expect(screen.getAllByRole("alert", { name: "Local save failure" })).toHaveLength(1));
    expect(dialog.contains(screen.getByRole("alert", { name: "Local save failure" }))).toBe(true);
    await userEvent.click(screen.getByRole("button", { name: "Close activity" }));
    await waitFor(() => expect(screen.getByTestId("page").contains(screen.getByRole("alert", { name: "Local save failure" }))).toBe(true));
    expect(screen.getAllByRole("alert", { name: "Local save failure" })).toHaveLength(1);
  });

  it("offers an update from inside the dialog", async () => {
    await mountShell(true);
    act(() => noteUpdateReady(vi.fn()));
    expect(screen.getByRole("dialog").contains(await screen.findByRole("status", { name: "Update available" }))).toBe(true);
    expect(screen.getAllByRole("status", { name: "Update available" })).toHaveLength(1);
  });
});

describe("a recorded activity is described as saved only once it is (2A-2)", () => {
  async function recordReflection() {
    await userEvent.type(screen.getByRole("textbox"), "The held note made the change feel calmer");
    await userEvent.click(screen.getByRole("button", { name: /Needs another pass/ }));
  }
  const line = () => screen.getByText(/on this device|limited backup store|could not be read/, { selector: ".record-save-status" });

  it("says saving while the write is pending, even though the previous save succeeded", async () => {
    await mountShell(true);
    const write = deferred<repository.SaveMedium>();
    vi.mocked(repository.savePersistedState).mockReturnValueOnce(write.promise);
    await recordReflection();
    expect(line().textContent).toBe("Saving on this device…");
    await act(async () => write.resolve("indexeddb"));
    expect(line().textContent).toBe("Saved on this device.");
  });

  it("says not saved when the write fails, and saved after a successful retry", async () => {
    await mountShell(true);
    vi.mocked(repository.savePersistedState).mockRejectedValueOnce(new DOMException("Full", "QuotaExceededError"));
    await recordReflection();
    await waitFor(() => expect(line().textContent).toMatch(/^Not saved on this device yet/));
    expect(screen.queryByText(/The evidence is saved/)).toBeNull();
    const dialog = screen.getByRole("dialog");
    await userEvent.click(within(dialog).getByRole("button", { name: "Try saving again" }));
    await waitFor(() => expect(line().textContent).toBe("Saved on this device."));
  });

  it("does not count a write that began before the record", async () => {
    await mountShell(true);
    const earlier = deferred<repository.SaveMedium>();
    const later = deferred<repository.SaveMedium>();
    vi.mocked(repository.savePersistedState).mockReturnValueOnce(earlier.promise).mockReturnValueOnce(later.promise);
    await userEvent.click(screen.getByText("Edit settings"));
    await recordReflection();
    await act(async () => earlier.resolve("indexeddb"));
    expect(line().textContent).toBe("Saving on this device…");
    await act(async () => later.resolve("indexeddb"));
    expect(line().textContent).toBe("Saved on this device.");
  });
});

describe("what \"saved\" may be said about", () => {
  function SavedProbe({ ids }: { ids: string[] }) {
    const { isEvidenceSaved, workspaceId, switchWorkspace, dispatch } = useV8Store();
    return <>
      <output data-testid="saved">{String(isEvidenceSaved(ids))}</output>
      <output data-testid="workspace">{workspaceId}</output>
      <button onClick={() => void switchWorkspace("account:other")}>Switch</button>
      <button onClick={() => dispatch({ type: "recordActivity", activityId: reflection.id, evidence: [{ ...probeEvidence, id: ids[0] }] })}>Record</button>
      <RecordSaveStatus evidenceIds={ids} />
    </>;
  }
  const probeEvidence = { competencyId: "c", source: "reflection", assistance: "none", context: { key: "C", mode: "major", tempo: 60, instrument: "electric" }, outcome: "retry", occurredAt: "2026-09-17T12:00:00.000Z", activityId: "a", method: "self-reported" } as never as import("../types").CompetencyEvidence;

  it("never calls a record saved because an unrelated save succeeded", async () => {
    render(<V8StoreProvider><SavedProbe ids={["not-yet-written"]} /></V8StoreProvider>);
    await screen.findByText("Saving on this device…");
    await act(async () => {});
    expect(repository.savePersistedState).toHaveBeenCalled();
    expect(screen.getByText("Saving on this device…")).toBeTruthy();
    expect(screen.getByTestId("saved").textContent).toBe("false");
  });

  it("says saving is paused, not in progress, when the stored workspace is unreadable", async () => {
    vi.mocked(repository.loadWorkspace).mockResolvedValue({ status: "unreadable", raw: { version: 99 }, reason: "Newer format" });
    render(<V8StoreProvider><SavedProbe ids={["held-on-screen"]} /></V8StoreProvider>);
    await act(async () => {});
    expect(screen.getByText(/^Not saved: this device's stored work could not be read/)).toBeTruthy();
  });

  it("does not carry a record's saved status into another workspace", async () => {
    render(<V8StoreProvider><SavedProbe ids={["recorded-here"]} /></V8StoreProvider>);
    await act(async () => {});
    await userEvent.click(screen.getByText("Record"));
    await waitFor(() => expect(screen.getByTestId("saved").textContent).toBe("true"));
    const pending = deferred<repository.SaveMedium>();
    vi.mocked(repository.savePersistedState).mockReturnValue(pending.promise);
    await userEvent.click(screen.getByText("Switch"));
    await waitFor(() => expect(screen.getByTestId("workspace").textContent).toBe("account:other"));
    expect(screen.getByTestId("saved").textContent).toBe("false");
  });
});

describe("an unsaved reflection holds a requested update", () => {
  it("waits while the draft exists and applies once it is recorded and saved", async () => {
    await mountShell(true);
    const apply = vi.fn();
    act(() => noteUpdateReady(apply));
    await userEvent.type(screen.getByRole("textbox"), "Draft");
    act(() => { requestUpdate(); });
    await act(async () => {});
    expect(apply).not.toHaveBeenCalled();
    await userEvent.type(screen.getByRole("textbox"), " about the held third");
    await userEvent.click(screen.getByRole("button", { name: /Needs another pass/ }));
    await waitFor(() => expect(apply).toHaveBeenCalledOnce());
  });
});
