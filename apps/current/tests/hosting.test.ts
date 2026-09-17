import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

/**
 * Lives outside src/ because it reads the repository's own configuration rather
 * than application code — the same reason firebaseRules.test.ts sits here. Run
 * by `npm test` alongside the unit suite.
 */
const root = new URL("../", import.meta.url).pathname;
const hosting = JSON.parse(readFileSync(`${root}firebase.json`, "utf8")).hosting as {
  headers: Array<{ source: string; headers: Array<{ key: string; value: string }> }>;
};
const sources = hosting.headers.map((entry) => entry.source);

describe("the service worker is cached under the name the build emits (B20)", () => {
  it("no-caches /sw.js, which is what vite-plugin-pwa generates", () => {
    const worker = hosting.headers.find((entry) => entry.source === "/sw.js");
    expect(worker).toBeDefined();
    expect(worker?.headers).toContainEqual({ key: "Cache-Control", value: "no-cache" });
  });

  it("no longer names a worker the build never produces", () => {
    /*
     * The header used to target /service-worker.js. Nothing by that name is ever
     * built, so the rule applied to nothing and the real worker was served with
     * default caching — which is how a device goes on running an old build long
     * after a new one is published.
     */
    expect(sources).not.toContain("/service-worker.js");
  });

  it("names only files the build actually produces, when there is a build to check", () => {
    if (!existsSync(`${root}dist/sw.js`)) return;
    for (const source of sources) {
      if (!source.endsWith(".js") || source.includes("*")) continue;
      expect(existsSync(`${root}dist${source}`)).toBe(true);
    }
  });
});

describe("a release deploys storage rules only where Firebase Storage exists", () => {
  const workflow = readFileSync(`${root}../../.github/workflows/firebase-hosting-merge.yml`, "utf8");
  it("never deploys storage rules unconditionally", () => {
    expect(workflow).not.toMatch(/--only\s+[^\n]*storage/);
  });
  it("adds storage only when the recording-sharing variable is enabled", () => {
    expect(workflow).toContain('targets="firestore:rules"');
    expect(workflow).toMatch(/if \[ "\$VITE_RECORDING_SHARING" = "enabled" \]; then targets="\$targets,storage"; fi/);
  });
});
