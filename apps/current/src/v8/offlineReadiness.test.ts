// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { shellCachedForPage } from "./offlineReadiness";

const origin = "https://guitar.example";
const page =
  '<script type="module" src="/assets/index-new.js"></script><link rel="stylesheet" href="/assets/index-new.css">';

function storage(caches: Record<string, Record<string, string>>): CacheStorage {
  return {
    keys: async () => Object.keys(caches),
    open: async (name: string) =>
      ({
        match: async (request: RequestInfo | URL) => {
          const path = new URL(String(request), origin).pathname;
          const body = caches[name][path];
          return body === undefined ? undefined : ({ text: async () => body } as Response);
        },
      }) as Cache,
  } as CacheStorage;
}

describe("selected lesson offline readiness", () => {
  it("requires the current shell's index, JavaScript and stylesheet together in a precache", async () => {
    const cache = storage({
      "workbox-precache": {
        "/index.html": page,
        "/assets/index-new.js": "app",
        "/assets/index-new.css": "styles",
      },
    });
    expect(await shellCachedForPage(cache, page, origin)).toBe(true);
  });

  it("does not mistake an old cached build for the page currently open", async () => {
    const cache = storage({
      "workbox-precache": {
        "/index.html": '<script type="module" src="/assets/index-old.js"></script>',
        "/assets/index-new.js": "app",
        "/assets/index-new.css": "styles",
      },
    });
    expect(await shellCachedForPage(cache, page, origin)).toBe(false);
  });

  it("does not report readiness when a required asset is missing or only runtime-cached", async () => {
    const cache = storage({
      "workbox-precache": { "/index.html": page, "/assets/index-new.js": "app" },
      "runtime-media": { "/assets/index-new.css": "styles" },
    });
    expect(await shellCachedForPage(cache, page, origin)).toBe(false);
  });
});
