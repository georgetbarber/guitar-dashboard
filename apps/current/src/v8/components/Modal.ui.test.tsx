// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useRef, useState } from "react";
import { Modal } from "./Modal";
import { ActivityPlayer } from "./ActivityPlayer";
import { ACTIVITIES } from "../curriculum";
import { DEFAULT_STATE, V8StoreProvider } from "../store";
import * as repository from "../repository";

vi.mock("../repository", async (original) => ({
  ...await original<typeof import("../repository")>(),
  loadWorkspace: vi.fn(), savePersistedState: vi.fn(), discardIncompleteStaging: vi.fn()
}));
vi.mock("../../audio/engine", () => ({ playHarmonicRelationship: vi.fn(), playMelodicRelationship: vi.fn() }));

// jsdom has no top layer; the browser journeys cover real focus containment and inertness.
beforeEach(() => {
  vi.resetAllMocks();
  Object.defineProperty(HTMLDialogElement.prototype, "showModal", { configurable: true, value: function (this: HTMLDialogElement) { this.setAttribute("open", ""); } });
  Object.defineProperty(HTMLDialogElement.prototype, "close", { configurable: true, value: function (this: HTMLDialogElement) { this.removeAttribute("open"); this.dispatchEvent(new Event("close")); } });
  vi.mocked(repository.loadWorkspace).mockResolvedValue({ status: "ok", state: structuredClone(DEFAULT_STATE) });
  vi.mocked(repository.savePersistedState).mockResolvedValue("indexeddb");
  vi.mocked(repository.discardIncompleteStaging).mockResolvedValue(0);
});
afterEach(cleanup);

function Harness({ refuse = false, backdrop = false }: { refuse?: boolean; backdrop?: boolean }) {
  const [open, setOpen] = useState(false);
  const [requests, setRequests] = useState(0);
  return <>
    <button onClick={() => setOpen(true)}>Open</button>
    <output data-testid="requests">{requests}</output>
    {open && <Modal className="test" labelledBy="title" closeOnBackdrop={backdrop} onRequestClose={() => { setRequests((n) => n + 1); if (!refuse) setOpen(false); }}>
      <div className="scroll-area" tabIndex={0}><h2 id="title">Title</h2><button>First</button><button data-autofocus>Chosen</button></div>
    </Modal>}
  </>;
}

describe("Modal treats Escape, backdrop and native closes as requests (B13)", () => {
  it("focuses the marked control, then returns focus to the trigger", async () => {
    render(<Harness />);
    const trigger = screen.getByText("Open");
    await userEvent.click(trigger);
    expect(document.activeElement).toBe(screen.getByText("Chosen"));
    const cancel = new Event("cancel", { cancelable: true });
    act(() => { screen.getByRole("dialog").dispatchEvent(cancel); });
    expect(cancel.defaultPrevented).toBe(true);
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });

  it("keeps a refusing dialog open on Escape and on a close the browser performs itself", async () => {
    render(<Harness refuse />);
    await userEvent.click(screen.getByText("Open"));
    const dialog = screen.getByRole("dialog") as HTMLDialogElement;
    act(() => { dialog.dispatchEvent(new Event("cancel", { cancelable: true })); });
    act(() => { dialog.close(); });
    expect(dialog.hasAttribute("open")).toBe(true);
    expect(screen.getByTestId("requests").textContent).toBe("2");
    expect(document.activeElement).toBe(screen.getByText("Chosen"));
  });

  it("closes from the backdrop only when asked to, and never from a press inside", async () => {
    const { unmount } = render(<Harness />);
    await userEvent.click(screen.getByText("Open"));
    fireEvent.mouseDown(screen.getByRole("dialog"));
    expect(screen.getByRole("dialog")).toBeTruthy();
    unmount();
    render(<Harness backdrop />);
    await userEvent.click(screen.getByText("Open"));
    fireEvent.mouseDown(screen.getByText("First"));
    expect(screen.getByRole("dialog")).toBeTruthy();
    fireEvent.mouseDown(screen.getByRole("dialog"));
    expect(screen.queryByRole("dialog")).toBeNull();
  });
});

describe("the activity player keeps an unsaved reflection on Escape", () => {
  const reflection = ACTIVITIES.find((activity) => activity.kind === "reflection")!;
  const listen = ACTIVITIES.find((activity) => activity.kind === "listen-compare")!;

  function Player({ activityId, onClose }: { activityId: string; onClose: () => void }) {
    const guard = useRef<(() => void) | null>(null);
    return <Modal className="activity-overlay" labelledBy="activity-title" onRequestClose={() => (guard.current ?? onClose)()}>
      <ActivityPlayer activityId={activityId} onClose={onClose} requestCloseRef={guard} />
    </Modal>;
  }

  it("refuses Escape with a draft, explains the explicit exit, and still leaves by Close activity", async () => {
    const onClose = vi.fn();
    render(<V8StoreProvider><Player activityId={reflection.id} onClose={onClose} /></V8StoreProvider>);
    const close = await screen.findByRole("button", { name: "Close activity" });
    expect(document.activeElement).toBe(close);
    const escape = () => act(() => { screen.getByRole("dialog").dispatchEvent(new Event("cancel", { cancelable: true })); });
    escape();
    expect(onClose).toHaveBeenCalledTimes(1);
    onClose.mockClear();
    await userEvent.type(screen.getByRole("textbox"), "Held the third longer");
    escape();
    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByText(/Your written reflection has not been saved/)).toBeTruthy();
    await userEvent.click(close);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("closes on Escape when nothing is written", async () => {
    const onClose = vi.fn();
    render(<V8StoreProvider><Player activityId={listen.id} onClose={onClose} /></V8StoreProvider>);
    await screen.findByRole("button", { name: "Close activity" });
    act(() => { screen.getByRole("dialog").dispatchEvent(new Event("cancel", { cancelable: true })); });
    expect(onClose).toHaveBeenCalledOnce();
  });
});
