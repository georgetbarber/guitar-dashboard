// @vitest-environment jsdom
import "fake-indexeddb/auto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DEFAULT_STATE, V8StoreProvider, useV8Store } from "./store";
import * as repository from "./repository";
import * as player from "../audio/scorePlayer";
import { PiecePlayer } from "./components/PiecePlayer";
import { completedActivityIdsFromEvidence, unitProgress } from "./learning";
import { validateEvidence, validateState } from "./validation";
import type { V8State } from "./types";

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
    signOut: vi.fn(),
  }),
}));
vi.mock("../audio/scorePlayer", async (original) => ({
  ...(await original<typeof import("../audio/scorePlayer")>()),
  startScorePlayback: vi.fn(),
  stopScorePlayback: vi.fn(),
}));

function Probe() {
  const { state } = useV8Store();
  return (
    <output data-testid="state">
      {JSON.stringify({ evidence: state.evidence, favourites: state.favoriteActivityIds ?? [] })}
    </output>
  );
}
const probe = () => JSON.parse(screen.getByTestId("state").textContent ?? "{}");
const renderPiece = (request: Parameters<typeof PiecePlayer>[0]["request"]) =>
  render(
    <V8StoreProvider>
      <PiecePlayer request={request} onClose={vi.fn()} />
      <Probe />
    </V8StoreProvider>,
  );

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(repository.loadWorkspace).mockResolvedValue({ status: "ok", state: structuredClone(DEFAULT_STATE) });
  vi.mocked(repository.savePersistedState).mockResolvedValue("indexeddb");
  vi.mocked(repository.discardIncompleteStaging).mockResolvedValue(0);
  vi.mocked(player.startScorePlayback).mockResolvedValue(() => undefined);
  vi.stubGlobal("matchMedia", () => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() }));
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("the piece player", () => {
  it("plays along: the learner's part silent, the second guitar sounding, the form shown bar by bar", async () => {
    const user = userEvent.setup();
    renderPiece({ pieceId: "piece-front-step", capstoneStage: 1 });
    await screen.findByRole("heading", { name: "Front Step" });
    expect(screen.getByText("Stage 1 capstone · Blues-rock")).toBeTruthy();
    expect(screen.getByRole("list", { name: "Form" }).textContent).toContain("Line 1 · E bars 1–4");
    expect(screen.getByText("Not yet checked on a guitar")).toBeTruthy();
    expect(screen.getByText(/Demonstration video still needed/).closest("p")!.textContent).toContain("muting");
    await user.click(screen.getByRole("button", { name: "Play along with the band" }));
    const [lead, options] = vi.mocked(player.startScorePlayback).mock.calls[0];
    expect(lead.id).toBe("front-step-one-finger");
    expect(options.mode).toBe("count-only");
    expect(options.accompaniment?.map((score) => score.id)).toEqual(["front-step-band"]);
    await user.click(screen.getByRole("button", { name: "Hear everything" }));
    expect(vi.mocked(player.startScorePlayback).mock.calls[1][1].mode).toBe("reference");
  });

  it("records a capstone self-report against the stage, never a unit, and says when the tab was showing", async () => {
    const user = userEvent.setup();
    renderPiece({ pieceId: "piece-front-step", capstoneStage: 1 });
    await screen.findByRole("heading", { name: "Front Step" });
    const report = screen.getByRole("button", { name: "I played it" }) as HTMLButtonElement;
    expect(report.disabled).toBe(true);
    await user.click(screen.getByRole("button", { name: "I played it without the app sound" }));
    await user.type(screen.getByRole("textbox", { name: "One concrete observation" }), "Lost the bar count at the B.");
    expect(screen.getByText(/recorded as played with a hint/)).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Partly there" }));
    const [first] = probe().evidence;
    expect(first).toMatchObject({
      activityId: "stage-1-capstone",
      competencyId: "piece.front-step.one-finger",
      source: "performance",
      assistance: "hint",
      outcome: "partial",
      method: "self-reported",
    });
    // Hidden tab, nothing played with it showing: unaided.
    await user.click(screen.getByRole("checkbox", { name: "Hide the tab" }));
    await user.click(screen.getByRole("button", { name: "I played it without the app sound" }));
    await user.type(
      screen.getByRole("textbox", { name: "One concrete observation" }),
      "All sixteen bars, together at the end.",
    );
    await user.click(screen.getByRole("button", { name: "I played it" }));
    expect(probe().evidence[1]).toMatchObject({ assistance: "none", outcome: "successful" });
  });

  it("offers no self-report outside a capstone, and saves a piece as a familiar favourite", async () => {
    const user = userEvent.setup();
    renderPiece({ pieceId: "piece-low-road", partId: "low-road-riff" });
    await screen.findByRole("heading", { name: "Low Road" });
    expect(screen.queryByRole("textbox", { name: "One concrete observation" })).toBeNull();
    await user.click(screen.getByRole("button", { name: "☆ Save as a familiar favourite" }));
    expect(probe().favourites).toEqual(["piece:piece-low-road"]);
  });

  it("lists every part by layer and switches the score and band", async () => {
    const user = userEvent.setup();
    renderPiece({ pieceId: "piece-low-road", capstoneStage: 2 });
    await screen.findByRole("heading", { name: "Low Road" });
    expect(screen.getByRole("heading", { name: "Riff, octave fill and tag in A" })).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "The same piece from E · capstone" }));
    await user.click(screen.getByRole("button", { name: "Play along with the band" }));
    const [lead, options] = vi.mocked(player.startScorePlayback).mock.calls[0];
    expect([lead.id, options.accompaniment?.[0].id]).toEqual(["low-road-whole-e", "low-road-band-e"]);
  });

  it("explains a piece missing from this version instead of failing", () => {
    renderPiece({ pieceId: "piece-not-yet" });
    expect(screen.getByRole("heading", { name: "This piece isn't in this version of Interval" })).toBeTruthy();
  });
});

describe("capstone records stay compatible", () => {
  const capstone = {
    id: "evidence-capstone",
    competencyId: "piece.front-step.one-finger",
    activityId: "stage-1-capstone",
    source: "performance",
    assistance: "none",
    outcome: "successful",
    occurredAt: "2026-10-24T09:00:00.000Z",
    localDate: "2026-10-24",
    method: "self-reported",
    context: { tempo: 72 },
  } as const;

  it("pass the same evidence validation and rules shape as every other observation", () => {
    expect(() => validateEvidence(capstone)).not.toThrow();
    expect(() => validateState({ ...DEFAULT_STATE, evidence: [capstone] })).not.toThrow();
  });

  it("never complete a unit or move the path", () => {
    const state: V8State = { ...DEFAULT_STATE, evidence: [capstone] };
    expect(completedActivityIdsFromEvidence(state.evidence)).toEqual(["stage-1-capstone"]);
    expect(unitProgress({ ...state, completedActivityIds: ["stage-1-capstone"] }, "unit-01")).toBe(0);
  });

  it("round-trip through an exported backup and a staged restore", async () => {
    const actual = await vi.importActual<typeof import("./repository")>("./repository");
    await new Promise<void>((resolve, reject) => {
      const request = indexedDB.deleteDatabase("guitar-academy-v8");
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
    actual.setActiveWorkspace("anonymous");
    const state: V8State = {
      ...DEFAULT_STATE,
      evidence: [capstone],
      completedActivityIds: ["stage-1-capstone"],
      favoriteActivityIds: ["piece:piece-front-step"],
    };
    const archive = new File([await actual.exportArchive(state)], "backup.guitar-academy");
    const preview = await actual.prepareRestore(archive, "anonymous");
    await actual.activateRestore(preview.operationId);
    const reopened = await actual.loadWorkspace("anonymous");
    expect(reopened.status).toBe("ok");
    if (reopened.status !== "ok") return;
    expect(reopened.state.evidence).toEqual([capstone]);
    expect(reopened.state.favoriteActivityIds).toEqual(["piece:piece-front-step"]);
  });
});
