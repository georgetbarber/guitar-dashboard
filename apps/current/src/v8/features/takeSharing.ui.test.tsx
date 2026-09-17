// @vitest-environment jsdom
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { act, cleanup, render, screen } from "@testing-library/react";
import { Create } from "./Create";
import { DEFAULT_STATE, V8StoreProvider } from "../store";
import * as repository from "../repository";

const cloud = vi.hoisted(() => ({ sharingAvailable: false }));
vi.mock("../repository", async (original) => ({
  ...await original<typeof import("../repository")>(),
  loadWorkspace: vi.fn(), savePersistedState: vi.fn(), discardIncompleteStaging: vi.fn(), loadBlob: vi.fn()
}));
vi.mock("../cloud", () => ({
  useCloudSync: () => ({ user: { uid: "learner", email: "learner@example.test" }, status: "synced", sharingAvailable: cloud.sharingAvailable, uploadedTakeBlob: vi.fn() })
}));
vi.mock("../../audio/microphone", () => ({ openMicrophone: vi.fn(), startTakeRecording: vi.fn() }));
vi.mock("../../audio/engine", () => ({ stopAudio: vi.fn(), startVoicingProgression: vi.fn() }));

beforeEach(() => {
  vi.resetAllMocks();
  const sketch = { ...repository.newSketch(0), id: "finished-sketch", status: "finished" as const, takes: [{ id: "take-1", name: "Take 1", createdAt: "2026-09-17T12:00:00.000Z", blobId: "blob-1", note: "" }] };
  vi.mocked(repository.loadWorkspace).mockResolvedValue({ status: "ok", state: { ...structuredClone(DEFAULT_STATE), sketches: [sketch], activeSketchId: sketch.id } });
  vi.mocked(repository.savePersistedState).mockResolvedValue("indexeddb");
  vi.mocked(repository.discardIncompleteStaging).mockResolvedValue(0);
  vi.mocked(repository.loadBlob).mockResolvedValue(new Blob(["audio"], { type: "audio/webm" }));
  URL.createObjectURL = vi.fn(() => "blob:take");
  URL.revokeObjectURL = vi.fn();
  vi.stubGlobal("matchMedia", () => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() }));
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

async function mount() {
  render(<V8StoreProvider><Create /></V8StoreProvider>);
  await act(async () => {});
  await screen.findByText("Take 1");
}

it("offers no sharing control for a finished take when this build has no Storage", async () => {
  cloud.sharingAvailable = false;
  await mount();
  expect(screen.queryByRole("button", { name: /share this take/i })).toBeNull();
});

it("offers sharing for a finished take when Storage-backed sharing is enabled", async () => {
  cloud.sharingAvailable = true;
  await mount();
  expect(screen.getByRole("button", { name: "Share this take across devices" })).toBeTruthy();
});
