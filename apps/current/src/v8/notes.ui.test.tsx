// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DEFAULT_STATE, V8StoreProvider, useV8Store } from "./store";
import { ContentStatus } from "./components/ContentStatus";
import { SettingsPanel } from "./components/SettingsPanel";
import * as repository from "./repository";
import { DRAFT_BY_AGENT } from "./provenance";
import checklist from "./georgeChecks.json";

vi.mock("./repository", async (original) => ({
  ...(await original<typeof import("./repository")>()),
  loadWorkspace: vi.fn(),
  savePersistedState: vi.fn(),
  discardIncompleteStaging: vi.fn(),
}));
vi.mock("./cloudFacade", () => ({
  useCloudSync: () => ({
    configured: false,
    user: null,
    status: "local-only",
    message: "Local only.",
    sharingAvailable: false,
    signOut: vi.fn(),
  }),
}));

function Probe() {
  const { state } = useV8Store();
  return (
    <output data-testid="notes">
      {JSON.stringify({
        notes: state.feedbackNotes ?? [],
        marks: state.reviewMarks ?? [],
        ticks: state.checklistTicks ?? [],
        evidence: state.evidence.length,
      })}
    </output>
  );
}
const probe = () => JSON.parse(screen.getByTestId("notes").textContent ?? "{}");

const provenance = { contentId: "one-note-qa-episode", contentVersion: 1, ...DRAFT_BY_AGENT };
const target = () => ({
  contentId: "one-note-qa-episode",
  contentVersion: 1,
  contentTitle: "One-note question and answer",
  location: "Step 2 · bar 2",
  showing: "count visible",
});

beforeEach(() => {
  vi.resetAllMocks();
  Object.defineProperty(HTMLDialogElement.prototype, "showModal", {
    configurable: true,
    value: function (this: HTMLDialogElement) {
      this.setAttribute("open", "");
    },
  });
  Object.defineProperty(HTMLDialogElement.prototype, "close", {
    configurable: true,
    value: function (this: HTMLDialogElement) {
      this.removeAttribute("open");
    },
  });
  vi.mocked(repository.loadWorkspace).mockResolvedValue({ status: "ok", state: structuredClone(DEFAULT_STATE) });
  vi.mocked(repository.savePersistedState).mockResolvedValue("indexeddb");
  vi.mocked(repository.discardIncompleteStaging).mockResolvedValue(0);
  vi.stubGlobal("matchMedia", () => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() }));
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("the lesson honesty strip", () => {
  it("shows a calm draft tag, takes a note with its context, and never records evidence", async () => {
    const user = userEvent.setup();
    render(
      <V8StoreProvider>
        <ContentStatus provenance={provenance} target={target} />
        <Probe />
      </V8StoreProvider>,
    );
    expect(await screen.findByText("Not yet checked on a guitar")).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Something's wrong here" }));
    const dialog = await screen.findByRole("dialog", { name: "Leave a note about this" });
    expect(within(dialog).getByText("Step 2 · bar 2")).toBeTruthy();
    // Nothing typed: Save refuses and keeps the dialog open.
    await user.click(within(dialog).getByRole("button", { name: "Save note" }));
    expect(within(dialog).getByRole("alert").textContent).toMatch(/Write what is wrong/);
    await user.type(
      within(dialog).getByLabelText("What is wrong, or what did you expect?"),
      "Bar 2 sounds a beat late",
    );
    await user.click(within(dialog).getByLabelText("Wrong note or chord"));
    // Closing with unsaved words asks first rather than losing them.
    await user.click(within(dialog).getByRole("button", { name: "Close note" }));
    expect(within(dialog).getByRole("alert").textContent).toMatch(/not saved yet/);
    await user.click(within(dialog).getByRole("button", { name: "Save note" }));
    expect(screen.queryByRole("dialog")).toBeNull();
    const { notes, evidence } = probe();
    expect(notes).toHaveLength(1);
    expect(notes[0]).toMatchObject({
      contentId: "one-note-qa-episode",
      contentVersion: 1,
      location: "Step 2 · bar 2",
      text: "Bar 2 sounds a beat late",
      category: "wrong-music",
    });
    expect(evidence).toBe(0);
  });

  it("marks this version as checked with a name, and can undo it", async () => {
    const user = userEvent.setup();
    render(
      <V8StoreProvider>
        <ContentStatus provenance={provenance} target={target} />
        <Probe />
      </V8StoreProvider>,
    );
    await user.click(await screen.findByRole("button", { name: "Mark as checked" }));
    await user.click(screen.getByRole("button", { name: "Save check" }));
    expect(screen.getByText(/Add your name so the check/)).toBeTruthy();
    await user.type(screen.getByLabelText("Checked by"), "George");
    await user.click(screen.getByRole("button", { name: "Save check" }));
    expect(screen.getByText(/^Checked by George ·/)).toBeTruthy();
    expect(probe().marks[0]).toMatchObject({ id: "one-note-qa-episode@1", reviewer: "George", withdrawn: false });
    await user.click(screen.getByRole("button", { name: "Undo check" }));
    expect(screen.getByText("Not yet checked on a guitar")).toBeTruthy();
    expect(probe().marks[0].withdrawn).toBe(true);
  });
});

describe("Settings › Things to check and Feedback", () => {
  it("ticks a checklist item from the shared JSON and keeps the tick", async () => {
    const user = userEvent.setup();
    render(
      <V8StoreProvider>
        <SettingsPanel onClose={vi.fn()} />
        <Probe />
      </V8StoreProvider>,
    );
    await user.click(await screen.findByRole("button", { name: /Things to check · 0 ticked/ }));
    const first = checklist.items[0];
    const box = await screen.findByRole("checkbox", { name: first.title });
    await user.click(box);
    expect(probe().ticks).toEqual([expect.objectContaining({ id: first.id, done: true })]);
    expect(screen.getByText(new RegExp(`1 of ${checklist.items.length} ticked`))).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "← Back to settings" }));
    expect(screen.getByRole("button", { name: /Things to check · 1 ticked/ })).toBeTruthy();
  });

  it("lists notes, marks one as dealt with, and exports Markdown", async () => {
    const user = userEvent.setup();
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText } });
    const state = structuredClone(DEFAULT_STATE);
    state.feedbackNotes = [
      {
        id: "note-1",
        contentId: "unit-03-rhythm",
        contentVersion: 1,
        contentTitle: "Steady pulse · Play the groove",
        showing: "Instruction shown",
        text: "The count-in is too short.",
        category: "confusing",
        createdAt: "2026-10-20T12:00:00.000Z",
        localDate: "2026-10-20",
        resolvedAt: null,
        updatedAt: "2026-10-20T12:00:00.000Z",
      },
    ];
    vi.mocked(repository.loadWorkspace).mockResolvedValue({ status: "ok", state });
    render(
      <V8StoreProvider>
        <SettingsPanel onClose={vi.fn()} initialView="feedback" />
        <Probe />
      </V8StoreProvider>,
    );
    expect(await screen.findByText("The count-in is too short.")).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Copy as Markdown" }));
    expect(writeText).toHaveBeenCalledWith(expect.stringContaining("> The count-in is too short."));
    await user.click(screen.getByRole("button", { name: "Mark as dealt with" }));
    expect(screen.getByText("Every note has been dealt with.")).toBeTruthy();
    expect(probe().notes[0].resolvedAt).toBeTruthy();
  });
});
