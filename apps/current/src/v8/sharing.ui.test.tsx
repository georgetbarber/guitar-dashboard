// @vitest-environment jsdom
import { afterEach, expect, it, vi } from "vitest";
import { act, cleanup, render, screen } from "@testing-library/react";

/*
 * A configured bucket name is not evidence that Firebase Storage exists: the
 * live project has a bucket name and no bucket. Take sharing is offered only
 * when a build explicitly opts in with VITE_RECORDING_SHARING=enabled.
 */
vi.mock("firebase/app", () => ({ getApps: () => [{}], initializeApp: vi.fn() }));
vi.mock("firebase/auth", () => ({ getAuth: () => ({}), getRedirectResult: async () => null, onAuthStateChanged: () => vi.fn(), GoogleAuthProvider: vi.fn(), signInWithPopup: vi.fn(), signOut: vi.fn() }));
vi.mock("firebase/firestore", () => ({ getFirestore: () => ({}), doc: vi.fn(), collection: vi.fn(), onSnapshot: vi.fn(() => vi.fn()), setDoc: vi.fn(), deleteDoc: vi.fn(), writeBatch: vi.fn() }));
vi.mock("firebase/storage", () => ({ getStorage: () => ({ bucket: "exists-in-test" }), deleteObject: vi.fn(), getBlob: vi.fn(), ref: vi.fn(), uploadBytes: vi.fn() }));

afterEach(() => { cleanup(); vi.unstubAllEnvs(); vi.resetModules(); });

async function sharingOffered(env: Record<string, string>) {
  for (const key of ["API_KEY", "AUTH_DOMAIN", "PROJECT_ID", "APP_ID"]) vi.stubEnv(`VITE_FIREBASE_${key}`, "local-test");
  vi.stubEnv("VITE_FIREBASE_APP_CHECK_SITE_KEY", "");
  for (const [key, value] of Object.entries(env)) vi.stubEnv(key, value);
  vi.resetModules();
  const { CloudSyncProvider, useCloudSync } = await import("./cloud");
  const { V8StoreProvider } = await import("./store");
  function Probe() { return <output data-testid="sharing">{String(useCloudSync().sharingAvailable)}</output>; }
  render(<V8StoreProvider><CloudSyncProvider><Probe /></CloudSyncProvider></V8StoreProvider>);
  await act(async () => {});
  const value = screen.getByTestId("sharing").textContent;
  cleanup();
  return value;
}

it("does not offer sharing just because a bucket name is configured", async () => {
  expect(await sharingOffered({ VITE_FIREBASE_STORAGE_BUCKET: "learn-the-guitar.appspot.com", VITE_RECORDING_SHARING: "" })).toBe("false");
});

it("offers sharing only when the build opts in and names a bucket", async () => {
  expect(await sharingOffered({ VITE_FIREBASE_STORAGE_BUCKET: "learn-the-guitar.appspot.com", VITE_RECORDING_SHARING: "enabled" })).toBe("true");
  expect(await sharingOffered({ VITE_FIREBASE_STORAGE_BUCKET: "", VITE_RECORDING_SHARING: "enabled" })).toBe("false");
});
