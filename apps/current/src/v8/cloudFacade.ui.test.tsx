// @vitest-environment jsdom
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { CloudSyncProvider, useCloudSync } from "./cloudFacade";
import { hasAccountWorkspace, workspaceHasLearningData } from "./repository";

const runtime = vi.hoisted(() => {
  for (const key of ["API_KEY", "AUTH_DOMAIN", "PROJECT_ID", "APP_ID"])
    vi.stubEnv(`VITE_FIREBASE_${key}`, "local-test");
  return { loaded: 0, redirected: vi.fn(async () => {}) };
});
vi.mock("./cloud", () => {
  runtime.loaded += 1;
  return {
    CloudSyncProvider: ({ children }: { children: React.ReactNode }) => children,
    useCloudSync: () => ({
      configured: true,
      signInReady: true,
      user: { uid: "returning" },
      status: "synced",
      message: "Connected",
    }),
    beginPreparedSignIn: runtime.redirected,
  };
});
vi.mock("./repository", async (original) => ({
  ...(await original<typeof import("./repository")>()),
  hasAccountWorkspace: vi.fn(async () => false),
  workspaceHasLearningData: vi.fn(async () => false),
}));

const stored = new Map<string, string>();
const storage = {
  getItem: (key: string) => stored.get(key) ?? null,
  setItem: (key: string, value: string) => {
    stored.set(key, value);
  },
  removeItem: (key: string) => {
    stored.delete(key);
  },
  clear: () => {
    stored.clear();
  },
  key: (index: number) => [...stored.keys()][index] ?? null,
  get length() {
    return stored.size;
  },
};

function Probe() {
  const cloud = useCloudSync();
  return (
    <>
      <output data-testid="cloud-status">{cloud.status}</output>
      <button onClick={() => void cloud.signIn()}>
        {cloud.signInReady ? "Open Google sign-in" : "Prepare Google sign-in"}
      </button>
    </>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  Object.defineProperty(window, "localStorage", { value: storage, configurable: true });
  vi.stubGlobal("localStorage", storage);
  vi.mocked(hasAccountWorkspace).mockResolvedValue(false);
  vi.mocked(workspaceHasLearningData).mockResolvedValue(false);
});
afterEach(() => {
  cleanup();
  storage.clear();
  vi.unstubAllGlobals();
});

it("keeps the account code out of a new guest launch, then loads it only when sign-in is requested", async () => {
  render(
    <CloudSyncProvider>
      <Probe />
    </CloudSyncProvider>,
  );
  await waitFor(() => expect(storage.getItem("guitar-academy-cloud-session")).toBe("guest"));
  expect(screen.getByTestId("cloud-status").textContent).toBe("signed-out");
  expect(runtime.loaded).toBe(0);
  await act(async () => {
    fireEvent.click(screen.getByText("Prepare Google sign-in"));
  });
  await waitFor(() => expect(screen.getByText("Open Google sign-in")).toBeTruthy());
  expect(runtime.loaded).toBe(1);
  expect(runtime.redirected).not.toHaveBeenCalled();
  await act(async () => {
    fireEvent.click(screen.getByText("Open Google sign-in"));
  });
  expect(runtime.redirected).toHaveBeenCalledOnce();
});

it("opens the account code for a returning signed-in device", async () => {
  storage.setItem("guitar-academy-cloud-session", "account");
  render(
    <CloudSyncProvider>
      <Probe />
    </CloudSyncProvider>,
  );
  await waitFor(() => expect(screen.getByTestId("cloud-status").textContent).toBe("synced"));
});

it("checks an existing account workspace once when upgrading a build without a hint", async () => {
  vi.mocked(hasAccountWorkspace).mockResolvedValue(true);
  render(
    <CloudSyncProvider>
      <Probe />
    </CloudSyncProvider>,
  );
  await waitFor(() => expect(screen.getByTestId("cloud-status").textContent).toBe("synced"));
  expect(hasAccountWorkspace).toHaveBeenCalledOnce();
});

it("checks existing guest learning once before assuming an older login is absent", async () => {
  vi.mocked(workspaceHasLearningData).mockResolvedValue(true);
  render(
    <CloudSyncProvider>
      <Probe />
    </CloudSyncProvider>,
  );
  await waitFor(() => expect(screen.getByTestId("cloud-status").textContent).toBe("synced"));
  expect(workspaceHasLearningData).toHaveBeenCalledWith("anonymous");
});
