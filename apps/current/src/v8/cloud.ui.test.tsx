// @vitest-environment jsdom
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { CloudSyncProvider, useCloudSync } from "./cloudFacade";
import { beginPreparedSignIn } from "./cloud";
import { DEFAULT_STATE, V8StoreProvider, useV8Store } from "./store";
import { RestoreHoldNotice } from "./components/SaveStatus";
import * as repository from "./repository";
import { setDoc } from "firebase/firestore";
import { signInWithPopup } from "firebase/auth";
import { resetUpdateStateForTests } from "./updates";

// Only the external SDK and device I/O are replaced. Both React providers,
// their effects, the sync planner, and the account-choice UI run unchanged.
const firebase = vi.hoisted(() => {
  for (const key of ["API_KEY", "AUTH_DOMAIN", "PROJECT_ID", "APP_ID"]) vi.stubEnv(`VITE_FIREBASE_${key}`, "local-test");
  vi.stubEnv("VITE_FIREBASE_APP_CHECK_SITE_KEY", "");
  return {
    authChanged: (_user: unknown) => {},
    snapshots: new Map<string, (snapshot: unknown) => void>(),
  };
});
vi.mock("firebase/app", () => ({ getApps: () => [{}], initializeApp: vi.fn() }));
vi.mock("firebase/auth", () => ({
  getAuth: () => ({}), getRedirectResult: async () => null,
  onAuthStateChanged: (_auth: unknown, callback: typeof firebase.authChanged) => { firebase.authChanged = callback; return vi.fn(); },
  GoogleAuthProvider: vi.fn(), signInWithPopup: vi.fn(), signInWithRedirect: vi.fn(async () => {}), signOut: vi.fn(),
}));
vi.mock("firebase/firestore", () => ({
  getFirestore: () => ({}), doc: (_db: unknown, ...path: string[]) => path.join("/"),
  collection: (_db: unknown, ...path: string[]) => path.join("/"),
  onSnapshot: (path: string, callback: (snapshot: unknown) => void) => {
    firebase.snapshots.set(path, callback);
    return () => firebase.snapshots.delete(path);
  },
  setDoc: vi.fn(async () => {}), deleteDoc: vi.fn(async () => {}),
  writeBatch: () => ({ set: vi.fn(), commit: async () => {} }),
}));
vi.mock("firebase/storage", () => ({ getStorage: () => null, deleteObject: vi.fn(), getBlob: vi.fn(), ref: vi.fn(), uploadBytes: vi.fn() }));
vi.mock("./repository", async (original) => ({
  ...await original<typeof import("./repository")>(),
  loadWorkspace: vi.fn(), savePersistedState: vi.fn(async () => "indexeddb"),
  confirmRestoreMerge: vi.fn(async () => {}),
  discardIncompleteStaging: vi.fn(async () => 0), workspaceExists: vi.fn(async () => true),
}));

function Controls() {
  const { state, dispatch, workspaceId } = useV8Store();
  const cloud = useCloudSync();
  return <>
    <output data-testid="account">{workspaceId}</output>
    <output data-testid="reflection">{state.lastReflection}</output>
    <output data-testid="sync-status">{cloud.status}</output>
    <button onClick={() => dispatch({ type: "updateSettings", settings: { dailyMinutes: 35 } })}>Ordinary edit</button>
    <button onClick={() => {
      dispatch({ type: "replaceState", state: { ...state, pendingRestoreId: "test-restore", updatedAt: new Date().toISOString(), settings: { ...state.settings, dailyMinutes: 55 } } });
    }}>Activate staged restore</button>
  </>;
}

const stored = new Map<string, string>();
const testStorage = {
  getItem: (key: string) => stored.get(key) ?? null,
  setItem: (key: string, value: string) => { stored.set(key, value); },
  removeItem: (key: string) => { stored.delete(key); },
  clear: () => { stored.clear(); },
  key: (index: number) => [...stored.keys()][index] ?? null,
  get length() { return stored.size; }
};
const noAuthChange = () => {};

async function waitForAuthListener() {
  vi.useRealTimers();
  try { await waitFor(() => expect(firebase.authChanged).not.toBe(noAuthChange)); }
  finally { vi.useFakeTimers(); }
}

beforeEach(() => {
  vi.clearAllMocks(); vi.useFakeTimers(); resetUpdateStateForTests();
  firebase.authChanged = noAuthChange;
  Object.defineProperty(window, "localStorage", { value: testStorage, configurable: true });
  vi.stubGlobal("localStorage", testStorage);
  testStorage.setItem("guitar-academy-cloud-session", "account");
  repository.setActiveWorkspace("anonymous");
  vi.mocked(repository.loadWorkspace).mockResolvedValue({ status: "ok", state: structuredClone(DEFAULT_STATE) });
  vi.stubGlobal("confirm", vi.fn(() => true));
});
afterEach(() => { cleanup(); vi.useRealTimers(); vi.unstubAllGlobals(); testStorage.clear(); resetUpdateStateForTests(); });

it("uses a popup from a prepared user gesture and retains the account hint", async () => {
  testStorage.setItem("guitar-academy-cloud-session", "guest");
  await beginPreparedSignIn();
  expect(signInWithPopup).toHaveBeenCalledOnce();
  expect(testStorage.getItem("guitar-academy-cloud-session")).toBe("account");
});

it("cancels a scheduled upload on restore and resumes only after a confirmed account choice", async () => {
  render(<V8StoreProvider><CloudSyncProvider><Controls /><RestoreHoldNotice /></CloudSyncProvider></V8StoreProvider>);
  await waitForAuthListener();
  await act(async () => firebase.authChanged({ uid: "learner", email: "learner@example.test" }));
  expect(screen.getByTestId("account").textContent).toBe("account:learner");
  expect(firebase.snapshots.size).toBe(3);
  await act(async () => {
    firebase.snapshots.get("users/learner")!({ exists: () => false });
    firebase.snapshots.get("users/learner/evidence")!({ docs: [] });
    firebase.snapshots.get("users/learner/sketches")!({ docs: [] });
    await vi.advanceTimersByTimeAsync(1000);
  });
  // Flush the upload scheduled by React's post-snapshot effect.
  await act(async () => { await vi.advanceTimersByTimeAsync(1000); });
  expect(setDoc).toHaveBeenCalled();
  vi.mocked(setDoc).mockClear();
  fireEvent.click(screen.getByText("Ordinary edit"));
  fireEvent.click(screen.getByText("Activate staged restore"));
  expect(screen.getByTestId("sync-status").textContent).toBe("restore-hold");
  await act(async () => { await vi.advanceTimersByTimeAsync(2000); });
  expect(setDoc).not.toHaveBeenCalled();
  vi.mocked(confirm).mockReturnValueOnce(false);
  fireEvent.click(screen.getByText("Merge with my account"));
  await act(async () => { await vi.advanceTimersByTimeAsync(2000); });
  expect(setDoc).not.toHaveBeenCalled();
  await act(async () => { fireEvent.click(screen.getByText("Merge with my account")); });
  await emitEmptyAccount();
  await act(async () => { await vi.advanceTimersByTimeAsync(1000); });
  expect(setDoc).toHaveBeenCalledWith("users/learner", expect.objectContaining({ settings: expect.objectContaining({ dailyMinutes: 55 }) }));
  expect(screen.getByTestId("sync-status").textContent).toBe("synced");
});


async function emitEmptyAccount() {
  await act(async () => {
    firebase.snapshots.get("users/learner")!({ exists: () => false });
    firebase.snapshots.get("users/learner/evidence")!({ docs: [] });
    firebase.snapshots.get("users/learner/sketches")!({ docs: [] });
  });
}

it("reloads a held account without subscribing or uploading, including after sign-out and sign-in", async () => {
  vi.mocked(repository.loadWorkspace).mockImplementation(async (workspace) => ({ status: "ok", state: workspace === "account:learner" ? { ...DEFAULT_STATE, pendingRestoreId: "saved-restore", lastReflection: "My restored idea" } : structuredClone(DEFAULT_STATE) }));
  const mount = () => render(<V8StoreProvider><CloudSyncProvider><Controls /><RestoreHoldNotice /></CloudSyncProvider></V8StoreProvider>);
  for (let attempt = 0; attempt < 2; attempt++) {
    firebase.authChanged = noAuthChange;
    const view = mount();
    await waitForAuthListener();
    await act(async () => firebase.authChanged({ uid: "learner" }));
    await act(async () => { await vi.advanceTimersByTimeAsync(2000); });
    expect(screen.getByTestId("reflection").textContent).toBe("My restored idea");
    expect(screen.getByTestId("sync-status").textContent).toBe("restore-hold");
    expect(firebase.snapshots.size).toBe(0);
    expect(setDoc).not.toHaveBeenCalled();
    await act(async () => firebase.authChanged(null));
    expect(screen.getByTestId("account").textContent).toBe("anonymous");
    await act(async () => firebase.authChanged({ uid: "learner" }));
    expect(screen.getByTestId("sync-status").textContent).toBe("restore-hold");
    view.unmount();
  }
});

it("ignores late snapshots from the subscription retired when a restore begins", async () => {
  render(<V8StoreProvider><CloudSyncProvider><Controls /><RestoreHoldNotice /></CloudSyncProvider></V8StoreProvider>);
  await waitForAuthListener();
  await act(async () => firebase.authChanged({ uid: "learner" }));
  await emitEmptyAccount();
  const lateSketches = firebase.snapshots.get("users/learner/sketches")!;
  fireEvent.click(screen.getByText("Activate staged restore"));
  expect(firebase.snapshots.size).toBe(0);
  const data = vi.fn(() => ({ ...repository.newSketch(0), id: "late-sketch" }));
  await act(async () => lateSketches({ docs: [{ id: "late-sketch", data }] }));
  expect(data).not.toHaveBeenCalled();
  await act(async () => { await vi.advanceTimersByTimeAsync(2000); });
  expect(screen.getByTestId("sync-status").textContent).toBe("restore-hold");
  expect(setDoc).not.toHaveBeenCalled();
  const writes = vi.mocked(repository.savePersistedState).mock.calls;
  expect(writes.at(-1)?.[0].sketches).toHaveLength(0);
});

it("keeps sync paused and the choice retryable when persisting confirmation fails", async () => {
  vi.mocked(repository.loadWorkspace).mockResolvedValue({ status: "ok", state: { ...DEFAULT_STATE, pendingRestoreId: "saved-restore" } });
  vi.mocked(repository.confirmRestoreMerge).mockRejectedValueOnce(new Error("Device refused the choice"));
  render(<V8StoreProvider><CloudSyncProvider><Controls /><RestoreHoldNotice /></CloudSyncProvider></V8StoreProvider>);
  await waitForAuthListener();
  await act(async () => firebase.authChanged({ uid: "learner" }));
  await act(async () => { fireEvent.click(screen.getByText("Merge with my account")); });
  expect(screen.getByText("Device refused the choice")).toBeTruthy();
  await act(async () => { await vi.advanceTimersByTimeAsync(2000); });
  expect(setDoc).not.toHaveBeenCalled();
  expect(firebase.snapshots.size).toBe(0);
  expect(screen.getByTestId("sync-status").textContent).toBe("restore-hold");
  await act(async () => { fireEvent.click(screen.getByText("Merge with my account")); });
  expect(repository.confirmRestoreMerge).toHaveBeenLastCalledWith("account:learner", "saved-restore");
  expect(firebase.snapshots.size).toBe(3);
});


it("does not subscribe or upload when the signed-in device workspace is unreadable", async () => {
  vi.mocked(repository.loadWorkspace).mockImplementation(async (workspace) => workspace === "account:learner" ? { status: "unreadable", reason: "Unknown format", raw: { version: 99 } } : { status: "ok", state: structuredClone(DEFAULT_STATE) });
  render(<V8StoreProvider><CloudSyncProvider><Controls /><RestoreHoldNotice /></CloudSyncProvider></V8StoreProvider>);
  await waitForAuthListener();
  await act(async () => firebase.authChanged({ uid: "learner" }));
  await act(async () => { await vi.advanceTimersByTimeAsync(2000); });
  expect(screen.getByTestId("sync-status").textContent).toBe("error");
  expect(firebase.snapshots.size).toBe(0);
  expect(setDoc).not.toHaveBeenCalled();
});
