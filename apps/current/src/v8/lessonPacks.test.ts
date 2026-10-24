// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  discardBrokenPackFiles,
  LESSON_CACHE,
  preparePacksForUpdate,
  pruneLessonCache,
  rememberedStages,
  saveStagePack,
  stagePackSaved,
  warmLessonPacks,
  type PackManifest,
} from "./lessonPacks";

const ORIGIN = location.origin;
const manifest: PackManifest = {
  version: 1,
  stages: {
    "1": ["assets/lesson-LessonPlayer-a.js", "assets/lesson-stage1-a.js"],
    "2": ["assets/lesson-LessonPlayer-a.js", "assets/lesson-stage2-a.js"],
  },
};
const nextBuild: PackManifest = {
  version: 1,
  stages: { "1": ["assets/lesson-LessonPlayer-b.js", "assets/lesson-stage1-b.js"] },
};

class FakeCache {
  entries = new Map<string, Response>();
  async match(input: string | { url: string }) {
    return this.entries.get(typeof input === "string" ? input : input.url)?.clone();
  }
  async put(url: string, response: Response) {
    this.entries.set(url, response);
  }
  async keys() {
    return [...this.entries.keys()].map((url) => ({ url }));
  }
  async delete(request: { url: string }) {
    return this.entries.delete(request.url);
  }
}

let cache: FakeCache;
let served: Record<string, { body: string; type: string } | PackManifest>;
const fetched: string[] = [];

beforeEach(() => {
  cache = new FakeCache();
  fetched.length = 0;
  localStorage.clear();
  served = {
    "/lesson-packs.json": manifest,
    "/assets/lesson-LessonPlayer-a.js": { body: "export{}", type: "text/javascript; charset=utf-8" },
    "/assets/lesson-stage1-a.js": { body: "export{}", type: "text/javascript; charset=utf-8" },
    "/assets/lesson-stage2-a.js": { body: "export{}", type: "text/javascript; charset=utf-8" },
  };
  vi.stubGlobal("caches", { open: async (name: string) => (name === LESSON_CACHE ? cache : new FakeCache()) });
  Object.defineProperty(navigator, "serviceWorker", { configurable: true, value: {} });
  Object.defineProperty(navigator, "onLine", { configurable: true, value: true });
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: string) => {
      fetched.push(input);
      const path = input.split("?")[0];
      const item = input.startsWith("/lesson-packs.json?") ? nextBuild : served[path];
      if (!item) return new Response("<!doctype html>", { status: 200, headers: { "content-type": "text/html" } });
      if ("version" in item)
        return new Response(JSON.stringify(item), { headers: { "content-type": "application/json" } });
      return new Response(item.body, { headers: { "content-type": item.type } });
    }),
  );
});
afterEach(() => vi.unstubAllGlobals());

describe("lesson packs", () => {
  it("call a stage ready only when every file of its pack is saved as code", async () => {
    expect(await stagePackSaved(1)).toBe(false);
    await saveStagePack(1);
    expect([...cache.entries.keys()].sort()).toEqual([
      `${ORIGIN}/assets/lesson-LessonPlayer-a.js`,
      `${ORIGIN}/assets/lesson-stage1-a.js`,
    ]);
    expect(await stagePackSaved(1)).toBe(true);
    expect(await stagePackSaved(2)).toBe(false);
    // A stage with no full lessons needs nothing beyond the shell.
    expect(await stagePackSaved(5)).toBe(true);
    expect(rememberedStages()).toEqual([1]);
  });

  it("keep nothing from a download where any file came back as a page instead of code", async () => {
    delete served["/assets/lesson-stage2-a.js"];
    await expect(saveStagePack(2)).rejects.toThrow(/did not download/);
    expect(cache.entries.size).toBe(0);
    expect(rememberedStages()).toEqual([]);
  });

  it("never treat a page stored under a lesson name as saved, and clear such entries", async () => {
    await saveStagePack(1);
    await cache.put(
      `${ORIGIN}/assets/lesson-stage1-a.js`,
      new Response("<!doctype html>", { headers: { "content-type": "text/html" } }),
    );
    expect(await stagePackSaved(1)).toBe(false);
    await discardBrokenPackFiles();
    expect([...cache.entries.keys()]).toEqual([`${ORIGIN}/assets/lesson-LessonPlayer-a.js`]);
  });

  it("save the working stage on startup and remove files no current pack lists", async () => {
    await cache.put(
      `${ORIGIN}/assets/lesson-stage1-old.js`,
      new Response("x", { headers: { "content-type": "text/javascript" } }),
    );
    await warmLessonPacks([2, 2]);
    expect(await stagePackSaved(2)).toBe(true);
    expect([...cache.entries.keys()].some((url) => url.endsWith("old.js"))).toBe(false);
    await pruneLessonCache(nextBuild);
    expect(cache.entries.size).toBe(0);
  });

  it("does nothing on startup while offline", async () => {
    Object.defineProperty(navigator, "onLine", { configurable: true, value: false });
    await warmLessonPacks([1]);
    expect(fetched).toEqual([]);
  });

  it("save the waiting build's packs for stages saved before, reading its list past the service worker", async () => {
    await saveStagePack(1);
    served["/assets/lesson-LessonPlayer-b.js"] = { body: "export{}", type: "text/javascript" };
    served["/assets/lesson-stage1-b.js"] = { body: "export{}", type: "text/javascript" };
    await preparePacksForUpdate();
    expect(fetched.some((url) => /^\/lesson-packs\.json\?build=\d+$/.test(url))).toBe(true);
    expect(cache.entries.has(`${ORIGIN}/assets/lesson-stage1-b.js`)).toBe(true);
    // The running build's files stay until it is replaced.
    expect(cache.entries.has(`${ORIGIN}/assets/lesson-stage1-a.js`)).toBe(true);
  });

  it("keep a waiting build's saved packs when the running build starts again before the update applies", async () => {
    await saveStagePack(1);
    served["/assets/lesson-LessonPlayer-b.js"] = { body: "export{}", type: "text/javascript" };
    served["/assets/lesson-stage1-b.js"] = { body: "export{}", type: "text/javascript" };
    await preparePacksForUpdate();
    await warmLessonPacks([1]);
    expect(cache.entries.has(`${ORIGIN}/assets/lesson-stage1-b.js`)).toBe(true);
    expect(cache.entries.has(`${ORIGIN}/assets/lesson-LessonPlayer-b.js`)).toBe(true);
    expect(await stagePackSaved(1, nextBuild)).toBe(true);
  });
});
